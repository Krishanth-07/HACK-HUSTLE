import React, { useEffect, useMemo, useState } from "react";

const API_URL = "http://127.0.0.1:8000/api/audit";

function formatTime(timestamp) {
  return new Intl.DateTimeFormat("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "short",
  }).format(new Date(timestamp));
}

function buildPdfText(entries, rowStatuses, chainMessage) {
  return [
    "Auditor Report",
    chainMessage,
    "",
    ...entries.map((entry, index) => {
      const status = rowStatuses[entry.entry_id] === "tampered" ? "TAMPERED" : "VERIFIED";
      return `${index + 1}. ${entry.applicant_name} | ${entry.applicant_name_tamil} | ${entry.decision.toUpperCase()} | confidence ${entry.confidence} | shap ${entry.shap_top_factor}=${entry.shap_value} | ${status}`;
    }),
  ].join("\\n");
}

function downloadPdf(filename, text) {
  const reportWindow = window.open("", "_blank", "width=960,height=720");
  if (!reportWindow) return;

  const rows = text
    .split("\\n")
    .filter(Boolean)
    .map((line) => `<p>${line.replace(/[&<>]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[char])}</p>`)
    .join("");

  reportWindow.document.write(`
    <!doctype html>
    <html lang="ta">
      <head>
        <meta charset="utf-8" />
        <title>${filename}</title>
        <style>
          @import url("https://fonts.googleapis.com/css2?family=Noto+Sans+Tamil:wght@400;600;800&display=swap");
          body {
            margin: 32px;
            color: #142018;
            font-family: "Noto Sans Tamil", Arial, sans-serif;
          }
          h1 {
            margin: 0 0 16px;
            font-size: 24px;
          }
          p {
            margin: 0 0 10px;
            font-size: 12px;
            line-height: 1.5;
          }
          @media print {
            button { display: none; }
          }
        </style>
      </head>
      <body>
        <button onclick="window.print()" style="margin-bottom:16px;padding:10px 14px;border:0;border-radius:8px;background:#142018;color:white;font-weight:800;">
          Save as PDF
        </button>
        <h1>தணிக்கையாளர் அறிக்கை / Auditor Report</h1>
        ${rows}
        <script>
          window.onload = () => setTimeout(() => window.print(), 400);
        </script>
      </body>
    </html>
  `);
  reportWindow.document.close();
}

