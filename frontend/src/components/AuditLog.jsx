import { useEffect, useMemo, useState } from "react";

const API = "/api";

function formatTime(value) {
  return new Intl.DateTimeFormat("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "short",
  }).format(new Date(value));
}

function copyText(value) {
  navigator.clipboard?.writeText(value);
}

export default function AuditLog() {
  const [entries, setEntries] = useState([]);
  const [merkleRoot, setMerkleRoot] = useState("");
  const [verification, setVerification] = useState(null);
  const [statuses, setStatuses] = useState({});
  const [editing, setEditing] = useState(null);
  const [draft, setDraft] = useState("");
  const [toast, setToast] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [regulatorOpen, setRegulatorOpen] = useState(false);
  const [anomalyFilter, setAnomalyFilter] = useState("all");

  const load = () =>
    fetch(`${API}/audit`).then((r) => r.json()).then((payload) => {
      setEntries(payload.entries || payload);
      setMerkleRoot(payload.merkle_root || "");
    });

  useEffect(() => {
    load();
  }, []);

  const statusList = useMemo(() => Object.values(statuses).sort((a, b) => a.entry_number - b.entry_number), [statuses]);
  const filteredEntries = useMemo(() => {
    if (anomalyFilter === "normal") return entries.filter((entry) => (entry.anomaly?.status || "NORMAL") === "NORMAL");
    if (anomalyFilter === "flagged") return entries.filter((entry) => (entry.anomaly?.status || "NORMAL") !== "NORMAL");
    return entries;
  }, [entries, anomalyFilter]);

  const verify = async () => {
    setVerifying(true);
    const result = await fetch(`${API}/audit/verify`, { method: "POST" }).then((r) => r.json());
    setVerification(result);
    setMerkleRoot(result.merkle_root);
    setStatuses({});
    for (let index = 0; index < result.entries.length; index += 1) {
      await new Promise((resolve) => setTimeout(resolve, 300));
      setStatuses((current) => ({ ...current, [result.entries[index].entry_id]: result.entries[index] }));
    }
    const firstBad = result.entries.find((item) => item.status === "TAMPERED");
    if (firstBad) {
      const invalidCount = result.entries.filter((item) => item.status === "TAMPERED").length - 1;
      setToast(`Tamper detected at Entry ${firstBad.entry_number} - ${invalidCount} subsequent entries invalidated`);
    } else if (!result.merkle_valid) {
      setToast("Merkle root mismatch - audit package compromised");
    } else {
      setToast("Chain verified - Merkle root intact");
    }
    setVerifying(false);
    setTimeout(() => setToast(""), 3500);
  };

  const saveTamper = async (entry) => {
    await fetch(`${API}/audit/tamper/${entry.entry_id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ shap_value: Number(draft) }),
    });
    setEditing(null);
    setVerification(null);
    setStatuses({});
    await load();
  };

  const downloadReport = () => {
    window.open(`${API}/audit/report`, "_blank");
  };

  return (
    <main className="min-h-[calc(100vh-64px)] bg-slate-50 p-4 sm:p-6">
      <header className="flex flex-col items-start justify-between gap-4 lg:flex-row">
        <div>
          <h1 className="text-2xl font-black text-slate-950 sm:text-3xl">Audit Log</h1>
          <p className="mt-1 text-sm font-semibold text-slate-500">Tamper-evident decision record - SHA-256 hash chain and Merkle root</p>
        </div>
        <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:flex-wrap sm:justify-end">
          <button disabled={verifying} onClick={verify} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-black text-white disabled:opacity-60">Verify Chain Integrity</button>
          <button onClick={downloadReport} className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-black text-slate-700">Export to PDF</button>
          <button onClick={() => setRegulatorOpen(true)} className="rounded-lg border border-blue-300 bg-white px-4 py-2 text-sm font-black text-blue-700">Simulate Regulator View</button>
        </div>
      </header>

      <section className="mt-5 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <h2 className="text-sm font-black uppercase tracking-wide text-slate-500">Merkle Root</h2>
            <p className="mt-2 truncate rounded-lg bg-slate-950 px-3 py-2 font-mono text-xs text-white">{merkleRoot || "Loading..."}</p>
          </div>
          <button onClick={() => copyText(merkleRoot)} className="shrink-0 rounded-lg bg-slate-900 px-4 py-2 text-sm font-black text-white">Copy</button>
        </div>
        {verification && (
          <div className={`mt-3 rounded-lg px-3 py-2 text-sm font-black ${verification.overall_integrity === "INTACT" ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"}`}>
            Overall integrity: {verification.overall_integrity} | Merkle valid: {String(verification.merkle_valid)}
          </div>
        )}
      </section>

      {statusList.length > 0 && (
        <section className="mt-5 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-black text-slate-950">Hash Chain Diagram</h2>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            {statusList.map((status, index) => (
              <div key={status.entry_id} className="flex items-center gap-3">
                <div className={`rounded-xl border px-4 py-3 shadow-sm ${status.status === "VALID" ? "border-green-200 bg-green-50" : "shake border-red-200 bg-red-50"}`}>
                  <div className={`text-xl ${status.status === "VALID" ? "text-green-700" : "text-red-700"}`}>{status.status === "VALID" ? "🔒" : "🔓"}</div>
                  <div className="mt-1 font-mono text-xs font-black text-slate-900">{status.hash_prefix}</div>
                  <div className={`mt-1 text-[10px] font-black ${status.status === "VALID" ? "text-green-700" : "text-red-700"}`}>{status.status}</div>
                </div>
                {index < statusList.length - 1 && <div className="text-xl font-black text-slate-400">→</div>}
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="mt-5 overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-lg font-black text-slate-950">Decision Records</h2>
          <select value={anomalyFilter} onChange={(event) => setAnomalyFilter(event.target.value)} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-bold text-slate-700">
            <option value="all">All decisions</option>
            <option value="normal">Normal only</option>
            <option value="flagged">Flagged only</option>
          </select>
        </div>
        {!entries.length ? (
          <div className="grid gap-3 p-5">
            <div className="h-10 rounded-lg skeleton" />
            <div className="h-10 rounded-lg skeleton" />
            <div className="h-10 rounded-lg skeleton" />
            <div className="h-10 rounded-lg skeleton" />
          </div>
        ) : (
        <table className="min-w-[1080px] w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs font-black uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Entry #</th>
              <th className="px-4 py-3">Timestamp</th>
              <th className="px-4 py-3">Applicant</th>
              <th className="px-4 py-3">Decision</th>
              <th className="px-4 py-3">Confidence</th>
              <th className="px-4 py-3">SHAP Factor</th>
              <th className="px-4 py-3">Anomaly</th>
              <th className="px-4 py-3">SHAP Value</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredEntries.map((entry) => {
              const status = statuses[entry.entry_id];
              const valid = status?.status === "VALID";
              const known = Boolean(status);
              const anomaly = entry.anomaly?.status || "NORMAL";
              const flagged = anomaly !== "NORMAL";
              return (
                <tr key={entry.entry_id} className={`border-l-4 border-t border-slate-100 ${flagged ? "border-l-amber-400" : "border-l-transparent"} ${known && valid ? "bg-green-50" : ""} ${known && !valid ? "shake bg-red-50" : ""}`}>
                  <td className="px-4 py-3 font-black">{entry.entry_number}</td>
                  <td className="px-4 py-3 font-semibold text-slate-600">{formatTime(entry.timestamp)}</td>
                  <td className="px-4 py-3 font-black text-slate-900">{entry.applicant_name}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-black text-white ${entry.decision === "REJECT" ? "bg-red-600" : "bg-green-600"}`}>{entry.decision}</span>
                  </td>
                  <td className="px-4 py-3 font-bold">{(entry.confidence * 100).toFixed(1)}%</td>
                  <td className="px-4 py-3 text-slate-600">{entry.shap_top_factor}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-black ${flagged ? "bg-amber-100 text-amber-800" : "bg-slate-100 text-slate-600"}`}>{anomaly}</span>
                  </td>
                  <td className="px-4 py-3">
                    {editing === entry.entry_id ? (
                      <input value={draft} onChange={(e) => setDraft(e.target.value)} className="w-20 rounded border border-slate-300 px-2 py-1" type="number" step="0.01" />
                    ) : (
                      Number(entry.shap_value).toFixed(2)
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {known ? (
                      <span className={`font-black ${valid ? "text-green-700" : "text-red-700"}`}>{status.status}</span>
                    ) : (
                      <span className="font-bold text-slate-400">Pending</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {editing === entry.entry_id ? (
                      <button onClick={() => saveTamper(entry)} className="rounded bg-green-600 px-3 py-1.5 text-xs font-black text-white">Save</button>
                    ) : (
                      <button onClick={() => { setEditing(entry.entry_id); setDraft(String(entry.shap_value)); }} className="rounded bg-slate-900 px-3 py-1.5 text-xs font-black text-white">Edit</button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        )}
      </section>

      {regulatorOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/60 p-6">
          <section className="w-full max-w-3xl rounded-xl bg-white shadow-2xl">
            <header className="flex items-start justify-between border-b border-slate-200 p-5">
              <div>
                <h2 className="text-2xl font-black text-slate-950">Regulator View</h2>
                <p className="mt-1 text-sm font-semibold text-slate-500">RBI-safe summary without internal SHAP details</p>
              </div>
              <button onClick={() => setRegulatorOpen(false)} className="rounded-full bg-slate-100 px-3 py-1.5 text-sm font-black text-slate-700">Close</button>
            </header>
            <div className="overflow-x-auto p-5">
              <div className={`mb-4 rounded-lg px-3 py-2 text-sm font-black ${verification?.overall_integrity === "COMPROMISED" ? "bg-red-50 text-red-800" : "bg-green-50 text-green-800"}`}>
                Overall integrity: {verification?.overall_integrity || "NOT VERIFIED"}
              </div>
              <table className="min-w-[520px] w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                  <tr>
                    <th className="px-3 py-3">Applicant</th>
                    <th className="px-3 py-3">Decision</th>
                    <th className="px-3 py-3">Confidence</th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map((entry) => (
                    <tr key={entry.entry_id} className="border-t border-slate-100">
                      <td className="px-3 py-3 font-black text-slate-900">{entry.applicant_name}</td>
                      <td className="px-3 py-3">{entry.decision}</td>
                      <td className="px-3 py-3">{(entry.confidence * 100).toFixed(1)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      )}

      {toast && <div className="fixed bottom-5 right-5 rounded-lg bg-slate-950 px-5 py-3 text-sm font-black text-white shadow-xl">{toast}</div>}
    </main>
  );
}
