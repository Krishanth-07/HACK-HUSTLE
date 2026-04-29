from __future__ import annotations

from functools import lru_cache
from pathlib import Path
from typing import Any
import urllib.request

import numpy as np
import pandas as pd
import shap
from sklearn.metrics import accuracy_score, precision_score, recall_score, roc_auc_score
from xgboost import XGBClassifier


APPLICANTS: list[dict[str, Any]] = [
    {
        "id": 1,
        "name": "Rajan Murugan",
        "name_tamil": "ரஜன் முருகன்",
        "age": 28,
        "city": "Coimbatore",
        "city_tamil": "கோவை",
        "loan_purpose": "Business Loan - Auto Parts Shop",
        "loan_amount": 200000,
        "monthly_income": 32000,
        "num_active_loans": 3,
        "monthly_emi_total": 11500,
        "emi_to_income_ratio": 0.71,
        "credit_history_months": 18,
        "num_late_payments": 2,
        "employment_months": 26,
        "age_group": "18-30",
        "geography": "tier2",
        "gender": "male",
        "expected_decision": "REJECT",
        "expected_confidence": 0.84,
        "primary_reject_reason": "Monthly EMI burden is 2.4x the safe threshold",
        "primary_reject_reason_tamil": "மாத EMI சுமை பாதுகாப்பு வரம்பை 2.4 மடங்கு மீறுகிறது",
        "action_steps": [
            {"step": "Close your existing personal loan with HDFC", "timeline": "3-4 months", "impact": "Reduces EMI burden by ₹4,200/month"},
            {"step": "Maintain on-time payments for all remaining loans", "timeline": "3 months", "impact": "Improves credit score by ~40 points"},
            {"step": "Reapply after 6 months", "timeline": "Month 6", "impact": "Predicted approval probability: 78%"},
        ],
    },
    {
        "id": 2,
        "name": "Priya Sundaram",
        "name_tamil": "பிரியா சுந்தரம்",
        "age": 34,
        "city": "Chennai",
        "city_tamil": "சென்னை",
        "loan_purpose": "Home Loan",
        "loan_amount": 500000,
        "monthly_income": 68000,
        "num_active_loans": 1,
        "monthly_emi_total": 12000,
        "emi_to_income_ratio": 0.18,
        "credit_history_months": 84,
        "num_late_payments": 0,
        "employment_months": 72,
        "age_group": "31-45",
        "geography": "metro",
        "gender": "female",
        "expected_decision": "APPROVE",
        "expected_confidence": 0.91,
    },
    {
        "id": 3,
        "name": "Murugesan Pillai",
        "name_tamil": "முருகேசன் பிள்ளை",
        "age": 52,
        "city": "Madurai",
        "city_tamil": "மதுரை",
        "loan_purpose": "Personal Loan",
        "loan_amount": 300000,
        "monthly_income": 41000,
        "num_active_loans": 2,
        "monthly_emi_total": 14000,
        "emi_to_income_ratio": 0.34,
        "credit_history_months": 8,
        "num_late_payments": 1,
        "employment_months": 8,
        "age_group": "46+",
        "geography": "tier2",
        "gender": "male",
        "expected_decision": "REJECT",
        "expected_confidence": 0.76,
    },
    {
        "id": 4,
        "name": "Selvi Arumugam",
        "name_tamil": "செல்வி அருமுகம்",
        "age": 44,
        "city": "Tirunelveli",
        "city_tamil": "திருநெல்வேலி",
        "loan_purpose": "Agriculture Loan",
        "loan_amount": 50000,
        "monthly_income": 14000,
        "num_active_loans": 1,
        "monthly_emi_total": 3200,
        "emi_to_income_ratio": 0.23,
        "credit_history_months": 36,
        "num_late_payments": 3,
        "employment_months": 240,
        "age_group": "31-45",
        "geography": "rural",
        "gender": "female",
        "expected_decision": "REJECT",
        "expected_confidence": 0.68,
    },
    {
        "id": 5,
        "name": "Arun Krishnamurthy",
        "name_tamil": "அருண் கிருஷ்ணமூர்த்தி",
        "age": 31,
        "city": "Chennai",
        "city_tamil": "சென்னை",
        "loan_purpose": "Business Expansion Loan",
        "loan_amount": 800000,
        "monthly_income": 95000,
        "num_active_loans": 1,
        "monthly_emi_total": 15000,
        "emi_to_income_ratio": 0.16,
        "credit_history_months": 60,
        "num_late_payments": 0,
        "employment_months": 48,
        "age_group": "18-30",
        "geography": "metro",
        "gender": "male",
        "expected_decision": "APPROVE",
        "expected_confidence": 0.94,
    },
]

