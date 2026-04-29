import json
import sys

from credit_default_pipeline import predict, train_model


TAMIL_APPLICANT_PROFILES = [
    {
        "profile_name": "Chennai salaried applicant",
        "monthly_income": 85000,
        "num_active_loans": 1,
        "emi_to_income_ratio": 0.22,
        "credit_history_months": 96,
        "num_late_payments": 0,
        "employment_months": 72,
        "loan_amount": 650000,
        "age": 34,
        "geography": 2,
        "gender": 1,
    },
    {
        "profile_name": "Madurai small business applicant",
        "monthly_income": 42000,
        "num_active_loans": 3,
        "emi_to_income_ratio": 0.48,
        "credit_history_months": 30,
        "num_late_payments": 4,
        "employment_months": 44,
        "loan_amount": 900000,
        "age": 41,
        "geography": 1,
        "gender": 0,
    },
    {
        "profile_name": "Coimbatore new employee",
        "monthly_income": 52000,
        "num_active_loans": 0,
        "emi_to_income_ratio": 0.18,
        "credit_history_months": 8,
        "num_late_payments": 0,
        "employment_months": 10,
        "loan_amount": 350000,
        "age": 24,
        "geography": 1,
        "gender": 1,
    },
    {
        "profile_name": "Thanjavur rural borrower",
        "monthly_income": 28000,
        "num_active_loans": 2,
        "emi_to_income_ratio": 0.58,
        "credit_history_months": 18,
        "num_late_payments": 5,
        "employment_months": 26,
        "loan_amount": 500000,
        "age": 29,
        "geography": 0,
        "gender": 0,
    },
    {
        "profile_name": "Tiruchirappalli senior applicant",
        "monthly_income": 115000,
        "num_active_loans": 2,
        "emi_to_income_ratio": 0.31,
        "credit_history_months": 156,
        "num_late_payments": 1,
        "employment_months": 140,
        "loan_amount": 1400000,
        "age": 52,
        "geography": 1,
        "gender": 1,
    },
]


if __name__ == "__main__":
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")

    metrics = train_model()
    print("Training metrics:")
    print(json.dumps(metrics, indent=2))
    print()

    for profile in TAMIL_APPLICANT_PROFILES:
        applicant = {key: value for key, value in profile.items() if key != "profile_name"}
        print(f"Profile: {profile['profile_name']}")
        print(json.dumps(predict(applicant), ensure_ascii=False, indent=2))
        print()
