import { createFileRoute, Link } from "@tanstack/react-router";
import { Layout } from "@/components/Layout";
import { ArrowRight, Sparkles } from "lucide-react";
import { useEffect, useRef } from "react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Project Green Challenge — Learn. Do. Connect. Win." },
      { name: "description", content: "30 days. 185 countries. One global movement of student climate leaders. Join Project Green Challenge 2026." },
      { property: "og:title", content: "Project Green Challenge — Learn. Do. Connect. Win." },
      { property: "og:description", content: "30 days. 185 countries. One global movement of student climate leaders. Join Project Green Challenge 2026." },
    ],
  }),
  component: Home,
});

const WINNERS = [
  { name: "Carolina Novillo Bravo", title: "PGC 2025 Champion", loc: "Cuenca, Ecuador" },
  { name: "Monica Annim", title: "PGC 2025 Second Place", loc: "Koforidua, Ghana" },
  { name: "Aarush Mahajan", title: "PGC 2025 Third Place (Tie)", loc: "Pune, India" },
  { name: "Charles Amoani-Antwi", title: "PGC 2025 Third Place (Tie)", loc: "Kumasi, Ghana" },
];

const STATS: { n: number; display: string; l: string }[] = [
  { n: 16423, display: "16,423", l: "Schools" },
  { n: 350253, display: "350,253", l: "Users" },
  { n: 50, display: "50", l: "States" },
  { n: 185, display: "185", l: "Countries" },
];

function prefersReducedMotion() {
  return typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
}

function animateCounter(el: HTMLElement, target: number, duration = 1800) {
  if (prefersReducedMotion()) { el.textContent = target.toLocaleString(); return; }
  const start = performance.now();
  const step = (now: number) => {
    const progress = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    el.textContent = Math.floor(eased * target).toLocaleString();
    if (progress < 1) requestAnimationFrame(step);
    else el.textContent = target.toLocaleString();
  };
  requestAnimationFrame(step);
}

