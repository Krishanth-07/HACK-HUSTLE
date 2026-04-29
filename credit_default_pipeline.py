import json
from pathlib import Path
from typing import Any, Dict, List

import joblib
import numpy as np
import pandas as pd
import shap
from sklearn.calibration import CalibratedClassifierCV
from sklearn.metrics import accuracy_score, roc_auc_score
from sklearn.model_selection import train_test_split
from xgboost import XGBClassifier


BASE_DIR = Path(__file__).resolve().parent
MODEL_PATH = BASE_DIR / "model.pkl"
METRICS_PATH = BASE_DIR / "training_metrics.json"
DATA_PATH = BASE_DIR / "credit_default_data.csv"
RANDOM_STATE = 42

FEATURES = [
    "monthly_income",
    "num_active_loans",
    "emi_to_income_ratio",
    "credit_history_months",
    "num_late_payments",
    "employment_months",
    "loan_amount",
    "age",
    "geography",
    "gender",
]

FEATURE_METADATA = {
    "monthly_income": {
        "name": "Monthly income",
        "actionable": True,
        "timeline": "fixable in 3-6 months",
        "ta_help": "உங்கள் மாத வருமானம் கடன் ஒப்புதலுக்கு சாதகமாக உள்ளது.",
        "ta_hurt": "உங்கள் மாத வருமானம் இந்த கடன் விண்ணப்பத்திற்கு பலவீனமாக உள்ளது.",
        "en_help": "Your monthly income supports the approval decision.",
        "en_hurt": "Your monthly income is weak for this loan application.",
    },
    "num_active_loans": {
        "name": "Active loans",
        "actionable": True,
        "timeline": "fixable in 3-6 months",
        "ta_help": "நடப்பு கடன்களின் எண்ணிக்கை கட்டுப்பாட்டில் இருப்பதால் இது உதவுகிறது.",
        "ta_hurt": "நடப்பு கடன்கள் அதிகமாக இருப்பதால் இது ஆபத்தை உயர்த்துகிறது.",
        "en_help": "Your active loan count is manageable and helps the application.",
        "en_hurt": "Too many active loans are increasing the risk on this application.",
    },
    "emi_to_income_ratio": {
        "name": "EMI to income ratio",
        "actionable": True,
        "timeline": "fixable in 3-6 months",
        "ta_help": "வருமானத்துடன் ஒப்பிடும்போது EMI சுமை குறைவாக இருப்பதால் இது உதவுகிறது.",
        "ta_hurt": "வருமானத்துடன் ஒப்பிடும்போது EMI சுமை அதிகமாக இருப்பதால் இது பாதிக்கிறது.",
        "en_help": "Your EMI burden is low compared with income, which helps approval.",
        "en_hurt": "Your EMI burden is high compared with income, which hurts approval.",
    },
    "credit_history_months": {
        "name": "Credit history length",
        "actionable": False,
        "timeline": "improves with time",
        "ta_help": "நீண்ட கடன் வரலாறு நம்பகத்தன்மையை காட்டுவதால் இது உதவுகிறது.",
        "ta_hurt": "கடன் வரலாறு குறைவாக இருப்பதால் முடிவில் எதிர்மறை தாக்கம் உள்ளது.",
        "en_help": "A longer credit history shows reliability and helps the decision.",
        "en_hurt": "A short credit history adds uncertainty and hurts the decision.",
    },
    "num_late_payments": {
        "name": "Late payments",
        "actionable": True,
        "timeline": "fixable in 3-6 months",
        "ta_help": "தாமதமான கட்டணங்கள் குறைவாக இருப்பதால் இது சாதகமாக உள்ளது.",
        "ta_hurt": "தாமதமான கட்டணங்கள் அதிகமாக இருப்பதால் இது விண்ணப்பத்தை பாதிக்கிறது.",
        "en_help": "Few late payments improve trust in your repayment behavior.",
        "en_hurt": "Late payments are hurting trust in your repayment behavior.",
    },
    "employment_months": {
        "name": "Employment stability",
        "actionable": False,
        "timeline": "improves with time",
        "ta_help": "வேலை நிலைத்தன்மை நல்லதாக இருப்பதால் இது உதவுகிறது.",
        "ta_hurt": "வேலை அனுபவம் குறைவாக இருப்பதால் இது ஆபத்தை உயர்த்துகிறது.",
        "en_help": "Stable employment supports the approval decision.",
        "en_hurt": "Limited employment history is increasing perceived risk.",
    },
    "loan_amount": {
        "name": "Loan amount requested",
        "actionable": True,
        "timeline": "fixable in 3-6 months",
        "ta_help": "கோரிய கடன் தொகை வருமானத்திற்கு ஏற்றதாக இருப்பதால் இது உதவுகிறது.",
        "ta_hurt": "கோரிய கடன் தொகை அதிகமாக இருப்பதால் இது ஆபத்தை உயர்த்துகிறது.",
        "en_help": "The requested loan amount looks reasonable for the profile.",
        "en_hurt": "The requested loan amount looks high for the profile.",
    },
    "age": {
        "name": "Age",
        "actionable": False,
        "timeline": "cannot change",
        "ta_help": "வயது தொடர்பான சுயவிவரம் இந்த முடிவில் சாதகமாக உள்ளது.",
        "ta_hurt": "வயது தொடர்பான சுயவிவரம் இந்த முடிவில் சாதகமல்ல.",
        "en_help": "The age profile is favorable in this decision.",
        "en_hurt": "The age profile is not favorable in this decision.",
    },
    "geography": {
        "name": "Geography",
        "actionable": False,
        "timeline": "cannot change",
        "ta_help": "இருப்பிட வகை இந்த முடிவில் சாதகமாக உள்ளது.",
        "ta_hurt": "இருப்பிட வகை இந்த முடிவில் எதிர்மறை தாக்கம் கொடுக்கிறது.",
        "en_help": "The geography category is favorable in this decision.",
        "en_hurt": "The geography category is adding risk in this decision.",
    },
    "gender": {
        "name": "Gender",
        "actionable": False,
        "timeline": "cannot change",
        "ta_help": "பாலின தகவல் இந்த மாதிரி முடிவில் சிறிய சாதக தாக்கம் கொடுக்கிறது.",
        "ta_hurt": "பாலின தகவல் இந்த மாதிரி முடிவில் சிறிய எதிர்மறை தாக்கம் கொடுக்கிறது.",
        "en_help": "Gender has a small favorable effect in this model decision.",
        "en_hurt": "Gender has a small unfavorable effect in this model decision.",
    },
}


