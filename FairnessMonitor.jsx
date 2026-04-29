import React, { useMemo, useState } from "react";

const GREEN = "#25D366";
const RED = "#E03137";
const YELLOW = "#F2B441";
const FOUR_FIFTHS = 0.8;

const monthlyRates = {
  1: {
    gender: [
      { label: "பெண் / Female", key: "female", rate: 86 },
      { label: "ஆண் / Male", key: "male", rate: 88 },
    ],
    age: [
      { label: "18-30", key: "18-30", rate: 84 },
      { label: "31-45", key: "31-45", rate: 87 },
      { label: "46+", key: "46+", rate: 85 },
    ],
    geography: [
      { label: "கிராமப்புறம் / Rural", key: "rural", rate: 82 },
      { label: "நகரம் / Tier-2", key: "tier2", rate: 85 },
      { label: "பெருநகரம் / Metro", key: "metro", rate: 86 },
    ],
  },
  2: {
    gender: [
      { label: "பெண் / Female", key: "female", rate: 87 },
      { label: "ஆண் / Male", key: "male", rate: 89 },
    ],
    age: [
      { label: "18-30", key: "18-30", rate: 85 },
      { label: "31-45", key: "31-45", rate: 88 },
      { label: "46+", key: "46+", rate: 86 },
    ],
    geography: [
      { label: "கிராமப்புறம் / Rural", key: "rural", rate: 83 },
      { label: "நகரம் / Tier-2", key: "tier2", rate: 86 },
      { label: "பெருநகரம் / Metro", key: "metro", rate: 87 },
    ],
  },
  3: {
    gender: [
      { label: "பெண் / Female", key: "female", rate: 85 },
      { label: "ஆண் / Male", key: "male", rate: 87 },
    ],
    age: [
      { label: "18-30", key: "18-30", rate: 86 },
      { label: "31-45", key: "31-45", rate: 88 },
      { label: "46+", key: "46+", rate: 84 },
    ],
    geography: [
      { label: "கிராமப்புறம் / Rural", key: "rural", rate: 84 },
      { label: "நகரம் / Tier-2", key: "tier2", rate: 86 },
      { label: "பெருநகரம் / Metro", key: "metro", rate: 88 },
    ],
  },
  4: {
    gender: [
      { label: "பெண் / Female", key: "female", rate: 84 },
      { label: "ஆண் / Male", key: "male", rate: 87 },
    ],
    age: [
      { label: "18-30", key: "18-30", rate: 83 },
      { label: "31-45", key: "31-45", rate: 86 },
      { label: "46+", key: "46+", rate: 85 },
    ],
    geography: [
      { label: "கிராமப்புறம் / Rural", key: "rural", rate: 82 },
      { label: "நகரம் / Tier-2", key: "tier2", rate: 85 },
      { label: "பெருநகரம் / Metro", key: "metro", rate: 86 },
    ],
  },
  5: {
    gender: [
      { label: "பெண் / Female", key: "female", rate: 67 },
      { label: "ஆண் / Male", key: "male", rate: 87 },
    ],
    age: [
      { label: "18-30", key: "18-30", rate: 82 },
      { label: "31-45", key: "31-45", rate: 86 },
      { label: "46+", key: "46+", rate: 84 },
    ],
    geography: [
      { label: "கிராமப்புறம் / Rural", key: "rural", rate: 81 },
      { label: "நகரம் / Tier-2", key: "tier2", rate: 84 },
      { label: "பெருநகரம் / Metro", key: "metro", rate: 86 },
    ],
  },
  6: {
    gender: [
      { label: "பெண் / Female", key: "female", rate: 65 },
      { label: "ஆண் / Male", key: "male", rate: 88 },
    ],
    age: [
      { label: "18-30", key: "18-30", rate: 83 },
      { label: "31-45", key: "31-45", rate: 87 },
      { label: "46+", key: "46+", rate: 84 },
    ],
    geography: [
      { label: "கிராமப்புறம் / Rural", key: "rural", rate: 82 },
      { label: "நகரம் / Tier-2", key: "tier2", rate: 85 },
      { label: "பெருநகரம் / Metro", key: "metro", rate: 87 },
    ],
  },
  7: {
    gender: [
      { label: "பெண் / Female", key: "female", rate: 64 },
      { label: "ஆண் / Male", key: "male", rate: 86 },
    ],
    age: [
      { label: "18-30", key: "18-30", rate: 82 },
      { label: "31-45", key: "31-45", rate: 85 },
      { label: "46+", key: "46+", rate: 83 },
    ],
    geography: [
      { label: "கிராமப்புறம் / Rural", key: "rural", rate: 81 },
      { label: "நகரம் / Tier-2", key: "tier2", rate: 84 },
      { label: "பெருநகரம் / Metro", key: "metro", rate: 85 },
    ],
  },
  8: {
    gender: [
      { label: "பெண் / Female", key: "female", rate: 68 },
      { label: "ஆண் / Male", key: "male", rate: 87 },
    ],
    age: [
      { label: "18-30", key: "18-30", rate: 84 },
      { label: "31-45", key: "31-45", rate: 86 },
      { label: "46+", key: "46+", rate: 83 },
    ],
    geography: [
      { label: "கிராமப்புறம் / Rural", key: "rural", rate: 82 },
      { label: "நகரம் / Tier-2", key: "tier2", rate: 85 },
      { label: "பெருநகரம் / Metro", key: "metro", rate: 86 },
    ],
  },
  9: {
    gender: [
      { label: "பெண் / Female", key: "female", rate: 82 },
      { label: "ஆண் / Male", key: "male", rate: 86 },
    ],
    age: [
      { label: "18-30", key: "18-30", rate: 83 },
      { label: "31-45", key: "31-45", rate: 86 },
      { label: "46+", key: "46+", rate: 84 },
    ],
    geography: [
      { label: "கிராமப்புறம் / Rural", key: "rural", rate: 80 },
      { label: "நகரம் / Tier-2", key: "tier2", rate: 83 },
      { label: "பெருநகரம் / Metro", key: "metro", rate: 85 },
    ],
  },
  10: {
    gender: [
      { label: "பெண் / Female", key: "female", rate: 83 },
      { label: "ஆண் / Male", key: "male", rate: 86 },
    ],
    age: [
      { label: "18-30", key: "18-30", rate: 82 },
      { label: "31-45", key: "31-45", rate: 85 },
      { label: "46+", key: "46+", rate: 83 },
    ],
    geography: [
      { label: "கிராமப்புறம் / Rural", key: "rural", rate: 61 },
      { label: "நகரம் / Tier-2", key: "tier2", rate: 78 },
      { label: "பெருநகரம் / Metro", key: "metro", rate: 86 },
    ],
  },
  11: {
    gender: [
      { label: "பெண் / Female", key: "female", rate: 84 },
      { label: "ஆண் / Male", key: "male", rate: 87 },
    ],
    age: [
      { label: "18-30", key: "18-30", rate: 83 },
      { label: "31-45", key: "31-45", rate: 86 },
      { label: "46+", key: "46+", rate: 84 },
    ],
    geography: [
      { label: "கிராமப்புறம் / Rural", key: "rural", rate: 59 },
      { label: "நகரம் / Tier-2", key: "tier2", rate: 80 },
      { label: "பெருநகரம் / Metro", key: "metro", rate: 88 },
    ],
  },
  12: {
    gender: [
      { label: "பெண் / Female", key: "female", rate: 85 },
      { label: "ஆண் / Male", key: "male", rate: 87 },
    ],
    age: [
      { label: "18-30", key: "18-30", rate: 82 },
      { label: "31-45", key: "31-45", rate: 86 },
      { label: "46+", key: "46+", rate: 85 },
    ],
    geography: [
      { label: "கிராமப்புறம் / Rural", key: "rural", rate: 58 },
      { label: "நகரம் / Tier-2", key: "tier2", rate: 81 },
      { label: "பெருநகரம் / Metro", key: "metro", rate: 89 },
    ],
  },
};

