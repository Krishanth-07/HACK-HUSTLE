import React, { useState } from "react";
import { useParams } from "react-router-dom";
import { applicants } from "./LoanOfficerCockpit.jsx";

const applicantMessages = {
  rajan: {
    tamil:
      "வணக்கம் ரஜன் முருகன், உங்கள் கடன் விண்ணப்பத்தை தற்போது ஒப்புதல் அளிக்க முடியவில்லை. அதிக EMI சுமை, HDFC தனிநபர் கடன் நிலுவை, மற்றும் சமீபத்திய தாமதமான கட்டணங்கள் காரணமாக இந்த முடிவு எடுக்கப்பட்டது.",
    english:
      "Hello Rajan Murugan, we are unable to approve your loan application right now. This decision was made because of a high EMI burden, an active HDFC personal loan, and recent late payments.",
  },
  meena: {
    tamil:
      "வணக்கம் மீனா சுப்பிரமணியன், உங்கள் கடன் விண்ணப்பம் ஒப்புதலுக்கு தயாராக உள்ளது. நிலையான வருமானம் மற்றும் குறைந்த EMI சுமை இந்த முடிவுக்கு உதவியது.",
    english:
      "Hello Meena Subramanian, your loan application is ready for approval. Stable income and a low EMI burden helped this decision.",
  },
  karthik: {
    tamil:
      "வணக்கம் கார்த்திக் வேல், உங்கள் விண்ணப்பத்திற்கு கூடுதல் மதிப்பாய்வு தேவை. குறுகிய கடன் வரலாறு மற்றும் நடப்பு EMI சுமை காரணமாக நாங்கள் மீண்டும் பார்க்கிறோம்.",
    english:
      "Hello Karthik Vel, your application needs additional review. A short credit history and current EMI burden require a closer look.",
  },
  lakshmi: {
    tamil:
      "வணக்கம் லட்சுமி பிரியா, உங்கள் விண்ணப்பம் ஒப்புதலுக்கு ஏற்றதாக உள்ளது. நல்ல திருப்பிச் செலுத்தும் வரலாறு மற்றும் செயலில் கடன்கள் இல்லாதது உதவியது.",
    english:
      "Hello Lakshmi Priya, your application is suitable for approval. Strong repayment history and no active loans helped the decision.",
  },
  selvam: {
    tamil:
      "வணக்கம் செல்வம் ராஜா, உங்கள் கடன் விண்ணப்பத்தை தற்போது ஒப்புதல் அளிக்க முடியவில்லை. தாமதமான கட்டணங்கள் மற்றும் அதிக வருமான சுமை காரணமாக இந்த முடிவு எடுக்கப்பட்டது.",
    english:
      "Hello Selvam Raja, we are unable to approve your loan application right now. Late payments and high income strain drove this decision.",
  },
};

const rejectionReasons = [
  {
    tone: "hurts",
    tamil: "உங்கள் EMI-to-income ratio அதிகமாக உள்ளது.",
    english: "Your EMI-to-income ratio is high.",
  },
  {
    tone: "hurts",
    tamil: "HDFC தனிநபர் கடன் இன்னும் செயலில் உள்ளது.",
    english: "Your HDFC personal loan is still active.",
  },
  {
    tone: "helps",
    tamil: "உங்கள் மாத வருமானம் நிலையானதாக உள்ளது.",
    english: "Your monthly income is stable.",
  },
];

const actionSteps = [
  {
    text: "Close your HDFC personal loan — reduces EMI by ₹4,200",
    timeline: "3-4 months",
  },
  {
    text: "Pay all pending dues on time for 3 months",
    timeline: "3 months",
  },
  {
    text: "Reapply after 6 months — we will notify you",
    timeline: "6 months",
  },
];

const reasons = [
  "Income has recently increased",
  "Loan was already closed",
  "Late payment record is incorrect",
  "Other supporting documents available",
];

function AccordionCard({ title, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <section className="accordion-card">
      <button
        className="accordion-trigger"
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
      >
        <span>{title}</span>
        <span className={`chevron ${open ? "open" : ""}`} aria-hidden="true">
          ▾
        </span>
      </button>
      {open && <div className="accordion-content">{children}</div>}
    </section>
  );
}