DATA_URL = "https://archive.ics.uci.edu/ml/machine-learning-databases/00350/default%20of%20credit%20card%20clients.xls"
DATA_PATH = Path(__file__).resolve().parent / "credit_data.xls"
REJECTION_THRESHOLD = 0.65

FEATURE_COLUMNS = [
    "LIMIT_BAL",
    "AGE",
    "PAY_0",
    "BILL_AMT1",
    "PAY_AMT1",
    "utilization_rate",
    "payment_ratio",
]

FEATURE_LABELS = {
    "LIMIT_BAL": "Credit Limit",
    "AGE": "Age",
    "PAY_0": "Repayment Status",
    "BILL_AMT1": "Latest Bill Amount",
    "PAY_AMT1": "Latest Payment Amount",
    "utilization_rate": "Utilization Rate",
    "payment_ratio": "Payment Ratio",
}

FACTOR_COPY = {
    "Credit Limit": ("Available credit capacity supports this application.", "Requested exposure is high for this risk profile."),
    "Age": ("Age profile is neutral to favorable.", "Age profile contributes modestly to risk."),
    "Repayment Status": ("Recent repayment behavior is clean.", "Recent repayment delays increase default risk."),
    "Latest Bill Amount": ("Current outstanding balance is manageable.", "Current outstanding balance is high."),
    "Latest Payment Amount": ("Recent payment amount supports repayment capacity.", "Recent payment amount is weak relative to balance."),
    "Utilization Rate": ("Credit utilization is within a healthier range.", "High credit utilization increases risk."),
    "Payment Ratio": ("Recent payments cover a healthy share of the bill.", "Payments cover too little of the outstanding bill."),
}

ACTIONABLE = {
    "Credit Limit": True,
    "Age": False,
    "Repayment Status": True,
    "Latest Bill Amount": True,
    "Latest Payment Amount": True,
    "Utilization Rate": True,
    "Payment Ratio": True,
}


def encode_applicant(applicant: dict[str, Any]) -> np.ndarray:
    if "LIMIT_BAL" in applicant:
        values = {column: float(applicant[column]) for column in FEATURE_COLUMNS}
    else:
        values = map_applicant_to_uci(applicant)
    return np.array([values[column] for column in FEATURE_COLUMNS], dtype=float)


def map_applicant_to_uci(applicant: dict[str, Any]) -> dict[str, float]:
    limit_bal = float(np.clip(applicant["loan_amount"], 50_000, 2_000_000))
    age = float(applicant["age"])
    late_payments = float(applicant.get("num_late_payments", 0))
    emi_ratio = float(applicant.get("emi_to_income_ratio", 0.0))
    emi_total = float(applicant.get("monthly_emi_total", 0.0))
    active_loans = float(applicant.get("num_active_loans", 1))
    credit_history_months = float(applicant.get("credit_history_months", 36))
    employment_months = float(applicant.get("employment_months", 36))

    short_history_penalty = 2.0 if credit_history_months < 12 else 0.0
    short_employment_penalty = 1.0 if employment_months < 12 else 0.0
    pay_0 = np.clip(
        round(
            late_payments
            + max(0.0, emi_ratio - 0.4) * 4
            + max(0.0, active_loans - 2) * 0.5
            + short_history_penalty
            + short_employment_penalty
        ),
        -1,
        8,
    )
    utilization_rate = float(np.clip(0.18 + emi_ratio * 0.92 + active_loans * 0.035 + late_payments * 0.035, 0.02, 1.35))
    bill_amt1 = float(np.clip(limit_bal * utilization_rate, 1_000, limit_bal * 1.5))
    pay_amt1 = float(np.clip(max(emi_total, bill_amt1 * (0.05 + max(0.0, 0.42 - emi_ratio) * 0.22)), 0, bill_amt1))
    payment_ratio = float(pay_amt1 / (bill_amt1 + 1))

    return {
        "LIMIT_BAL": limit_bal,
        "AGE": age,
        "PAY_0": float(pay_0),
        "BILL_AMT1": bill_amt1,
        "PAY_AMT1": pay_amt1,
        "utilization_rate": utilization_rate,
        "payment_ratio": payment_ratio,
    }


