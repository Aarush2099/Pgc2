import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

// The 27 non-rest themes with their day numbers (rest days 10, 16, 26 excluded)
export const RESEARCH_THEMES = [
  { day: 1,  theme: "Why" },
  { day: 2,  theme: "Footprint" },
  { day: 3,  theme: "Cities" },
  { day: 4,  theme: "Food" },
  { day: 5,  theme: "Water" },
  { day: 6,  theme: "Fashion" },
  { day: 7,  theme: "Waste" },
  { day: 8,  theme: "Oceans" },
  { day: 9,  theme: "Climate Justice" },
  { day: 11, theme: "Forests" },
  { day: 12, theme: "Outdoors" },
  { day: 13, theme: "Indigenous Peoples" },
  { day: 14, theme: "Body" },
  { day: 15, theme: "Soil" },
  { day: 17, theme: "Food Waste" },
  { day: 18, theme: "Wellness" },
  { day: 19, theme: "Connect" },
  { day: 20, theme: "Plant-Based" },
  { day: 21, theme: "Fair Trade" },
  { day: 22, theme: "Nature" },
  { day: 23, theme: "Purpose" },
  { day: 24, theme: "Energy" },
  { day: 25, theme: "Advocate" },
  { day: 27, theme: "Commitment" },
  { day: 28, theme: "Activate" },
  { day: 29, theme: "Reflect" },
  { day: 30, theme: "Inspire" },
] as const;

const GenerateInput = z.object({
  countries: z.array(z.string().min(1)).min(1).max(25),
  dayNumber: z.number().int().min(1).max(30),
  theme: z.string().min(1),
  year: z.number().int().min(2024).max(2100).default(2026),
  overwrite: z.boolean().default(false),
  runId: z.string().uuid().optional(),
});

type PriorityT = "critical" | "high" | "medium" | "low";

function buildPrompt(country: string, theme: string, dayNumber: number) {
  return `Generate a regional research context for a student in ${country} for the Project Green Challenge theme "${theme}" (Day ${dayNumber}).

Return ONLY a JSON object with these exact keys (no markdown, no explanation):
{
  "context_headline": "A specific, compelling 8-12 word headline about this theme in ${country}",
  "context_body": "2-3 sentences (max 80 words) describing the specific local reality of ${theme} in ${country}. Be concrete — mention real local issues, data points, organisations, rivers, regions, or policies relevant to ${country}. Tell the student exactly what to research locally.",
  "priority": "critical OR high OR medium OR low (based on severity of this issue in ${country})"
}

Rules:
- context_headline must name a specific local issue, not be generic
- context_body must be specific to ${country}, not apply to every country
- If ${country} has low relevance to this theme, still find the most relevant local angle
- priority = critical only if this is a severe, documented crisis in ${country}`;
}

export const generateRegionalContextsBatch = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => GenerateInput.parse(d))
  .handler(async ({ data, context }) => {
    // Admin gate
    const { data: isAdmin, error: roleErr } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (roleErr) throw new Error(`Role check failed: ${roleErr.message}`);
    if (!isAdmin) throw new Error("Forbidden: admin role required");

    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("Missing LOVABLE_API_KEY");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { countries, dayNumber, theme, year, overwrite } = data;

    // Skip rows that already exist unless overwrite
    let countriesToProcess = countries;
    if (!overwrite) {
      const { data: existing } = await supabaseAdmin
        .from("regional_contexts")
        .select("country")
        .eq("day_number", dayNumber)
        .eq("year", year)
        .in("country", countries);
      const existingSet = new Set((existing ?? []).map((r: { country: string }) => r.country));
      countriesToProcess = countries.filter((c) => !existingSet.has(c));
    }

    if (countriesToProcess.length === 0) {
      return {
        generated: 0,
        skipped: countries.length,
        failed: 0,
        failedDetails: [] as string[],
      };
    }

    const results = await Promise.allSettled(
      countriesToProcess.map(async (country) => {
        const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Lovable-API-Key": apiKey,
            "X-Lovable-AIG-SDK": "vercel-ai-sdk",
          },
          body: JSON.stringify({
            model: "google/gemini-3-flash-preview",
            response_format: { type: "json_object" },
            messages: [
              {
                role: "system",
                content:
                  "You are a climate-research curator. Always reply with a single valid JSON object matching the requested schema. No prose, no markdown fences.",
              },
              { role: "user", content: buildPrompt(country, theme, dayNumber) },
            ],
          }),
        });

        if (!res.ok) {
          const text = await res.text().catch(() => "");
          if (res.status === 429) throw new Error(`Rate limited (${country})`);
          if (res.status === 402) throw new Error(`AI credits exhausted (${country})`);
          throw new Error(`AI ${res.status} for ${country}: ${text.slice(0, 160)}`);
        }

        const json = (await res.json()) as {
          choices?: { message?: { content?: string } }[];
        };
        const raw = json.choices?.[0]?.message?.content ?? "{}";
        const cleaned = raw.replace(/```json|```/g, "").trim();
        let parsed: { context_headline?: string; context_body?: string; priority?: string };
        try {
          parsed = JSON.parse(cleaned);
        } catch {
          throw new Error(`Invalid JSON from AI for ${country}`);
        }

        if (!parsed.context_headline || !parsed.context_body || !parsed.priority) {
          throw new Error(`Missing fields in AI response for ${country}`);
        }
        const priority: PriorityT = (["critical", "high", "medium", "low"] as const).includes(
          parsed.priority as PriorityT,
        )
          ? (parsed.priority as PriorityT)
          : "medium";

        const { error } = await supabaseAdmin
          .from("regional_contexts")
          .upsert(
            {
              country,
              theme,
              day_number: dayNumber,
              year,
              context_headline: parsed.context_headline.trim(),
              context_body: parsed.context_body.trim(),
              priority,
            },
            { onConflict: "country,day_number,year" },
          );
        if (error) throw new Error(`DB write failed for ${country}: ${error.message}`);
        return country;
      }),
    );

    const succeeded = results.filter((r) => r.status === "fulfilled").length;
    const failedDetails = results
      .filter((r): r is PromiseRejectedResult => r.status === "rejected")
      .map((r) => (r.reason instanceof Error ? r.reason.message : String(r.reason)));

    return {
      generated: succeeded,
      skipped: countries.length - countriesToProcess.length,
      failed: failedDetails.length,
      failedDetails,
    };
  });
