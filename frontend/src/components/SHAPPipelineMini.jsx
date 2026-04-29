import { useState } from "react";
import { Bar, BarChart, Cell, CartesianGrid, ResponsiveContainer, ReferenceLine, Tooltip, XAxis, YAxis } from "recharts";

function Stage({ title, subtitle, active = false, done = false, children }) {
  const tone = active ? "border-blue-400 bg-blue-50" : done ? "border-green-300 bg-green-50" : "border-slate-200 bg-white";
  const dotTone = active ? "bg-blue-600" : done ? "bg-green-600" : "bg-slate-300";

  return (
    <article className={`rounded-xl border p-3 shadow-sm transition ${tone}`}>
      <div className="mb-2 flex items-center gap-2">
        <span className={`h-2.5 w-2.5 rounded-full ${dotTone} ${active ? "live-dot" : ""}`} />
        <h3 className="text-xs font-black uppercase tracking-wide text-slate-700">{title}</h3>
      </div>
      <p className="text-[11px] font-bold leading-4 text-slate-500">{subtitle}</p>
      <div className="mt-2">{children}</div>
    </article>
  );
}

function formatBranchImpact(value) {
  const numeric = Number(value || 0);
  return `${numeric >= 0 ? "+" : ""}${numeric.toFixed(3)}`;
}

