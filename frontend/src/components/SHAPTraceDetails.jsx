function formatTraceValue(feature, value) {
  if (["Credit Limit", "Latest Bill Amount", "Latest Payment Amount"].includes(feature)) {
    return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(value);
  }
  if (feature === "Age") return `${Math.round(value)} years`;
  return Number(value).toFixed(4);
}

export default function SHAPTraceDetails({ trace }) {
  if (!trace) return null;

  return (
    <section className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 shadow-sm">
      <header>
        <h3 className="text-base font-black text-slate-950">Complete SHAP Reasoning Trace</h3>
        <p className="mt-1 text-xs font-semibold text-slate-500">Every model feature, SHAP value, transformation step, and decision-threshold calculation is shown below.</p>
      </header>

      <article className="rounded-xl border border-slate-200 bg-white p-4">
        <h4 className="text-sm font-black text-slate-900">Step 1: Model Feature Vector</h4>
        <div className="mt-3 overflow-x-auto rounded-lg border border-slate-200">
          <table className="min-w-[640px] w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="px-3 py-2 font-black uppercase">Model Feature</th>
                <th className="px-3 py-2 font-black uppercase">Source Key</th>
                <th className="px-3 py-2 font-black uppercase">Value</th>
              </tr>
            </thead>
            <tbody>
              {trace.model_feature_inputs.map((row) => (
                <tr key={row.source_feature} className="border-t border-slate-100">
                  <td className="px-3 py-2 font-black text-slate-900">{row.feature}</td>
                  <td className="px-3 py-2 font-mono text-slate-600">{row.source_feature}</td>
                  <td className="px-3 py-2 font-bold text-slate-700">{formatTraceValue(row.feature, row.value)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </article>

      <article className="rounded-xl border border-slate-200 bg-white p-4">
        <h4 className="text-sm font-black text-slate-900">Step 2: Raw SHAP Outputs</h4>
        <p className="mt-1 text-xs font-semibold text-slate-500">{trace.raw_shap.explanation}</p>
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-lg bg-slate-50 p-3">
            <div className="text-[11px] font-black uppercase text-slate-500">Expected Value(s)</div>
            <div className="mt-1 text-sm font-black text-slate-900">{trace.raw_shap.expected_values.join(", ")}</div>
          </div>
          <div className="rounded-lg bg-slate-50 p-3">
            <div className="text-[11px] font-black uppercase text-slate-500">Base Value Used</div>
            <div className="mt-1 text-sm font-black text-slate-900">{Number(trace.raw_shap.base_value_used).toFixed(4)}</div>
          </div>
          <div className="rounded-lg bg-slate-50 p-3">
            <div className="text-[11px] font-black uppercase text-slate-500">Reconstructed Output</div>
            <div className="mt-1 text-sm font-black text-slate-900">{Number(trace.raw_shap.model_output_reconstructed).toFixed(4)}</div>
          </div>
        </div>
        <div className="mt-3 overflow-x-auto rounded-lg border border-slate-200">
          <table className="min-w-[780px] w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="px-3 py-2 font-black uppercase">Feature</th>
                <th className="px-3 py-2 font-black uppercase">Model Value</th>
                <th className="px-3 py-2 font-black uppercase">Raw SHAP</th>
                <th className="px-3 py-2 font-black uppercase">Approval Impact</th>
                <th className="px-3 py-2 font-black uppercase">Direction</th>
              </tr>
            </thead>
            <tbody>
              {trace.raw_shap.rows.map((row) => (
                <tr key={row.source_feature} className="border-t border-slate-100">
                  <td className="px-3 py-2 font-black text-slate-900">{row.feature}</td>
                  <td className="px-3 py-2 font-bold text-slate-700">{formatTraceValue(row.feature, row.model_feature_value)}</td>
                  <td className="px-3 py-2 font-mono text-slate-700">{Number(row.shap_raw).toFixed(4)}</td>
                  <td className={`px-3 py-2 font-black ${row.approval_impact >= 0 ? "text-green-700" : "text-red-700"}`}>{Number(row.approval_impact).toFixed(4)}</td>
                  <td className="px-3 py-2 font-semibold text-slate-600">{row.direction}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </article>

      <article className="rounded-xl border border-slate-200 bg-white p-4">
        <h4 className="text-sm font-black text-slate-900">Step 3: Applicant-Factor Aggregation</h4>
        <div className="mt-3 grid gap-3">
          {trace.aggregation.rows.map((row) => (
            <details key={row.input_feature} className="rounded-lg border border-slate-200 bg-slate-50 p-3" open>
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-black text-slate-900">
                <span>{row.input_feature}</span>
                <span className={Number(row.impact) >= 0 ? "text-green-700" : "text-red-700"}>{Number(row.impact).toFixed(4)}</span>
              </summary>
              <div className="mt-3 overflow-x-auto rounded-lg border border-slate-200 bg-white">
                <table className="min-w-[740px] w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500">
                    <tr>
                      <th className="px-3 py-2 font-black uppercase">Source</th>
                      <th className="px-3 py-2 font-black uppercase">Weight</th>
                      <th className="px-3 py-2 font-black uppercase">Source Impact</th>
                      <th className="px-3 py-2 font-black uppercase">Weighted Impact</th>
                      <th className="px-3 py-2 font-black uppercase">Why This Exists</th>
                    </tr>
                  </thead>
                  <tbody>
                    {row.components.map((component) => (
                      <tr key={`${row.input_feature}-${component.source_feature}-${component.weight}`} className="border-t border-slate-100">
                        <td className="px-3 py-2 font-black text-slate-900">{component.source_label}</td>
                        <td className="px-3 py-2 font-mono text-slate-700">{Number(component.weight).toFixed(4)}</td>
                        <td className={`px-3 py-2 font-black ${component.source_contribution >= 0 ? "text-green-700" : "text-red-700"}`}>{Number(component.source_contribution).toFixed(4)}</td>
                        <td className={`px-3 py-2 font-black ${component.weighted_contribution >= 0 ? "text-green-700" : "text-red-700"}`}>{Number(component.weighted_contribution).toFixed(4)}</td>
                        <td className="px-3 py-2 font-semibold text-slate-600">{component.note}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </details>
          ))}
        </div>
      </article>

      <article className="rounded-xl border border-slate-200 bg-white p-4">
        <h4 className="text-sm font-black text-slate-900">Step 4: Decision Threshold Math</h4>
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-5">
          <div className="rounded-lg bg-slate-50 p-3">
            <div className="text-[11px] font-black uppercase text-slate-500">Reject Probability</div>
            <div className="mt-1 text-sm font-black text-slate-900">{(Number(trace.decision_math.reject_probability) * 100).toFixed(2)}%</div>
          </div>
          <div className="rounded-lg bg-slate-50 p-3">
            <div className="text-[11px] font-black uppercase text-slate-500">Threshold</div>
            <div className="mt-1 text-sm font-black text-slate-900">{(Number(trace.decision_math.threshold) * 100).toFixed(2)}%</div>
          </div>
          <div className="rounded-lg bg-slate-50 p-3">
            <div className="text-[11px] font-black uppercase text-slate-500">Margin</div>
            <div className={`mt-1 text-sm font-black ${Number(trace.decision_math.threshold_margin) >= 0 ? "text-red-700" : "text-green-700"}`}>{Number(trace.decision_math.threshold_margin).toFixed(4)}</div>
          </div>
          <div className="rounded-lg bg-slate-50 p-3">
            <div className="text-[11px] font-black uppercase text-slate-500">Decision</div>
            <div className="mt-1 text-sm font-black text-slate-900">{trace.decision_math.decision}</div>
          </div>
          <div className="rounded-lg bg-slate-50 p-3">
            <div className="text-[11px] font-black uppercase text-slate-500">Confidence</div>
            <div className="mt-1 text-sm font-black text-slate-900">{(Number(trace.decision_math.confidence) * 100).toFixed(2)}%</div>
          </div>
        </div>
      </article>
    </section>
  );
}