def _sigmoid(value: np.ndarray) -> np.ndarray:
    return 1.0 / (1.0 + np.exp(-value))


def generate_synthetic_data(rows: int = 1000) -> pd.DataFrame:
    rng = np.random.default_rng(RANDOM_STATE)
    monthly_income = np.clip(rng.lognormal(mean=10.65, sigma=0.45, size=rows), 12000, 220000)
    num_active_loans = np.clip(rng.poisson(1.6, rows), 0, 8)
    emi_to_income_ratio = np.clip(rng.beta(2.2, 5.0, rows) * 0.85, 0.02, 0.9)
    credit_history_months = np.clip(rng.gamma(4.0, 18.0, rows), 3, 240)
    num_late_payments = np.clip(rng.poisson(1.1 + emi_to_income_ratio * 2.2, rows), 0, 12)
    employment_months = np.clip(rng.gamma(3.0, 16.0, rows), 1, 240)
    loan_amount = np.clip(monthly_income * rng.uniform(4, 28, rows), 30000, 3_000_000)
    age = np.clip(rng.normal(36, 10, rows), 21, 65)
    geography = rng.choice([0, 1, 2], rows, p=[0.34, 0.36, 0.30])
    gender = rng.integers(0, 2, rows)

    loan_to_income = loan_amount / np.maximum(monthly_income, 1)
    risk_score = (
        -2.2
        - 0.000018 * monthly_income
        + 1.9 * emi_to_income_ratio
        + 0.24 * num_active_loans
        - 0.010 * credit_history_months
        + 0.32 * num_late_payments
        - 0.006 * employment_months
        + 0.050 * loan_to_income
        + np.where(age < 24, 0.32, 0)
        + np.where(age > 55, 0.18, 0)
        + np.where(geography == 0, 0.18, np.where(geography == 2, -0.08, 0.0))
        + rng.normal(0, 0.55, rows)
    )
    default_probability = _sigmoid(risk_score)
    default = rng.binomial(1, default_probability)

    data = pd.DataFrame(
        {
            "monthly_income": monthly_income.round(2),
            "num_active_loans": num_active_loans.astype(int),
            "emi_to_income_ratio": emi_to_income_ratio.round(4),
            "credit_history_months": credit_history_months.round().astype(int),
            "num_late_payments": num_late_payments.astype(int),
            "employment_months": employment_months.round().astype(int),
            "loan_amount": loan_amount.round(2),
            "age": age.round().astype(int),
            "geography": geography.astype(int),
            "gender": gender.astype(int),
            "default": default.astype(int),
        }
    )
    return data


