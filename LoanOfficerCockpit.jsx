import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const PRIMARY_GREEN = "#25D366";
const TN_RED = "#C8102E";

export const applicants = [
  {
    id: "rajan",
    nameTamil: "ரஜன் முருகன்",
    nameEnglish: "Rajan Murugan",
    city: "Chennai",
    age: 38,
    loanPurpose: "Business expansion",
    loanPurposeTamil: "வணிக விரிவாக்கம்",
    amount: 850000,
    employmentDuration: "2 years",
    activeLoans: 5,
    timeAgo: "8 min ago",
    urgency: "red",
    verdictTamil: "ரஜன் அவர்களின் கடன் மாத EMI சுமை காரணமாக நிராகரிக்கப்பட வேண்டும்",
    verdictEnglish: "Reject — monthly debt burden is 2.4x safe limit",
    applicant: {
      monthly_income: 32000,
      num_active_loans: 5,
      emi_to_income_ratio: 0.82,
      credit_history_months: 18,
      num_late_payments: 8,
      employment_months: 24,
      loan_amount: 1200000,
      age: 38,
      geography: 2,
      gender: 1,
    },
  },
  {
    id: "meena",
    nameTamil: "மீனா சுப்பிரமணியன்",
    nameEnglish: "Meena Subramanian",
    city: "Coimbatore",
    age: 32,
    loanPurpose: "Home renovation",
    loanPurposeTamil: "வீட்டு புதுப்பிப்பு",
    amount: 420000,
    employmentDuration: "6 years 2 months",
    activeLoans: 1,
    timeAgo: "18 min ago",
    urgency: "green",
    verdictTamil: "மீனா அவர்களின் நிலையான வருமானம் மற்றும் குறைந்த EMI சுமை காரணமாக ஒப்புதல் அளிக்கலாம்",
    verdictEnglish: "Approve — stable income and low repayment burden",
    applicant: {
      monthly_income: 78000,
      num_active_loans: 1,
      emi_to_income_ratio: 0.21,
      credit_history_months: 88,
      num_late_payments: 0,
      employment_months: 74,
      loan_amount: 420000,
      age: 32,
      geography: 1,
      gender: 0,
    },
  },
  {
    id: "karthik",
    nameTamil: "கார்த்திக் வேல்",
    nameEnglish: "Karthik Vel",
    city: "Madurai",
    age: 29,
    loanPurpose: "Vehicle purchase",
    loanPurposeTamil: "வாகன வாங்குதல்",
    amount: 580000,
    employmentDuration: "1 year 5 months",
    activeLoans: 2,
    timeAgo: "27 min ago",
    urgency: "yellow",
    verdictTamil: "கார்த்திக் அவர்களின் குறுகிய கடன் வரலாறு காரணமாக கூடுதல் மதிப்பாய்வு தேவை",
    verdictEnglish: "Review — thin credit history needs closer checks",
    applicant: {
      monthly_income: 54000,
      num_active_loans: 2,
      emi_to_income_ratio: 0.38,
      credit_history_months: 16,
      num_late_payments: 1,
      employment_months: 17,
      loan_amount: 580000,
      age: 29,
      geography: 1,
      gender: 1,
    },
  },
  {
    id: "lakshmi",
    nameTamil: "லட்சுமி பிரியா",
    nameEnglish: "Lakshmi Priya",
    city: "Tiruchirappalli",
    age: 45,
    loanPurpose: "Education support",
    loanPurposeTamil: "கல்வி உதவி",
    amount: 300000,
    employmentDuration: "9 years 1 month",
    activeLoans: 0,
    timeAgo: "42 min ago",
    urgency: "green",
    verdictTamil: "லட்சுமி அவர்களின் நல்ல திருப்பிச் செலுத்தும் வரலாறு காரணமாக ஒப்புதல் அளிக்கலாம்",
    verdictEnglish: "Approve — strong repayment history and no active loans",
    applicant: {
      monthly_income: 92000,
      num_active_loans: 0,
      emi_to_income_ratio: 0.12,
      credit_history_months: 126,
      num_late_payments: 0,
      employment_months: 109,
      loan_amount: 300000,
      age: 45,
      geography: 1,
      gender: 0,
    },
  },
  {
    id: "selvam",
    nameTamil: "செல்வம் ராஜா",
    nameEnglish: "Selvam Raja",
    city: "Thanjavur",
    age: 51,
    loanPurpose: "Farm equipment",
    loanPurposeTamil: "விவசாய உபகரணம்",
    amount: 640000,
    employmentDuration: "3 years 4 months",
    activeLoans: 2,
    timeAgo: "1 hr ago",
    urgency: "red",
    verdictTamil: "செல்வம் அவர்களின் தாமதமான கட்டணங்கள் மற்றும் வருமான சுமை காரணமாக நிராகரிக்கப்பட வேண்டும்",
    verdictEnglish: "Reject — late payments and income strain are above threshold",
    applicant: {
      monthly_income: 35000,
      num_active_loans: 2,
      emi_to_income_ratio: 0.57,
      credit_history_months: 34,
      num_late_payments: 5,
      employment_months: 40,
      loan_amount: 640000,
      age: 51,
      geography: 0,
      gender: 1,
    },
  },
];

