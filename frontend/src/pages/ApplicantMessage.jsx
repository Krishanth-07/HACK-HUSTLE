import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";

const API = "http://localhost:8000/api";

const tamilNames = {
  1: "ரஜன் முருகன்",
  2: "பிரியா சுந்தரம்",
  3: "முருகேசன் பிள்ளை",
  4: "செல்வி அருமுகம்",
  5: "அருண் கிருஷ்ணமூர்த்தி",
};

const fallbackSteps = {
  1: [
    ["HDFC personal loan-ஐ மூடுங்கள்", "Close your HDFC personal loan", "EMI சுமை சுமார் ₹4,200 குறையும்.", "Reduces EMI burden by about ₹4,200."],
    ["3 மாதங்கள் நேரத்தில் EMI செலுத்துங்கள்", "Pay every EMI on time for 3 months", "கட்டண நம்பகத்தன்மை மேம்படும்.", "Improves repayment reliability."],
    ["6 மாதங்களுக்கு பிறகு மீண்டும் விண்ணப்பிக்கவும்", "Reapply after 6 months", "அனுமதி வாய்ப்பு அதிகரிக்கும்.", "Approval chances improve."],
  ],
  3: [
    ["வேலை தொடர்ச்சியை 6 மாதங்கள் நிலைப்படுத்துங்கள்", "Maintain employment continuity for 6 months", "வருமான நிலைத்தன்மை வலுப்படும்.", "Strengthens income stability."],
    ["சிறிய கிரெடிட் வசதியில் நேரத்தில் செலுத்துங்கள்", "Build on-time history with a small credit line", "கடன் வரலாறு மேம்படும்.", "Improves credit history."],
    ["குறைந்த தொகையுடன் மீண்டும் விண்ணப்பிக்கவும்", "Reapply with a lower amount", "மாத சுமை குறையும்.", "Reduces monthly burden."],
  ],
  4: [
    ["நிலுவை தொகைகளை முதலில் சரிசெய்யுங்கள்", "Clear pending dues first", "தாமத கட்டண பாதிப்பு குறையும்.", "Reduces late-payment impact."],
    ["சேமிப்பு கணக்கில் மாத buffer வைத்திருங்கள்", "Keep a monthly repayment buffer", "பருவகால வருமான இடைவெளி சமநிலைப்படும்.", "Smooths seasonal income gaps."],
    ["குறைந்த தொகைக்கு மீண்டும் விண்ணப்பிக்கவும்", "Reapply for a lower amount", "அனுமதி வாய்ப்பு உயரலாம்.", "Approval chance may improve."],
  ],
};

function money(value) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(value);
}

function tamilFactorName(feature) {
  const names = {
    "Repayment Status": "கட்டண பழக்கம்",
    "Utilization Rate": "கடன் பயன்பாட்டு விகிதம்",
    "Latest Bill Amount": "தற்போதைய நிலுவைத் தொகை",
    "Credit Limit": "கடன் வரம்பு",
    "Payment Ratio": "கட்டண விகிதம்",
    "Latest Payment Amount": "சமீபத்திய கட்டணம்",
    Age: "வயது",
  };
  return names[feature] || feature;
}

function tamilReason(factor) {
  const hurts = factor.contribution < 0;
  const name = tamilFactorName(factor.feature);
  if (hurts) return `${name} இந்த முடிவில் அபாயத்தை அதிகப்படுத்துகிறது.`;
  return `${name} இந்த முடிவில் உங்களுக்கு சாதகமாக உள்ளது.`;
}

function readinessScore(factors) {
  const actionableRoom = factors
    .filter((factor) => factor.actionable && factor.contribution < 0)
    .reduce((sum, factor) => sum + Math.abs(factor.contribution), 0);
  return Math.max(35, Math.min(92, Math.round(48 + actionableRoom * 16)));
}

function loanTerms(applicant) {
  const tenure = applicant.loan_amount >= 500000 ? 36 : 24;
  const rate = applicant.loan_amount >= 700000 ? 13.4 : 12.8;
  const emi = Math.round((applicant.loan_amount * (1 + rate / 100)) / tenure);
  return { tenure, rate, emi };
}

function stepsFor(applicant) {
  if (fallbackSteps[applicant.id]) return fallbackSteps[applicant.id];
  if (applicant.action_steps?.length) {
    return applicant.action_steps.map((item) => [item.step, item.step, `${item.impact} (${item.timeline})`, `${item.impact} (${item.timeline})`]);
  }
  return [
    ["அனைத்து EMI-களையும் நேரத்தில் செலுத்துங்கள்", "Pay all EMIs on time", "நம்பகத்தன்மை மேம்படும்.", "Improves reliability."],
    ["புதிய கடன்களை தவிர்க்கவும்", "Avoid new debt", "திருப்பிச் செலுத்தும் திறன் நிலையாகும்.", "Keeps repayment capacity stable."],
    ["3-6 மாதங்களில் மீண்டும் விண்ணப்பிக்கவும்", "Reapply in 3-6 months", "முடிவு மேம்படலாம்.", "Decision may improve."],
  ];
}

