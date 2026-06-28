import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export function PeerPreview({ country, dayNumber, theme, excludeUserId }: {
  country: string; dayNumber: number; theme: string; excludeUserId: string;
}) {
  const [findings, setFindings] = useState<string[] | null>(null);

  useEffect(() => {
    let cancel = false;
    (async () => {
      try {
        const { data } = await supabase
          .from("submissions")
          .select("key_findings")
          .eq("country", country)
          .eq("day_number", dayNumber)
          .eq("phase", "october_research")
          .neq("user_id", excludeUserId)
          .limit(5);
        const rows = (data as { key_findings: string | null }[] | null) ?? [];
        const snippets = rows
          .map(r => r.key_findings?.trim())
          .filter((x): x is string => !!x)
          .map(s => s.length > 120 ? s.slice(0, 120) + "…" : s);
        if (!cancel) setFindings(snippets);
      } catch { if (!cancel) setFindings([]); }
    })();
    return () => { cancel = true; };
  }, [country, dayNumber, excludeUserId]);

  if (!findings || findings.length < 3) return null;

  return (
    <div className="mt-4 rounded-lg border border-primary/30 bg-primary/5 p-4">
      <h4 className="text-sm font-bold text-primary-dark">
        What students in {country} are finding about {theme}
      </h4>
      <ul className="mt-3 space-y-2">
        {findings.map((f, i) => (
          <li key={i} className="text-xs text-foreground/80 leading-relaxed border-l-2 border-primary/40 pl-3">
            "{f}"
          </li>
        ))}
      </ul>
      <p className="mt-3 text-[10px] uppercase tracking-widest text-muted-foreground">
        From PGC 2026 participants in {country} — anonymised
      </p>
    </div>
  );
}
