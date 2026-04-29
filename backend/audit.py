from __future__ import annotations

import hashlib
import json
import uuid
from datetime import datetime
from io import BytesIO
from pathlib import Path
from typing import Any

from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas

from model import get_applicant, predict

AUDIT_PATH = Path(__file__).resolve().parent / "audit_log.json"

TIMESTAMPS = {
    1: "2026-04-29T09:14:00+05:30",
    3: "2026-04-29T09:22:00+05:30",
    4: "2026-04-29T09:31:00+05:30",
    2: "2026-04-29T09:45:00+05:30",
    5: "2026-04-29T10:02:00+05:30",
}


def entry_hash(entry: dict[str, Any], prev_hash: str | None = None) -> str:
    previous = entry["prev_hash"] if prev_hash is None else prev_hash
    raw = (
        f"{entry['timestamp']}"
        f"{entry['applicant_id']}"
        f"{entry['decision']}"
        f"{entry['confidence']}"
        f"{entry['shap_top_factor']}"
        f"{entry['shap_value']}"
        f"{previous}"
    )
    return hashlib.sha256(raw.encode("utf-8")).hexdigest()


def merkle_root(entry_hashes: list[str]) -> str:
    if not entry_hashes:
        return hashlib.sha256(b"").hexdigest()
    level = entry_hashes[:]
    while len(level) > 1:
        if len(level) % 2 == 1:
            level.append(level[-1])
        level = [
            hashlib.sha256((level[index] + level[index + 1]).encode("utf-8")).hexdigest()
            for index in range(0, len(level), 2)
        ]
    return level[0]


def envelope(entries: list[dict[str, Any]]) -> dict[str, Any]:
    return {"merkle_root": merkle_root([entry["entry_hash"] for entry in entries]), "entries": entries}


def seed_entries() -> list[dict[str, Any]]:
    order = [1, 3, 4, 2, 5]
    previous = "GENESIS"
    entries = []
    for index, applicant_id in enumerate(order, start=1):
        applicant = get_applicant(applicant_id)
        prediction = predict(applicant)
        factor = prediction["shap_factors"][0]
        entry = {
            "entry_number": index,
            "entry_id": str(uuid.uuid4()),
            "timestamp": TIMESTAMPS[applicant_id],
            "applicant_id": applicant["id"],
            "applicant_name": applicant["name"],
            "decision": prediction["decision"],
            "confidence": prediction["confidence"],
            "feature_inputs": {
                "monthly_income": applicant["monthly_income"],
                "num_active_loans": applicant["num_active_loans"],
                "monthly_emi_total": applicant["monthly_emi_total"],
                "emi_to_income_ratio": applicant["emi_to_income_ratio"],
                "credit_history_months": applicant["credit_history_months"],
                "num_late_payments": applicant["num_late_payments"],
                "employment_months": applicant["employment_months"],
                "loan_amount": applicant["loan_amount"],
                "age": applicant["age"],
                "gender": applicant["gender"],
                "geography": applicant["geography"],
            },
            "shap_top_factor": factor["feature"],
            "shap_value": factor["contribution"],
            "loan_amount": applicant["loan_amount"],
            "prev_hash": previous,
        }
        entry["entry_hash"] = entry_hash(entry)
        previous = entry["entry_hash"]
        entries.append(entry)
    return entries


def write_entries(entries: list[dict[str, Any]]) -> None:
    AUDIT_PATH.write_text(json.dumps(envelope(entries), indent=2), encoding="utf-8")


def read_entries() -> list[dict[str, Any]]:
    if not AUDIT_PATH.exists():
        write_entries(seed_entries())
    payload = json.loads(AUDIT_PATH.read_text(encoding="utf-8"))
    entries = payload["entries"] if isinstance(payload, dict) and "entries" in payload else payload
    if any("feature_inputs" not in entry for entry in entries) or not isinstance(payload, dict):
        entries = seed_entries()
        write_entries(entries)
    return entries


def read_audit_log() -> dict[str, Any]:
    entries = read_entries()
    payload = json.loads(AUDIT_PATH.read_text(encoding="utf-8"))
    if not isinstance(payload, dict) or "merkle_root" not in payload:
        write_entries(entries)
        payload = json.loads(AUDIT_PATH.read_text(encoding="utf-8"))
    return {"merkle_root": payload["merkle_root"], "entries": entries}


def verify_entries(entries: list[dict[str, Any]] | None = None) -> dict[str, Any]:
    stored_log = read_audit_log()
    entries = stored_log["entries"] if entries is None else entries
    stored_root = stored_log["merkle_root"]
    previous = "GENESIS"
    first_bad = None
    result = []
    for index, entry in enumerate(entries):
        expected = entry_hash(entry, previous)
        hash_valid = entry["entry_hash"] == expected
        chain_valid = entry["prev_hash"] == previous
        valid = hash_valid and chain_valid
        if not valid and first_bad is None:
            first_bad = index
        is_valid = first_bad is None
        result.append(
            {
                "entry_id": entry["entry_id"],
                "entry_number": index + 1,
                "is_valid": is_valid,
                "status": "VALID" if is_valid else "TAMPERED",
                "hash_valid": hash_valid,
                "chain_valid": chain_valid,
                "expected_hash": expected,
                "stored_hash": entry["entry_hash"],
                "hash_prefix": entry["entry_hash"][:8],
            }
        )
        previous = entry["entry_hash"] if valid else expected
    computed_root = merkle_root([entry["entry_hash"] for entry in entries])
    merkle_valid = computed_root == stored_root
    compromised = first_bad is not None or not merkle_valid
    return {
        "entries": result,
        "merkle_root": stored_root,
        "computed_merkle_root": computed_root,
        "merkle_valid": merkle_valid,
        "overall_integrity": "COMPROMISED" if compromised else "INTACT",
    }


def tamper_entry(entry_id: str, shap_value: float) -> dict[str, Any]:
    entries = read_entries()
    for entry in entries:
        if entry["entry_id"] == entry_id:
            entry["shap_value"] = shap_value
            write_entries(entries)
            return entry
    raise KeyError(entry_id)


def build_report_pdf() -> bytes:
    entries = read_entries()
    verification = verify_entries(entries)
    statuses = {item["entry_id"]: item["is_valid"] for item in verification["entries"]}
    buffer = BytesIO()
    page = canvas.Canvas(buffer, pagesize=letter)
    page.setFont("Helvetica-Bold", 16)
    page.drawString(40, 750, "VaazhlaiPartner Auditor Report")
    page.setFont("Helvetica", 10)
    page.drawString(40, 730, f"Generated: {datetime.now().isoformat(timespec='seconds')}")
    page.drawString(40, 714, f"Merkle Root: {verification['merkle_root']}")
    page.drawString(40, 698, f"Overall Integrity: {verification['overall_integrity']} | Merkle Valid: {verification['merkle_valid']}")
    y = 670
    for entry in entries:
        status = "VERIFIED" if statuses[entry["entry_id"]] else "TAMPERED"
        page.drawString(
            40,
            y,
            f"{entry['entry_number']}. {entry['timestamp']} | {entry['applicant_name']} | "
            f"{entry['decision']} | {entry['confidence']:.2f} | {entry['shap_top_factor']} "
            f"{entry['shap_value']:.2f} | {status}",
        )
        y -= 24
    page.save()
    return buffer.getvalue()
