import pandas as pd
import numpy as np
import statsmodels.api as sm
from sklearn.metrics import r2_score, mean_absolute_error
import json

# ── Load data ──────────────────────────────────────────────────────────────
train = pd.read_csv("crosssectional_train.csv")
test = pd.read_csv("crosssectional_test.csv")

# ── Define features and target ─────────────────────────────────────────────
TARGET = "crime_rate_per_1000pop"

# Intervention variables (what the simulator will manipulate)
INTERVENTION_FEATURES = [
    "active_vacancy_count",  # vacancy remediation lever
    "transit_stop_count",  # transit investment lever
    "csb_vacant_bldg_complaints",  # disorder / 311 response lever
]

# Controls (held constant in simulator, but needed for unbiased coefficients)
CONTROL_FEATURES = [
    "avg_condition_rating",  # blight severity
    "census_vacancy_rate",  # structural vacancy (Census)
    "complaints_per_1000pop",  # neighborhood disorder intensity
    "pct_black",  # demographic controls — required to avoid
    "pct_hispanic",  # omitted variable bias in crime regression
    "population",
]

ALL_FEATURES = INTERVENTION_FEATURES + CONTROL_FEATURES

# ── Fit OLS with statsmodels (gives p-values + confidence intervals) ────────
X_train = sm.add_constant(train[ALL_FEATURES])
X_test = sm.add_constant(test[ALL_FEATURES])
y_train = train[TARGET]
y_test = test[TARGET]

model = sm.OLS(y_train, X_train).fit()
print(model.summary())
