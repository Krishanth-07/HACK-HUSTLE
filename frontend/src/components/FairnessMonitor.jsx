import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const API = "http://localhost:8000/api";
const dimensions = [
  ["approval_by_gender", "Approval Rate by Gender"],
  ["approval_by_age", "Approval Rate by Age Group"],
  ["approval_by_geography", "Approval Rate by Geography"],
];

function colorForRatio(ratio) {
  if (ratio >= 0.8) return "bg-green-100 text-green-800";
  if (ratio >= 0.75) return "bg-amber-100 text-amber-800";
  return "bg-red-100 text-red-800";
}

function barColor(ratio) {
  if (ratio >= 0.8) return "#16a34a";
  if (ratio >= 0.75) return "#f59e0b";
  return "#dc2626";
}

function titleCase(value) {
  return value.split("-").map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join("-");
}

function flattenRows(data) {
  return dimensions.flatMap(([key, title]) =>
    Object.entries(data[key] || {}).map(([group, metrics]) => ({
      dimension: title.replace("Approval Rate by ", ""),
      group,
      ...metrics,
    })),
  );
}

function ChartCard({ title, values, mode }) {
  const metric = mode === "equalized" ? "false_negative_rate" : "approval_rate";
  const label = mode === "equalized" ? "False Negative Rate" : "Approval Rate";
  const data = Object.entries(values).map(([name, item]) => ({
    name: titleCase(name),
    value: item[metric],
    ratio: item.ratio,
  }));

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-black text-slate-950">{title}</h2>
      <p className="mt-1 text-xs font-bold text-slate-500">{label}</p>
      <div className="mt-4 h-52">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ left: 82, right: 25 }}>
            <CartesianGrid stroke="#e5e7eb" horizontal={false} />
            <XAxis type="number" domain={[0, 100]} tickFormatter={(v) => `${Number(v).toFixed(1)}%`} />
            <YAxis type="category" dataKey="name" width={82} tick={{ fontSize: 12 }} />
            <Tooltip formatter={(v) => `${Number(v).toFixed(1)}%`} />
            <Bar dataKey="value" radius={5}>
              {data.map((entry) => <Cell key={entry.name} fill={mode === "equalized" ? "#2563eb" : barColor(entry.ratio)} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}

function Alerts({ alerts }) {
  if (!alerts.length) {
    return (
      <section className="rounded-xl border border-green-200 bg-green-50 p-4 text-green-800">
        <h2 className="text-lg font-black">No 4/5ths rule violations</h2>
        <p className="mt-1 text-sm font-bold">All demographic groups are within the approved parity threshold for this month.</p>
      </section>
    );
  }

  return (
    <div className="grid gap-3">
      {alerts.map((alert) => (
        <section key={alert.group} className="rounded-xl bg-red-600 p-5 text-white shadow-lg">
          <h2 className="text-xl font-black">DEMOGRAPHIC PARITY ALERT</h2>
          <p className="mt-2 text-sm font-bold">
            {titleCase(alert.group)} approval ratio is {alert.ratio.toFixed(3)}, below the 4/5ths rule threshold of {alert.threshold.toFixed(3)}.
          </p>
          <p className="mt-1 text-sm font-bold">Immediate review required before next approval batch.</p>
        </section>
      ))}
    </div>
  );
}

function BreakdownTable({ rows, mode }) {
  return (
    <section className="mt-5 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-black text-slate-950">Demographics Breakdown</h2>
      <div className="mt-4 overflow-x-auto rounded-lg border border-slate-200">
        <table className="min-w-[760px] w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-3 py-3">Dimension</th>
              <th className="px-3 py-3">Group</th>
              <th className="px-3 py-3">Sample Size</th>
              <th className="px-3 py-3">Approval Rate</th>
              <th className="px-3 py-3">4/5ths Ratio</th>
              {mode === "equalized" && <th className="px-3 py-3">False Positive Rate</th>}
              {mode === "equalized" && <th className="px-3 py-3">False Negative Rate</th>}
              <th className="px-3 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={`${row.dimension}-${row.group}`} className="border-t border-slate-100">
                <td className="px-3 py-3 font-bold text-slate-500">{row.dimension}</td>
                <td className="px-3 py-3 font-black text-slate-900">{titleCase(row.group)}</td>
                <td className="px-3 py-3 text-slate-700">{row.sample_size}</td>
                <td className="px-3 py-3 font-bold text-slate-900">{row.approval_rate.toFixed(1)}%</td>
                <td className="px-3 py-3">
                  <span className={`rounded-full px-2.5 py-1 text-xs font-black ${colorForRatio(row.ratio)}`}>{row.ratio.toFixed(3)}</span>
                </td>
                {mode === "equalized" && <td className="px-3 py-3 text-slate-700">{row.false_positive_rate.toFixed(1)}%</td>}
                {mode === "equalized" && <td className="px-3 py-3 text-slate-700">{row.false_negative_rate.toFixed(1)}%</td>}
                <td className="px-3 py-3">
                  <span className={`rounded-full px-2.5 py-1 text-xs font-black ${row.status === "OK" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>{row.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default function FairnessMonitor() {
  const location = useLocation();
  const [month, setMonth] = useState(1);
  const [data, setData] = useState(null);
  const [mode, setMode] = useState("parity");
  const [logging, setLogging] = useState(false);
  const [draft, setDraft] = useState("");
  const [entries, setEntries] = useState([]);

  useEffect(() => {
    fetch(`${API}/fairness/${month}`).then((r) => r.json()).then(setData);
  }, [month]);

  const rows = useMemo(() => (data ? flattenRows(data) : []), [data]);

  if (!data) {
    return (
      <main className="min-h-[calc(100vh-64px)] bg-slate-50 p-4 sm:p-6">
        <div className="h-16 max-w-xl rounded-xl skeleton" />
        <div className="mt-5 h-28 rounded-xl skeleton" />
        <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="h-72 rounded-xl skeleton" />
          <div className="h-72 rounded-xl skeleton" />
          <div className="h-72 rounded-xl skeleton" />
        </div>
        <div className="mt-5 h-80 rounded-xl skeleton" />
      </main>
    );
  }

  return (
    <main className="min-h-[calc(100vh-64px)] bg-slate-50 p-4 sm:p-6">
      <header className="flex flex-col items-start justify-between gap-4 lg:flex-row">
        <div>
          <h1 className="text-2xl font-black text-slate-950 sm:text-3xl">Fairness Monitor</h1>
          <p className="mt-1 text-sm font-semibold text-slate-500">Model-scored demographic parity and equalized odds tracking</p>
        </div>
        <div className="flex w-full flex-col rounded-xl border border-slate-200 bg-white p-1 shadow-sm sm:w-auto sm:flex-row">
          <button onClick={() => setMode("parity")} className={`rounded-lg px-4 py-2 text-sm font-black ${mode === "parity" ? "bg-blue-600 text-white" : "text-slate-600"}`}>Demographic Parity</button>
          <button onClick={() => setMode("equalized")} className={`rounded-lg px-4 py-2 text-sm font-black ${mode === "equalized" ? "bg-blue-600 text-white" : "text-slate-600"}`}>Equalized Odds</button>
        </div>
      </header>

      <div className="mt-5">
        <Alerts alerts={data.alerts || []} />
      </div>

      <section className="mt-5 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <label className="text-sm font-black text-slate-900">Synthetic population month: {month}</label>
        <p className="mt-1 text-xs font-bold text-slate-500">500 generated applicants are scored through the trained XGBoost model for each month.</p>
        {location.state?.highlight && (
          <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-black text-amber-800">
            Bias review context: {location.state.highlight}
          </div>
        )}
        <input className="mt-4 w-full accent-blue-600" type="range" min="1" max="12" value={month} onChange={(e) => setMonth(Number(e.target.value))} />
      </section>

      <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-3">
        {dimensions.map(([key, title]) => <ChartCard key={key} title={title} values={data[key]} mode={mode} />)}
      </div>

      <BreakdownTable rows={rows} mode={mode} />

      <section className="mt-5 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-black text-slate-950">Corrective Action Log</h2>
        <button onClick={() => setLogging(true)} className="mt-3 rounded-lg bg-blue-600 px-4 py-2 text-sm font-black text-white">Log Corrective Action</button>
        {logging && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setEntries([{ timestamp: new Date().toLocaleString("en-IN"), action: draft }, ...entries]);
              setDraft("");
              setLogging(false);
            }}
            className="mt-3 flex flex-col gap-2 sm:flex-row"
          >
            <input value={draft} onChange={(e) => setDraft(e.target.value)} className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm" placeholder="Describe action taken" required />
            <button className="rounded-lg bg-green-600 px-4 py-2 text-sm font-black text-white">Submit</button>
          </form>
        )}
        <table className="mt-4 w-full text-left text-sm">
          <tbody>
            {entries.map((entry) => (
              <tr key={`${entry.timestamp}-${entry.action}`} className="border-t border-slate-100">
                <td className="py-2 font-bold text-slate-600">{entry.timestamp}</td>
                <td className="py-2 text-slate-800">{entry.action}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </main>
  );
}