def _ensure_uci_dataset() -> Path:
    if not DATA_PATH.exists():
        urllib.request.urlretrieve(DATA_URL, DATA_PATH)
    return DATA_PATH


def _load_uci_training_data() -> tuple[np.ndarray, np.ndarray]:
    path = _ensure_uci_dataset()
    data = pd.read_excel(path, header=1)
    data.columns = [str(column).strip() for column in data.columns]
    target_column = "default.payment.next.month"
    if target_column not in data.columns:
        target_column = "default payment next month"
    data = data.rename(columns={target_column: "target"})
    data["utilization_rate"] = data["BILL_AMT1"] / data["LIMIT_BAL"].replace(0, np.nan)
    data["payment_ratio"] = data["PAY_AMT1"] / (data["BILL_AMT1"] + 1)
    data = data.replace([np.inf, -np.inf], np.nan).dropna(subset=FEATURE_COLUMNS + ["target"])
    x = data[FEATURE_COLUMNS].astype(float).to_numpy()
    y = data["target"].astype(int).to_numpy()
    return x, y


@lru_cache(maxsize=1)
def model_bundle() -> dict[str, Any]:
    x, y = _load_uci_training_data()
    model = XGBClassifier(
        n_estimators=260,
        max_depth=3,
        learning_rate=0.045,
        subsample=0.92,
        colsample_bytree=0.95,
        eval_metric="logloss",
        random_state=42,
    )
    model.fit(x, y)
    train_probabilities = model.predict_proba(x)[:, 1]
    train_predictions = (train_probabilities >= 0.5).astype(int)
    explainer = shap.TreeExplainer(model)
    shap_sample = x[: min(1200, len(x))]
    shap_values = np.asarray(explainer.shap_values(shap_sample))
    mean_abs_shap = np.abs(shap_values).mean(axis=0)
    feature_importance = [
        {"feature": feature, "mean_abs_shap": round(float(value), 4)}
        for feature, value in sorted(zip(FEATURE_COLUMNS, mean_abs_shap), key=lambda item: item[1], reverse=True)
    ]
    return {
        "model": model,
        "explainer": explainer,
        "train_accuracy": float(accuracy_score(y, train_predictions)),
        "auc_score": float(roc_auc_score(y, train_probabilities)),
        "precision": float(precision_score(y, train_predictions, zero_division=0)),
        "recall": float(recall_score(y, train_predictions, zero_division=0)),
        "feature_importance": feature_importance,
    }


def _factor_for(feature_name: str, contribution: float) -> dict[str, Any]:
    label = FEATURE_LABELS[feature_name]
    helps_text, hurts_text = FACTOR_COPY[label]
    direction = "helps" if contribution >= 0 else "hurts"
    return {
        "feature": label,
        "source_feature": feature_name,
        "contribution": round(float(contribution), 4),
        "direction": direction,
        "actionable": ACTIONABLE[label],
        "timeline": "fixable in 3-6 months" if ACTIONABLE[label] else "improves with time",
        "plain_english": helps_text if direction == "helps" else hurts_text,
    }


def predict(applicant: dict[str, Any]) -> dict[str, Any]:
    if applicant.get("id") and any(column not in applicant for column in ["monthly_income", "emi_to_income_ratio", "loan_amount"]):
        applicant = get_applicant(int(applicant["id"]))
    row = encode_applicant(applicant).reshape(1, -1)
    bundle = model_bundle()
    reject_probability = float(bundle["model"].predict_proba(row)[0, 1])
    decision = "REJECT" if reject_probability >= REJECTION_THRESHOLD else "APPROVE"
    confidence = _decision_confidence(reject_probability)
    shap_values = np.asarray(bundle["explainer"].shap_values(row))[0]
    approval_contributions = -shap_values
    order = np.argsort(np.abs(approval_contributions))[::-1][:3]
    factors = [_factor_for(FEATURE_COLUMNS[index], approval_contributions[index]) for index in order]
    return {
        "decision": decision,
        "confidence": round(float(confidence), 4),
        "reject_probability": round(float(reject_probability), 4),
        "shap_factors": factors,
        "model": "XGBoostClassifier + SHAP TreeExplainer",
    }


