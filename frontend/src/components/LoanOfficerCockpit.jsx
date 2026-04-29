import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import SHAPModal from "./SHAPModal.jsx";

const API = "http://localhost:8000/api";
const timeAgo = { 1: "2 mins ago", 2: "8 mins ago", 3: "15 mins ago", 4: "34 mins ago", 5: "1 hr ago" };
const urgency = { 1: "bg-red-500", 2: "bg-green-500", 3: "bg-red-500", 4: "bg-amber-500", 5: "bg-green-500" };
const messagePreview = {
  1: {
    tamil: "வணக்கம் ரஜன் அவர்களே, உங்கள் கடன் விண்ணப்பம் இப்போது அனுமதிக்க இயலவில்லை. முக்கிய காரணம்: கடந்த கட்டண பழக்கம் மற்றும் EMI சுமை அதிகமாக உள்ளது.",
    steps: [
      "HDFC personal loan-ஐ முதலில் மூடுங்கள். இது மாத EMI சுமையை சுமார் ₹4,200 குறைக்கும்.",
      "அடுத்த 3 மாதங்களுக்கு எந்த EMI-யும் தாமதிக்காமல் செலுத்துங்கள்.",
      "EMI/வருமான விகிதத்தை 40% க்குக் கீழே கொண்டு வந்து 6 மாதங்களுக்கு பிறகு மீண்டும் விண்ணப்பிக்கவும்.",
    ],
  },
  2: {
    tamil: "வணக்கம் பிரியா அவர்களே, உங்கள் கடன் விண்ணப்பம் அனுமதிக்க ஏற்ற நிலையில் உள்ளது. உங்கள் கட்டண பழக்கம் வலுவாக உள்ளது.",
    steps: [
      "வருமான ஆவணம், வங்கி அறிக்கை, அடையாள ஆவணங்களை தயார் வைத்திருக்கவும்.",
      "தற்போதைய EMI கட்டணங்களை நேரத்தில் தொடருங்கள்.",
      "ஆவண சரிபார்ப்பு முடிந்ததும் கடன் செயல்முறை அடுத்த கட்டத்திற்கு செல்லும்.",
    ],
  },
  3: {
    tamil: "வணக்கம் முருகேசன் அவர்களே, உங்கள் விண்ணப்பம் இப்போது அனுமதிக்க இயலவில்லை. குறுகிய கடன் வரலாறு மற்றும் வேலை நிலைத்தன்மை காரணமாக அபாயம் அதிகமாக உள்ளது.",
    steps: [
      "குறைந்தபட்சம் 6 மாதங்கள் தற்போதைய வேலைவாய்ப்பை தொடருங்கள்.",
      "சிறிய அளவு கடன் அல்லது கிரெடிட் வசதியில் நேர்மையான கட்டண வரலாறு உருவாக்குங்கள்.",
      "தாமதமின்றி 6 மாதங்கள் கட்டணம் செலுத்திய பிறகு குறைந்த கடன் தொகையுடன் மீண்டும் விண்ணப்பிக்கவும்.",
    ],
  },
  4: {
    tamil: "வணக்கம் செல்வி அவர்களே, உங்கள் விண்ணப்பம் இப்போது அனுமதிக்க இயலவில்லை. தாமத கட்டணங்கள் மற்றும் வருமான மாறுபாடு முடிவை பாதித்துள்ளன.",
    steps: [
      "நிலுவையில் உள்ள கட்டணங்களை முதலில் சரிசெய்யுங்கள்.",
      "பருவகால வருமானத்திற்கு மாத சேமிப்பு கணக்கை தனியாக வைத்துக் கொள்ளுங்கள்.",
      "₹50,000 க்கு பதிலாக குறைந்த தொகை அல்லது கூட்டுறவு/உத்தரவாத ஆதரவு உடன் 3-6 மாதங்களில் மீண்டும் விண்ணப்பிக்கவும்.",
    ],
  },
  5: {
    tamil: "வணக்கம் அருண் அவர்களே, உங்கள் கடன் விண்ணப்பம் அனுமதிக்க ஏற்ற நிலையில் உள்ளது. வருமானம் மற்றும் கட்டண வரலாறு வலுவாக உள்ளன.",
    steps: [
      "கடந்த 6 மாத வங்கி அறிக்கைகள் மற்றும் GST/வணிக ஆவணங்களை தயார் வைத்திருக்கவும்.",
      "தற்போதைய EMI கட்டணங்களை நேரத்தில் தொடருங்கள்.",
      "இறுதி ஆவண சரிபார்ப்புக்குப் பிறகு கடன் வழங்கல் செயல்முறை தொடரும்.",
    ],
  },
};