function Home() {
  const statsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (prefersReducedMotion()) {
      document.querySelectorAll<HTMLElement>(".animate-on-scroll").forEach((el) => el.classList.add("in-view"));
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add("in-view");
          observer.unobserve(e.target);
        }
      }),
      { threshold: 0.15 },
    );
    document.querySelectorAll<HTMLElement>(".animate-on-scroll").forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const root = statsRef.current;
    if (!root) return;
    // Fallback: set numbers immediately so users see them even if IO doesn't fire.
    root.querySelectorAll<HTMLElement>("[data-counter]").forEach((el) => {
      const target = Number(el.dataset.counter);
      if (Number.isFinite(target)) el.textContent = target.toLocaleString();
    });
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((e) => {
        if (e.isIntersecting) {
          root.querySelectorAll<HTMLElement>("[data-counter]").forEach((el) => {
            const target = Number(el.dataset.counter);
            if (!Number.isFinite(target)) return;
            el.textContent = "0";
            animateCounter(el, target);
          });
          observer.disconnect();
        }
      }),
      { threshold: 0.4 },
    );
    observer.observe(root);
    return () => observer.disconnect();
  }, []);

  return (
    <Layout>
      {/* Hero */}
      <section className="relative">
        <div className="container-pgc grid lg:grid-cols-12 gap-y-10 gap-x-8 pt-16 pb-24 md:pt-24 md:pb-28">
          <div className="lg:col-span-8 hero-float">
            <p className="eyebrow inline-flex items-center gap-2"><Sparkles className="size-3" /> Turning Green · est. 2011</p>
            <h1 className="mt-5 tracking-[-0.03em] leading-[0.95]">
              <span className="block text-5xl md:text-7xl font-light text-foreground/95">Project Green</span>
              <span className="block text-4xl md:text-6xl font-extrabold text-primary mt-1">Challenge</span>
            </h1>
            <p className="mt-7 max-w-2xl text-lg leading-relaxed text-foreground/80">
              Thirty days. One theme a day. Students from 185 countries documenting what
              climate change actually looks like in their corner of the world — and then
              doing something about it. No prior experience required. Just show up.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link to="/challenges" className="btn-pgc">See Challenges & Research <ArrowRight className="size-4" /></Link>
              <Link to="/hub" className="btn-outline-pgc">Enter your Hub</Link>
            </div>
          </div>
        </div>

        {/* Hand-drawn divider between hero and stats */}
        <div className="container-pgc" aria-hidden="true">
          <svg viewBox="0 0 1200 24" xmlns="http://www.w3.org/2000/svg"
               preserveAspectRatio="none" style={{ width: "100%", height: 24, opacity: 0.15 }}>
            <path d="M0,12 C150,4 300,20 450,12 C600,4 750,20 900,12 C1050,4 1200,20 1200,12"
                  fill="none" stroke="rgba(34,197,94,0.6)" strokeWidth="1.5" />
          </svg>
        </div>
      </section>

      {/* Stats — extra breathing room above */}
      <section className="container-pgc pt-10 pb-20 animate-on-scroll">
        <div ref={statsRef} className="glass-card p-8 md:p-12">
          <p className="text-[11px] uppercase tracking-[0.15em] text-primary-dark text-center">Unite with students globally to take climate action</p>
          <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-6">
            {STATS.map(s => (
              <div key={s.l} className="text-center">
                <p
                  className="text-4xl md:text-5xl font-bold tabular-nums text-foreground"
                  data-counter={s.n}
                >{s.display}</p>
                <p className="mt-1 text-[11px] uppercase tracking-[0.15em] text-muted-foreground">{s.l}</p>
              </div>
            ))}
          </div>
          <p className="mt-8 max-w-3xl mx-auto text-center text-sm text-muted-foreground">
            Fifteen years. 350,000 students. Every country on the map. PGC is the longest-running
            student sustainability challenge in the world — and it's still getting louder.
          </p>
        </div>
      </section>

      {/* Program details */}
      <section className="container-pgc pb-24 animate-on-scroll">
        <div className="grid lg:grid-cols-12 gap-x-8 gap-y-6">
          <div className="lg:col-span-5">
            <h2 className="text-4xl md:text-5xl font-normal tracking-tight" style={{ fontFamily: "'Playfair Display', Georgia, serif", color: "hsl(150 20% 90%)" }}>How PGC works.</h2>
          </div>
          <div className="lg:col-span-7 text-lg leading-relaxed text-foreground/80">
            <p className="mb-4 text-foreground/90">Here's how it actually works — it's simpler than you think.</p>
            <p>
              PGC runs from October 1st until October 30th then November 1 to November 30 each year. Every day, a unique
              challenge is unveiled at 6am PST. Each challenge is live for 24 hours or more, inviting participants to
              complete actions and upload content to acquire points and prizes. You'll submit photos, videos, written
              pieces, and creative work — whatever best captures what you found. Up to twenty prizes will be awarded
              daily based on outstanding content. At the end of the 30 days, up to 14 finalists are selected from global
              participants to attend the PGC Finals and compete for the grand prize.
            </p>
          </div>
        </div>
      </section>

      {/* Editorial rule between sections */}
      <div className="container-pgc mt-4">
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }} />
      </div>

      {/* Winners */}
      <section className="container-pgc pt-16 pb-20 animate-on-scroll">
        <div className="text-left max-w-2xl">
          <h2 className="text-3xl md:text-4xl font-normal tracking-tight" style={{ fontFamily: "'Playfair Display', Georgia, serif", color: "hsl(150 20% 90%)" }}>Congrats to PGC 2025 Winners.</h2>
        </div>
        <div className="mt-10 grid grid-cols-2 lg:grid-cols-4 gap-5">
          {WINNERS.map(w => (
            <div key={w.name} className="glass-card pgc-card p-4">
              <div className="aspect-square w-full rounded-2xl bg-gradient-to-br from-mint/40 to-primary/20 grid place-items-center border border-white/60">
                <span className="font-mono text-[11px] uppercase tracking-[0.15em] text-primary-dark/60">photo</span>
              </div>
              <p className="mt-4 font-bold leading-tight">{w.name}</p>
              <p className="mt-1 text-[11px] uppercase tracking-[0.15em] text-primary-dark">{w.title}</p>
              <p className="mt-1 text-xs text-muted-foreground">{w.loc}</p>
            </div>
          ))}
        </div>

        <div className="mt-10 text-center">
          <Link to="/climate-action-projects" className="btn-pgc">Read about Climate Action Projects <ArrowRight className="size-4" /></Link>
        </div>

        <div className="mt-10 mx-auto max-w-3xl">
          <div className="aspect-[16/10] w-full rounded-2xl bg-gradient-to-br from-mint/30 via-white/30 to-sky/20 border border-white/60 grid place-items-center">
            <span className="font-mono text-[11px] uppercase tracking-[0.15em] text-primary-dark/60">featured image</span>
          </div>
        </div>
      </section>

      {/* Learn. Do. Connect. Win. + video */}
      <section className="container-pgc pb-24 animate-on-scroll">
        <div className="text-center max-w-2xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-normal tracking-tight" style={{ fontFamily: "'Playfair Display', Georgia, serif", color: "hsl(150 20% 90%)" }}>Learn. Do. Connect. Win.</h2>
          <p className="mt-3 text-lg text-foreground/75">Let's change lives + heal the planet.</p>
        </div>
        <div className="mt-10 mx-auto max-w-4xl glass-card p-3">
          <div className="relative w-full" style={{ paddingTop: "56.25%" }}>
            <iframe
              className="absolute inset-0 h-full w-full rounded-2xl"
              src="https://www.youtube.com/embed/CExKIH97CkM"
              title="Project Green Challenge"
              loading="lazy"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </div>
      </section>
    </Layout>
  );
}
