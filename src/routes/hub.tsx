import { createFileRoute, Link } from "@tanstack/react-router";
import { Layout } from "@/components/Layout";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { ArrowRight, Microscope, Megaphone, FileDown, UserCircle2, Leaf, Users, Heart } from "lucide-react";
import { getFlagThumb } from "@/lib/flags";

export const Route = createFileRoute("/hub")({
  head: () => ({ meta: [
    { title: "Your Hub — PGC 2026" },
    { name: "description", content: "Your personal Hub for Project Green Challenge — research, action, and your submissions." },
  ]}),
  component: Hub,
});

type Recent = {
  id: string; theme: string; title: string; phase: string; status: string;
  ai_feedback: string | null; submitted_at: string;
};

const ALUMNI_QUOTES = [
  { q: "PGC feels like a family you want to belong to.", a: "Valentín, Ambassador 2022–2026" },
  { q: "Climate anxiety can be transformed into collective power.", a: "Darinka, Finalist 2025" },
  { q: "Whatever form the next chapter takes, I hope it preserves the spirit of possibility, connection, and action.", a: "Carolina, PGC 2025 Global Winner" },
  { q: "PGC gave me the opportunity and the funds to prove myself — and that's where my journey started.", a: "Shahed, Finalist & Ambassador 2023" },
  { q: "The friendships I formed with the other finalists have stayed with me to this day.", a: "Anjali, Ambassador 2015–2025" },
];

