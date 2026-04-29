function toneForImpact(value) {
  return Number(value || 0) >= 0 ? "bg-green-600 text-white" : "bg-red-600 text-white";
}

function BranchCard({ feature, impact, source }) {
  return (
    <div className="min-w-0 rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm">
      <div className="flex min-w-0 items-start justify-between gap-2 sm:items-center">
        <span className="min-w-0 break-words text-xs font-black leading-4 text-slate-900">{feature}</span>
        <span className={`rounded-full px-2 py-0.5 text-[10px] font-black ${toneForImpact(impact)}`}>{Number(impact || 0) >= 0 ? "+" : ""}{Number(impact || 0).toFixed(3)}</span>
      </div>
      <div className="mt-1 break-words text-[10px] font-semibold text-slate-500">{source}</div>
    </div>
  );
}

export default function SHAPBranchTree({ result, trace }) {
  const rows = trace?.raw_shap?.rows || result?.shap_values || [];
  const negative = rows.filter((item) => Number(item.approval_impact ?? item.impact ?? 0) < 0).slice(0, 3);
  const positive = rows.filter((item) => Number(item.approval_impact ?? item.impact ?? 0) >= 0).slice(0, 3);
  const decision = result?.decision || "PENDING";

  return (
    <section className="rounded-2xl border border-slate-200 bg-gradient-to-b from-[#f5f8ff] to-white p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-black text-slate-950">Branched SHAP Reasoning</h2>
          <p className="mt-1 text-xs font-semibold text-slate-500">Root explanation flows into separate positive and negative paths before merging into the final decision.</p>
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-black ${decision === "APPROVE" ? "bg-green-100 text-green-800" : decision === "REJECT" ? "bg-red-100 text-red-800" : "bg-slate-100 text-slate-600"}`}>
          {decision}
        </span>
      </div>

      <div className="mt-6 grid gap-8 xl:grid-cols-[minmax(320px,_1fr)_400px_minmax(320px,_1fr)] xl:items-start">
        <div className="grid min-w-0 gap-3">
          <div className="mx-auto w-full max-w-[280px] rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-center shadow-sm">
            <div className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-700">Applicant Inputs</div>
            <div className="mt-1 text-sm font-black text-slate-950">Feature vector sent to the model</div>
          </div>
          <div className="mx-auto h-10 w-px bg-blue-300" />
          <div className="mx-auto w-full max-w-[280px] rounded-2xl border border-slate-300 bg-white px-4 py-3 text-center shadow-lg">
            <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">XGBoost + SHAP</div>
            <div className="mt-1 text-sm font-black text-slate-950">Model scoring and attribution</div>
            <div className="mt-2 rounded-lg bg-slate-100 px-2 py-1 text-[11px] font-bold text-slate-700">
              {result ? `Risk ${(Number(result.reject_probability || 0) * 100).toFixed(1)}%` : "Waiting for run"}
            </div>
          </div>
          <div className="mx-auto h-10 w-px bg-slate-300" />
          <div className="mx-auto w-full max-w-[280px] rounded-2xl border border-slate-300 bg-white px-4 py-3 text-center shadow-sm">
            <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Decision Gate</div>
            <div className="mt-1 text-sm font-black text-slate-950">Policy threshold and confidence</div>
          </div>
        </div>

        <div className="relative min-w-0 rounded-2xl border border-slate-200 bg-slate-950/95 p-6 text-white shadow-xl xl:min-h-[420px] max-h-[65vh] overflow-auto">
          <div className="pointer-events-none absolute inset-x-8 top-14 hidden h-px bg-white/20 md:block" />
          <div className="pointer-events-none absolute inset-x-8 top-1/2 hidden h-px bg-white/15 md:block" />
          <div className="pointer-events-none absolute inset-x-8 bottom-20 hidden h-px bg-white/20 md:block" />
          <div className="pointer-events-none absolute left-1/2 top-0 hidden h-full w-px -translate-x-1/2 bg-white/15 md:block" />

          <div className="relative z-10 grid gap-5 pt-1">
            <div className="mx-auto w-full max-w-[220px] rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-center backdrop-blur">
              <div className="text-[10px] font-black uppercase tracking-[0.25em] text-blue-200">SHAP Root</div>
              <div className="mt-1 text-sm font-black">How the model distributes credit</div>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <div className="min-w-0 rounded-2xl border border-red-300/20 bg-white/5 p-3">
                <div className="mb-3 flex items-center justify-between">
                  <div>
                    <div className="text-[10px] font-black uppercase tracking-[0.2em] text-red-200">Hurts Approval</div>
                    <div className="text-xs font-semibold text-white/70">Negative SHAP branches</div>
                  </div>
                  <span className="rounded-full bg-red-500 px-2 py-0.5 text-[10px] font-black text-white">{negative.length}</span>
                </div>
                <div className="grid gap-2">
                  {negative.map((item) => (
                    <BranchCard key={`${item.source_feature || item.feature}-neg`} feature={item.feature} impact={item.approval_impact ?? item.impact} source={item.source || item.source_label || "model feature"} />
                  ))}
                  {!negative.length && <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/60">No negative branches yet.</div>}
                </div>
              </div>

              <div className="min-w-0 rounded-2xl border border-green-300/20 bg-white/5 p-3">
                <div className="mb-3 flex items-center justify-between">
                  <div>
                    <div className="text-[10px] font-black uppercase tracking-[0.2em] text-green-200">Helps Approval</div>
                    <div className="text-xs font-semibold text-white/70">Positive SHAP branches</div>
                  </div>
                  <span className="rounded-full bg-green-500 px-2 py-0.5 text-[10px] font-black text-white">{positive.length}</span>
                </div>
                <div className="grid gap-2">
                  {positive.map((item) => (
                    <BranchCard key={`${item.source_feature || item.feature}-pos`} feature={item.feature} impact={item.approval_impact ?? item.impact} source={item.source || item.source_label || "model feature"} />
                  ))}
                  {!positive.length && <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/60">No positive branches yet.</div>}
                </div>
              </div>
            </div>

            <div className="mx-auto w-full max-w-[260px] rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-center backdrop-blur">
              <div className={`text-sm font-black ${decision === "APPROVE" ? "text-green-300" : decision === "REJECT" ? "text-red-300" : "text-slate-200"}`}>{decision}</div>
              <div className="mt-1 text-xs text-white/70">The branches merge here into the policy decision.</div>
            </div>
          </div>
        </div>

        <div className="grid min-w-0 gap-3">
          <div className="mx-auto w-full max-w-[280px] rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-center shadow-sm">
            <div className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-700">Confidence</div>
            <div className="mt-1 text-sm font-black text-slate-950">{result ? `${(Number(result.confidence || 0) * 100).toFixed(1)}%` : "No result yet"}</div>
          </div>
          <div className="mx-auto h-10 w-px bg-blue-300" />
          <div className="mx-auto w-full max-w-[280px] rounded-2xl border border-slate-300 bg-white px-4 py-3 text-center shadow-lg">
            <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Top Reason</div>
            <div className="mt-1 text-sm font-black text-slate-950">{result?.top_reason || "Awaiting explanation"}</div>
          </div>
          <div className="mx-auto h-10 w-px bg-slate-300" />
          <div className="mx-auto w-full max-w-[280px] rounded-2xl border border-slate-300 bg-white px-4 py-3 text-center shadow-sm">
            <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Trace</div>
            <div className="mt-1 text-sm font-black text-slate-950">Open the full explanation page for details</div>
          </div>
        </div>
      </div>
    </section>
  );
}