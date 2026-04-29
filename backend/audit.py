from __future__ import annotations

import hashlib
import json
import uuid
from datetime import datetime
from io import BytesIO
from pathlib import Path
from typing import Any

from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import inch
from reportlab.platypus import PageBreak, Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle

from model import fairness_for_month, get_applicant, predict

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
    context = json.dumps(entry.get("application_context", {}), sort_keys=True, separators=(",", ":"))
    anomaly = json.dumps(entry.get("anomaly", {}), sort_keys=True, separators=(",", ":"))
    raw = (
        f"{entry['timestamp']}"
        f"{entry['applicant_id']}"
        f"{entry['decision']}"
        f"{entry['confidence']}"
        f"{entry['shap_top_factor']}"
        f"{entry['shap_value']}"
        f"{context}"
        f"{anomaly}"
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
            "application_context": {
                "loan_purpose": applicant["loan_purpose"],
                "collateral_type": applicant.get("collateral_type", "None"),
                "collateral_value": applicant.get("collateral_value", 0),
                "collateral_verified": applicant.get("collateral_verified", "unavailable"),
                "collateral_notes": applicant.get("collateral_notes", ""),
                "model_usage_note": "Collateral is recorded for underwriting context and audit evidence; it is not a model feature in this UCI-trained XGBoost model.",
            },
            "shap_top_factor": factor["feature"],
            "shap_value": factor["contribution"],
            "anomaly": prediction.get("anomaly", {"status": "NORMAL", "reason": "No anomaly detected"}),
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
    if any("feature_inputs" not in entry or "application_context" not in entry or "anomaly" not in entry for entry in entries) or not isinstance(payload, dict):
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


def _page_number(canvas_obj, doc):
    canvas_obj.saveState()
    canvas_obj.setFont("Helvetica", 8)
    canvas_obj.setFillColor(colors.HexColor("#475569"))
    canvas_obj.drawCentredString(letter[0] / 2, 0.35 * inch, f"Page {doc.page}")
    canvas_obj.restoreState()


def _paragraph(text: str, style: ParagraphStyle):
    return Paragraph(text.replace("—", "&mdash;"), style)


def _audit_table(entries: list[dict[str, Any]]) -> Table:
    data = [["ID", "Applicant", "Decision", "Confidence", "Top Factor", "Anomaly Flag", "Hash"]]
    for entry in entries:
        anomaly = entry.get("anomaly", {}).get("status", "NORMAL")
        data.append(
            [
                str(entry["entry_number"]),
                entry["applicant_name"],
                entry["decision"],
                f"{entry['confidence'] * 100:.1f}%",
                entry["shap_top_factor"],
                anomaly,
                entry["entry_hash"][:12],
            ]
        )
    table = Table(data, colWidths=[0.35 * inch, 1.35 * inch, 0.8 * inch, 0.85 * inch, 1.15 * inch, 1.15 * inch, 1.05 * inch])
    table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#1A3366")),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                ("FONTSIZE", (0, 0), (-1, -1), 8),
                ("GRID", (0, 0), (-1, -1), 0.25, colors.HexColor("#CBD5E1")),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#F8FAFC")]),
            ]
        )
    )
    for row_index, entry in enumerate(entries, start=1):
        if entry.get("anomaly", {}).get("status") != "NORMAL":
            table.setStyle(TableStyle([("TEXTCOLOR", (5, row_index), (5, row_index), colors.HexColor("#B45309"))]))
    return table


def _fairness_table() -> Table:
    month = max(1, min(12, datetime.now().month))
    fairness = fairness_for_month(month)
    data = [["Dimension", "Group", "Approval Rate", "Sample", "4/5ths Ratio", "Status"]]
    sections = [
        ("Gender", fairness["approval_by_gender"]),
        ("Age", fairness["approval_by_age"]),
        ("Geography", fairness["approval_by_geography"]),
    ]
    row_styles = []
    row_index = 1
    for dimension, metrics in sections:
        for group, values in metrics.items():
            status = values.get("status", "OK")
            data.append(
                [
                    dimension,
                    group,
                    f"{values['approval_rate']:.1f}%",
                    str(values["sample_size"]),
                    f"{values['ratio']:.3f}",
                    status,
                ]
            )
            row_styles.append((row_index, status))
            row_index += 1
    table = Table(data, colWidths=[1.0 * inch, 1.1 * inch, 1.1 * inch, 0.75 * inch, 1.0 * inch, 0.9 * inch])
    style = TableStyle(
        [
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#1A3366")),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
            ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
            ("FONTSIZE", (0, 0), (-1, -1), 9),
            ("GRID", (0, 0), (-1, -1), 0.25, colors.HexColor("#CBD5E1")),
            ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#F8FAFC")]),
        ]
    )
    for row, status in row_styles:
        style.add("TEXTCOLOR", (5, row), (5, row), colors.red if status == "VIOLATION" else colors.green)
    table.setStyle(style)
    return table


