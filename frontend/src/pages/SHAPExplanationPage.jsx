import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import SHAPBranchTree from "../components/SHAPBranchTree.jsx";
import SHAPTraceDetails from "../components/SHAPTraceDetails.jsx";

const API = "/api";

export default function SHAPExplanationPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const result = location.state?.result || null;
  const trace = result?.shap_trace || null;
  const [counterfactual, setCounterfactual] = useState(null);
  const [activeTab, setActiveTab] = useState("trace");
  const applicantId = location.state?.applicantId || null;

  useEffect(() => {
    if (applicantId) {
      fetch(`${API}/counterfactual/${applicantId}`)
        .then((response) => response.json())
        .then(setCounterfactual)
        .catch((error) => console.error("Counterfactual fetch error:", error));
    }
  }, [applicantId]);

  const summary = useMemo(() => {
    if (!result) return null;
    return {
      decision: result.decision,
      confidence: `${(Number(result.confidence || 0) * 100).toFixed(1)}%`,
      topReason: result.top_reason,
    };
  }, [result]);

  return (
    <main className="min-h-[calc(100vh-64px)] bg-slate-50 p-4 sm:p-6">
      <header className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-950 sm:text-3xl">SHAP Explanation</h1>
          <p className="mt-1 text-sm font-semibold text-slate-500">Branched reasoning tree and full SHAP attribution breakdown.</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <button onClick={() => navigate("/sandbox")} className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-black text-slate-700">
            Back to Sandbox
          </button>
          {!result && (
            <button onClick={() => navigate("/sandbox")} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-black text-white">
              Run a Scenario First
            </button>
          )}
        </div>
      </header>

      <section className="mt-5 grid gap-5">
        {!result ? (
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-semibold text-slate-500">To see the branched SHAP reasoning tree and detailed attribution trace, first run a scenario in the sandbox.</p>
          </div>
        ) : (
          <>
            {counterfactual && counterfactual.counterfactual_decision === "APPROVE" && (
              <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
                <div className="flex gap-2 border-b border-slate-200">
                  <button
                    onClick={() => setActiveTab("trace")}
                    className={`px-4 py-2 text-sm font-black ${activeTab === "trace" ? "border-b-2 border-blue-600 text-blue-600" : "text-slate-600"}`}
                  >
                    SHAP Trace
                  </button>
                  <button
                    onClick={() => setActiveTab("counterfactual")}
                    className={`px-4 py-2 text-sm font-black ${activeTab === "counterfactual" ? "border-b-2 border-blue-600 text-blue-600" : "text-slate-600"}`}
                  >
                    Counterfactual Explanation
                  </button>
                </div>
              </div>
            )}

            {activeTab === "trace" ? (
              <>
                <SHAPBranchTree result={result} trace={trace} />

                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h2 className="text-lg font-black text-slate-950">Decision Summary</h2>
                      <p className="mt-1 text-xs font-semibold text-slate-500">The compact verdict that feeds the branched tree.</p>
                    </div>
                    {summary && (
                      <div className={`rounded-xl px-4 py-2 text-sm font-black text-white ${summary.decision === "APPROVE" ? "bg-green-600" : "bg-red-600"}`}>
                        {summary.decision}
                      </div>
                    )}
                  </div>
                  {summary && <p className="mt-3 text-sm font-semibold text-slate-700">Confidence {summary.confidence} · Top reason: {summary.topReason}</p>}
                </div>

                <SHAPTraceDetails trace={trace} />
              </>
            ) : activeTab === "counterfactual" && counterfactual ? (
              <div className="rounded-2xl border border-blue-200 bg-blue-50 p-5 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <h2 className="text-lg font-black text-slate-950">Counterfactual Explanation</h2>
                  <span className="inline-block h-5 w-5 rounded-full bg-blue-600 text-[11px] font-black leading-5 text-center text-white" title="Computed by finding the minimum feature change that crosses the model's 0.65 decision threshold">?</span>
                </div>

                {counterfactual.tamil_text && (
                  <div className="mb-4 rounded-lg bg-white p-3 border border-blue-200">
                    <p className="text-sm font-bold text-slate-900">{counterfactual.tamil_text}</p>
                  </div>
                )}

                <div className="grid gap-3 mb-4">
                  <h3 className="text-sm font-black text-slate-950">Required Changes</h3>
                  {counterfactual.changes && counterfactual.changes.map((change, idx) => (
                    <div key={idx} className="rounded-lg border border-blue-200 bg-white p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="flex items-center gap-2 font-black text-slate-900">
                          <span className="inline-block h-2.5 w-2.5 rounded-full bg-blue-600" />
                          {change.display_name}
                        </span>
                        <span className={`rounded-full px-2.5 py-1 text-xs font-black ${change.actionable ? "bg-green-100 text-green-700" : "bg-slate-200 text-slate-600"}`}>
                          {change.actionable ? "Actionable" : "Time-based"}
                        </span>
                      </div>
                      <div className="text-sm text-slate-700 mb-2">
                        {change.feature === "emi_amount" && (
                          <span>₹{Math.round(change.original_value).toLocaleString()} → ₹{Math.round(change.new_value).toLocaleString()} <span className="text-xs text-slate-600">({change.change_pct}%)</span></span>
                        )}
                        {change.feature === "credit_score" && (
                          <span>Score: {Math.round(change.original_value)} → {Math.round(change.new_value)}</span>
                        )}
                        {change.feature === "num_defaults" && (
                          <span>Defaults: {Math.round(change.original_value)} → {Math.round(change.new_value)}</span>
                        )}
                      </div>
                      <p className="text-xs text-slate-600">{change.description}</p>
                    </div>
                  ))}
                </div>

                <div className="rounded-lg bg-white p-3 border border-blue-200 mb-4">
                  <p className="text-xs font-black text-slate-600 mb-1">Confidence Improvement</p>
                  <p className="text-sm font-bold text-slate-900">
                    {(counterfactual.original_confidence * 100).toFixed(1)}% → {(counterfactual.new_confidence * 100).toFixed(1)}%
                  </p>
                </div>

                <div className="rounded-lg bg-white p-3 border border-blue-200">
                  <p className="text-sm font-semibold text-slate-700">{counterfactual.plain_english}</p>
                </div>
              </div>
            ) : null}
          </>
        )}
      </section>
    </main>
  );
}