import hashlib
import json
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

from credit_default_pipeline import predict


BASE_DIR = Path(__file__).resolve().parent
AUDIT_LOG_PATH = BASE_DIR / "audit_log.json"

SEED_AUDIT_ENTRIES = [
    {
        "entry_id": "8f8ef4cf-7829-4f06-a8b7-73c7c7d3b101",
        "timestamp": "2026-04-29T09:00:00+05:30",
        "applicant_name": "Rajan Murugan",
        "applicant_name_tamil": "ரஜன் முருகன்",
        "decision": "reject",
        "confidence": 0.84,
        "shap_top_factor": "emi_to_income_ratio",
        "shap_value": -0.34,
        "loan_amount": 200000,
    },
    {
        "entry_id": "68ec64a4-f802-49df-864e-00a0f1b22e52",
        "timestamp": "2026-04-29T09:08:00+05:30",
        "applicant_name": "Meena Subramanian",
        "applicant_name_tamil": "மீனா சுப்பிரமணியன்",
        "decision": "approve",
        "confidence": 0.91,
        "shap_top_factor": "monthly_income",
        "shap_value": 0.46,
        "loan_amount": 420000,
    },
    {
        "entry_id": "046d35c6-65a6-45f1-aec3-91ccf5166103",
        "timestamp": "2026-04-29T09:17:00+05:30",
        "applicant_name": "Karthik Vel",
        "applicant_name_tamil": "கார்த்திக் வேல்",
        "decision": "reject",
        "confidence": 0.73,
        "shap_top_factor": "credit_history_months",
        "shap_value": -0.29,
        "loan_amount": 580000,
    },
    {
        "entry_id": "13ff624f-b015-4a45-9fcb-cc4b4f3011ba",
        "timestamp": "2026-04-29T09:29:00+05:30",
        "applicant_name": "Lakshmi Priya",
        "applicant_name_tamil": "லட்சுமி பிரியா",
        "decision": "approve",
        "confidence": 0.96,
        "shap_top_factor": "num_late_payments",
        "shap_value": 0.51,
        "loan_amount": 300000,
    },
    {
        "entry_id": "7ca1c1d4-c3e6-4dff-9cf8-f01f26f5e8e8",
        "timestamp": "2026-04-29T09:41:00+05:30",
        "applicant_name": "Selvam Raja",
        "applicant_name_tamil": "செல்வம் ராஜா",
        "decision": "reject",
        "confidence": 0.88,
        "shap_top_factor": "num_late_payments",
        "shap_value": -0.41,
        "loan_amount": 640000,
    },
]


def canonical_entry(entry):
    payload = {
        "entry_id": entry["entry_id"],
        "timestamp": entry["timestamp"],
        "applicant_name": entry["applicant_name"],
        "applicant_name_tamil": entry["applicant_name_tamil"],
        "decision": entry["decision"],
        "confidence": entry["confidence"],
        "shap_top_factor": entry["shap_top_factor"],
        "shap_value": entry["shap_value"],
        "loan_amount": entry["loan_amount"],
        "prev_hash": entry["prev_hash"],
    }
    return json.dumps(payload, ensure_ascii=False, sort_keys=True, separators=(",", ":"))


def hash_entry(entry):
    return hashlib.sha256(canonical_entry(entry).encode("utf-8")).hexdigest()


def create_seed_audit_log():
    previous_hash = "GENESIS"
    entries = []
    for seed in SEED_AUDIT_ENTRIES:
        entry = {**seed, "prev_hash": previous_hash}
        entry["entry_hash"] = hash_entry(entry)
        previous_hash = entry["entry_hash"]
        entries.append(entry)
    return entries


def read_audit_log():
    if not AUDIT_LOG_PATH.exists():
        write_audit_log(create_seed_audit_log())
    return json.loads(AUDIT_LOG_PATH.read_text(encoding="utf-8"))


def write_audit_log(entries):
    AUDIT_LOG_PATH.write_text(json.dumps(entries, ensure_ascii=False, indent=2), encoding="utf-8")


def verify_audit_log(entries):
    previous_recomputed_hash = "GENESIS"
    first_mismatch = None
    statuses = []

    for index, entry in enumerate(entries):
        expected_hash = hash_entry({**entry, "prev_hash": previous_recomputed_hash})
        current_valid = entry.get("prev_hash") == previous_recomputed_hash and entry.get("entry_hash") == expected_hash

        if not current_valid and first_mismatch is None:
            first_mismatch = index

        tampered = first_mismatch is not None and index >= first_mismatch
        statuses.append(
            {
                "entry_id": entry["entry_id"],
                "verified": not tampered,
                "expected_hash": expected_hash,
                "stored_hash": entry.get("entry_hash"),
                "message": "verified" if not tampered else f"Hash mismatch at entry {first_mismatch + 1}",
            }
        )
        previous_recomputed_hash = expected_hash

    return {
        "chain_intact": first_mismatch is None,
        "mismatch_index": first_mismatch,
        "statuses": statuses,
    }


class PredictHandler(BaseHTTPRequestHandler):
    def _send_json(self, status, payload):
        body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, PATCH, OPTIONS")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_OPTIONS(self):
        self._send_json(200, {"ok": True})

    def do_GET(self):
        if self.path == "/api/audit":
            entries = read_audit_log()
            self._send_json(200, {"entries": entries, "verification": verify_audit_log(entries)})
            return

        self._send_json(404, {"error": "Not found"})

    def do_POST(self):
        if self.path == "/api/audit/verify":
            entries = read_audit_log()
            self._send_json(200, verify_audit_log(entries))
            return

        if self.path != "/predict":
            self._send_json(404, {"error": "Not found"})
            return

        try:
            content_length = int(self.headers.get("Content-Length", "0"))
            applicant = json.loads(self.rfile.read(content_length).decode("utf-8"))
            self._send_json(200, predict(applicant))
        except Exception as exc:
            self._send_json(500, {"error": str(exc)})

    def do_PATCH(self):
        if self.path != "/api/audit":
            self._send_json(404, {"error": "Not found"})
            return

        try:
            content_length = int(self.headers.get("Content-Length", "0"))
            payload = json.loads(self.rfile.read(content_length).decode("utf-8"))
            entries = read_audit_log()
            for entry in entries:
                if entry["entry_id"] == payload["entry_id"]:
                    entry["shap_value"] = float(payload["shap_value"])
                    write_audit_log(entries)
                    self._send_json(200, {"entry": entry, "verification": verify_audit_log(entries)})
                    return
            self._send_json(404, {"error": "Entry not found"})
        except Exception as exc:
            self._send_json(500, {"error": str(exc)})

    def log_message(self, format, *args):
        return


if __name__ == "__main__":
    read_audit_log()
    server = ThreadingHTTPServer(("127.0.0.1", 8000), PredictHandler)
    print("API running at http://127.0.0.1:8000")
    server.serve_forever()