function money(value) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(value);
}

function percent(value) {
  return `${(value * 100).toFixed(1)}%`;
}

function ConfidenceGauge({ value }) {
  const [animatedValue, setAnimatedValue] = useState(0);
  const pct = Math.max(0, Math.min(100, (animatedValue || 0) * 100));
  const targetPct = Math.max(0, Math.min(100, (value || 0) * 100));
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const color = targetPct < 60 ? "#dc2626" : targetPct < 80 ? "#d97706" : "#16a34a";

  useEffect(() => {
    setAnimatedValue(0);
    const frame = window.requestAnimationFrame(() => setAnimatedValue(value || 0));
    return () => window.cancelAnimationFrame(frame);
  }, [value]);

  return (
    <div className="relative h-28 w-28 shrink-0">
      <svg viewBox="0 0 108 108" className="h-full w-full -rotate-90">
        <circle cx="54" cy="54" r={radius} fill="none" stroke="#e5e7eb" strokeWidth="10" />
        <circle
          className="confidence-ring"
          cx="54"
          cy="54"
          r={radius}
          fill="none"
          stroke={color}
          strokeLinecap="round"
          strokeWidth="10"
          strokeDasharray={circumference}
          strokeDashoffset={circumference - (pct / 100) * circumference}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">
        <div>
          <div className="text-2xl font-black text-slate-950">{targetPct.toFixed(0)}%</div>
          <div className="text-[10px] font-black uppercase tracking-wide text-slate-500">Confidence</div>
        </div>
      </div>
    </div>
  );
}

function verdictSentence(applicant) {
  const prediction = applicant.prediction;
  if (prediction.decision === "APPROVE") return "Approve - strong repayment capacity with clean history";
  return `Reject - ${prediction.shap_factors[0].plain_english}`;
}

