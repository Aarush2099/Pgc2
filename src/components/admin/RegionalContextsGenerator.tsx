import { useEffect, useState } from "react";
import { Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { COUNTRIES } from "@/lib/countries";
import { supabase } from "@/integrations/supabase/client";
import {
  generateRegionalContextsBatch,
  RESEARCH_THEMES,
} from "@/lib/generateRegionalContexts.functions";

const YEAR = 2026;
const BATCH_SIZE = 10;
const TOTAL_TARGET = COUNTRIES.length * RESEARCH_THEMES.length; // 185 × 27 = 4995

type Summary = { generated: number; skipped: number; failed: number };

export function RegionalContextsGenerator({ onAfterRun }: { onAfterRun?: () => void }) {
  const generate = useServerFn(generateRegionalContextsBatch);

  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0, theme: "" });
  const [summary, setSummary] = useState<Summary | null>(null);
  const [overwrite, setOverwrite] = useState(false);
  const [selectedDays, setSelectedDays] = useState<number[]>(
    RESEARCH_THEMES.map((t) => t.day),
  );
  const [coverage, setCoverage] = useState<{
    total: number;
    countries: number;
    themes: number;
  } | null>(null);

  async function refreshCoverage() {
    const { data, count } = await supabase
      .from("regional_contexts")
      .select("country,theme", { count: "exact" })
      .eq("year", YEAR);
    if (!data) return;
    setCoverage({
      total: count ?? data.length,
      countries: new Set(data.map((r) => r.country)).size,
      themes: new Set(data.map((r) => r.theme)).size,
    });
  }

  useEffect(() => {
    void refreshCoverage();
  }, []);

  async function runGenerator() {
    if (selectedDays.length === 0) {
      toast.error("Select at least one theme.");
      return;
    }
    setGenerating(true);
    setSummary(null);

    const themesToRun = RESEARCH_THEMES.filter((t) => selectedDays.includes(t.day));
    let totalGenerated = 0;
    let totalSkipped = 0;
    let totalFailed = 0;

    setProgress({ current: 0, total: themesToRun.length, theme: "" });

    try {
      for (let tIdx = 0; tIdx < themesToRun.length; tIdx++) {
        const { day, theme } = themesToRun[tIdx];
        setProgress({ current: tIdx + 1, total: themesToRun.length, theme });

        for (let i = 0; i < COUNTRIES.length; i += BATCH_SIZE) {
          const batch = COUNTRIES.slice(i, i + BATCH_SIZE);
          try {
            const result = await generate({
              data: { countries: batch, dayNumber: day, theme, year: YEAR, overwrite },
            });
            totalGenerated += result.generated;
            totalSkipped += result.skipped;
            totalFailed += result.failed;
            if (result.failed > 0) {
              console.warn(`Day ${day} ${theme} failures:`, result.failedDetails);
            }
          } catch (err) {
            totalFailed += batch.length;
            console.error(`Batch failed (Day ${day} ${theme}):`, err);
          }
          await new Promise((r) => setTimeout(r, 200));
        }
      }
      setSummary({ generated: totalGenerated, skipped: totalSkipped, failed: totalFailed });
      toast.success(`Generated ${totalGenerated} contexts (${totalFailed} failed)`);
    } finally {
      setGenerating(false);
      await refreshCoverage();
      onAfterRun?.();
    }
  }

  const pct = coverage
    ? Math.min(100, Math.round((coverage.total / TOTAL_TARGET) * 100))
    : 0;
  const runPct = progress.total
    ? Math.round((progress.current / progress.total) * 100)
    : 0;

  return (
    <div className="mb-5 rounded-2xl border border-primary/30 bg-primary/5 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-primary/20 pb-3">
        <div>
          <p className="eyebrow inline-flex items-center gap-1.5">
            <Sparkles className="size-3" /> AI Generator
          </p>
          <h3 className="mt-1 text-lg font-bold">Generate regional contexts in bulk</h3>
          <p className="mt-1 text-xs text-muted-foreground max-w-2xl">
            AI-generates localised research prompts for all 185 countries × selected themes via the
            Lovable AI Gateway. Existing contexts are skipped unless &quot;Overwrite&quot; is enabled.
            Full run takes ~15–25 minutes — keep this tab open.
          </p>
        </div>
        {summary && (
          <div className="rounded-lg bg-white/70 border border-border px-3 py-2 text-xs">
            <p className="font-semibold text-success">✓ {summary.generated} generated</p>
            <p className="text-muted-foreground">
              {summary.skipped} skipped · {summary.failed} failed
            </p>
          </div>
        )}
      </div>

      {coverage && (
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
          <span className="font-semibold">{coverage.total.toLocaleString()} / {TOTAL_TARGET.toLocaleString()} contexts</span>
          <span className="text-muted-foreground">{coverage.countries} / {COUNTRIES.length} countries</span>
          <span className="text-muted-foreground">{coverage.themes} / {RESEARCH_THEMES.length} themes</span>
          <span
            className={`ml-auto font-semibold ${
              coverage.total >= TOTAL_TARGET ? "text-success" : "text-primary"
            }`}
          >
            {coverage.total >= TOTAL_TARGET ? "✓ Complete" : `${pct}% coverage`}
          </span>
        </div>
      )}

      <div className="mt-4">
        <div className="flex items-baseline justify-between">
          <label className="eyebrow">
            Themes ({selectedDays.length} / {RESEARCH_THEMES.length})
          </label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setSelectedDays(RESEARCH_THEMES.map((t) => t.day))}
              className="text-[10px] px-2 py-0.5 rounded border border-border text-muted-foreground hover:text-foreground hover:border-foreground/40 transition-colors"
            >
              All
            </button>
            <button
              type="button"
              onClick={() => setSelectedDays([])}
              className="text-[10px] px-2 py-0.5 rounded border border-border text-muted-foreground hover:text-foreground hover:border-foreground/40 transition-colors"
            >
              None
            </button>
          </div>
        </div>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {RESEARCH_THEMES.map(({ day, theme }) => {
            const active = selectedDays.includes(day);
            return (
              <button
                key={day}
                type="button"
                disabled={generating}
                onClick={() =>
                  setSelectedDays((prev) =>
                    prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day],
                  )
                }
                className={`text-[11px] px-2 py-1 rounded-md border transition-colors ${
                  active
                    ? "border-primary/60 bg-primary/15 text-primary-dark font-semibold"
                    : "border-border text-muted-foreground hover:border-foreground/40"
                }`}
              >
                {day}. {theme}
              </button>
            );
          })}
        </div>
      </div>

      <label className="mt-4 inline-flex items-center gap-2 text-xs text-muted-foreground">
        <input
          type="checkbox"
          checked={overwrite}
          disabled={generating}
          onChange={(e) => setOverwrite(e.target.checked)}
          className="rounded"
        />
        Overwrite existing contexts
      </label>

      {generating && (
        <div className="mt-4 rounded-lg border border-border bg-white/60 p-3">
          <div className="flex justify-between text-xs font-semibold">
            <span>
              Theme {progress.current} of {progress.total}
              {progress.theme && ` — ${progress.theme}`}
            </span>
            <span>{runPct}%</span>
          </div>
          <div className="mt-2 h-2 w-full rounded-full bg-border overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${runPct}%` }}
            />
          </div>
          <p className="mt-2 text-[11px] text-muted-foreground">
            Processing {COUNTRIES.length} countries in batches of {BATCH_SIZE} · do not close this tab
          </p>
        </div>
      )}

      <button
        type="button"
        onClick={runGenerator}
        disabled={generating || selectedDays.length === 0}
        className="btn-pgc mt-4 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {generating ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            Generating…
          </>
        ) : (
          <>
            <Sparkles className="size-4" />
            Generate {selectedDays.length} theme{selectedDays.length !== 1 ? "s" : ""} × {COUNTRIES.length} countries
          </>
        )}
      </button>
    </div>
  );
}
