import { useEffect, useState } from "react";
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const API = "/api";

function MetricCard({ label, value, color }) {
  const pct = Math.round(value * 100);
  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - value);
  return (
    <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-4">
        <svg width="96" height="96" viewBox="0 0 96 96" aria-label={`${label} ${pct}%`}>
          <circle cx="48" cy="48" r={radius} fill="none" stroke="#e5e7eb" strokeWidth="10" />
          <circle cx="48" cy="48" r={radius} fill="none" stroke={color} strokeWidth="10" strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={offset} transform="rotate(-90 48 48)" />
          <text x="48" y="52" textAnchor="middle" className="fill-slate-950 text-sm font-black">{pct}%</text>
        </svg>
        <div>
          <div className="text-sm font-black uppercase tracking-wide text-slate-500">{label}</div>
          <div className="mt-1 text-2xl font-black text-slate-950">{value.toFixed(3)}</div>
        </div>
      </div>
    </article>
  );
}

export default function ModelCard() {
  const [info, setInfo] = useState(null);

  useEffect(() => {
    fetch(`${API}/model/info`).then((response) => response.json()).then(setInfo);
  }, []);

  if (!info) {
    return (
      <main className="min-h-[calc(100vh-64px)] bg-slate-50 p-4 sm:p-6">
        <div className="h-16 max-w-xl rounded-xl skeleton" />
        <div className="mt-5 h-40 rounded-xl skeleton" />
        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="h-36 rounded-xl skeleton" />
          <div className="h-36 rounded-xl skeleton" />
          <div className="h-36 rounded-xl skeleton" />
          <div className="h-36 rounded-xl skeleton" />
        </div>
        <div className="mt-5 h-80 rounded-xl skeleton" />
      </main>
    );
  }

  const importance = info.feature_importance || [];

  return (
    <main className="min-h-[calc(100vh-64px)] bg-slate-50 p-4 sm:p-6">
      <header className="flex flex-col items-start justify-between gap-4 sm:flex-row">
        <div>
          <h1 className="text-2xl font-black text-slate-950 sm:text-3xl">Model Card</h1>
          <p className="mt-1 text-sm font-semibold text-slate-500">Judge-facing documentation for model performance, explainability, and fairness monitoring.</p>
        </div>
        <button onClick={() => window.open(`${API}/model/card/pdf`, "_blank")} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-black text-white">Download Model Card PDF</button>
      </header>

      <section className="mt-5 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-black text-slate-950">Model Overview</h2>
        <div className="mt-4 grid grid-cols-1 gap-3 text-sm sm:grid-cols-2 lg:grid-cols-5">
          <div className="rounded-lg bg-slate-50 p-3"><div className="font-bold text-slate-500">Algorithm</div><div className="mt-1 font-black text-slate-950">{info.algorithm_name}</div></div>
          <div className="rounded-lg bg-slate-50 p-3"><div className="font-bold text-slate-500">Dataset</div><div className="mt-1 font-black text-slate-950">{info.training_dataset}</div></div>
          <div className="rounded-lg bg-slate-50 p-3"><div className="font-bold text-slate-500">Records</div><div className="mt-1 font-black text-slate-950">{info.number_of_records.toLocaleString("en-IN")}</div></div>
          <div className="rounded-lg bg-slate-50 p-3"><div className="font-bold text-slate-500">Training Date</div><div className="mt-1 font-black text-slate-950">{info.training_date}</div></div>
          <div className="rounded-lg bg-slate-50 p-3"><div className="font-bold text-slate-500">Version</div><div className="mt-1 font-black text-slate-950">{info.version}</div></div>
        </div>
      </section>

      <section className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <MetricCard label="Accuracy" value={info.train_accuracy} color="#16a34a" />
        <MetricCard label="AUC-ROC" value={info.auc_score} color="#2563eb" />
        <MetricCard label="Precision" value={info.precision} color="#f59e0b" />
        <MetricCard label="Recall" value={info.recall} color="#dc2626" />
      </section>

      <section className="mt-5 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-black text-slate-950">Feature Importance</h2>
        <p className="mt-1 text-sm font-semibold text-slate-500">Mean absolute SHAP value across a training sample, sorted descending.</p>
        <div className="mt-4 h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={importance} layout="vertical" margin={{ left: 110, right: 30 }}>
              <CartesianGrid stroke="#e5e7eb" horizontal={false} />
              <XAxis type="number" tickFormatter={(value) => Number(value).toFixed(2)} />
              <YAxis type="category" dataKey="feature" width={110} tick={{ fontSize: 12 }} />
              <Tooltip formatter={(value) => Number(value).toFixed(4)} />
              <Bar dataKey="mean_abs_shap" radius={5}>
                {importance.map((item, index) => <Cell key={item.feature} fill={index === 0 ? "#2563eb" : "#64748b"} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-black text-slate-950">Known Limitations</h2>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm font-semibold leading-6 text-slate-600">
            {info.known_limitations.map((item) => <li key={item}>{item}</li>)}
          </ul>
        </article>
        <article className="rounded-xl border border-blue-200 bg-blue-50 p-5 shadow-sm">
          <h2 className="text-lg font-black text-blue-950">Fairness Statement</h2>
          <p className="mt-3 text-sm font-semibold leading-6 text-blue-900">{info.fairness_statement}</p>
        </article>
      </section>
    </main>
  );
}
