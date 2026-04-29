from __future__ import annotations

import csv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from pydantic import BaseModel
from io import BytesIO, StringIO
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas

from audit import build_report_pdf, read_audit_log, tamper_entry, verify_entries
from model import fairness_for_month, fairness_population_for_month, get_applicant_with_prediction, get_applicants, model_info, predict, predict_custom

app = FastAPI(title="VaazhlaiPartner API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


class TamperPayload(BaseModel):
    shap_value: float


class CustomPredictionPayload(BaseModel):
    monthly_income: int
    emi_amount: int
    credit_score: int
    credit_age_months: int
    num_defaults: int
    loan_amount: int


@app.get("/api/applicants")
def api_applicants():
    return get_applicants()


@app.get("/api/applicant/{applicant_id}")
def api_applicant(applicant_id: int):
    try:
        return get_applicant_with_prediction(applicant_id)
    except KeyError as exc:
        raise HTTPException(status_code=404, detail="Applicant not found") from exc


@app.post("/api/predict")
def api_predict(applicant: dict):
    return predict(applicant)


@app.post("/api/predict/custom")
def api_predict_custom(payload: CustomPredictionPayload):
    return predict_custom(payload.model_dump())


@app.get("/api/model/info")
def api_model_info():
    return model_info()


@app.get("/api/model/card/pdf")
def api_model_card_pdf():
    info = model_info()
    buffer = BytesIO()
    page = canvas.Canvas(buffer, pagesize=letter)
    y = 750
    page.setFont("Helvetica-Bold", 16)
    page.drawString(40, y, "VaazhlaiPartner Model Card")
    y -= 28
    page.setFont("Helvetica", 10)
    overview = [
        f"Algorithm: {info['algorithm_name']}",
        f"Dataset: {info['dataset_name']}",
        f"Records: {info['number_of_records']}",
        f"Training date: {info['training_date']}",
        f"Version: {info['version']}",
    ]
    for line in overview:
        page.drawString(40, y, line)
        y -= 16
    y -= 8
    page.setFont("Helvetica-Bold", 12)
    page.drawString(40, y, "Performance Metrics")
    y -= 18
    page.setFont("Helvetica", 10)
    for label, value in [
        ("Accuracy", info["train_accuracy"]),
        ("AUC-ROC", info["auc_score"]),
        ("Precision", info["precision"]),
        ("Recall", info["recall"]),
    ]:
        page.drawString(55, y, f"{label}: {value:.4f}")
        y -= 15
    y -= 8
    page.setFont("Helvetica-Bold", 12)
    page.drawString(40, y, "Feature Importance (mean absolute SHAP)")
    y -= 18
    page.setFont("Helvetica", 10)
    for item in info["feature_importance"]:
        page.drawString(55, y, f"{item['feature']}: {item['mean_abs_shap']:.4f}")
        y -= 14
    y -= 8
    page.setFont("Helvetica-Bold", 12)
    page.drawString(40, y, "Known Limitations")
    y -= 18
    page.setFont("Helvetica", 9)
    for limitation in info["known_limitations"]:
        page.drawString(55, y, f"- {limitation[:105]}")
        y -= 14
    y -= 8
    page.setFont("Helvetica-Bold", 12)
    page.drawString(40, y, "Fairness Statement")
    y -= 18
    page.setFont("Helvetica", 9)
    page.drawString(55, y, info["fairness_statement"][:115])
    y -= 12
    page.drawString(55, y, info["fairness_statement"][115:230])
    page.save()
    return Response(
        buffer.getvalue(),
        media_type="application/pdf",
        headers={"Content-Disposition": "attachment; filename=model-card.pdf"},
    )


@app.get("/api/audit")
def api_audit():
    return read_audit_log()


@app.post("/api/audit/verify")
def api_audit_verify():
    return verify_entries()


@app.post("/api/audit/tamper/{entry_id}")
def api_audit_tamper(entry_id: str, payload: TamperPayload):
    try:
        return tamper_entry(entry_id, payload.shap_value)
    except KeyError as exc:
        raise HTTPException(status_code=404, detail="Entry not found") from exc


@app.get("/api/audit/report")
def api_audit_report():
    return Response(
        build_report_pdf(),
        media_type="application/pdf",
        headers={"Content-Disposition": "attachment; filename=auditor-report.pdf"},
    )


@app.get("/api/fairness/{month}")
def api_fairness(month: int):
    return fairness_for_month(month)


@app.get("/api/fairness/{month}/population")
def api_fairness_population(month: int):
    return fairness_population_for_month(month)


@app.get("/api/fairness/{month}/population.csv")
def api_fairness_population_csv(month: int):
    population = fairness_population_for_month(month)
    buffer = StringIO()
    fieldnames = [
        "person_id",
        "gender",
        "age_group",
        "geography",
        "monthly_income",
        "emi_to_income_ratio",
        "num_active_loans",
        "num_late_payments",
        "credit_history_months",
        "loan_amount",
        "predicted_default_risk",
        "decision",
        "actual_default",
    ]
    writer = csv.DictWriter(buffer, fieldnames=fieldnames)
    writer.writeheader()
    writer.writerows(population)
    return Response(
        buffer.getvalue(),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=fairness-population-month-{month}.csv"},
    )