const dimensions = [
  { key: "gender", title: "பாலினம் / Gender" },
  { key: "age", title: "வயது குழு / Age Group" },
  { key: "geography", title: "புவியியல் / Geography" },
];

function findAlerts(data) {
  return dimensions.flatMap((dimension) => {
    const groups = data[dimension.key];
    const highest = Math.max(...groups.map((group) => group.rate));
    return groups
      .filter((group) => group.rate < highest * FOUR_FIFTHS)
      .map((group) => ({
        dimension: dimension.key,
        dimensionTitle: dimension.title,
        group,
        highest,
        gap: Math.round(highest - group.rate),
        ratio: group.rate / highest,
      }));
  });
}

function getAlarmCopy(alert) {
  if (!alert) return null;

  if (alert.dimension === "gender" && alert.group.key === "female") {
    return {
      tamil: "பெண் விண்ணப்பதாரர்களின் அனுமதி விகிதம் ஆண்களை விட 23% குறைவாக உள்ளது.",
      english: "Female applicants are approved 23% less than male applicants.",
    };
  }

  if (alert.dimension === "geography" && alert.group.key === "rural") {
    return {
      tamil: "கிராமப்புற விண்ணப்பதாரர்களின் அனுமதி விகிதம் பெருநகரத்தை விட மிகவும் குறைவாக உள்ளது.",
      english: `Rural applicants are approved ${alert.gap}% less than the highest geography group.`,
    };
  }

  return {
    tamil: `${alert.group.label} குழுவின் அனுமதி விகிதம் அதிகபட்ச குழுவை விட ${alert.gap}% குறைவாக உள்ளது.`,
    english: `${alert.group.label} is approved ${alert.gap}% less than the highest group.`,
  };
}

