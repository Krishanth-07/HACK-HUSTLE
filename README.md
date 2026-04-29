# Credit Default Prediction Pipeline

Train and run:

```bash
python credit_default_pipeline.py
python test_predict.py
```

The pipeline uses a 1000-row synthetic dataset when `credit_default_data.csv` is not present. A custom CSV must include the requested feature columns plus a `default` target column where `1` means default and `0` means no default.

Outputs:

- `model.pkl`: calibrated XGBoost model artifact
- `training_metrics.json`: accuracy and AUC-ROC
- `credit_default_data.csv`: generated fallback dataset