def load_or_create_data() -> pd.DataFrame:
    if DATA_PATH.exists():
        data = pd.read_csv(DATA_PATH)
        missing = sorted(set(FEATURES + ["default"]) - set(data.columns))
        if missing:
            raise ValueError(f"{DATA_PATH.name} is missing columns: {missing}")
        return data[FEATURES + ["default"]]

    data = generate_synthetic_data(1000)
    data.to_csv(DATA_PATH, index=False)
    return data


def train_model() -> Dict[str, float]:
    data = load_or_create_data()
    x_train, x_test, y_train, y_test = train_test_split(
        data[FEATURES],
        data["default"],
        test_size=0.20,
        random_state=RANDOM_STATE,
        stratify=data["default"],
    )

    base_model = XGBClassifier(
        n_estimators=180,
        max_depth=3,
        learning_rate=0.05,
        subsample=0.9,
        colsample_bytree=0.9,
        eval_metric="logloss",
        random_state=RANDOM_STATE,
    )
    model = CalibratedClassifierCV(base_model, method="isotonic", cv=3)
    model.fit(x_train, y_train)

    default_probability = model.predict_proba(x_test)[:, 1]
    predictions = (default_probability >= 0.5).astype(int)
    metrics = {
        "accuracy": round(float(accuracy_score(y_test, predictions)), 4),
        "auc_roc": round(float(roc_auc_score(y_test, default_probability)), 4),
        "train_rows": int(len(x_train)),
        "test_rows": int(len(x_test)),
    }

    shap_model = model.calibrated_classifiers_[0].estimator
    artifact = {
        "model": model,
        "shap_model": shap_model,
        "features": FEATURES,
        "metrics": metrics,
    }
    joblib.dump(artifact, MODEL_PATH)
    METRICS_PATH.write_text(json.dumps(metrics, indent=2), encoding="utf-8")
    return metrics


def _load_artifact() -> Dict[str, Any]:
    if not MODEL_PATH.exists():
        train_model()
    return joblib.load(MODEL_PATH)


def _validate_applicant(applicant_dict: Dict[str, Any]) -> pd.DataFrame:
    missing = sorted(set(FEATURES) - set(applicant_dict))
    if missing:
        raise ValueError(f"Applicant dict is missing fields: {missing}")

    row = {feature: applicant_dict[feature] for feature in FEATURES}
    return pd.DataFrame([row], columns=FEATURES).astype(float)


def _top_factors(shap_values: np.ndarray) -> List[Dict[str, Any]]:
    # SHAP explains default risk; invert signs so positive means helps approval.
    approval_contributions = -shap_values[0]
    ordered_indexes = np.argsort(np.abs(approval_contributions))[::-1][:3]
    factors = []

    for idx in ordered_indexes:
        feature = FEATURES[int(idx)]
        contribution = round(float(approval_contributions[int(idx)]), 4)
        direction = "helps" if contribution >= 0 else "hurts"
        metadata = FEATURE_METADATA[feature]
        factors.append(
            {
                "feature_name": metadata["name"],
                "contribution": contribution,
                "direction": direction,
                "actionable": bool(metadata["actionable"]),
                "timeline": metadata["timeline"],
                "plain_tamil": metadata["ta_help"] if direction == "helps" else metadata["ta_hurt"],
                "plain_english": metadata["en_help"] if direction == "helps" else metadata["en_hurt"],
            }
        )
    return factors


def predict(applicant_dict: Dict[str, Any]) -> Dict[str, Any]:
    artifact = _load_artifact()
    applicant = _validate_applicant(applicant_dict)

    default_probability = float(artifact["model"].predict_proba(applicant)[:, 1][0])
    decision = "reject" if default_probability >= 0.5 else "approve"
    confidence = default_probability if decision == "reject" else 1.0 - default_probability

    explainer = shap.TreeExplainer(artifact["shap_model"])
    shap_values = explainer.shap_values(applicant)
    if isinstance(shap_values, list):
        shap_values = shap_values[1]

    return {
        "decision": decision,
        "confidence": round(float(confidence), 4),
        "monthly_income_used": applicant_dict["monthly_income"],
        "top_factors": _top_factors(np.asarray(shap_values)),
    }


if __name__ == "__main__":
    print(json.dumps(train_model(), indent=2))
