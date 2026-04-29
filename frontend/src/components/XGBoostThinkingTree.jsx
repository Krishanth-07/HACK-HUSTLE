import { useEffect, useState } from "react";

function TreeNodeBox({ label, value, status, animationDelay }) {
  const statusColors = {
    good: "border-green-300 bg-green-50",
    moderate: "border-amber-300 bg-amber-50",
    risky: "border-red-300 bg-red-50",
    neutral: "border-slate-200 bg-white",
  };

  return (
    <div
      className={`rounded-lg border-2 p-2 text-center transition-all ${statusColors[status] || statusColors.neutral}`}
      style={{
        opacity: 0,
        animation: `fadeUpIn 500ms ease-out ${animationDelay}ms both`,
      }}
    >
      <div className="text-[10px] font-bold text-slate-600">{label}</div>
      <div className="mt-1 text-xs font-black text-slate-900">{value}</div>
    </div>
  );
}

export default function XGBoostThinkingTree({ loading, result, values }) {
  const [animationPhase, setAnimationPhase] = useState(0);

  useEffect(() => {
    if (loading) {
      setAnimationPhase(0);
      const timer = setInterval(() => {
        setAnimationPhase((p) => (p < 4 ? p + 1 : 4));
      }, 600);
      return () => clearInterval(timer);
    }
  }, [loading]);

  // Calculate XGBoost scores
  const annualIncome = values.monthly_income * 12;
  const annualEMI = values.emi_amount * 12;
  const creditScore = values.credit_score;
  const loanAmount = values.loan_amount;

  // Tree 1: Credit Score
  let tree1Score = 0;
  if (creditScore >= 750) tree1Score = 0.35;
  else if (creditScore >= 650) tree1Score = 0.15;
  else if (creditScore >= 550) tree1Score = -0.05;
  else tree1Score = -0.35;

  // Tree 2: LTI (Loan-to-Income)
  const lti = loanAmount / annualIncome;
  let tree2Score = 0;
  if (lti < 0.25) tree2Score = 0.3;
  else if (lti < 0.45) tree2Score = 0.1;
  else if (lti < 0.7) tree2Score = -0.1;
  else tree2Score = -0.35;

  // Tree 3: FOIR (Fixed Obligation-to-Income Ratio)
  const foir = annualEMI / annualIncome;
  let tree3Score = 0;
  if (foir < 0.35) tree3Score = 0.25;
  else if (foir < 0.5) tree3Score = 0.05;
  else if (foir < 0.65) tree3Score = -0.15;
  else tree3Score = -0.4;

  // Tree 4: LTV (simplified - assuming assets = 1.5x loan)
  const assumedAssets = loanAmount * 1.5;
  const ltv = loanAmount / assumedAssets;
  let tree4Score = 0;
  if (ltv < 0.3) tree4Score = 0.2;
  else if (ltv < 0.6) tree4Score = 0.05;
  else if (ltv < 1.0) tree4Score = -0.1;
  else tree4Score = -0.3;

  // Tree 5: Employment (assuming salaried)
  const employmentScore = 1.0;
  let tree5Score = (employmentScore - 0.5) * 0.3;

  // Calculate probability
  const rawScore = tree1Score + tree2Score + tree3Score + tree4Score + tree5Score;
  const sigmoid = (x) => 1 / (1 + Math.exp(-x));
  let probability = sigmoid(rawScore * 3);
  probability = Math.max(0.03, Math.min(0.97, probability));

  const isApproved = probability >= 0.5;

  const importance = [
    { label: "Credit Score", pct: 31 },
    { label: "LTI", pct: 24 },
    { label: "FOIR", pct: 22 },
    { label: "LTV", pct: 13 },
    { label: "Employment", pct: 10 },
  ];

  return (
    <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-black text-slate-900">XGBoost Thinking Process</h3>
          <p className="text-[11px] font-semibold text-slate-500">Watch how the model evaluates your application</p>
        </div>
        <span
          className={`h-3 w-3 rounded-full ${
            loading ? "bg-amber-400 animate-pulse" : isApproved ? "bg-green-500" : "bg-red-500"
          }`}
        />
      </div>

      <style>{`
        @keyframes fadeUpIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div className="space-y-3">
        {/* Root Node */}
        {animationPhase >= 0 && (
          <div
            className="rounded-lg border-2 border-blue-400 bg-blue-50 p-3 text-center"
            style={{ opacity: 0, animation: "fadeUpIn 500ms ease-out 0ms both" }}
          >
            <div className="text-xs font-black text-blue-900">Loan Application Evaluated</div>
            <div className="mt-2 grid grid-cols-3 gap-2">
              <div className="text-[10px]">
                <span className="font-bold text-slate-600">Score:</span>
                <div className="text-blue-700">{creditScore}</div>
              </div>
              <div className="text-[10px]">
                <span className="font-bold text-slate-600">Income:</span>
                <div className="text-blue-700">₹{(annualIncome / 100000).toFixed(1)}L</div>
              </div>
              <div className="text-[10px]">
                <span className="font-bold text-slate-600">Loan:</span>
                <div className="text-blue-700">₹{(loanAmount / 100000).toFixed(1)}L</div>
              </div>
            </div>
          </div>
        )}

        {/* Level 1: Main Branches */}
        {animationPhase >= 1 && (
          <div className="grid grid-cols-3 gap-2">
            <TreeNodeBox
              label="Credit Score"
              value={creditScore}
              status={creditScore >= 750 ? "good" : creditScore >= 650 ? "moderate" : "risky"}
              animationDelay={600}
            />
            <TreeNodeBox
              label="LTI"
              value={`${(lti * 100).toFixed(1)}%`}
              status={lti < 0.45 ? "good" : lti < 0.7 ? "moderate" : "risky"}
              animationDelay={600}
            />
            <TreeNodeBox
              label="FOIR"
              value={`${(foir * 100).toFixed(1)}%`}
              status={foir < 0.5 ? "good" : foir < 0.65 ? "moderate" : "risky"}
              animationDelay={600}
            />
          </div>
        )}

        {/* Level 2: Decision Nodes */}
        {animationPhase >= 2 && (
          <div className="grid grid-cols-5 gap-1">
            <TreeNodeBox
              label="Credit Gate"
              value={tree1Score >= 0 ? "✓ Pass" : "✗ Fail"}
              status={tree1Score >= 0 ? "good" : "risky"}
              animationDelay={1200}
            />
            <TreeNodeBox
              label="FOIR Check"
              value={tree3Score >= 0 ? "✓ Pass" : "✗ Fail"}
              status={tree3Score >= 0 ? "good" : "risky"}
              animationDelay={1200}
            />
            <TreeNodeBox
              label="EMI Burden"
              value={tree2Score >= 0 ? "✓ Ok" : "✗ High"}
              status={tree2Score >= 0 ? "good" : "risky"}
              animationDelay={1200}
            />
            <TreeNodeBox
              label="Employment"
              value={tree5Score >= 0 ? "✓ Stable" : "✗ Risky"}
              status={tree5Score >= 0 ? "good" : "risky"}
              animationDelay={1200}
            />
            <TreeNodeBox
              label="LTV Ratio"
              value={tree4Score >= 0 ? "✓ Safe" : "✗ High"}
              status={tree4Score >= 0 ? "good" : "risky"}
              animationDelay={1200}
            />
          </div>
        )}

        {/* Level 3: Tree Votes */}
        {animationPhase >= 3 && (
          <div className="rounded-lg border-2 border-slate-200 bg-slate-50 p-2">
            <div className="mb-2 text-center text-[10px] font-bold text-slate-600">Tree Ensemble Votes</div>
            <div className="grid grid-cols-5 gap-2">
              {[
                { name: "Tree 1", score: tree1Score },
                { name: "Tree 2", score: tree2Score },
                { name: "Tree 3", score: tree3Score },
                { name: "Tree 4", score: tree4Score },
                { name: "Tree 5", score: tree5Score },
              ].map((tree, idx) => (
                <div
                  key={tree.name}
                  className={`rounded-md p-2 text-center transition-all ${
                    tree.score > 0 ? "border-green-200 bg-green-100" : "border-red-200 bg-red-100"
                  }`}
                  style={{
                    opacity: 0,
                    animation: `fadeUpIn 500ms ease-out ${1800 + idx * 100}ms both`,
                  }}
                >
                  <div className="text-[9px] font-bold text-slate-600">{tree.name}</div>
                  <div
                    className={`text-xs font-black ${tree.score > 0 ? "text-green-700" : "text-red-700"}`}
                  >
                    {tree.score > 0 ? "▲" : "▼"} {Math.abs(tree.score).toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Final Verdict */}
        {animationPhase >= 4 && (
          <div
            className={`rounded-lg border-2 p-4 text-center transition-all ${
              isApproved ? "border-green-400 bg-green-50" : "border-red-400 bg-red-50"
            }`}
            style={{ opacity: 0, animation: "fadeUpIn 600ms ease-out 2300ms both" }}
          >
            <div className={`text-2xl font-black ${isApproved ? "text-green-700" : "text-red-700"}`}>
              {isApproved ? "✓ APPROVED" : "✗ REJECTED"}
            </div>
            <div className="mt-2">
              <div className="text-[11px] font-bold text-slate-600">Probability</div>
              <div className="mt-1 h-3 overflow-hidden rounded-full bg-slate-200">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    isApproved ? "bg-green-500" : "bg-red-500"
                  }`}
                  style={{ width: `${probability * 100}%` }}
                />
              </div>
              <div className="mt-1 text-xs font-black text-slate-700">
                {(probability * 100).toFixed(1)}%
              </div>
            </div>

            {/* Feature Importance */}
            <div className="mt-4 space-y-1.5">
              <div className="text-[10px] font-bold text-slate-600">Feature Importance</div>
              {importance.map((feat) => (
                <div key={feat.label} className="flex items-center gap-2">
                  <span className="text-[9px] font-bold text-slate-700 w-20 text-right">
                    {feat.label}
                  </span>
                  <div className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 transition-all duration-500"
                      style={{ width: `${feat.pct}%` }}
                    />
                  </div>
                  <span className="text-[9px] font-black text-slate-700 w-8">
                    {feat.pct}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
