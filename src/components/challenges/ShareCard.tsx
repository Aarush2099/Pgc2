import { useRef, useState } from "react";
import { toPng } from "html-to-image";
import { Share2, Download } from "lucide-react";

export function ShareCard({ theme, dayNumber, country, flagCode }: {
  theme: string; dayNumber: number; country: string | null; flagCode?: string | null;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState(false);

  const caption = `Day ${dayNumber} of #PGC2026 — researching ${theme}${country ? ` in ${country}` : ""}. Join the global movement: projectgreenchallenge.lovable.app #TurningGreen`;

  async function download() {
    if (!cardRef.current) return;
    setBusy(true);
    try {
      const dataUrl = await toPng(cardRef.current, { cacheBust: true, pixelRatio: 1 });
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = `pgc-day-${dayNumber}-${theme.toLowerCase().replace(/\s+/g, "-")}.png`;
      a.click();
    } finally { setBusy(false); }
  }

  return (
    <div className="mt-4">
      {/* Hidden render target — 1080x1080 */}
      <div className="overflow-hidden" style={{ position: "absolute", left: -99999, top: 0 }}>
        <div
          ref={cardRef}
          style={{
            width: 1080, height: 1080,
            background: "linear-gradient(135deg, hsl(150,35%,15%) 0%, hsl(150,40%,10%) 100%)",
            color: "#fff",
            fontFamily: "system-ui, -apple-system, sans-serif",
            padding: 80,
            display: "flex", flexDirection: "column", justifyContent: "space-between",
            position: "relative",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontWeight: 700, fontSize: 28, letterSpacing: 2 }}>PGC</span>
            <span style={{ fontSize: 22, opacity: 0.8 }}>PGC 2026</span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 24 }}>
            {flagCode && (
              <img src={`https://flagcdn.com/w80/${flagCode}.png`} alt="" style={{ width: 80, height: "auto", borderRadius: 6 }} crossOrigin="anonymous" />
            )}
            <h1 style={{ fontSize: 56, fontWeight: 800, lineHeight: 1.15, textAlign: "center", margin: 0, padding: "0 40px" }}>
              I researched {theme} for my community
            </h1>
            <p style={{ fontSize: 24, opacity: 0.7, margin: 0 }}>
              {country ? `${country} · ` : ""}Day {dayNumber}
            </p>
          </div>

          <div style={{ textAlign: "center" }}>
            <p style={{ fontSize: 20, color: "hsl(150, 60%, 70%)", margin: 0 }}>
              Join me at projectgreenchallenge.lovable.app
            </p>
          </div>

          <div style={{ position: "absolute", bottom: 40, right: 40, fontSize: 60, opacity: 0.2 }}>🌿</div>
        </div>
      </div>

      <button onClick={download} disabled={busy} className="btn-pgc text-sm">
        {busy ? <>Generating…</> : <><Share2 className="size-4" /> Share your research</>}
      </button>
      <button onClick={download} disabled={busy} className="ml-2 btn-outline-pgc text-sm">
        <Download className="size-4" /> Download PNG
      </button>

      <p className="mt-3 text-xs text-muted-foreground">
        <b>Suggested caption:</b> "{caption}"
      </p>
    </div>
  );
}