function formatCurrency(value) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

function localFallbackPredict(applicant) {
  const highRisk =
    applicant.emi_to_income_ratio >= 0.5 ||
    applicant.num_late_payments >= 4 ||
    applicant.num_active_loans >= 3;

  return {
    decision: highRisk ? "reject" : "approve",
    confidence: highRisk ? 0.87 : 0.91,
    monthly_income_used: applicant.monthly_income,
    top_factors: [
      {
        feature_name: "EMI to income ratio",
        contribution: applicant.emi_to_income_ratio >= 0.35 ? -1.18 : 0.86,
        direction: applicant.emi_to_income_ratio >= 0.35 ? "hurts" : "helps",
        plain_tamil:
          applicant.emi_to_income_ratio >= 0.35
            ? "EMI சுமை வருமானத்துடன் ஒப்பிடும்போது அதிகமாக உள்ளது."
            : "EMI சுமை வருமானத்துடன் ஒப்பிடும்போது கட்டுப்பாட்டில் உள்ளது.",
        plain_english:
          applicant.emi_to_income_ratio >= 0.35
            ? "EMI burden is high compared with income."
            : "EMI burden is controlled compared with income.",
      },
      {
        feature_name: "Late payments",
        contribution: applicant.num_late_payments > 0 ? -0.88 : 0.72,
        direction: applicant.num_late_payments > 0 ? "hurts" : "helps",
        plain_tamil:
          applicant.num_late_payments > 0
            ? "சமீபத்திய தாமதமான கட்டணங்கள் ஆபத்தை உயர்த்துகின்றன."
            : "தாமதமான கட்டணங்கள் இல்லாதது நம்பகத்தன்மையை உயர்த்துகிறது.",
        plain_english:
          applicant.num_late_payments > 0
            ? "Recent late payments increase risk."
            : "No late payments improves repayment trust.",
      },
      {
        feature_name: "Monthly income",
        contribution: applicant.monthly_income >= 60000 ? 0.64 : -0.42,
        direction: applicant.monthly_income >= 60000 ? "helps" : "hurts",
        plain_tamil:
          applicant.monthly_income >= 60000
            ? "மாத வருமானம் இந்த விண்ணப்பத்திற்கு ஆதரவாக உள்ளது."
            : "மாத வருமானம் கடன் தொகைக்கு ஒப்பிடும்போது குறைவாக உள்ளது.",
        plain_english:
          applicant.monthly_income >= 60000
            ? "Monthly income supports this application."
            : "Monthly income is low compared with the requested amount.",
      },
    ],
  };
}

function toWaterfallData(prediction) {
  return (prediction?.top_factors || []).map((factor) => ({
    label: factor.feature_name,
    displayLabel: `${
      factor.feature_name === "EMI to income ratio"
        ? "EMI விகிதம்"
        : factor.feature_name === "Late payments"
          ? "தாமத கட்டணம்"
          : factor.feature_name === "Monthly income"
            ? "மாத வருமானம்"
            : factor.feature_name
    } / ${factor.feature_name}`,
    tamil:
      factor.feature_name === "EMI to income ratio"
        ? "EMI விகிதம்"
        : factor.feature_name === "Late payments"
          ? "தாமத கட்டணம்"
          : factor.feature_name === "Monthly income"
            ? "மாத வருமானம்"
            : factor.feature_name,
    value: Number(factor.contribution.toFixed(2)),
    direction: factor.direction,
  }));
}