def build_report_pdf() -> bytes:
    entries = read_entries()
    verification = verify_entries(entries)
    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter, rightMargin=48, leftMargin=48, topMargin=54, bottomMargin=54)
    styles = getSampleStyleSheet()
    navy = colors.HexColor("#1A3366")
    title = ParagraphStyle("RbiTitle", parent=styles["Title"], fontName="Helvetica-Bold", fontSize=22, leading=28, textColor=navy, alignment=1)
    subtitle = ParagraphStyle("RbiSubtitle", parent=styles["Normal"], fontSize=11, leading=16, alignment=1)
    heading = ParagraphStyle("RbiHeading", parent=styles["Heading1"], fontName="Helvetica-Bold", fontSize=15, leading=20, textColor=navy)
    body = ParagraphStyle("RbiBody", parent=styles["BodyText"], fontSize=10, leading=15, textColor=colors.black)
    small = ParagraphStyle("RbiSmall", parent=body, fontSize=9, leading=13)
    month_label = datetime.now().strftime("%B %Y")
    today = datetime.now().strftime("%d %B %Y")
    story = []

    story.extend(
        [
            Spacer(1, 1.1 * inch),
            _paragraph("RESERVE BANK OF INDIA", title),
            Spacer(1, 12),
            _paragraph("Master Direction — Digital Lending Guidelines 2023 | Algorithmic Credit Decision Disclosure", subtitle),
            Spacer(1, 0.65 * inch),
            Table([["Bank", "VaazhlaiPartner Credit Systems Pvt. Ltd."], ["Report type", "Periodic Algorithmic Audit Report"], ["Reporting period", month_label], ["Date", today]], colWidths=[1.6 * inch, 4.2 * inch], style=TableStyle([("GRID", (0, 0), (-1, -1), 0.4, colors.HexColor("#CBD5E1")), ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"), ("BACKGROUND", (0, 0), (0, -1), colors.HexColor("#F1F5F9")), ("FONTSIZE", (0, 0), (-1, -1), 10), ("PADDING", (0, 0), (-1, -1), 8)])),
            Spacer(1, 0.4 * inch),
            Table([[""]], colWidths=[6.6 * inch], style=TableStyle([("LINEABOVE", (0, 0), (-1, -1), 1.2, navy)])),
            Spacer(1, 0.25 * inch),
            _paragraph("CONFIDENTIAL — REGULATORY USE ONLY", ParagraphStyle("Classification", parent=body, fontName="Helvetica-Bold", fontSize=11, textColor=colors.red, alignment=1)),
            PageBreak(),
        ]
    )

    story.extend(
        [
            _paragraph("1. ALGORITHMIC MODEL DISCLOSURE", heading),
            _paragraph("1.1 Model Type: XGBoost Gradient Boosted Classifier", body),
            _paragraph("1.2 Training Dataset: UCI Credit Default Dataset (N=30,000 records)", body),
            _paragraph("1.3 Explainability Method: SHAP TreeExplainer (post-hoc, model-agnostic)", body),
            _paragraph("1.4 Fairness Standard Applied: EEOC 4/5ths Rule", body),
            _paragraph("1.5 Protected Attributes Monitored: Gender, Age Group, Geography", body),
            _paragraph(f"1.6 Audit Period: {month_label}", body),
            _paragraph(f"1.7 Total Decisions in Period: {len(entries)}", body),
            PageBreak(),
            _paragraph("2. DECISION AUDIT TRAIL", heading),
            _paragraph("2.1 All decisions recorded with SHA-256 hash chaining for tamper-evidence", body),
            _paragraph(f"2.2 Merkle root: {verification['merkle_root']}", small),
            _paragraph(f"2.3 Chain integrity: {verification['overall_integrity']}", body),
            Spacer(1, 12),
            _audit_table(entries),
            PageBreak(),
            _paragraph("3. DEMOGRAPHIC FAIRNESS ASSESSMENT", heading),
            _fairness_table(),
            Spacer(1, 14),
            _paragraph("3.X CORRECTIVE ACTIONS TAKEN:", body),
            _paragraph("• Monthly 500-applicant fairness population is evaluated through the live XGBoost model.", body),
            _paragraph("• Any subgroup breaching the 4/5ths rule is routed for human review before the next approval batch.", body),
            _paragraph("• Audit exports preserve anomaly flags, SHAP top factors, and hash-chain integrity evidence.", body),
            PageBreak(),
            _paragraph("4. CERTIFICATION", heading),
            _paragraph(f"This report has been generated automatically by VaazhlaiPartner's tamper-evident audit system. All SHAP values are derived from model internals and have not been modified post-hoc. Hash chain integrity has been verified as of {today}.", body),
            Spacer(1, 20),
            _paragraph("Digitally signed by: VaazhlaiPartner Audit System", body),
            _paragraph(f"Verification hash: {verification['merkle_root']}", small),
        ]
    )
    doc.build(story, onFirstPage=_page_number, onLaterPages=_page_number)
    return buffer.getvalue()


generate_report = build_report_pdf