function RateChart({ title, groups }) {
  const highest = Math.max(...groups.map((group) => group.rate));
  const threshold = highest * FOUR_FIFTHS;

  return (
    <section className="fairness-card">
      <div className="chart-header">
        <h2>{title}</h2>
        <span>80% threshold: {Math.round(threshold)}%</span>
      </div>

      <div className="bar-stack">
        {groups.map((group) => {
          const passes = group.rate >= threshold;
          const ratio = Math.round((group.rate / highest) * 100);

          return (
            <div className="bar-row" key={group.key}>
              <div className="bar-label">{group.label}</div>
              <div className="bar-track" aria-label={`${group.label} approval rate ${group.rate}%`}>
                <div
                  className="bar-fill"
                  style={{
                    width: `${group.rate}%`,
                    background: passes ? GREEN : RED,
                  }}
                />
              </div>
              <strong className={passes ? "rate-pass" : "rate-fail"}>{group.rate}%</strong>
            </div>
          );
        })}
      </div>

      <div className="ratio-list">
        {groups.map((group) => {
          const ratio = Math.round((group.rate / highest) * 100);
          const passes = group.rate >= threshold;
          return (
            <span className={passes ? "ratio-chip pass" : "ratio-chip fail"} key={group.key}>
              {group.label}: {ratio}% vs highest group
            </span>
          );
        })}
      </div>
    </section>
  );
}