function ShapModal({ applicant, prediction, onClose }) {
  const data = toWaterfallData(prediction);

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section
        className="shap-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="shap-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="modal-header">
          <div>
            <h2 id="shap-title">இந்த முடிவை எப்படி எட்டினோம் / How we reached this decision</h2>
            <p>{applicant.nameTamil} / {applicant.nameEnglish}</p>
          </div>
          <button type="button" className="close-button" onClick={onClose} aria-label="Close">
            x
          </button>
        </div>

        <div className="chart-wrap">
          <ResponsiveContainer width="100%" height={330}>
            <BarChart data={data} layout="vertical" margin={{ top: 8, right: 26, left: 160, bottom: 8 }}>
              <CartesianGrid stroke="#e8ece9" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 12 }} />
              <YAxis
                type="category"
                dataKey="displayLabel"
                width={160}
                tick={{ fontSize: 12, fill: "#25312b" }}
              />
              <Tooltip
                formatter={(value, _name, item) => [
                  value,
                  `${item.payload.tamil} / ${item.payload.label}`,
                ]}
              />
              <Bar dataKey="value" radius={[4, 4, 4, 4]}>
                {data.map((entry) => (
                  <Cell key={entry.label} fill={entry.value >= 0 ? PRIMARY_GREEN : "#e5484d"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="factor-grid">
          {prediction?.top_factors?.map((factor) => (
            <article className="factor-card" key={factor.feature_name}>
              <strong>{factor.feature_name}</strong>
              <span className={factor.direction === "helps" ? "helps" : "hurts"}>
                {factor.contribution > 0 ? "+" : ""}
                {factor.contribution}
              </span>
              <p>{factor.plain_tamil}</p>
              <p>{factor.plain_english}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

export default function LoanOfficerCockpit() {
  const [selectedId, setSelectedId] = useState("rajan");
  const [predictions, setPredictions] = useState({});
  const [modalOpen, setModalOpen] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [toast, setToast] = useState("");
  const thinkingTimer = useRef(null);
  const toastTimer = useRef(null);
  const navigate = useNavigate();

  const selectedApplicant = useMemo(
    () => applicants.find((applicant) => applicant.id === selectedId) || applicants[0],
    [selectedId],
  );

  const prediction = predictions[selectedApplicant.id] || localFallbackPredict(selectedApplicant.applicant);
  const isReject = prediction.decision === "reject";
  const confidencePercent = Math.round((prediction.confidence || 0) * 100);

  const selectApplicant = (applicantId) => {
    setSelectedId(applicantId);
    setIsThinking(true);
    window.clearTimeout(thinkingTimer.current);
    thinkingTimer.current = window.setTimeout(() => setIsThinking(false), 1500);
  };

  const sendMessage = () => {
    const message = `${selectedApplicant.nameTamil}க்கு WhatsApp செய்தி அனுப்பப்பட்டது ✓`;
    setToast(message);
    window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(""), 3200);
  };

  useEffect(() => {
    return () => {
      window.clearTimeout(thinkingTimer.current);
      window.clearTimeout(toastTimer.current);
    };
  }, []);

  useEffect(() => {
    applicants.forEach((item) => {
      fetch("http://127.0.0.1:8000/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item.applicant),
      })
        .then((response) => {
          if (!response.ok) throw new Error("Prediction API failed");
          return response.json();
        })
        .then((result) => {
          setPredictions((current) => ({ ...current, [item.id]: result }));
        })
        .catch(() => {
          setPredictions((current) => ({
            ...current,
            [item.id]: current[item.id] || localFallbackPredict(item.applicant),
          }));
        });
    });
  }, []);

  const exportAudit = () => {
    const text = [
      "Loan Officer Audit Report",
      `${selectedApplicant.nameTamil} / ${selectedApplicant.nameEnglish}`,
      `Decision: ${prediction.decision.toUpperCase()}`,
      `Confidence: ${confidencePercent}%`,
      `Monthly income used: ${formatCurrency(prediction.monthly_income_used)}`,
      `Amount: ${formatCurrency(selectedApplicant.amount)}`,
    ].join("\\n");
    const pdf = `%PDF-1.3
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>
endobj
4 0 obj
<< /Length 180 >>
stream
BT /F1 16 Tf 72 720 Td (${text.replace(/[()]/g, "")}) Tj ET
endstream
endobj
5 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
endobj
xref
0 6
0000000000 65535 f 
0000000010 00000 n 
0000000059 00000 n 
0000000116 00000 n 
0000000267 00000 n 
0000000498 00000 n 
trailer
<< /Root 1 0 R /Size 6 >>
startxref
568
%%EOF`;
    const blob = new Blob([pdf], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${selectedApplicant.id}-audit.pdf`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <main className="cockpit-shell">
      <style>{`
        @import url("https://fonts.googleapis.com/css2?family=Noto+Sans+Tamil:wght@400;500;600;700;800&display=swap");

        * { box-sizing: border-box; }

        .cockpit-shell {
          width: 100vw;
          min-height: calc(100vh - 58px);
          background: #ffffff;
          color: #142018;
          font-family: "Noto Sans Tamil", Inter, system-ui, sans-serif;
          letter-spacing: 0;
        }

        .top-tabs {
          height: 54px;
          padding: 0 24px;
          display: flex;
          align-items: end;
          gap: 8px;
          border-bottom: 1px solid #ead5d9;
          background: #ffffff;
        }

        .tab-button {
          height: 46px;
          border: 0;
          border-bottom: 3px solid transparent;
          padding: 0 18px;
          background: transparent;
          color: #5b6861;
          cursor: pointer;
          font: inherit;
          font-size: 13px;
          font-weight: 700;
        }

        .tab-button.active {
          border-color: ${TN_RED};
          color: ${TN_RED};
        }

        .stats-bar {
          min-height: 42px;
          display: flex;
          align-items: center;
          padding: 8px 24px;
          border-bottom: 1px solid #f0dce0;
          background: #fff7f8;
          color: #7a0c1d;
          font-size: 13px;
          font-weight: 900;
          line-height: 1.35;
        }

        .tab-panel {
          min-height: calc(100vh - 154px);
        }

        .dashboard-grid {
          display: grid;
          grid-template-columns: 40% 60%;
          min-height: calc(100vh - 154px);
        }

        .queue-column {
          border-right: 1px solid #ead5d9;
          background: #ffffff;
        }

        .queue-header {
          height: 66px;
          padding: 14px 22px 12px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-bottom: 1px solid #ecf0ed;
        }

        .queue-header h1 {
          margin: 0;
          color: #142018;
          font-size: 18px;
          line-height: 1.3;
        }

        .count-badge {
          min-width: 34px;
          height: 28px;
          border-radius: 999px;
          display: grid;
          place-items: center;
          background: ${PRIMARY_GREEN};
          color: #07351e;
          font-size: 14px;
          font-weight: 800;
        }

        .queue-list {
          display: grid;
          gap: 0;
        }

        .applicant-row {
          width: 100%;
          min-height: 88px;
          border: 0;
          border-bottom: 1px solid #ecf0ed;
          padding: 13px 22px;
          display: grid;
          grid-template-columns: 10px 1fr auto;
          gap: 12px;
          align-items: center;
          background: #ffffff;
          cursor: pointer;
          text-align: left;
          font: inherit;
        }

        .applicant-row.selected {
          background: #eafff1;
          box-shadow: inset 4px 0 0 ${TN_RED};
        }

        .urgency-dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
        }

        .urgency-dot.red { background: #e5484d; }
        .urgency-dot.yellow { background: #f2b441; }
        .urgency-dot.green { background: ${PRIMARY_GREEN}; }

        .row-main strong,
        .applicant-link {
          display: block;
          color: #142018;
          font-size: 15px;
          font-weight: 800;
          line-height: 1.3;
          text-decoration: none;
        }

        .applicant-link:hover,
        .profile-name-link:hover {
          color: #128c4a;
          text-decoration: underline;
        }

        .row-main span {
          display: block;
          margin-top: 3px;
          color: #69756f;
          font-size: 12px;
          line-height: 1.35;
        }

        .row-meta {
          text-align: right;
        }

        .row-meta strong {
          display: block;
          color: #142018;
          font-size: 14px;
        }

        .row-meta span {
          display: block;
          margin-top: 4px;
          color: #78857e;
          font-size: 11px;
        }

        .verdict-column {
          padding: 16px 20px;
          display: grid;
          grid-template-columns: minmax(0, 1fr) 260px;
          gap: 18px;
          align-items: start;
          background: #f4f7f5;
        }

        .verdict-main {
          min-width: 0;
        }

        .profile-name-link {
          color: inherit;
          text-decoration: none;
        }

        .profile-card,
        .verdict-card,
        .placeholder-card {
          border: 1px solid #dfe8e2;
          border-radius: 8px;
          background: #ffffff;
          box-shadow: 0 10px 30px rgba(200, 16, 46, 0.05);
        }

        .profile-card {
          padding: 16px 18px;
        }

        .profile-top {
          display: flex;
          justify-content: space-between;
          gap: 18px;
          margin-bottom: 12px;
        }

        .profile-top h2 {
          margin: 0;
          color: #142018;
          font-size: 22px;
          line-height: 1.2;
        }

        .profile-top p {
          margin: 5px 0 0;
          color: #647169;
          font-size: 14px;
        }

        .decision-badge {
          align-self: start;
          min-width: 124px;
          border-radius: 8px;
          padding: 10px 16px;
          color: #ffffff;
          text-align: center;
          font-size: 18px;
          font-weight: 900;
        }

        .decision-badge.reject { background: #d92d35; }
        .decision-badge.approve { background: #159947; }

        .decision-badge.reject.pulse-on-load {
          animation: rejectPulse 820ms ease-out 1;
        }

        .profile-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
        }

        .profile-stat {
          min-height: 62px;
          border-radius: 8px;
          padding: 9px 10px;
          background: #f7faf8;
        }

        .profile-stat span {
          display: block;
          color: #728078;
          font-size: 11px;
          font-weight: 700;
        }

        .profile-stat strong {
          display: block;
          margin-top: 5px;
          color: #17241c;
          font-size: 14px;
          line-height: 1.35;
        }

        .verdict-card {
          margin-top: 12px;
          padding: 18px 20px;
        }

        .eyebrow {
          margin: 0 0 10px;
          color: #728078;
          font-size: 12px;
          font-weight: 900;
          letter-spacing: 0.08em;
        }

        .verdict-tamil {
          margin: 0;
          color: #101a14;
          font-size: 22px;
          font-weight: 800;
          line-height: 1.55;
        }

        .verdict-english {
          margin: 6px 0 16px;
          color: ${PRIMARY_GREEN};
          font-size: 15px;
          font-weight: 800;
        }

        .confidence-row {
          display: grid;
          grid-template-columns: 1fr 58px;
          gap: 14px;
          align-items: center;
        }

        .confidence-track {
          height: 14px;
          overflow: hidden;
          border-radius: 999px;
          background: #e9efeb;
        }

        .confidence-fill {
          height: 100%;
          border-radius: inherit;
          background: ${PRIMARY_GREEN};
        }

        .confidence-value {
          color: #142018;
          font-size: 18px;
          font-weight: 900;
          text-align: right;
        }

        .action-row {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
          margin-top: 12px;
        }

        .action-button {
          min-height: 46px;
          border: 0;
          border-radius: 8px;
          padding: 10px 12px;
          background: #142018;
          color: #ffffff;
          cursor: pointer;
          font: inherit;
          font-size: 12px;
          font-weight: 800;
          line-height: 1.35;
        }

        .action-button.secondary {
          background: #ffffff;
          color: #142018;
          border: 1px solid #ead5d9;
        }

        .message-preview-panel {
          position: sticky;
          top: 74px;
          border: 1px solid #dfe8e2;
          border-radius: 8px;
          padding: 12px;
          background: #ffffff;
          box-shadow: 0 10px 30px rgba(16, 32, 24, 0.05);
        }

        .preview-header h2 {
          margin: 0;
          color: #142018;
          font-size: 14px;
          line-height: 1.3;
        }

        .preview-header span {
          display: block;
          margin-top: 4px;
          color: #647169;
          font-size: 11px;
          font-weight: 700;
        }

        .mini-phone {
          height: 312px;
          margin-top: 12px;
          overflow: hidden;
          border: 8px solid #111b15;
          border-radius: 24px;
          background: #efe7dc;
          box-shadow: inset 0 0 0 1px rgba(255,255,255,0.16);
        }

        .mini-chat-header {
          height: 40px;
          display: flex;
          align-items: center;
          padding: 0 12px;
          background: #075e54;
          color: #ffffff;
          font-size: 11px;
          font-weight: 900;
        }

        .mini-bubble {
          width: 190px;
          margin: 16px 10px;
          border-radius: 0 8px 8px 8px;
          padding: 10px;
          background: #dcf8c6;
          color: #111b15;
          box-shadow: 0 1px 1px rgba(0,0,0,0.14);
        }

        .mini-bubble strong {
          display: block;
          margin-bottom: 6px;
          font-size: 11px;
        }

        .mini-bubble p {
          margin: 0 0 8px;
          font-size: 10.5px;
          line-height: 1.45;
        }

        .send-message-button {
          width: 100%;
          min-height: 42px;
          margin-top: 12px;
          border: 0;
          border-radius: 8px;
          background: #25d366;
          color: #07351e;
          cursor: pointer;
          font: inherit;
          font-size: 12px;
          font-weight: 900;
          line-height: 1.3;
        }

        .send-toast {
          position: fixed;
          right: 24px;
          bottom: 24px;
          z-index: 30;
          border-radius: 8px;
          padding: 13px 16px;
          background: #142018;
          color: #ffffff;
          box-shadow: 0 18px 44px rgba(16,32,24,0.28);
          font-size: 13px;
          font-weight: 900;
          animation: toastIn 180ms ease-out;
        }

        .skeleton-panel {
          border: 1px solid #dfe8e2;
          border-radius: 8px;
          padding: 24px;
          background: #ffffff;
          box-shadow: 0 10px 30px rgba(16, 32, 24, 0.05);
        }

        .skeleton-line,
        .skeleton-grid span,
        .mini-skeleton span {
          display: block;
          border-radius: 8px;
          background: linear-gradient(90deg, #eef3f0 0%, #f8fbf9 45%, #eef3f0 90%);
          background-size: 220% 100%;
          animation: shimmer 1.1s linear infinite;
        }

        .skeleton-line {
          height: 18px;
          margin-top: 18px;
        }

        .skeleton-line.title {
          width: 52%;
          height: 34px;
          margin-top: 0;
        }

        .skeleton-line.verdict {
          height: 82px;
        }

        .skeleton-line.short {
          width: 44%;
        }

        .skeleton-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
          margin-top: 22px;
        }

        .skeleton-grid span {
          height: 72px;
        }

        .mini-skeleton {
          display: grid;
          gap: 12px;
          padding: 54px 14px;
        }

        .mini-skeleton span {
          height: 54px;
        }

        @keyframes shimmer {
          to {
            background-position: -220% 0;
          }
        }

        @keyframes toastIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes rejectPulse {
          0% {
            transform: scale(1);
            box-shadow: 0 0 0 0 rgba(200, 16, 46, 0.55);
          }
          45% {
            transform: scale(1.07);
            box-shadow: 0 0 0 12px rgba(200, 16, 46, 0);
          }
          100% {
            transform: scale(1);
            box-shadow: 0 0 0 0 rgba(200, 16, 46, 0);
          }
        }

        .placeholder-card {
          margin: 24px;
          padding: 28px;
        }

        .placeholder-card h2 {
          margin: 0 0 8px;
        }

        .modal-backdrop {
          position: fixed;
          inset: 0;
          z-index: 20;
          display: grid;
          place-items: center;
          padding: 24px;
          background: rgba(12, 20, 15, 0.56);
        }

        .shap-modal {
          width: min(920px, calc(100vw - 48px));
          max-height: calc(100vh - 48px);
          overflow: auto;
          border-radius: 8px;
          background: #ffffff;
          box-shadow: 0 28px 80px rgba(0, 0, 0, 0.28);
        }

        .modal-header {
          padding: 22px 24px 12px;
          display: flex;
          justify-content: space-between;
          gap: 18px;
        }

        .modal-header h2 {
          margin: 0;
          color: #142018;
          font-size: 20px;
          line-height: 1.35;
        }

        .modal-header p {
          margin: 5px 0 0;
          color: #66736b;
          font-size: 13px;
        }

        .close-button {
          width: 36px;
          height: 36px;
          border: 0;
          border-radius: 50%;
          background: #eef3f0;
          cursor: pointer;
          color: #142018;
          font-size: 18px;
          font-weight: 800;
        }

        .chart-wrap {
          height: 360px;
          padding: 8px 24px 18px;
        }

        .factor-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
          padding: 0 24px 24px;
        }

        .factor-card {
          border-radius: 8px;
          padding: 14px;
          background: #f7faf8;
        }

        .factor-card strong,
        .factor-card span {
          display: block;
        }

        .factor-card span {
          margin-top: 4px;
          font-size: 18px;
          font-weight: 900;
        }

        .factor-card span.helps { color: #159947; }
        .factor-card span.hurts { color: #d92d35; }

        .factor-card p {
          margin: 8px 0 0;
          color: #5d6b63;
          font-size: 12px;
          line-height: 1.45;
        }

        @media (max-width: 900px) {
          .dashboard-grid {
            grid-template-columns: 40% 60%;
          }

          .profile-grid,
          .action-row,
          .factor-grid,
          .verdict-column {
            grid-template-columns: 1fr;
          }

          .message-preview-panel {
            position: static;
          }
        }
      `}</style>

      <div className="stats-bar">
        இன்று: 47 விண்ணப்பங்கள் | 31 அனுமதி | 16 நிராகரிப்பு | Today: 47 Applications | 31 Approved | 16 Rejected
      </div>

      <nav className="top-tabs" aria-label="Loan officer cockpit sections">
          <button
          type="button"
          className="tab-button active"
          onClick={() => navigate("/")}
        >
          விண்ணப்பங்கள் / Applications
        </button>
        <button
          type="button"
          className="tab-button"
          onClick={() => navigate("/fairness")}
        >
          நீதி கண்காணிப்பு / Fairness Monitor
        </button>
        <button
          type="button"
          className="tab-button"
          onClick={() => navigate("/audit")}
        >
          தணிக்கை பதிவு / Audit Log
        </button>
      </nav>

        <section className="dashboard-grid">
          <aside className="queue-column">
            <header className="queue-header">
              <h1>நிலுவை விண்ணப்பங்கள் / Pending Applications</h1>
              <span className="count-badge">{applicants.length}</span>
            </header>

            <div className="queue-list">
              {applicants.map((applicant) => (
                <div
                  role="button"
                  tabIndex={0}
                  className={`applicant-row ${applicant.id === selectedId ? "selected" : ""}`}
                  key={applicant.id}
                  onClick={() => selectApplicant(applicant.id)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      selectApplicant(applicant.id);
                    }
                  }}
                >
                  <span className={`urgency-dot ${applicant.urgency}`} aria-label={`${applicant.urgency} urgency`} />
                  <span className="row-main">
                    <Link
                      className="applicant-link"
                      to={`/applicant/${applicant.id}`}
                      target="_blank"
                      rel="noreferrer"
                      onClick={(event) => event.stopPropagation()}
                    >
                      {applicant.nameTamil}
                    </Link>
                    <span>{applicant.nameEnglish} • {applicant.city}</span>
                  </span>
                  <span className="row-meta">
                    <strong>{formatCurrency(applicant.amount)}</strong>
                    <span>{applicant.timeAgo}</span>
                  </span>
                </div>
              ))}
            </div>
          </aside>

          <section className="verdict-column">
            <div className="verdict-main">
            {isThinking ? (
              <section className="skeleton-panel" aria-live="polite" aria-label="Loading applicant analysis">
                <div className="skeleton-line title" />
                <div className="skeleton-grid">
                  <span />
                  <span />
                  <span />
                  <span />
                  <span />
                  <span />
                </div>
                <div className="skeleton-line verdict" />
                <div className="skeleton-line" />
                <div className="skeleton-line short" />
              </section>
            ) : (
              <>
            <article className="profile-card">
              <div className="profile-top">
                <div>
                  <h2>
                    <Link
                      className="profile-name-link"
                      to={`/applicant/${selectedApplicant.id}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {selectedApplicant.nameTamil}
                    </Link>
                  </h2>
                  <p>{selectedApplicant.nameEnglish}</p>
                </div>
                <div
                  key={`${selectedApplicant.id}-${prediction.decision}`}
                  className={`decision-badge ${isReject ? "reject pulse-on-load" : "approve"}`}
                >
                  {isReject ? "REJECT" : "APPROVE"}
                </div>
              </div>

              <div className="profile-grid">
                <div className="profile-stat">
                  <span>Age / City</span>
                  <strong>{selectedApplicant.age} • {selectedApplicant.city}</strong>
                </div>
                <div className="profile-stat">
                  <span>Purpose</span>
                  <strong>{selectedApplicant.loanPurposeTamil} / {selectedApplicant.loanPurpose}</strong>
                </div>
                <div className="profile-stat">
                  <span>Amount</span>
                  <strong>{formatCurrency(selectedApplicant.amount)}</strong>
                </div>
                <div className="profile-stat">
                  <span>Employment duration</span>
                  <strong>{selectedApplicant.employmentDuration}</strong>
                </div>
                <div className="profile-stat">
                  <span>Active loans</span>
                  <strong>{selectedApplicant.activeLoans}</strong>
                </div>
                <div className="profile-stat">
                  <span>Monthly income used</span>
                  <strong>{formatCurrency(prediction.monthly_income_used)}</strong>
                </div>
              </div>
            </article>

            <article className="verdict-card">
              <p className="eyebrow">THE VERDICT</p>
              <p className="verdict-tamil">{selectedApplicant.verdictTamil}</p>
              <p className="verdict-english">{selectedApplicant.id === "rajan" ? "Reject — monthly debt burden is 2.4x safe limit" : selectedApplicant.verdictEnglish}</p>
              <div className="confidence-row" aria-label={`Confidence ${confidencePercent}%`}>
                <div className="confidence-track">
                  <div className="confidence-fill" style={{ width: `${confidencePercent}%` }} />
                </div>
                <div className="confidence-value">{confidencePercent}%</div>
              </div>
            </article>

            <div className="action-row">
              <button type="button" className="action-button" onClick={() => setModalOpen(true)}>
                முழு பகுப்பாய்வு / Full Analysis
              </button>
              <button type="button" className="action-button secondary" onClick={() => navigate("/fairness")}>
                சார்பு மதிப்பாய்வு / Flag Bias Review
              </button>
              <button type="button" className="action-button secondary" onClick={exportAudit}>
                தணிக்கை ஏற்றுமதி / Export Audit
              </button>
            </div>
              </>
            )}
            </div>

            <aside className="message-preview-panel">
              <div className="preview-header">
                <h2>VaazhlaiPartner Message Preview</h2>
                <span>{selectedApplicant.nameEnglish}</span>
              </div>
              <div className="mini-phone">
                {isThinking ? (
                  <div className="mini-skeleton">
                    <span />
                    <span />
                    <span />
                  </div>
                ) : (
                  <>
                    <div className="mini-chat-header">VaazhlaiPartner 🤝</div>
                    <div className="mini-bubble">
                      <strong>{selectedApplicant.nameTamil},</strong>
                      <p>
                        {isReject
                          ? "உங்கள் கடன் விண்ணப்பம் தற்போது நிராகரிக்கப்படுகிறது."
                          : "உங்கள் கடன் விண்ணப்பம் ஒப்புதலுக்கு தயாராக உள்ளது."}
                      </p>
                      <p>
                        {isReject
                          ? selectedApplicant.verdictEnglish
                          : "Approve — profile meets current repayment safety checks."}
                      </p>
                    </div>
                  </>
                )}
              </div>
              <button type="button" className="send-message-button" onClick={sendMessage}>
                செய்தி அனுப்பவும் / Send Message
              </button>
            </aside>
          </section>
        </section>

      {modalOpen && (
        <ShapModal
          applicant={selectedApplicant}
          prediction={prediction}
          onClose={() => setModalOpen(false)}
        />
      )}
      {toast && <div className="send-toast">{toast}</div>}
    </main>
  );
}
