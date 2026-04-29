import { useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const API = "http://localhost:8000/api";

const sliders = [
  ["monthly_income", "Monthly Income", 10000, 200000, 1000, "currency"],
  ["emi_amount", "EMI Amount", 1000, 80000, 500, "currency"],
  ["credit_score", "Credit Score", 300, 900, 10, "number"],
  ["credit_age_months", "Credit History", 6, 120, 1, "months"],
  ["num_defaults", "Past Defaults", 0, 5, 1, "number"],
  ["loan_amount", "Loan Amount", 50000, 2000000, 10000, "currency"],
];

const initialValues = {
  monthly_income: 32000,
  emi_amount: 30000,
  credit_score: 580,
  credit_age_months: 18,
  num_defaults: 2,
  loan_amount: 400000,
};

const rajanValues = {
  monthly_income: 32000,
  emi_amount: 11500,
  credit_score: 580,
  credit_age_months: 18,
  num_defaults: 2,
  loan_amount: 200000,
};

function formatValue(value, type) {
  if (type === "currency") {
    return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(value);
  }
  if (type === "months") return `${value} months`;
  return value;
}

export default function PredictionSandbox() {
  const [values, setValues] = useState(initialValues);
  const [result, setResult] = useState(null);
  const [rajanResult, setRajanResult] = useState(null);
  const [compareToRajan, setCompareToRajan] = useState(false);
  const [loading, setLoading] = useState(false);

  const runPrediction = async () => {
    setLoading(true);
    setResult(null);
    const response = await fetch(`${API}/predict/custom`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    const payload = await response.json();
    setResult(payload);
    setLoading(false);
  };

  const toggleCompare = async () => {
    const next = !compareToRajan;
    setCompareToRajan(next);
    if (next && !rajanResult) {
      const response = await fetch(`${API}/predict/custom`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(rajanValues),
      });
      setRajanResult(await response.json());
    }
  };

  const chartData = useMemo(() => {
    if (!result) return [];
    const rajanMap = new Map((rajanResult?.shap_values || []).map((item) => [item.feature, item.impact]));
    return result.shap_values.map((item) => ({
      ...item,
      rajanImpact: rajanMap.get(item.feature) ?? 0,
    }));
  }, [result, rajanResult]);

  return (
    <main className="min-h-[calc(100vh-64px)] bg-slate-50 p-4 sm:p-6">
      <header>
        <h1 className="text-2xl font-black text-slate-950 sm:text-3xl">Live Prediction Sandbox</h1>
        <p className="mt-1 text-sm font-semibold text-slate-500">Adjust applicant inputs and run the trained XGBoost model in real time.</p>
      </header>

      <section className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-[420px_1fr]">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-black text-slate-950">Applicant Inputs</h2>
          <div className="mt-5 grid gap-5">
            {sliders.map(([key, label, min, max, step, type]) => (
              <label key={key} className="block">
                <div className="flex items-center justify-between text-sm font-black text-slate-800">
                  <span>{label}</span>
                  <span className="text-blue-700">{formatValue(values[key], type)}</span>
                </div>
                <input
                  type="range"
                  min={min}
                  max={max}
                  step={step}
                  value={values[key]}
                  onChange={(event) => setValues((current) => ({ ...current, [key]: Number(event.target.value) }))}
                  className="mt-2 w-full accent-blue-600"
                />
              </label>
            ))}
          </div>
          <button onClick={runPrediction} disabled={loading} className="mt-6 w-full rounded-lg bg-blue-600 px-4 py-3 text-sm font-black text-white disabled:opacity-60">
            {loading ? "Running Model..." : "Run Model"}
          </button>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-lg font-black text-slate-950">Model Result</h2>
            <button
              onClick={toggleCompare}
              className={`rounded-full px-3 py-2 text-xs font-black transition ${compareToRajan ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-700"}`}
            >
              Compare to Rajan
            </button>
          </div>
          {loading && (
            <div className="mt-6 grid gap-4">
              <div className="h-14 w-40 rounded-xl skeleton" />
              <div className="h-20 rounded-xl skeleton" />
              <div className="h-80 rounded-xl skeleton" />
            </div>
          )}
          {!loading && !result && <p className="mt-6 text-sm font-semibold text-slate-500">Run the model to see the verdict, confidence, SHAP waterfall, and top reason.</p>}
          {!loading && result && (
            <div className="mt-5">
              <div className={`inline-flex rounded-xl px-5 py-3 text-2xl font-black text-white ${result.decision === "APPROVE" ? "bg-green-600" : "bg-red-600"}`}>{result.decision}</div>
              <div className="mt-5">
                <div className="flex justify-between text-sm font-black text-slate-700">
                  <span>Confidence</span>
                  <span>{(result.confidence * 100).toFixed(1)}%</span>
                </div>
                <div className="mt-2 h-4 overflow-hidden rounded-full bg-slate-100">
                  <div className={`h-full rounded-full ${result.decision === "APPROVE" ? "bg-green-600" : "bg-red-600"}`} style={{ width: `${result.confidence * 100}%` }} />
                </div>
              </div>
              <p className="mt-4 rounded-lg bg-slate-50 p-3 text-sm font-bold text-slate-700">Top reason: {result.top_reason}</p>
              {typeof result.reject_probability === "number" && (
                <p className="mt-2 rounded-lg bg-blue-50 p-3 text-xs font-bold text-blue-800">
                  Raw model default risk: {(result.reject_probability * 100).toFixed(1)}%. The final verdict uses the lender policy threshold from the Model Card.
                </p>
              )}
              <div className="mt-5 h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} layout="vertical" margin={{ left: 100, right: 30 }}>
                    <CartesianGrid stroke="#e5e7eb" horizontal={false} />
                    <XAxis type="number" tickFormatter={(value) => value.toFixed(1)} />
                    <YAxis type="category" dataKey="feature" width={100} tick={{ fontSize: 12 }} />
                    <Tooltip formatter={(value, name) => [Number(value).toFixed(4), name === "rajanImpact" ? "Rajan SHAP impact" : "Custom SHAP impact"]} />
                    {compareToRajan && rajanResult && (
                      <Bar dataKey="rajanImpact" radius={5} fill="#64748b" opacity={0.32} />
                    )}
                    <Bar dataKey="impact" radius={5}>
                      {chartData.map((entry) => (
                        <Cell key={entry.feature} fill={entry.impact < 0 ? "#dc2626" : "#16a34a"} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