export default function LoanOfficerCockpit() {
  const [applicants, setApplicants] = useState([]);
  const [modelInfo, setModelInfo] = useState(null);
  const [selectedId, setSelectedId] = useState(1);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [toast, setToast] = useState("");
  const timer = useRef(null);
  const toastTimer = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetch(`${API}/applicants`).then((response) => response.json()).then(setApplicants);
    fetch(`${API}/model/info`).then((response) => response.json()).then(setModelInfo);
  }, []);

  const selected = useMemo(() => applicants.find((item) => item.id === selectedId) || applicants[0], [applicants, selectedId]);

  const selectApplicant = (id) => {
    setSelectedId(id);
    setLoading(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setLoading(false), 1500);
  };

  const exportAudit = () => {
    window.open(`${API}/audit/report`, "_blank");
  };

  const sendMessage = () => {
    setToast(`Message sent to ${selected.name} via WhatsApp`);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(""), 3000);
  };

  if (!selected) {
    return (
      <main className="grid gap-4 p-4 sm:p-6">
        <div className="h-20 rounded-xl skeleton" />
        <div className="grid gap-4 sm:grid-cols-[38%_62%]">
          <div className="h-96 rounded-xl skeleton" />
          <div className="h-96 rounded-xl skeleton" />
        </div>
      </main>
    );
  }

  const prediction = selected.prediction;
  const rejected = prediction.decision === "REJECT";

  return (
    <main className="grid min-h-[calc(100vh-173px)] grid-cols-1 overflow-hidden lg:h-[calc(100vh-173px)] lg:grid-cols-[38%_62%]">
      <aside className="border-b border-slate-200 bg-white lg:border-b-0 lg:border-r">
        <div className="flex h-16 items-center justify-between border-b border-slate-200 px-5">
          <h1 className="text-lg font-black text-slate-950">Pending Applications</h1>
          <span className="rounded-full bg-blue-600 px-3 py-1 text-sm font-black text-white">{applicants.length}</span>
        </div>
        <div className="flex gap-3 overflow-x-auto p-3 lg:block lg:p-0">
          {applicants.map((applicant) => (
            <div
              role="button"
              tabIndex={0}
              key={applicant.id}
              onClick={() => selectApplicant(applicant.id)}
              className={`grid min-w-[285px] cursor-pointer grid-cols-[10px_1fr_auto] items-center gap-3 rounded-xl border border-slate-100 px-4 py-4 outline-none transition hover:bg-slate-50 lg:min-w-0 lg:rounded-none lg:border-x-0 lg:border-t-0 lg:px-5 ${
                selectedId === applicant.id ? "border-l-4 border-l-blue-600 bg-blue-50" : "border-l-4 border-l-transparent"
              }`}
            >
              <span className={`h-2.5 w-2.5 rounded-full ${urgency[applicant.id]}`} />
              <div className="min-w-0">
                <Link to={`/applicant/${applicant.id}`} target="_blank" onClick={(event) => event.stopPropagation()} className="font-black text-slate-950 hover:text-blue-700 hover:underline">
                  {applicant.name}
                </Link>
                <div className="truncate text-xs font-semibold text-slate-500">{applicant.city} | {applicant.loan_purpose}</div>
              </div>
              <div className="text-right">
                <div className="text-sm font-black text-slate-900">{money(applicant.loan_amount)}</div>
                <div className="text-xs font-semibold text-slate-500">{timeAgo[applicant.id]}</div>
              </div>
            </div>
          ))}
        </div>
      </aside>

      <section className="overflow-auto bg-slate-50 p-4 sm:p-5">
        {loading ? (
          <div className="grid gap-4">
            <div className="h-36 rounded-xl skeleton" />
            <div className="h-52 rounded-xl skeleton" />
            <div className="h-20 rounded-xl skeleton" />
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_220px]">
            <div className="grid gap-4">
              <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <h2 className="text-2xl font-black text-slate-950">{selected.name}</h2>
                <div className="mt-4 grid gap-3 text-sm font-semibold text-slate-600">
                  <div>Age {selected.age} | {selected.city} | Employment {selected.employment_months} months</div>
                  <div>{selected.loan_purpose} | {money(selected.loan_amount)}</div>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <span>Monthly Income: <b className="text-slate-950">{money(selected.monthly_income)}</b></span>
                    <span>Active Loans: <b className="text-slate-950">{selected.num_active_loans}</b></span>
                    <span>EMI/Income: <b className={selected.emi_to_income_ratio > 0.4 ? "text-red-600" : "text-green-600"}>{percent(selected.emi_to_income_ratio)}</b></span>
                  </div>
                </div>
              </article>

              <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className={`inline-flex rounded-xl px-5 py-3 text-2xl font-black text-white pulse-once ${rejected ? "bg-red-600" : "bg-green-600"}`}>{prediction.decision}</div>
                    <div className="mt-3 text-lg font-black text-slate-900">{percent(prediction.confidence)} confidence</div>
                  </div>
                  <ConfidenceGauge key={selected.id} value={prediction.confidence} />
                </div>
                <p className={`mt-3 text-xl font-black ${rejected ? "text-red-700" : "text-green-700"}`}>{verdictSentence(selected)}</p>
                <p className="mt-2 text-sm font-semibold text-slate-600">
                  Primary factor: {prediction.shap_factors[0].feature} ({prediction.shap_factors[0].plain_english})
                </p>
              </article>

              <article className="grid grid-cols-1 gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:grid-cols-3">
                <button onClick={() => setModalOpen(true)} className="rounded-lg bg-blue-600 px-4 py-3 text-sm font-black text-white">Full Analysis</button>
                <button onClick={() => navigate("/fairness", { state: { highlight: selected.gender || selected.geography } })} className="rounded-lg border border-amber-400 bg-white px-4 py-3 text-sm font-black text-amber-700">Flag for Bias Review</button>
                <button onClick={exportAudit} className="rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm font-black text-slate-700">Export Audit PDF</button>
              </article>

              {modelInfo && (
                <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-black uppercase tracking-wide text-slate-500">Model Card</h3>
                      <p className="mt-1 text-lg font-black text-slate-950">{modelInfo.dataset_name}</p>
                    </div>
                    <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-black text-blue-700">{modelInfo.model_type}</span>
                  </div>
                  <div className="mt-4 grid grid-cols-1 gap-3 text-sm sm:grid-cols-3">
                    <div className="rounded-lg bg-slate-50 p-3">
                      <div className="font-bold text-slate-500">Features</div>
                      <div className="mt-1 text-xl font-black text-slate-950">{modelInfo.n_features}</div>
                    </div>
                    <div className="rounded-lg bg-slate-50 p-3">
                      <div className="font-bold text-slate-500">Train Accuracy</div>
                      <div className="mt-1 text-xl font-black text-slate-950">{percent(modelInfo.train_accuracy)}</div>
                    </div>
                    <div className="rounded-lg bg-slate-50 p-3">
                      <div className="font-bold text-slate-500">AUC</div>
                      <div className="mt-1 text-xl font-black text-slate-950">{modelInfo.auc_score.toFixed(3)}</div>
                    </div>
                  </div>
                  <div className="mt-3 rounded-lg border border-blue-100 bg-blue-50 p-3 text-xs font-bold text-blue-800">
                    Policy threshold: reject only when predicted default risk is at least {percent(modelInfo.rejection_threshold)}.
                  </div>
                  <p className="mt-3 text-xs font-semibold text-slate-500">Features: {modelInfo.feature_names.join(", ")}</p>
                </article>
              )}
            </div>

            <aside className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
              <h3 className="text-sm font-black text-slate-950">Message Preview</h3>
              <div className="mt-3 h-[390px] overflow-hidden rounded-[24px] border-[8px] border-slate-950 bg-[#efe7dc]">
                <div className="bg-[#075e54] px-3 py-3 text-xs font-black text-white">VaazhlaiPartner</div>
                <div className="h-[334px] overflow-y-auto px-3 pb-4">
                  <div className="mt-3 rounded-lg bg-white p-3 text-[10.5px] leading-5 shadow">
                    <b>{selected.name}</b>
                    <p className="mt-2 font-semibold text-slate-900">{messagePreview[selected.id]?.tamil}</p>
                    <div className="mt-3 rounded-md bg-green-50 p-2 text-[10px] font-bold leading-4 text-green-800">
                      <div className="mb-1 text-[10.5px] font-black">தகுதி பெற செய்ய வேண்டியது:</div>
                      <ol className="list-decimal space-y-1 pl-4">
                        {messagePreview[selected.id]?.steps.map((step) => (
                          <li key={step}>{step}</li>
                        ))}
                      </ol>
                    </div>
                  </div>
                </div>
              </div>
              <button onClick={sendMessage} className="mt-3 w-full rounded-lg bg-green-600 px-3 py-3 text-sm font-black text-white">Send Message</button>
            </aside>
          </div>
        )}
      </section>

      {modalOpen && <SHAPModal applicant={selected} prediction={prediction} onClose={() => setModalOpen(false)} />}
      {toast && <div className="fixed bottom-5 right-5 rounded-lg bg-slate-950 px-5 py-3 text-sm font-black text-white shadow-xl">{toast}</div>}
    </main>
  );
}
