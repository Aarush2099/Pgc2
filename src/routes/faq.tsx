import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Layout } from "@/components/Layout";

export const Route = createFileRoute("/faq")({
  head: () => ({
    meta: [
      { title: "FAQ — PGC 2026" },
      { name: "description", content: "Everything you need to know about Project Green Challenge 2026." },
    ],
  }),
  component: FAQ,
});

const SECTIONS: { title: string; items: { q: string; a: string }[] }[] = [
  {
    title: "About the Challenge",
    items: [
      { q: "What is PGC 2026?", a: "A free 30+30-day climate leadership program for students worldwide. October is research; November is action." },
      { q: "Who runs it?", a: "Turning Green, a nonprofit that has educated youth on planet and people since 2005." },
    ],
  },
  {
    title: "Eligibility",
    items: [
      { q: "Who can join?", a: "Any high school or university student, anywhere on Earth, at no cost." },
      { q: "Do I need teacher approval?", a: "No. Individuals can register directly; teachers can also enroll a class." },
    ],
  },
  {
    title: "Participation & Submissions",
    items: [
      { q: "How many challenges are there?", a: "60 — one per day, October 1 through November 29." },
      { q: "What do submissions look like?", a: "Short writeups plus photos, videos, or data. October submissions ask for regional research; November asks for documented action." },
    ],
  },
  {
    title: "Prizes & Finals",
    items: [
      { q: "What are the prizes?", a: "Daily eco-product drops, weekly scholarships, and 24 fully-funded Finals invites." },
      { q: "Where are the Finals?", a: "San Francisco, late November. Travel, lodging, and meals covered." },
    ],
  },
];

function FAQ() {
  const [intlOpen, setIntlOpen] = useState(false);
  return (
    <Layout>
      <section className="container-pgc py-16 max-w-4xl">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary-dark">Frequently asked</p>
        <h1 className="mt-3 text-5xl font-black">FAQ.</h1>
        <div className="mt-10 space-y-10">
          {SECTIONS.map((s) => (
            <div key={s.title}>
              <h2 className="text-2xl font-bold text-primary-dark">{s.title}</h2>
              <dl className="mt-4 space-y-4">
                {s.items.map((it) => (
                  <div key={it.q} className="doodle-card p-5">
                    <dt className="font-bold">{it.q}</dt>
                    <dd className="mt-2 text-sm text-muted-foreground">{it.a}</dd>
                  </div>
                ))}
              </dl>
            </div>
          ))}
        </div>

        {/* International participants */}
        <div className="mt-14 doodle-card p-6">
          <button
            onClick={() => setIntlOpen(o => !o)}
            className="w-full flex items-center justify-between text-left"
            aria-expanded={intlOpen}
          >
            <h2 className="text-2xl font-bold text-primary-dark">Participating from outside the United States?</h2>
            <span className="text-2xl font-bold text-primary-dark">{intlOpen ? "–" : "+"}</span>
          </button>
          {intlOpen && (
            <div className="mt-6 space-y-6 text-sm">
              <div>
                <h3 className="font-bold text-base">Visa & Finals Travel</h3>
                <p className="mt-1 text-muted-foreground leading-relaxed">
                  If selected as a finalist, you'll receive notification by October 31.
                  We strongly recommend beginning your US visa application immediately upon
                  notification — standard B-1/B-2 tourist visa processing can take 3–8 weeks
                  depending on your country. PGC will provide an official invitation letter within
                  48 hours of your finalist confirmation to support your application.
                </p>
              </div>
              <div>
                <h3 className="font-bold text-base">Submission Windows</h3>
                <p className="mt-1 text-muted-foreground leading-relaxed">
                  All daily challenges open at 6am PST. We understand this may fall at
                  an inconvenient hour in your timezone. Submissions are accepted for 24 hours
                  or more — check the specific challenge for its closing time.
                </p>
              </div>
              <div>
                <h3 className="font-bold text-base">Language</h3>
                <p className="mt-1 text-muted-foreground leading-relaxed">
                  Submissions may be made in English. If English is not your first language,
                  do your best — your ideas matter more than perfect grammar. Judges are instructed
                  to evaluate content and impact, not language perfection.
                </p>
              </div>
              <div>
                <h3 className="font-bold text-base">Team Submissions</h3>
                <p className="mt-1 text-muted-foreground leading-relaxed">
                  If submitting as a team, designate one representative per submission.
                  All team members should be listed in the submission description. Only the
                  designated representative will appear on the leaderboard, but the full team
                  will be recognised at judging.
                </p>
              </div>
            </div>
          )}
        </div>
      </section>
    </Layout>
  );
}