function Hub() {
  const { user, profile, loading } = useAuth();
  const [counts, setCounts] = useState({ research: 0, action: 0 });
  const [recent, setRecent] = useState<Recent[]>([]);
  const [quoteIdx, setQuoteIdx] = useState(0);
  const [fade, setFade] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const [{ count: r }, { count: a }, { data: rec }] = await Promise.all([
          supabase.from("submissions").select("id", { count: "exact", head: true }).eq("user_id", user.id).eq("phase", "october_research"),
          supabase.from("submissions").select("id", { count: "exact", head: true }).eq("user_id", user.id).eq("phase", "november_action"),
          supabase.from("submissions").select("id,theme,title,phase,status,ai_feedback,submitted_at").eq("user_id", user.id).order("submitted_at", { ascending: false }).limit(5),
        ]);
        setCounts({ research: r ?? 0, action: a ?? 0 });
        setRecent((rec as Recent[]) ?? []);
      } catch { /* gracefully ignore */ }
    })();
  }, [user]);

  useEffect(() => {
    const id = window.setInterval(() => {
      setFade(false);
      window.setTimeout(() => {
        setQuoteIdx((i) => (i + 1) % ALUMNI_QUOTES.length);
        setFade(true);
      }, 350);
    }, 8000);
    return () => window.clearInterval(id);
  }, []);

  // Guest screen renders immediately for unauthenticated visitors —
  // do NOT wait for loading or any database query.
  if (!loading && !user) {
    return (
      <Layout>
        <section className="container-pgc py-24">
          <div className="mx-auto max-w-xl glass-card p-10 text-center">
            <p className="eyebrow">// Your Hub</p>
            <h1 className="mt-3 text-4xl md:text-5xl font-bold tracking-tight">The Hub awaits.</h1>
            <p className="mt-4 text-muted-foreground">
              Sign in to unlock your research dashboard, track your 30-day progress,
              and see your country's personalised November challenges.
            </p>
            <div className="mt-8 flex flex-col items-center gap-3">
              <Link to="/auth" className="btn-pgc">Sign In <ArrowRight className="size-4" /></Link>
              <Link to="/auth" className="text-sm text-primary-dark underline">New to PGC? Create an account</Link>
            </div>
          </div>
        </section>
      </Layout>
    );
  }

  if (loading) {
    return <Layout><div className="container-pgc py-12">Loading…</div></Layout>;
  }

  const quote = ALUMNI_QUOTES[quoteIdx];

  return (
    <Layout>
      <section className="container-pgc py-12">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="eyebrow">// Your Hub</p>
            <h1 className="mt-2 text-3xl md:text-4xl font-bold">
              Welcome back, {profile?.full_name ?? "friend"}
              {profile?.country && (
                <span className="text-muted-foreground font-normal inline-flex items-center gap-2 ml-1">
                  · <img src={getFlagThumb(profile.country)} alt="" className="inline h-3.5 w-auto rounded-[2px]" />
                  {profile.country}
                </span>
              )}
            </h1>
          </div>
          <Link to="/profile" className="btn-outline-pgc text-sm"><UserCircle2 className="size-4" /> Profile</Link>
        </div>

        {!profile?.country && (
          <div className="mt-6 glass-card p-4 border-l-4 border-l-destructive">
            <p className="text-sm"><b>Add your country</b> in your <Link to="/profile" className="underline">profile</Link> so submissions get tagged correctly.</p>
          </div>
        )}

        <div className="mt-8 grid md:grid-cols-2 gap-5">
          <Link to="/challenges" className="glass-card p-7 group hover:-translate-y-0.5 transition">
            <Microscope className="size-7 text-primary" />
            <h3 className="mt-4 text-2xl font-bold">Go to Research</h3>
            <p className="mt-1 text-sm text-muted-foreground">October · regional audits across 30 themes.</p>
            <p className="mt-4 font-mono text-sm">{counts.research} of 30 submitted</p>
            <div className="mt-3 h-1 bg-secondary"><div className="h-full bg-primary" style={{ width: `${Math.min(100, (counts.research / 30) * 100)}%` }} /></div>
            <p className="mt-4 text-sm font-semibold text-primary-dark inline-flex items-center gap-1">Open Research <ArrowRight className="size-4" /></p>
          </Link>

          <Link to="/challenges" className="glass-card p-7 group hover:-translate-y-0.5 transition">
            <Megaphone className="size-7 text-primary" />
            <h3 className="mt-4 text-2xl font-bold">Go to Action</h3>
            <p className="mt-1 text-sm text-muted-foreground">November · policy-level changes informed by your research.</p>
            <p className="mt-4 font-mono text-sm">{counts.action} of 30 submitted</p>
            <div className="mt-3 h-1 bg-secondary"><div className="h-full bg-primary" style={{ width: `${Math.min(100, (counts.action / 30) * 100)}%` }} /></div>
            <p className="mt-4 text-sm font-semibold text-primary-dark inline-flex items-center gap-1">Open Action <ArrowRight className="size-4" /></p>
          </Link>
        </div>

        <div className="mt-10 grid lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 glass-card p-6">
            <h2 className="text-xl font-bold">Recent activity</h2>
            <div className="mt-4 divide-y divide-border">
              {recent.length === 0 && <p className="text-sm text-muted-foreground py-3">No submissions yet — pick a theme to start.</p>}
              {recent.map((r) => (
                <div key={r.id} className="py-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold">{r.theme} · {r.title}</p>
                    <span className={`text-[10px] uppercase font-bold ${r.status === "reviewed" ? "text-primary-dark" : "text-muted-foreground"}`}>{r.status}</span>
                  </div>
                  {r.ai_feedback && <p className="mt-1 text-xs text-muted-foreground line-clamp-1"><b>AI:</b> {r.ai_feedback}</p>}
                </div>
              ))}
            </div>
          </div>
          <Link to="/certificate" className="glass-card p-6 text-left hover:-translate-y-0.5 transition block">
            <FileDown className="size-6 text-primary" />
            <h3 className="mt-3 font-bold">Academic Certificate →</h3>
            <p className="mt-1 text-xs text-muted-foreground">Download your printable certificate of participation for credit recognition.</p>
          </Link>
        </div>

        {/* Community section */}
        <div className="mt-16">
          <div className="text-center">
            <p className="eyebrow">// The PGC Community</p>
            <h2 className="mt-2 text-3xl md:text-4xl font-bold tracking-tight">The PGC Community</h2>
            <p className="mt-2 text-muted-foreground">PGC doesn't end in November. The community lasts.</p>
          </div>

          <div className="mt-8 grid md:grid-cols-3 gap-5">
            {/* Rotating quote */}
            <div className="glass-card p-6 flex flex-col">
              <Users className="size-6 text-primary" />
              <div className={`mt-4 flex-1 transition-opacity duration-300 ${fade ? "opacity-100" : "opacity-0"}`}>
                <p className="text-base leading-relaxed">"{quote.q}"</p>
                <p className="mt-3 text-xs text-muted-foreground">— {quote.a}</p>
              </div>
              <Link to="/climate-action-projects" className="mt-4 text-sm text-primary-dark font-semibold inline-flex items-center gap-1">
                Read more stories <ArrowRight className="size-4" />
              </Link>
            </div>

            {/* Stay involved */}
            <div className="glass-card p-6">
              <Megaphone className="size-6 text-primary" />
              <h3 className="mt-4 text-lg font-bold">Stay involved after November</h3>
              <ul className="mt-3 space-y-2 text-sm">
                <li><Link to="/campus-reps" className="text-primary-dark hover:underline">→ Apply to become a Campus Rep</Link></li>
                <li><a href="mailto:pgc@turninggreen.org?subject=PGC%20Mentor" className="text-primary-dark hover:underline">→ Mentor next year's participants</a></li>
                <li><a href="mailto:pgc@turninggreen.org?subject=CAP%20Showcase" className="text-primary-dark hover:underline">→ Submit your CAP project for showcasing</a></li>
              </ul>
            </div>

            {/* You're not alone */}
            <div className="glass-card p-6">
              <Leaf className="size-6 text-primary" />
              <h3 className="mt-3 text-lg font-bold inline-flex items-center gap-2">
                <Heart className="size-4 text-primary" /> Feeling overwhelmed?
              </h3>
              <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
                Many PGC participants come in with climate anxiety. That's not a weakness — it's why you're here.
                The community around you has felt the same. Use the challenge to turn that energy into action.
              </p>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}
