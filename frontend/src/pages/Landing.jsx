import { Link } from "react-router-dom";

const stats = [
  { value: "30,000", label: "Training records", detail: "UCI dataset" },
  { value: "7", label: "Explainable model features", detail: "Mapped to SHAP" },
  { value: "3", label: "Protected attributes monitored", detail: "Parity + odds checks" },
  { value: "SHA-256 + Merkle", label: "Tamper-evident audit", detail: "Immutable chain" },
];

const audiences = [
  {
    icon: "🏦",
    title: "For Loan Officers",
    body: "Real-time XGBoost predictions with full SHAP reasoning tree and anomaly detection",
  },
  {
    icon: "👤",
    title: "For Borrowers",
    body: "Tamil-first rejection explanations with counterfactual guidance - the minimum change needed to qualify",
  },
  {
    icon: "⚖️",
    title: "For Regulators",
    body: "Demographic parity + equalized odds monitoring, Merkle-verified audit trail, RBI-formatted compliance reports",
  },
];

const steps = [
  "Application received",
  "XGBoost scores",
  "SHAP explains",
  "Decision + audit logged",
];

export default function Landing() {
  return (
    <main className="bg-white text-slate-950">
      <section className="relative flex min-h-screen items-center overflow-hidden bg-slate-900 px-4 py-16 text-white sm:px-6 lg:px-8">
        <div
          className="pointer-events-none absolute inset-0 opacity-70"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, rgba(16,185,129,0.32) 1px, transparent 0)",
            backgroundSize: "26px 26px",
            animation: "dotPulse 10s ease-in-out infinite",
          }}
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 opacity-95" />

        <style>{`
          @keyframes dotPulse {
            0%, 100% { opacity: 0.28; transform: scale(1); }
            50% { opacity: 0.6; transform: scale(1.03); }
          }
        `}</style>

        <div className="relative z-10 mx-auto grid w-full max-w-7xl gap-12 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
          <div className="max-w-3xl">
            <div className="inline-flex rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs font-black uppercase tracking-[0.3em] text-slate-300">
              Optimus
            </div>
            <h1 className="mt-6 text-5xl font-black tracking-tight text-white sm:text-6xl lg:text-7xl">
              Transparent Credit Decisions.
              <span className="block text-emerald-400">Explainable by Design.</span>
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-8 text-slate-400 sm:text-lg">
              The only lending AI that shows its work - to borrowers, compliance officers, and regulators simultaneously. Built for RBI's 2023 Digital Lending Guidelines.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link to="/dashboard" className="inline-flex items-center justify-center rounded-full bg-emerald-500 px-6 py-3.5 text-sm font-black text-slate-950 transition hover:bg-emerald-400">
                View Live Demo →
              </Link>
              <Link to="/model-card" className="inline-flex items-center justify-center rounded-full border border-white/30 px-6 py-3.5 text-sm font-black text-white transition hover:bg-white/10">
                Explore Model Card
              </Link>
            </div>
          </div>

          <div className="grid gap-4 rounded-[28px] border border-white/10 bg-white/5 p-4 shadow-2xl backdrop-blur-sm sm:grid-cols-2">
            {stats.map((stat) => (
              <div key={stat.label} className="rounded-2xl border border-white/10 bg-slate-950/35 p-5">
                <div className="text-2xl font-black tracking-tight text-white sm:text-3xl">{stat.value}</div>
                <div className="mt-2 text-sm font-bold text-slate-300">{stat.label}</div>
                <div className="mt-1 text-xs font-semibold uppercase tracking-wide text-slate-500">{stat.detail}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-slate-200 bg-white px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto grid w-full max-w-7xl gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <article key={stat.label} className="rounded-2xl border border-slate-200 bg-slate-50 p-5 shadow-sm">
              <div className="text-2xl font-black text-slate-950">{stat.value}</div>
              <div className="mt-2 text-sm font-bold text-slate-700">{stat.label}</div>
              <div className="mt-1 text-xs font-semibold uppercase tracking-wide text-slate-500">{stat.detail}</div>
            </article>
          ))}
        </div>
      </section>

      <section className="bg-slate-50 px-4 py-14 sm:px-6 lg:px-8">
        <div className="mx-auto grid w-full max-w-7xl gap-5 lg:grid-cols-3">
          {audiences.map((audience) => (
            <article key={audience.title} className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg">
              <div className="text-3xl">{audience.icon}</div>
              <h2 className="mt-4 text-xl font-black text-slate-950">{audience.title}</h2>
              <p className="mt-3 text-sm leading-7 text-slate-600">{audience.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="bg-white px-4 py-14 sm:px-6 lg:px-8">
        <div className="mx-auto w-full max-w-7xl">
          <div className="flex items-end justify-between gap-4 flex-wrap">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.3em] text-emerald-600">How It Works</p>
              <h2 className="mt-2 text-3xl font-black text-slate-950 sm:text-4xl">From application to auditable decision</h2>
            </div>
          </div>
          <div className="mt-8 grid gap-4 lg:grid-cols-4">
            {steps.map((step, index) => (
              <div key={step} className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <div className="text-sm font-black uppercase tracking-wide text-emerald-600">0{index + 1}</div>
                <div className="mt-2 text-lg font-black text-slate-950">{step}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-200 bg-slate-950 px-4 py-8 text-center text-sm font-semibold text-slate-300 sm:px-6 lg:px-8">
        Optimus | Built for RBI Master Direction on Digital Lending 2023 | XGBoost + SHAP + SHA-256 Merkle Chain
      </footer>
    </main>
  );
}