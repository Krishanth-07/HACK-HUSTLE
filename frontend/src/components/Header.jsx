import { useEffect, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";

const API = "/api";

const talkingPoints = {
  "/": [
    "Landing page shows the product story and judge positioning",
    "View Live Demo takes you into the working loan cockpit",
    "Explore Model Card surfaces the transparency artifact first",
  ],
  "/dashboard": [
    "Model verdict comes from live XGBoost - not hardcoded",
    "SHAP values are computed by TreeExplainer on the actual model",
    "Click Full Analysis to see feature attribution breakdown",
  ],
  "/sandbox": [
    "Type any applicant profile - model predicts in real time",
    "SHAP waterfall updates instantly showing which features drove the decision",
    "This proves the model generalises beyond our 5 demo applicants",
  ],
  "/explanation": [
    "Dedicated SHAP page shows the branched reasoning tree clearly",
    "Full attribution trace is separated from the sandbox to reduce clutter",
    "This is the page to use when you want to walk judges through every step",
  ],
  "/fairness": [
    "500-person synthetic population evaluated every month",
    "4/5ths rule flags demographic parity violations automatically",
    "Month 5 shows a real gender disparity from model output drift",
  ],
  "/audit": [
    "Each entry is SHA-256 hashed including the previous hash",
    "Edit any value and re-verify - downstream hashes break",
    "Merkle root lets a regulator verify the entire log in one check",
  ],
  "/applicant/1": [
    "Borrower-facing Tamil explanation - right to explanation fulfilled",
    "Reapply readiness score computed from actionable SHAP factors",
    "This is what differentiates us - the borrower is not left in the dark",
  ],
  "/model-card": [
    "This is our transparency artifact - standard in responsible AI",
    "Feature importance from real SHAP not from intuition",
    "Known limitations section shows we've thought about failure modes",
  ],
};

function clockText(date) {
  return new Intl.DateTimeFormat("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  }).format(date);
}

function pointsForPath(pathname) {
  if (talkingPoints[pathname]) return talkingPoints[pathname];
  if (pathname.startsWith("/applicant/")) return talkingPoints["/applicant/1"];
  return talkingPoints["/"];
}

function DemoGuide({ points }) {
  const [collapsed, setCollapsed] = useState(false);
  return (
    <aside className={`fixed right-4 top-24 z-40 rounded-xl border border-blue-200 bg-white shadow-2xl transition-all ${collapsed ? "w-14 p-2" : "w-80 p-4"}`}>
      <button onClick={() => setCollapsed(!collapsed)} className="mb-2 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-black text-white">
        {collapsed ? "Open" : "Hide"}
      </button>
      {!collapsed && (
        <>
          <h2 className="text-sm font-black uppercase tracking-wide text-blue-700">Demo Mode</h2>
          <p className="mt-1 text-xs font-bold text-slate-500">Judge talking points</p>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm font-semibold leading-6 text-slate-700">
            {points.map((point) => <li key={point}>{point}</li>)}
          </ul>
        </>
      )}
    </aside>
  );
}

export default function Header() {
  const [now, setNow] = useState(new Date());
  const [demoMode, setDemoMode] = useState(false);
  const [fairnessAlert, setFairnessAlert] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key.toLowerCase() === "d" && !event.ctrlKey && !event.metaKey && !event.altKey) {
        const tag = event.target?.tagName?.toLowerCase();
        if (["input", "textarea", "select"].includes(tag)) return;
        setDemoMode((current) => !current);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    fetch(`${API}/fairness/5`)
      .then((response) => response.json())
      .then((payload) => setFairnessAlert((payload.alerts || []).length > 0))
      .catch(() => setFairnessAlert(false));
  }, []);

  const linkClass = ({ isActive }) =>
    `whitespace-nowrap rounded-md px-4 py-2 text-sm font-semibold transition ${
      isActive ? "bg-blue-600 text-white" : "text-slate-600 hover:bg-slate-100"
    }`;

  return (
    <header className="min-h-16 border-b border-slate-200 bg-white px-4 shadow-sm sm:px-6">
      <div className="grid min-h-16 grid-cols-1 items-center gap-3 py-3 lg:grid-cols-[220px_1fr_280px] lg:py-0">
        <div className="min-w-0">
          <NavLink to="/" className="text-lg font-black text-slate-950 hover:text-blue-700">Optimus</NavLink>
          <div className="text-xs font-semibold text-slate-500">Credit Decision System</div>
        </div>
        <nav className="flex gap-1 overflow-x-auto lg:justify-center">
          <NavLink to="/dashboard" className={linkClass}>Dashboard</NavLink>
          <NavLink to="/sandbox" className={linkClass}>Try Live Prediction</NavLink>
          <NavLink to="/explanation" className={linkClass}>SHAP Explanation</NavLink>
          <NavLink to="/fairness" className={linkClass}>Fairness Monitor</NavLink>
          <NavLink to="/audit" className={linkClass}>Audit Log</NavLink>
          <NavLink to="/model-card" className={linkClass}>Model Card</NavLink>
        </nav>
        <div className="flex flex-wrap items-center gap-3 text-sm font-bold text-slate-700 lg:justify-end">
          <button
            aria-label="Fairness notifications"
            className="relative grid h-9 w-9 place-items-center rounded-full bg-slate-100 text-base text-slate-700"
            title={fairnessAlert ? "Fairness alert active" : "No fairness alert"}
          >
            <span aria-hidden="true">🔔</span>
            {fairnessAlert && <span className="absolute right-1.5 top-1.5 h-2.5 w-2.5 rounded-full bg-red-600 ring-2 ring-white" />}
          </button>
          <button
            onClick={() => setDemoMode((current) => !current)}
            className={`rounded-full px-3 py-1.5 text-xs font-black transition ${demoMode ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600"}`}
          >
            Demo Mode
          </button>
          <span className="live-dot h-2.5 w-2.5 rounded-full bg-green-500" />
          <span>Live</span>
          <time className="tabular-nums">{clockText(now)}</time>
        </div>
      </div>
      {demoMode && <DemoGuide points={pointsForPath(location.pathname)} />}
    </header>
  );
}