function Bubble({ side = "left", children, tone = "bank" }) {
  const right = side === "right";
  return (
    <div className={`flex ${right ? "justify-end" : "justify-start"}`}>
      <div
        className={`chat-bubble relative max-w-[82%] px-3 py-2 text-sm leading-6 shadow-sm ${
          right ? "bubble-right rounded-l-2xl rounded-br-2xl bg-white text-slate-900" : tone === "success" ? "bubble-left rounded-r-2xl rounded-bl-2xl bg-green-50 text-green-900" : "bubble-left rounded-r-2xl rounded-bl-2xl bg-slate-100 text-slate-900"
        }`}
      >
        {children}
      </div>
    </div>
  );
}

export default function ApplicantMessage() {
  const { id = "1" } = useParams();
  const [applicant, setApplicant] = useState(null);
  const [language, setLanguage] = useState("ta");
  const [shared, setShared] = useState(false);

  useEffect(() => {
    fetch(`${API}/applicant/${id}`).then((response) => response.json()).then(setApplicant);
  }, [id]);

  const text = language === "ta";
  const approved = applicant?.prediction?.decision === "APPROVE";
  const topFactors = applicant?.prediction?.shap_factors || [];
  const readiness = useMemo(() => readinessScore(topFactors), [topFactors]);

  if (!applicant) {
    return (
      <main className="grid min-h-[calc(100vh-64px)] place-items-start bg-slate-200 py-5">
        <section className="mx-auto h-[calc(100vh-104px)] min-h-[650px] w-[min(375px,calc(100vw-24px))] overflow-hidden rounded-[28px] border-[10px] border-slate-950 bg-[#e5ddd5] shadow-2xl">
          <div className="h-14 bg-[#075e54]" />
          <div className="grid gap-4 p-4">
            <div className="h-28 rounded-2xl skeleton" />
            <div className="h-24 rounded-2xl skeleton" />
            <div className="ml-auto h-12 w-52 rounded-2xl skeleton" />
            <div className="h-40 rounded-2xl skeleton" />
          </div>
        </section>
      </main>
    );
  }

  const displayName = text ? tamilNames[applicant.id] || applicant.name : applicant.name;
  const terms = loanTerms(applicant);
  const steps = stepsFor(applicant);
  const summary = approved
    ? `VaazhlaiPartner: ${applicant.name} is approved for ${money(applicant.loan_amount)}. Confidence ${(applicant.prediction.confidence * 100).toFixed(1)}%.`
    : `VaazhlaiPartner: ${applicant.name} was not approved right now. Top reason: ${applicant.prediction.shap_factors[0].plain_english}. Suggested next step: ${steps[0][1]}.`;

  const share = async () => {
    await navigator.clipboard?.writeText(summary);
    setShared(true);
    setTimeout(() => setShared(false), 1800);
  };

  return (
    <main className="grid min-h-[calc(100vh-64px)] place-items-start bg-slate-200 py-5">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Tamil:wght@400;600;700;900&display=swap');
        .tamil-screen{font-family:"Noto Sans Tamil", system-ui, sans-serif}
        .bubble-left:before{content:"";position:absolute;left:-7px;top:0;border-top:10px solid rgb(241 245 249);border-left:10px solid transparent}
        .bubble-right:after{content:"";position:absolute;right:-7px;top:0;border-top:10px solid white;border-right:10px solid transparent}
      `}</style>
      <section className="tamil-screen mx-auto h-[calc(100vh-104px)] min-h-[650px] w-[min(375px,calc(100vw-24px))] overflow-hidden rounded-[28px] border-[10px] border-slate-950 bg-[#e5ddd5] shadow-2xl">
        <header className="bg-[#075e54] text-white">
          <div className="flex items-center justify-between px-4 py-3">
            <div>
              <div className="text-base font-black">VaazhlaiPartner 🤝</div>
              <div className="text-xs font-semibold opacity-90">{text ? "ஆன்லைன்" : "online"}</div>
            </div>
            <button onClick={() => setLanguage(text ? "en" : "ta")} className="rounded-full bg-white/15 px-3 py-1 text-xs font-black">
              {text ? "English" : "தமிழ்"}
            </button>
          </div>
        </header>

        <div className="flex h-[calc(100%-58px)] flex-col overflow-y-auto p-4">
          <div className="mb-3 flex justify-end">
            <button onClick={share} className="rounded-full bg-white px-3 py-1.5 text-xs font-black text-[#075e54] shadow-sm">
              {shared ? (text ? "நகலெடுக்கப்பட்டது" : "Copied") : text ? "விளக்கத்தை பகிரவும்" : "Share this explanation"}
            </button>
          </div>

          {approved ? (
            <>
              <Bubble tone="success">
                <p className="font-black">{text ? `வாழ்த்துக்கள் ${displayName}!` : `Congratulations ${displayName}!`}</p>
                <p className="mt-1">
                  {text
                    ? `உங்கள் ${money(applicant.loan_amount)} கடன் விண்ணப்பம் அனுமதிக்கத் தயாராக உள்ளது.`
                    : `Your ${money(applicant.loan_amount)} loan is ready for approval.`}
                </p>
              </Bubble>
              <div className="mt-3" />
              <Bubble tone="success">
                <p className="font-black">{text ? "கடன் நிபந்தனைகள்" : "Loan terms summary"}</p>
                <ul className="mt-2 list-disc space-y-1 pl-5">
                  <li>{text ? `தொகை: ${money(applicant.loan_amount)}` : `Amount: ${money(applicant.loan_amount)}`}</li>
                  <li>{text ? `காலம்: ${terms.tenure} மாதங்கள்` : `Tenure: ${terms.tenure} months`}</li>
                  <li>{text ? `மதிப்பிடப்பட்ட EMI: ${money(terms.emi)}` : `Estimated EMI: ${money(terms.emi)}`}</li>
                  <li>{text ? `வட்டி: ${terms.rate}%` : `Rate: ${terms.rate}%`}</li>
                </ul>
              </Bubble>
            </>
          ) : (
            <>
              <Bubble>
                <p className="font-black">{text ? `வணக்கம் ${displayName},` : `Hi ${displayName},`}</p>
                <p className="mt-1">
                  {text
                    ? "உங்கள் கடன் விண்ணப்பம் இப்போது அனுமதிக்க இயலவில்லை. இது நிரந்தர மறுப்பு அல்ல; சில விஷயங்களை சரிசெய்தால் மீண்டும் தகுதி பெறலாம்."
                    : "Your loan could not be approved right now. This is not permanent; you can improve eligibility by fixing a few factors."}
                </p>
              </Bubble>

              <div className="mt-3" />
              <Bubble>
                <p className="font-black">{text ? "முக்கிய 3 காரணங்கள்" : "Top 3 reasons"}</p>
                <ul className="mt-2 space-y-2">
                  {topFactors.map((factor) => (
                    <li key={factor.feature} className="flex gap-2">
                      <span>{factor.actionable ? "⚠" : "🕐"}</span>
                      <span>{text ? tamilReason(factor) : factor.plain_english}</span>
                    </li>
                  ))}
                </ul>
              </Bubble>

              <div className="mt-3" />
              <Bubble>
                <button onClick={() => setLanguage(text ? "en" : "ta")} className="rounded-full bg-[#25D366] px-3 py-1.5 text-xs font-black text-white">
                  {text ? "Show English translation" : "தமிழில் காண்க"}
                </button>
              </Bubble>

              <div className="mt-3" />
              <Bubble side="right">
                <button className="font-black text-[#075e54]">{text ? "நான் எப்படி மேம்படுத்தலாம்?" : "What can I do to improve?"}</button>
              </Bubble>

              <div className="mt-3" />
              <Bubble>
                <p className="font-black">{text ? "செய்ய வேண்டிய படிகள்" : "Actionable steps"}</p>
                <ol className="mt-2 list-decimal space-y-2 pl-5">
                  {steps.map((step) => (
                    <li key={step[0]}>
                      <b>{text ? step[0] : step[1]}</b>
                      <div className="text-xs opacity-80">{text ? step[2] : step[3]}</div>
                    </li>
                  ))}
                </ol>
              </Bubble>

              <div className="mt-3 rounded-2xl bg-white p-3 shadow-sm">
                <div className="flex items-center justify-between text-xs font-black text-slate-700">
                  <span>{text ? "மீண்டும் விண்ணப்பத் தயார்நிலை" : "Reapply readiness"}</span>
                  <span>{readiness}/100</span>
                </div>
                <div className="mt-2 h-3 overflow-hidden rounded-full bg-slate-200">
                  <div className="h-full rounded-full bg-[#25D366]" style={{ width: `${readiness}%` }} />
                </div>
                <p className="mt-2 text-[11px] leading-5 text-slate-500">
                  {text
                    ? "செய்யக்கூடிய காரணிகளில் உள்ள SHAP தாக்கத்தை வைத்து இந்த மதிப்பெண் கணக்கிடப்படுகிறது."
                    : "This score is estimated from actionable SHAP impact: more fixable impact means more room to improve."}
                </p>
              </div>
            </>
          )}
        </div>
      </section>
    </main>
  );
}