def predict_custom(inputs: dict[str, Any]) -> dict[str, Any]:
    monthly_income = max(float(inputs["monthly_income"]), 1.0)
    emi_amount = float(inputs["emi_amount"])
    credit_score = float(inputs["credit_score"])
    credit_age_months = float(inputs["credit_age_months"])
    num_defaults = float(inputs["num_defaults"])
    loan_amount = float(inputs["loan_amount"])

    score_penalty_defaults = max(0, int((700 - credit_score) // 80))
    inferred_late_payments = int(min(9, max(num_defaults, num_defaults + score_penalty_defaults)))
    inferred_active_loans = int(min(6, max(1, round(emi_amount / max(monthly_income * 0.18, 1)) + num_defaults)))
    applicant = {
        "monthly_income": monthly_income,
        "num_active_loans": inferred_active_loans,
        "monthly_emi_total": emi_amount,
        "emi_to_income_ratio": min(0.98, emi_amount / monthly_income),
        "credit_history_months": credit_age_months,
        "num_late_payments": inferred_late_payments,
        "employment_months": max(6, credit_age_months),
        "loan_amount": loan_amount,
        "age": 32,
        "gender": "male",
        "geography": "tier2",
    }

    row = encode_applicant(applicant).reshape(1, -1)
    bundle = model_bundle()
    reject_probability = float(bundle["model"].predict_proba(row)[0, 1])
    decision = "REJECT" if reject_probability >= REJECTION_THRESHOLD else "APPROVE"
    confidence = _decision_confidence(reject_probability)
    shap_values = np.asarray(bundle["explainer"].shap_values(row))[0]
    approval_contributions = -shap_values

    uci_contributions = dict(zip(FEATURE_COLUMNS, approval_contributions))
    score_penalty = max(0.0, (700 - credit_score) / 400)
    short_history = 1.0 if credit_age_months < 12 else max(0.0, (36 - credit_age_months) / 30)
    default_weight = min(1.0, num_defaults / 5) if num_defaults else 0.0
    emi_stress = min(1.0, emi_amount / monthly_income)
    loan_weight = min(1.0, loan_amount / 1_000_000)
    source_buckets = {
        "Monthly Income": {
            "Latest Bill Amount": uci_contributions["BILL_AMT1"] * 0.4,
            "Utilization Rate": uci_contributions["utilization_rate"] * 0.45,
            "Payment Ratio": uci_contributions["payment_ratio"] * 0.15,
        },
        "EMI Amount": {
            "Payment Ratio": uci_contributions["payment_ratio"] * 0.25,
            "Latest Payment Amount": uci_contributions["PAY_AMT1"] * (0.3 if emi_stress <= 0.35 else -0.35),
            "Utilization Rate": uci_contributions["utilization_rate"] * (0.25 + emi_stress * 0.35),
        },
        "Credit Score": {
            "Repayment Status": uci_contributions["PAY_0"] * score_penalty * 0.45,
        },
        "Credit History": {
            "Repayment Status": uci_contributions["PAY_0"] * short_history * 0.35,
        },
        "Past Defaults": {
            "Repayment Status": uci_contributions["PAY_0"] * max(0.2, default_weight) * 0.75,
        },
        "Loan Amount": {
            "Credit Limit": uci_contributions["LIMIT_BAL"],
            "Latest Bill Amount": uci_contributions["BILL_AMT1"] * loan_weight * 0.35,
        },
    }

    aggregated = []
    for label, sources in source_buckets.items():
        value = sum(float(contribution) for contribution in sources.values())
        strongest_source = max(sources.items(), key=lambda item: abs(item[1]))[0]
        aggregated.append(
            {
                "feature": label,
                "value": round(float(value), 4),
                "impact": round(float(value), 4),
                "source": strongest_source,
            }
        )

    aggregated.sort(key=lambda item: abs(item["impact"]), reverse=True)
    top = aggregated[0]
    direction = "helps approval" if top["impact"] > 0 else "increases rejection risk"
    return {
        "decision": decision,
        "confidence": round(float(confidence), 4),
        "reject_probability": round(float(reject_probability), 4),
        "shap_values": aggregated,
        "top_reason": f"{top['feature']} {direction}",
    }


def model_info() -> dict[str, Any]:
    bundle = model_bundle()
    return {
        "dataset_name": "UCI Credit Default - 30,000 records",
        "training_dataset": "UCI Default of Credit Card Clients",
        "number_of_records": 30000,
        "model_type": "XGBoost",
        "algorithm_name": "XGBoost Gradient Boosted Trees",
        "training_date": "2026-04-29",
        "version": "v1.0-uci-xgb",
        "n_features": len(FEATURE_COLUMNS),
        "feature_names": list(FEATURE_COLUMNS),
        "train_accuracy": round(float(bundle["train_accuracy"]), 4),
        "auc_score": round(float(bundle["auc_score"]), 4),
        "precision": round(float(bundle["precision"]), 4),
        "recall": round(float(bundle["recall"]), 4),
        "feature_importance": bundle["feature_importance"],
        "rejection_threshold": REJECTION_THRESHOLD,
        "known_limitations": [
            "Demographic attributes are monitored using synthetic audit populations because the UCI dataset does not include Indian protected-attribute coverage.",
            "The demo does not integrate live bureau tradeline data or multi-bureau reconciliation.",
            "The sandbox uses one bureau-style repayment score adapter rather than multiple independent bureau scores.",
        ],
        "fairness_statement": "VaazhlaiPartner monitors gender, age group, and geography using demographic parity and the 4/5ths rule, with equalized-odds diagnostics shown for false positive and false negative rates.",
    }


def _decision_confidence(reject_probability: float) -> float:
    if reject_probability >= REJECTION_THRESHOLD:
        scaled = (reject_probability - REJECTION_THRESHOLD) / (1 - REJECTION_THRESHOLD)
    else:
        scaled = (REJECTION_THRESHOLD - reject_probability) / REJECTION_THRESHOLD
    return round(float(0.5 + 0.5 * np.clip(scaled, 0, 1)), 4)


def with_prediction(applicant: dict[str, Any]) -> dict[str, Any]:
    enriched = dict(applicant)
    enriched["prediction"] = predict(applicant)
    return enriched


def get_applicants() -> list[dict[str, Any]]:
    internal_applicants = []
    for applicant in APPLICANTS:
        item = with_prediction(applicant)
        item.pop("name_tamil", None)
        item.pop("city_tamil", None)
        item.pop("primary_reject_reason_tamil", None)
        internal_applicants.append(item)
    return internal_applicants


def get_applicant(applicant_id: int) -> dict[str, Any]:
    for applicant in APPLICANTS:
        if applicant["id"] == applicant_id:
            return applicant
    raise KeyError(applicant_id)


def get_applicant_with_prediction(applicant_id: int) -> dict[str, Any]:
    return with_prediction(get_applicant(applicant_id))


def fairness_for_month(month: int) -> dict[str, Any]:
    month = max(1, min(12, int(month)))
    population = _synthetic_fairness_population(month)
    rows = [encode_applicant(applicant) for applicant in population]
    probabilities = model_bundle()["model"].predict_proba(np.asarray(rows))[:, 1]
    approvals = probabilities < REJECTION_THRESHOLD
    defaults = np.array([applicant["actual_default"] for applicant in population], dtype=int)

    gender = _group_metrics(population, approvals, defaults, "gender")
    age = _group_metrics(population, approvals, defaults, "age_group")
    geography = _group_metrics(population, approvals, defaults, "geography")
    alerts = []
    for metrics in [gender, age, geography]:
        alerts.extend(_alerts_for(metrics))
    return {
        "month": month,
        "approval_by_gender": gender,
        "approval_by_age": age,
        "approval_by_geography": geography,
        "gender": {key: value["approval_rate"] for key, value in gender.items()},
        "ageGroup": {key: value["approval_rate"] for key, value in age.items()},
        "geography": {key: value["approval_rate"] for key, value in geography.items()},
        "alerts": alerts,
    }


def _synthetic_fairness_population(month: int) -> list[dict[str, Any]]:
    rng = np.random.default_rng(10_000 + month)
    drift = (month - 6.5) / 12
    population = []
    for _ in range(500):
        gender = "female" if rng.random() < 0.5 else "male"
        age_group = rng.choice(["18-25", "26-35", "36-50", "51+"], p=[0.2, 0.34, 0.31, 0.15])
        geography = rng.choice(["urban", "semi-urban", "rural"], p=[0.42, 0.34, 0.24])
        age = {
            "18-25": rng.integers(21, 26),
            "26-35": rng.integers(26, 36),
            "36-50": rng.integers(36, 51),
            "51+": rng.integers(51, 66),
        }[age_group]
        geography_income_factor = {"urban": 1.05, "semi-urban": 1.0, "rural": 0.92}[geography]
        monthly_income = np.clip(rng.lognormal(10.68 + drift * 0.035, 0.42) * geography_income_factor, 12_000, 220_000)
        targeted_gender_stress = month == 5 and gender == "female"
        targeted_rural_stress = month == 10 and geography == "rural"
        active_loans = int(np.clip(rng.poisson(1.0 + (geography == "rural") * 0.06 + month * 0.006), 0, 5))
        if targeted_gender_stress or targeted_rural_stress:
            active_loans = int(np.clip(active_loans + 1, 0, 5))
        month_pressure = 0.01 if month in {7, 8} else 0.0
        demo_stress = 0.12 if targeted_gender_stress else 0.0
        demo_stress += 0.13 if targeted_rural_stress else 0.0
        emi_ratio = float(np.clip(rng.beta(2.0 + month * 0.012, 5.8) + active_loans * 0.026 + (geography == "rural") * 0.012 + month_pressure + demo_stress, 0.04, 0.82))
        monthly_emi_total = monthly_income * emi_ratio
        credit_history_months = float(np.clip(rng.gamma(3.8, 18) + max(age - 30, -4) * 1.2, 18, 180))
        late_base = 0.24 + emi_ratio * 1.35 + (geography == "rural") * 0.06 + (age_group == "18-25") * 0.03 + drift * 0.05
        if month == 8 and geography == "rural":
            late_base += 0.04
        if targeted_gender_stress:
            late_base += 0.55
        if targeted_rural_stress:
            late_base += 0.6
        num_late_payments = int(np.clip(rng.poisson(max(0.05, late_base)), 0, 8))
        employment_months = float(np.clip(rng.gamma(3.4, 20) + max(age - 28, -3) * 1.1, 12, 260))
        loan_amount = float(np.clip(monthly_income * rng.uniform(2.8, 12.0) * (1 + active_loans * 0.035), 50_000, 2_000_000))
        risk = (
            -2.2
            + emi_ratio * 3.2
            + num_late_payments * 0.38
            + active_loans * 0.12
            - monthly_income / 250_000
            - credit_history_months / 260
            + (geography == "rural") * 0.05
            + rng.normal(0, 0.35)
        )
        actual_default = int(rng.random() < 1 / (1 + np.exp(-risk)))
        population.append(
            {
                "monthly_income": float(monthly_income),
                "num_active_loans": active_loans,
                "monthly_emi_total": float(monthly_emi_total),
                "emi_to_income_ratio": emi_ratio,
                "credit_history_months": credit_history_months,
                "num_late_payments": num_late_payments,
                "employment_months": employment_months,
                "loan_amount": loan_amount,
                "age": int(age),
                "age_group": age_group,
                "geography": geography,
                "gender": gender,
                "actual_default": actual_default,
            }
        )
    return population


def _group_metrics(population: list[dict[str, Any]], approvals: np.ndarray, defaults: np.ndarray, key: str) -> dict[str, dict[str, Any]]:
    groups = sorted({str(applicant[key]) for applicant in population})
    metrics = {}
    approval_rates = []
    for group in groups:
        mask = np.array([str(applicant[key]) == group for applicant in population])
        sample_size = int(mask.sum())
        approval_rate = float(approvals[mask].mean() * 100) if sample_size else 0.0
        approved = approvals[mask]
        actual = defaults[mask]
        false_positive_rate = float(((approved == 1) & (actual == 1)).sum() / max(1, (actual == 1).sum()) * 100)
        false_negative_rate = float(((approved == 0) & (actual == 0)).sum() / max(1, (actual == 0).sum()) * 100)
        approval_rates.append(approval_rate)
        metrics[group] = {
            "approval_rate": round(approval_rate, 1),
            "sample_size": sample_size,
            "ratio": 1.0,
            "false_positive_rate": round(false_positive_rate, 1),
            "false_negative_rate": round(false_negative_rate, 1),
        }
    highest = max(approval_rates) if approval_rates else 0
    for group, values in metrics.items():
        ratio = values["approval_rate"] / highest if highest else 1.0
        values["ratio"] = round(float(min(1.0, ratio)), 3)
        values["status"] = "VIOLATION" if ratio < 0.8 else "OK"
    return metrics


def _alerts_for(metrics: dict[str, dict[str, Any]]) -> list[dict[str, Any]]:
    return [
        {
            "group": group,
            "ratio": values["ratio"],
            "threshold": 0.8,
            "status": values["status"],
        }
        for group, values in metrics.items()
        if values["status"] == "VIOLATION"
    ]