export default function FairnessMonitor() {
  const [month, setMonth] = useState(1);
  const [confirmation, setConfirmation] = useState(false);
  const [actionLog, setActionLog] = useState([]);

  const monthData = monthlyRates[month];
  const alerts = useMemo(() => findAlerts(monthData), [monthData]);
  const activeAlert = alerts[0];
  const alarmCopy = getAlarmCopy(activeAlert);

  const recordAction = () => {
    const entry = `Month ${month}: Corrective action recorded for ${
      activeAlert ? activeAlert.group.label : "current parity monitoring"
    }`;
    console.log(entry);
    setActionLog((current) => [entry, ...current].slice(0, 4));
    setConfirmation(true);
    window.setTimeout(() => setConfirmation(false), 3200);
  };

  return (
    <section className="fairness-monitor">
      <style>{`
        @import url("https://fonts.googleapis.com/css2?family=Noto+Sans+Tamil:wght@400;500;600;700;800;900&display=swap");

        .fairness-monitor {
          position: relative;
          min-height: calc(100vh - 58px);
          padding: 20px 24px;
          overflow: hidden;
          background: #ffffff;
          color: #142018;
          font-family: "Noto Sans Tamil", Inter, system-ui, sans-serif;
          letter-spacing: 0;
        }

        .fairness-monitor::before {
          content: "";
          position: absolute;
          right: 36px;
          bottom: 18px;
          width: 360px;
          height: 520px;
          opacity: 0.055;
          pointer-events: none;
          background-repeat: no-repeat;
          background-position: center;
          background-size: contain;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 210 320' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M114 8 C132 25 139 46 132 65 C127 81 137 94 154 109 C181 132 190 161 179 191 C171 214 156 223 149 242 C142 263 145 284 126 307 C110 326 84 305 78 282 C73 263 85 247 74 226 C64 205 43 203 35 179 C27 155 39 137 54 122 C70 106 71 87 63 68 C53 43 76 20 114 8 Z' fill='none' stroke='%23C8102E' stroke-width='10' stroke-linejoin='round'/%3E%3C/svg%3E");
        }

        .fairness-monitor > * {
          position: relative;
          z-index: 1;
        }

        .alarm-banner {
          display: none;
        }

        .alarm-banner.active {
          display: block;
          margin-bottom: 16px;
          border: 3px solid #8f0d13;
          border-radius: 8px;
          padding: 16px 20px;
          background: ${RED};
          color: #ffffff;
          box-shadow: 0 18px 45px rgba(224, 49, 55, 0.34);
          animation: slamIn 420ms cubic-bezier(0.17, 0.92, 0.2, 1.32);
        }

        .alarm-banner h1 {
          margin: 0 0 10px;
          font-size: 23px;
          font-weight: 900;
          line-height: 1.25;
        }

        .alarm-banner p {
          margin: 5px 0;
          font-size: 15px;
          font-weight: 800;
          line-height: 1.45;
        }

        @keyframes slamIn {
          0% {
            opacity: 0;
            transform: translateY(-90px) scale(1.08);
          }
          70% {
            opacity: 1;
            transform: translateY(8px) scale(0.99);
          }
          100% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        .monitor-top {
          display: grid;
          grid-template-columns: minmax(0, 1fr) 310px;
          gap: 18px;
          align-items: stretch;
          margin-bottom: 14px;
        }

        .simulator-card,
        .summary-card,
        .fairness-card,
        .action-log {
          border: 1px solid #dfe8e2;
          border-radius: 8px;
          background: #ffffff;
          box-shadow: 0 10px 30px rgba(16, 32, 24, 0.05);
        }

        .simulator-card {
          padding: 18px;
        }

        .simulator-card h1 {
          margin: 0;
          color: #142018;
          font-size: 20px;
          line-height: 1.35;
        }

        .simulator-card p {
          margin: 8px 0 18px;
          color: #607068;
          font-size: 13px;
          line-height: 1.45;
        }

        .slider-row {
          display: grid;
          grid-template-columns: 88px 1fr 84px;
          gap: 14px;
          align-items: center;
        }

        .month-pill {
          height: 42px;
          border-radius: 999px;
          display: grid;
          place-items: center;
          background: #102018;
          color: #ffffff;
          font-size: 15px;
          font-weight: 900;
        }

        .period-slider {
          width: 100%;
          accent-color: ${activeAlert ? RED : GREEN};
          cursor: pointer;
        }

        .month-end {
          color: #647169;
          font-size: 12px;
          font-weight: 800;
          text-align: right;
        }

        .summary-card {
          padding: 18px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          gap: 12px;
        }

        .status-light {
          width: fit-content;
          border-radius: 999px;
          padding: 7px 11px;
          background: ${activeAlert ? "#fff0f0" : "#e9f9ef"};
          color: ${activeAlert ? RED : "#128c4a"};
          font-size: 12px;
          font-weight: 900;
        }

        .summary-card strong {
          color: #142018;
          font-size: 28px;
          line-height: 1;
        }

        .summary-card span {
          display: block;
          margin-top: 4px;
          color: #647169;
          font-size: 12px;
          font-weight: 700;
        }

        .charts-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 16px;
        }

        .fairness-card {
          padding: 16px;
        }

        .chart-header {
          display: flex;
          align-items: start;
          justify-content: space-between;
          gap: 12px;
          margin-bottom: 18px;
        }

        .chart-header h2 {
          margin: 0;
          color: #142018;
          font-size: 17px;
          line-height: 1.35;
        }

        .chart-header span {
          flex: 0 0 auto;
          border-radius: 999px;
          padding: 5px 8px;
          background: #f1f5f3;
          color: #647169;
          font-size: 10px;
          font-weight: 900;
        }

        .bar-stack {
          display: grid;
          gap: 14px;
        }

        .bar-row {
          display: grid;
          grid-template-columns: 118px minmax(0, 1fr) 46px;
          gap: 10px;
          align-items: center;
        }

        .bar-label {
          color: #233028;
          font-size: 12px;
          font-weight: 800;
          line-height: 1.35;
        }

        .bar-track {
          height: 18px;
          overflow: hidden;
          border-radius: 999px;
          background: #e9efeb;
        }

        .bar-fill {
          height: 100%;
          min-width: 8px;
          border-radius: inherit;
          transition: width 260ms ease, background 260ms ease;
        }

        .rate-pass,
        .rate-fail {
          font-size: 13px;
          text-align: right;
        }

        .rate-pass {
          color: #128c4a;
        }

        .rate-fail {
          color: ${RED};
        }

        .ratio-list {
          display: flex;
          flex-wrap: wrap;
          gap: 7px;
          margin-top: 18px;
        }

        .ratio-chip {
          border-radius: 999px;
          padding: 6px 8px;
          font-size: 10px;
          font-weight: 900;
          line-height: 1.2;
        }

        .ratio-chip.pass {
          background: #e9f9ef;
          color: #128c4a;
        }

        .ratio-chip.fail {
          background: #fff0f0;
          color: ${RED};
        }

        .action-row-fairness {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-top: 18px;
        }

        .corrective-button {
          min-height: 46px;
          border: 0;
          border-radius: 8px;
          padding: 10px 16px;
          background: ${activeAlert ? RED : "#142018"};
          color: #ffffff;
          cursor: pointer;
          font: inherit;
          font-size: 13px;
          font-weight: 900;
        }

        .confirmation {
          border-radius: 8px;
          padding: 10px 12px;
          background: #e9f9ef;
          color: #128c4a;
          font-size: 13px;
          font-weight: 900;
        }

        .action-log {
          margin-top: 16px;
          padding: 16px 18px;
        }

        .action-log h2 {
          margin: 0 0 10px;
          font-size: 15px;
        }

        .action-log p,
        .action-log li {
          color: #647169;
          font-size: 12px;
          line-height: 1.45;
        }

        .action-log ul {
          display: grid;
          gap: 6px;
          margin: 0;
          padding-left: 18px;
        }

        @media (max-width: 1120px) {
          .monitor-top,
          .charts-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <div className={`alarm-banner ${activeAlert ? "active" : ""}`} aria-live="assertive">
        {activeAlert && (
          <>
            <h1>⚠️ சமத்துவ எச்சரிக்கை / DEMOGRAPHIC PARITY ALERT</h1>
            <p>{alarmCopy.tamil}</p>
            <p>{alarmCopy.english}</p>
            <p>Immediate review required before next approval.</p>
          </>
        )}
      </div>

      <div className="monitor-top">
        <section className="simulator-card">
          <h1>காலகட்ட சிமுலேட்டர் / Time Period Simulator</h1>
          <p>
            Slide from Month 1 to Month 12 to replay approval-rate drift and watch the 4/5ths rule alarm fire.
          </p>
          <div className="slider-row">
            <span className="month-pill">Month {month}</span>
            <input
              className="period-slider"
              type="range"
              min="1"
              max="12"
              step="1"
              value={month}
              onChange={(event) => {
                setMonth(Number(event.target.value));
                setConfirmation(false);
              }}
              aria-label="Time Period Simulator"
            />
            <span className="month-end">Month 12</span>
          </div>
        </section>

        <aside className="summary-card">
          <span className="status-light">
            {activeAlert ? "ALARM ACTIVE" : "Parity within threshold"}
          </span>
          <div>
            <strong>{alerts.length}</strong>
            <span>groups below 80% of the highest approval group</span>
          </div>
        </aside>
      </div>

      <div className="charts-grid">
        {dimensions.map((dimension) => (
          <RateChart
            key={dimension.key}
            title={dimension.title}
            groups={monthData[dimension.key]}
          />
        ))}
      </div>

      <div className="action-row-fairness">
        <button className="corrective-button" type="button" onClick={recordAction}>
          சரிசெய்யும் நடவடிக்கை / Corrective Action Taken
        </button>
        {confirmation && (
          <span className="confirmation">நடவடிக்கை பதிவு செய்யப்பட்டது</span>
        )}
      </div>

      <section className="action-log">
        <h2>Action log</h2>
        {actionLog.length === 0 ? (
          <p>No corrective actions recorded in this session.</p>
        ) : (
          <ul>
            {actionLog.map((entry) => (
              <li key={entry}>{entry}</li>
            ))}
          </ul>
        )}
      </section>
    </section>
  );
}