export default function AuditLog() {
  const [entries, setEntries] = useState([]);
  const [rowStatuses, setRowStatuses] = useState({});
  const [editingId, setEditingId] = useState(null);
  const [draftValue, setDraftValue] = useState("");
  const [chainMessage, setChainMessage] = useState("சரிபார்ப்பு நிலுவையில் உள்ளது / Verification pending");
  const [isVerifying, setIsVerifying] = useState(false);

  const statusById = useMemo(() => rowStatuses, [rowStatuses]);

  const loadEntries = () => {
    fetch(API_URL)
      .then((response) => response.json())
      .then((payload) => {
        setEntries(payload.entries || []);
        const neutral = {};
        (payload.entries || []).forEach((entry) => {
          neutral[entry.entry_id] = "idle";
        });
        setRowStatuses(neutral);
      })
      .catch(() => setChainMessage("Backend not reachable at /api/audit"));
  };

  useEffect(() => {
    loadEntries();
  }, []);

  const verifyChain = async () => {
    setIsVerifying(true);
    setChainMessage("சங்கிலி சரிபார்க்கப்படுகிறது / Verifying chain...");
    const payload = await fetch(`${API_URL}/verify`, { method: "POST" }).then((response) => response.json());
    const statuses = payload.statuses || [];
    const nextStatuses = {};

    for (let index = 0; index < statuses.length; index += 1) {
      const status = statuses[index];
      nextStatuses[status.entry_id] = status.verified ? "verified" : "tampered";
      setRowStatuses((current) => ({ ...current, ...nextStatuses }));
      await new Promise((resolve) => window.setTimeout(resolve, 300));
    }

    if (payload.chain_intact) {
      setChainMessage("சங்கிலி சரியானது / Chain Intact ✓");
    } else {
      setChainMessage(`⚠️ சேதமடைந்தது / TAMPERED — Hash mismatch at entry ${payload.mismatch_index + 1}`);
    }
    setIsVerifying(false);
  };

  const startEdit = (entry) => {
    setEditingId(entry.entry_id);
    setDraftValue(String(entry.shap_value));
  };

  const saveEdit = async (entryId) => {
    const payload = await fetch(API_URL, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ entry_id: entryId, shap_value: Number(draftValue) }),
    }).then((response) => response.json());

    setEntries((current) =>
      current.map((entry) => (entry.entry_id === entryId ? payload.entry : entry)),
    );
    setEditingId(null);
    setChainMessage("shap_value changed. Run Verify Chain to reveal tampering.");
    setRowStatuses((current) => ({ ...current, [entryId]: "idle" }));
  };

  const exportReport = () => {
    downloadPdf("auditor-report.pdf", buildPdfText(entries, rowStatuses, chainMessage));
  };

  return (
    <section className="audit-log-page">
      <style>{`
        @import url("https://fonts.googleapis.com/css2?family=Noto+Sans+Tamil:wght@400;500;600;700;800;900&display=swap");

        .audit-log-page {
          min-height: calc(100vh - 58px);
          padding: 20px 24px;
          background: #ffffff;
          color: #142018;
          font-family: "Noto Sans Tamil", Inter, system-ui, sans-serif;
          letter-spacing: 0;
        }

        .audit-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          margin-bottom: 14px;
        }

        .audit-header h1 {
          margin: 0;
          font-size: 23px;
          line-height: 1.25;
        }

        .audit-header p {
          margin: 5px 0 0;
          color: #647169;
          font-size: 13px;
        }

        .audit-actions {
          display: flex;
          gap: 10px;
        }

        .audit-button {
          min-height: 42px;
          border: 0;
          border-radius: 8px;
          padding: 10px 14px;
          background: #142018;
          color: #ffffff;
          cursor: pointer;
          font: inherit;
          font-size: 12px;
          font-weight: 900;
        }

        .audit-button.secondary {
          border: 1px solid #d8e2dc;
          background: #ffffff;
          color: #142018;
        }

        .audit-button:disabled {
          cursor: wait;
          opacity: 0.7;
        }

        .chain-message {
          margin-bottom: 12px;
          border-radius: 8px;
          padding: 12px 14px;
          background: #ffffff;
          border: 1px solid #dfe8e2;
          color: #142018;
          font-size: 14px;
          font-weight: 900;
          box-shadow: 0 10px 30px rgba(16, 32, 24, 0.05);
        }

        .chain-message:has(.tampered-text) {
          border-color: #ffd1d1;
          background: #fff0f0;
          color: #d92d35;
        }

        .audit-table-wrap {
          overflow: hidden;
          border: 1px solid #dfe8e2;
          border-radius: 8px;
          background: #ffffff;
          box-shadow: 0 10px 30px rgba(16, 32, 24, 0.05);
        }

        .audit-table {
          width: 100%;
          border-collapse: collapse;
        }

        .audit-table th,
        .audit-table td {
          border-bottom: 1px solid #edf2ef;
          padding: 11px 14px;
          text-align: left;
          vertical-align: middle;
        }

        .audit-table th {
          background: #f8faf9;
          color: #627169;
          font-size: 12px;
          font-weight: 900;
        }

        .audit-table td {
          color: #142018;
          font-size: 13px;
        }

        .audit-row {
          transition: background 240ms ease, box-shadow 240ms ease;
        }

        .audit-row.verified {
          background: #e9f9ef;
          box-shadow: inset 5px 0 0 #25d366;
        }

        .audit-row.tampered {
          background: #fff0f0;
          box-shadow: inset 5px 0 0 #e03137;
        }

        .name-cell strong,
        .name-cell span {
          display: block;
        }

        .name-cell span {
          margin-top: 3px;
          color: #68766e;
          font-size: 11px;
        }

        .decision-badge-small {
          border-radius: 999px;
          padding: 6px 9px;
          color: #ffffff;
          font-size: 11px;
          font-weight: 900;
          text-transform: uppercase;
        }

        .decision-badge-small.reject {
          background: #d92d35;
        }

        .decision-badge-small.approve {
          background: #159947;
        }

        .status-pill {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          border-radius: 999px;
          padding: 6px 9px;
          font-size: 11px;
          font-weight: 900;
        }

        .status-pill.idle {
          background: #eef3f0;
          color: #647169;
        }

        .status-pill.verified {
          background: #dff8e8;
          color: #128c4a;
        }

        .status-pill.tampered {
          background: #ffe2e2;
          color: #d92d35;
        }

        .shap-edit {
          width: 86px;
          height: 34px;
          border: 1px solid #d7e1db;
          border-radius: 7px;
          padding: 6px 8px;
          font: inherit;
          font-size: 12px;
        }

        .row-button {
          min-height: 34px;
          border: 0;
          border-radius: 7px;
          padding: 7px 10px;
          background: #102018;
          color: #ffffff;
          cursor: pointer;
          font: inherit;
          font-size: 11px;
          font-weight: 900;
        }

        .row-button.save {
          background: #25d366;
          color: #07351e;
        }

        .edit-controls {
          display: flex;
          align-items: center;
          gap: 8px;
        }
      `}</style>

      <header className="audit-header">
        <div>
          <h1>தணிக்கை பதிவு / Audit Log</h1>
          <p>Hash-chained decision records stored in audit_log.json</p>
        </div>
        <div className="audit-actions">
          <button className="audit-button" type="button" onClick={verifyChain} disabled={isVerifying}>
            சரிபார்க்கவும் / Verify Chain
          </button>
          <button className="audit-button secondary" type="button" onClick={exportReport}>
            தணிக்கையாளர் அறிக்கை / Auditor Report
          </button>
        </div>
      </header>

      <div className="chain-message">
        {chainMessage.startsWith("⚠️") ? <span className="tampered-text">{chainMessage}</span> : chainMessage}
      </div>

      <div className="audit-table-wrap">
        <table className="audit-table">
          <thead>
            <tr>
              <th>நேரம் / Time</th>
              <th>பெயர் / Name</th>
              <th>முடிவு / Decision</th>
              <th>நம்பிக்கை / Confidence</th>
              <th>SHAP value</th>
              <th>நிலை / Status</th>
              <th>திருத்து / Edit</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry) => {
              const status = statusById[entry.entry_id] || "idle";
              return (
                <tr className={`audit-row ${status}`} key={entry.entry_id}>
                  <td>{formatTime(entry.timestamp)}</td>
                  <td className="name-cell">
                    <strong>{entry.applicant_name_tamil}</strong>
                    <span>{entry.applicant_name}</span>
                  </td>
                  <td>
                    <span className={`decision-badge-small ${entry.decision}`}>
                      {entry.decision}
                    </span>
                  </td>
                  <td>{Math.round(entry.confidence * 100)}%</td>
                  <td>
                    {editingId === entry.entry_id ? (
                      <input
                        className="shap-edit"
                        type="number"
                        step="0.01"
                        value={draftValue}
                        onChange={(event) => setDraftValue(event.target.value)}
                      />
                    ) : (
                      entry.shap_value
                    )}
                  </td>
                  <td>
                    <span className={`status-pill ${status}`}>
                      {status === "tampered" ? "⚠️ Tampered" : status === "verified" ? "🔒 Verified" : "Pending"}
                    </span>
                  </td>
                  <td>
                    {editingId === entry.entry_id ? (
                      <div className="edit-controls">
                        <button className="row-button save" type="button" onClick={() => saveEdit(entry.entry_id)}>
                          Save
                        </button>
                        <button className="row-button" type="button" onClick={() => setEditingId(null)}>
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button className="row-button" type="button" onClick={() => startEdit(entry)}>
                        திருத்து / Edit
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