export default function ApplicantMessage() {
  const { id = "rajan" } = useParams();
  const applicant = applicants.find((item) => item.id === id) || applicants[0];
  const message = applicantMessages[applicant.id] || applicantMessages.rajan;
  const [reviewSubmitted, setReviewSubmitted] = useState(false);
  const [reviewReason, setReviewReason] = useState(reasons[0]);

  const submitReview = (event) => {
    event.preventDefault();
    setReviewSubmitted(true);
  };

  return (
    <main className="phone-frame" aria-label="WhatsApp credit decision chat">
      <style>{`
        @import url("https://fonts.googleapis.com/css2?family=Noto+Sans+Tamil:wght@400;500;600;700&display=swap");

        * {
          box-sizing: border-box;
        }

        .phone-frame {
          width: 375px;
          height: calc(100vh - 58px);
          min-height: 610px;
          margin: 0;
          overflow: hidden;
          background: #efe7dc;
          color: #101a14;
          font-family: "Noto Sans Tamil", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
          letter-spacing: 0;
        }

        .chat-header {
          height: 64px;
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 12px;
          background: #075e54;
          color: #ffffff;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.22);
        }

        .back-button,
        .icon-button {
          width: 30px;
          height: 30px;
          flex: 0 0 30px;
          border: 0;
          padding: 0;
          display: grid;
          place-items: center;
          background: transparent;
          color: #ffffff;
          font-size: 24px;
          line-height: 1;
        }

        .avatar {
          width: 38px;
          height: 38px;
          flex: 0 0 38px;
          border-radius: 50%;
          display: grid;
          place-items: center;
          background: #25d366;
          color: #06382f;
          font-size: 18px;
          font-weight: 700;
        }

        .header-copy {
          min-width: 0;
          flex: 1;
        }

        .header-title {
          margin: 0;
          overflow: hidden;
          color: #ffffff;
          font-size: 15px;
          font-weight: 700;
          line-height: 1.2;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .header-status {
          margin: 2px 0 0;
          color: rgba(255, 255, 255, 0.82);
          font-size: 11px;
          font-weight: 400;
          line-height: 1.2;
        }

        .header-actions {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .chat-body {
          position: relative;
          height: calc(100vh - 122px);
          min-height: 546px;
          overflow-y: auto;
          padding: 12px 10px 18px;
          background-color: #efe7dc;
          background-image:
            radial-gradient(circle at 28px 24px, rgba(7, 94, 84, 0.055) 0 1.5px, transparent 1.6px),
            radial-gradient(circle at 94px 78px, rgba(7, 94, 84, 0.05) 0 1.2px, transparent 1.3px);
          background-size: 118px 118px;
        }

        .date-pill {
          width: fit-content;
          margin: 0 auto 10px;
          padding: 5px 10px 4px;
          border-radius: 7px;
          background: rgba(255, 255, 255, 0.82);
          color: #5e6864;
          font-size: 10px;
          font-weight: 600;
          line-height: 1;
          text-transform: uppercase;
          box-shadow: 0 1px 1px rgba(0, 0, 0, 0.06);
        }

        .sender {
          margin: 0 0 4px 7px;
          color: #167a3b;
          font-size: 11px;
          font-weight: 700;
          line-height: 1.2;
        }

        .message-bubble {
          position: relative;
          width: 322px;
          margin: 0 0 10px 7px;
          padding: 9px 10px 17px;
          border-radius: 0 8px 8px 8px;
          background: #dcf8c6;
          box-shadow: 0 1px 1px rgba(0, 0, 0, 0.14);
        }

        .message-bubble::before {
          content: "";
          position: absolute;
          top: 0;
          left: -8px;
          width: 0;
          height: 0;
          border-top: 8px solid #dcf8c6;
          border-left: 8px solid transparent;
        }

        .message-text {
          margin: 0;
          color: #111b15;
          font-size: 12.6px;
          font-weight: 400;
          line-height: 1.62;
        }

        .message-divider {
          height: 1px;
          margin: 8px 0;
          background: rgba(17, 27, 21, 0.11);
        }

        .message-time {
          position: absolute;
          right: 9px;
          bottom: 5px;
          color: rgba(17, 27, 21, 0.52);
          font-size: 10px;
          line-height: 1;
        }

        .accordion-stack {
          display: grid;
          gap: 8px;
          width: 340px;
          margin-left: 7px;
        }

        .accordion-card {
          overflow: hidden;
          border-radius: 8px;
          background: rgba(255, 255, 255, 0.96);
          box-shadow: 0 1px 1px rgba(0, 0, 0, 0.14);
        }

        .accordion-trigger {
          width: 100%;
          min-height: 48px;
          border: 0;
          padding: 10px 11px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          background: #ffffff;
          color: #111b15;
          cursor: pointer;
          font-family: inherit;
          font-size: 12px;
          font-weight: 700;
          line-height: 1.35;
          text-align: left;
        }

        .chevron {
          width: 22px;
          height: 22px;
          flex: 0 0 22px;
          border-radius: 50%;
          display: grid;
          place-items: center;
          background: rgba(37, 211, 102, 0.14);
          color: #128c4a;
          font-size: 14px;
          transform: rotate(-90deg);
          transition: transform 160ms ease;
        }

        .chevron.open {
          transform: rotate(0deg);
        }

        .accordion-content {
          border-top: 1px solid rgba(17, 27, 21, 0.07);
          padding: 11px;
          background: #ffffff;
        }

        .reason-list,
        .steps-list {
          display: grid;
          gap: 10px;
          margin: 0;
          padding: 0;
          list-style: none;
        }

        .reason-item {
          display: grid;
          grid-template-columns: 9px 1fr;
          gap: 8px;
          align-items: start;
        }

        .status-dot {
          width: 8px;
          height: 8px;
          margin-top: 6px;
          border-radius: 50%;
        }

        .status-dot.hurts {
          background: #e53935;
        }

        .status-dot.helps {
          background: #25d366;
        }

        .reason-text,
        .step-text {
          margin: 0;
          color: #17211b;
          font-size: 11.5px;
          line-height: 1.5;
        }

        .english-line {
          display: block;
          margin-top: 2px;
          color: #58615d;
          font-size: 11px;
          line-height: 1.35;
        }

        .step-item {
          display: grid;
          grid-template-columns: 20px 1fr;
          gap: 8px;
          align-items: start;
        }

        .step-number {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          display: grid;
          place-items: center;
          background: #25d366;
          color: #083d2a;
          font-size: 11px;
          font-weight: 800;
          line-height: 1;
        }

        .timeline-chip {
          display: inline-flex;
          width: fit-content;
          margin-top: 5px;
          padding: 3px 7px 2px;
          border-radius: 999px;
          background: #e7f7ed;
          color: #14783b;
          font-size: 10px;
          font-weight: 700;
          line-height: 1.25;
        }

        .review-form {
          display: grid;
          gap: 9px;
        }

        .field-label {
          display: grid;
          gap: 4px;
          color: #46514b;
          font-size: 10.5px;
          font-weight: 700;
          line-height: 1.2;
        }

        .text-input,
        .reason-select {
          width: 100%;
          height: 38px;
          border: 1px solid #d8e0db;
          border-radius: 7px;
          padding: 8px 9px;
          background: #f8faf9;
          color: #111b15;
          font-family: inherit;
          font-size: 12px;
          outline: none;
        }

        .reason-select:focus,
        .text-input:focus {
          border-color: #25d366;
          box-shadow: 0 0 0 2px rgba(37, 211, 102, 0.18);
        }

        .submit-button {
          height: 38px;
          border: 0;
          border-radius: 7px;
          background: #25d366;
          color: #06351f;
          cursor: pointer;
          font-family: inherit;
          font-size: 12px;
          font-weight: 800;
        }

        .submit-button:active {
          transform: translateY(1px);
        }

        .success-message {
          margin: 2px 0 0;
          border-radius: 7px;
          padding: 9px;
          background: #e7f7ed;
          color: #116b35;
          font-size: 11.5px;
          font-weight: 600;
          line-height: 1.55;
        }

        .input-bar {
          position: sticky;
          bottom: 0;
          display: flex;
          align-items: center;
          gap: 7px;
          margin: 12px -2px 0;
          padding-top: 3px;
        }

        .fake-input {
          height: 42px;
          flex: 1;
          border-radius: 999px;
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 0 12px;
          background: #ffffff;
          color: #87918c;
          font-size: 12px;
          box-shadow: 0 1px 1px rgba(0, 0, 0, 0.08);
        }

        .send-circle {
          width: 42px;
          height: 42px;
          flex: 0 0 42px;
          border-radius: 50%;
          border: 0;
          display: grid;
          place-items: center;
          background: #25d366;
          color: #ffffff;
          font-size: 18px;
          line-height: 1;
        }

        @media (min-width: 376px) {
          body {
            margin: 0;
          }

          .phone-frame {
            margin: 0;
          }
        }
      `}</style>

      <header className="chat-header">
        <button className="back-button" type="button" aria-label="Back">
          ‹
        </button>
        <div className="avatar" aria-hidden="true">
          V
        </div>
        <div className="header-copy">
          <h1 className="header-title">VaazhlaiPartner 🤝</h1>
          <p className="header-status">online</p>
        </div>
        <div className="header-actions" aria-hidden="true">
          <button className="icon-button" type="button" tabIndex={-1}>
            ⋮
          </button>
        </div>
      </header>

      <div className="chat-body">
        <div className="date-pill">Today</div>

        <p className="sender">VaazhlaiPartner 🤝</p>
        <article className="message-bubble">
          <p className="message-text">{message.tamil}</p>
          <div className="message-divider" />
          <p className="message-text">{message.english}</p>
          <time className="message-time">10:42 AM</time>
        </article>

        <div className="accordion-stack">
          <AccordionCard title="ஏன் நிராகரிக்கப்பட்டேன்? / Why was I rejected?" defaultOpen>
            <ul className="reason-list">
              {rejectionReasons.map((reason) => (
                <li className="reason-item" key={reason.english}>
                  <span className={`status-dot ${reason.tone}`} aria-hidden="true" />
                  <p className="reason-text">
                    {reason.tamil}
                    <span className="english-line">{reason.english}</span>
                  </p>
                </li>
              ))}
            </ul>
          </AccordionCard>

          <AccordionCard title="நான் என்ன செய்யலாம்? / What can I do?">
            <ol className="steps-list">
              {actionSteps.map((step, index) => (
                <li className="step-item" key={step.text}>
                  <span className="step-number">{index + 1}</span>
                  <p className="step-text">
                    {step.text}
                    <span className="timeline-chip">{step.timeline}</span>
                  </p>
                </li>
              ))}
            </ol>
          </AccordionCard>

          <AccordionCard title="மனித மதிப்பாய்வு கோரவும் / Request human review">
            {reviewSubmitted ? (
              <p className="success-message">
                உங்கள் கோரிக்கை பதிவு செய்யப்பட்டது. 48 மணி நேரத்தில் தொடர்பு கொள்வோம்.
              </p>
            ) : (
              <form className="review-form" onSubmit={submitReview}>
                <label className="field-label">
                  Name
                  <input className="text-input" type="text" value={applicant.nameEnglish} readOnly />
                </label>
                <label className="field-label">
                  Reason
                  <select
                    className="reason-select"
                    value={reviewReason}
                    onChange={(event) => setReviewReason(event.target.value)}
                  >
                    {reasons.map((reason) => (
                      <option key={reason} value={reason}>
                        {reason}
                      </option>
                    ))}
                  </select>
                </label>
                <button className="submit-button" type="submit">
                  Submit review request
                </button>
              </form>
            )}
          </AccordionCard>
        </div>

        <div className="input-bar" aria-hidden="true">
          <div className="fake-input">Message</div>
          <button className="send-circle" type="button" tabIndex={-1}>
            ›
          </button>
        </div>
      </div>
    </main>
  );
}