export default function SHAPPipelineMini({ loading, result, values, trace, compact = false }) {
  const [showAllBranches, setShowAllBranches] = useState(false);
  const hasResult = Boolean(result);
  const decision = result?.decision || "PENDING";
  const topReason = result?.top_reason || "Awaiting model output";
  const traceRows = trace?.raw_shap?.rows || [];
  const sourceRows = traceRows.length ? traceRows : (result?.shap_values || []);
  const visibleRows = showAllBranches ? sourceRows : sourceRows.slice(0, 5);
  const branchRows = traceRows.length
    ? visibleRows.map((item) => ({
        key: item.source_feature,
        feature: item.feature,
        impact: Number(item.approval_impact || 0),
      }))
    : visibleRows.map((item) => ({
        key: item.feature,
        feature: item.feature,
        impact: Number(item.impact || 0),
      }));

  const maxBranchImpact = Math.max(0.1, ...branchRows.map((item) => Math.abs(item.impact)));
  const waterfallRows = [...branchRows]
    .sort((left, right) => Math.abs(right.impact) - Math.abs(left.impact))
    .slice(0, 6)
    .map((branch) => ({
      name: branch.feature,
      impact: branch.impact,
    }));

  if (compact) {
    return (
      <div className="mt-4 rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-black text-slate-900">SHAP Waterfall</h3>
            <p className="text-[11px] font-semibold text-slate-500">Top feature contributions driving the verdict</p>
          </div>
          <span className={`rounded-full px-2.5 py-1 text-[10px] font-black ${loading ? "bg-blue-100 text-blue-800" : hasResult ? (result.decision === "APPROVE" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800") : "bg-slate-100 text-slate-600"}`}>
            {loading ? "Running" : hasResult ? "Live" : "Ready"}
          </span>
        </div>

        <div className="h-80 rounded-xl border border-slate-200 bg-slate-50 p-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={waterfallRows} layout="vertical" margin={{ left: 110, right: 18, top: 8, bottom: 8 }}>
              <CartesianGrid stroke="#e5e7eb" horizontal={false} />
              <ReferenceLine x={0} stroke="#94a3b8" strokeDasharray="3 3" />
              <XAxis
                type="number"
                domain={[-maxBranchImpact, maxBranchImpact]}
                tickFormatter={(value) => `${value >= 0 ? "+" : ""}${Number(value).toFixed(1)}`}
                tick={{ fontSize: 11, fill: "#475569" }}
                axisLine={{ stroke: "#cbd5e1" }}
                tickLine={false}
              />
              <YAxis
                type="category"
                dataKey="name"
                width={110}
                tick={{ fontSize: 11, fill: "#0f172a", fontWeight: 700 }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                cursor={{ fill: "rgba(59,130,246,0.06)" }}
                formatter={(value) => [`${Number(value).toFixed(3)}`, "SHAP impact"]}
                labelFormatter={(label) => `${label}`}
              />
              <Bar dataKey="impact" radius={[0, 6, 6, 0]} barSize={18}>
                {waterfallRows.map((entry) => (
                  <Cell key={entry.name} fill={entry.impact < 0 ? "#ef4444" : "#22c55e"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="mt-3 grid gap-2 sm:grid-cols-3">
          <div className="rounded-lg bg-slate-50 px-3 py-2 text-xs font-bold text-slate-700">
            Risk {(Number(result?.reject_probability || 0) * 100).toFixed(1)}%
          </div>
          <div className="rounded-lg bg-slate-50 px-3 py-2 text-xs font-bold text-slate-700">
            Top reason: {topReason}
          </div>
          <div className="rounded-lg bg-slate-50 px-3 py-2 text-xs font-bold text-slate-700">
            Decision: {decision}
          </div>
        </div>
      </div>
    );
  }

  return (
    <section className="mt-5 rounded-xl border border-slate-200 bg-white p-4 shadow-sm max-h-[28rem] overflow-y-auto">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-black text-slate-950">How The Model Thinks</h2>
          <p className="mt-1 text-xs font-semibold text-slate-500">Branched flow: model scoring fans out into feature-level SHAP paths, then merges into one lending verdict.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {sourceRows.length > 5 && (
            <button
              onClick={() => setShowAllBranches((current) => !current)}
              aria-pressed={showAllBranches}
              className="rounded-full border border-blue-300 bg-blue-50 px-3 py-1 text-xs font-black text-blue-800"
            >
              {showAllBranches ? "Auditor Mode: All Branches" : "Judge Mode: Top Branches"}
            </button>
          )}
          <span className={`rounded-full px-3 py-1 text-xs font-black ${loading ? "bg-blue-100 text-blue-800" : hasResult ? "bg-green-100 text-green-800" : "bg-slate-100 text-slate-600"}`}>
            {loading ? "Running" : hasResult ? "Explained" : "Ready"}
          </span>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-[240px_1fr_260px] lg:items-stretch">
        <Stage title="1. Inputs" subtitle="Applicant feature values" active={!loading && !hasResult} done={loading || hasResult}>
          <div className="grid grid-cols-2 gap-1 text-[11px] font-bold text-slate-700">
            <span>Income: {(values.monthly_income / 1000).toFixed(0)}k</span>
            <span>EMI: {(values.emi_amount / 1000).toFixed(0)}k</span>
            <span>Score: {values.credit_score}</span>
            <span>Defaults: {values.num_defaults}</span>
          </div>
        </Stage>

        <article className="rounded-xl border border-slate-200 bg-slate-50 p-3 shadow-sm">
          <div className="mb-3 grid gap-3 md:grid-cols-[1fr_42px_1fr] md:items-center">
            <Stage title="2. XGBoost" subtitle="Predicts default risk" active={loading} done={hasResult}>
              <div className="h-8 rounded-md bg-slate-100 px-2 py-1 text-[11px] font-bold text-slate-700">
                {loading ? "Scoring applicant profile..." : hasResult ? `Risk ${(result.reject_probability * 100).toFixed(1)}%` : "Waiting for run"}
              </div>
            </Stage>
            <div className="relative hidden h-10 md:block">
              <div className={`absolute left-0 top-1/2 h-px w-full -translate-y-1/2 ${loading || hasResult ? "bg-blue-400" : "bg-slate-300"}`} />
              <span className={`pipeline-dot absolute left-0 top-1/2 h-2.5 w-2.5 -translate-y-1/2 rounded-full ${loading || hasResult ? "bg-blue-500" : "bg-slate-300"}`} />
            </div>
            <Stage title="3. SHAP" subtitle="Branch-level contributions" active={loading} done={hasResult}>
              <div className="h-8 rounded-md bg-slate-100 px-2 py-1 text-[11px] font-bold text-slate-700">
                {loading ? "Computing SHAP vectors..." : hasResult ? topReason : "Pending contributions"}
              </div>
            </Stage>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-3">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-[11px] font-black uppercase tracking-wide text-slate-500">SHAP Branches</p>
              <div className="flex items-center gap-2">
                <p className="text-[11px] font-bold text-slate-500">Showing {branchRows.length} of {sourceRows.length || branchRows.length}</p>
                {sourceRows.length > 5 && (
                  <span className="rounded-md border border-blue-200 bg-blue-50 px-2 py-1 text-[10px] font-black text-blue-700">
                    {showAllBranches ? "All branches visible" : "Top branches visible"}
                  </span>
                )}
              </div>
            </div>
            <div className="grid gap-2">
              {branchRows.map((branch) => {
                const width = Math.max(8, (Math.abs(branch.impact) / maxBranchImpact) * 100);
                const negative = branch.impact < 0;
                return (
                  <div key={branch.key} className="rounded-md border border-slate-200 bg-slate-50 p-2">
                    <div className="mb-1 flex items-center justify-between gap-2 text-[11px]">
                      <span className="truncate font-black text-slate-800">{branch.feature}</span>
                      <span className={`font-black ${negative ? "text-red-700" : "text-green-700"}`}>{formatBranchImpact(branch.impact)}</span>
                    </div>
                    <div className="branch-lane relative h-2.5 rounded-full bg-slate-200">
                      <div className={`h-full rounded-full ${negative ? "bg-red-500" : "bg-green-500"}`} style={{ width: `${width}%` }} />
                    </div>
                  </div>
                );
              })}
              {!branchRows.length && (
                <div className="rounded-md border border-slate-200 bg-slate-50 p-2 text-[11px] font-semibold text-slate-500">
                  Run model to generate SHAP branches.
                </div>
              )}
            </div>
          </div>
        </article>

        <Stage title="4. Decision" subtitle="Policy threshold + explanation" active={hasResult} done={hasResult}>
          <div className="flex items-center gap-2">
            <span className={`rounded-md px-2 py-1 text-[11px] font-black text-white ${decision === "APPROVE" ? "bg-green-600" : decision === "REJECT" ? "bg-red-600" : "bg-slate-400"}`}>
              {decision}
            </span>
            <span className="text-[11px] font-bold text-slate-700">
              {hasResult ? `${(result.confidence * 100).toFixed(1)}% confidence` : "No result yet"}
            </span>
          </div>
        </Stage>
      </div>
    </section>
  );
}