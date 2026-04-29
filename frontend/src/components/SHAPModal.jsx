import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, XAxis, YAxis } from "recharts";

export default function SHAPModal({ applicant, prediction, onClose }) {
  const data = prediction.shap_factors.map((factor) => ({
    name: factor.feature,
    value: factor.contribution,
  }));

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/60 p-3 sm:p-6">
      <section className="max-h-[92vh] w-full max-w-4xl overflow-auto rounded-xl bg-white shadow-2xl">
        <header className="flex flex-col gap-3 border-b border-slate-200 p-4 sm:flex-row sm:items-start sm:justify-between sm:p-5">
          <div>
            <h2 className="text-xl font-black text-slate-950 sm:text-2xl">Decision Analysis - {applicant.name}</h2>
            <p className="mt-1 text-sm font-semibold text-slate-500">How the model reached this decision</p>
          </div>
          <button className="rounded-full bg-slate-100 px-3 py-1.5 text-sm font-black text-slate-700" onClick={onClose}>Close</button>
        </header>
        <div className="h-80 p-5">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} layout="vertical" margin={{ left: 130, right: 30 }}>
              <CartesianGrid stroke="#e5e7eb" horizontal={false} />
              <XAxis type="number" domain={[-0.5, 0.5]} tickFormatter={(value) => value.toFixed(1)} />
              <YAxis type="category" dataKey="name" width={130} tick={{ fontSize: 12 }} />
              <Bar dataKey="value" radius={5}>
                {data.map((entry) => (
                  <Cell key={entry.name} fill={entry.value < 0 ? "#dc2626" : "#16a34a"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="grid gap-3 px-5 pb-5">
          {prediction.shap_factors.map((factor) => (
            <article key={factor.feature} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center justify-between">
                <strong className="text-sm text-slate-950">{factor.feature}</strong>
                <span className={`rounded-full px-2.5 py-1 text-xs font-black ${factor.actionable ? "bg-green-100 text-green-700" : "bg-slate-200 text-slate-600"}`}>
                  {factor.actionable ? "Actionable" : "Structural"}
                </span>
              </div>
              <p className="mt-2 text-sm leading-6 text-slate-600">{factor.plain_english}</p>
            </article>
          ))}
        </div>
        <footer className="border-t border-slate-200 bg-slate-50 px-5 py-3 text-xs font-semibold text-slate-500">
          Explanations are derived directly from model feature weights using SHAP TreeExplainer. Not generated independently.
        </footer>
      </section>
    </div>
  );
}
