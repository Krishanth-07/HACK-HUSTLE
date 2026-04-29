import { useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import SHAPBranchTree from "../components/SHAPBranchTree.jsx";
import SHAPTraceDetails from "../components/SHAPTraceDetails.jsx";

export default function SHAPExplanationPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const result = location.state?.result || null;
  const trace = result?.shap_trace || null;

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
        )}
      </section>
    </main>
  );
}