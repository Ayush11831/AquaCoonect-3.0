# ml-service/priority_model.py
"""Priority scorer for water complaints.

Given a complaint location + issue type, enriches it with environmental data and
produces a 1-100 priority score. Uses a trained RandomForest when a model file is
present, and falls back to a transparent rule-based scorer otherwise — so the
service is useful before any model has been trained.
"""
import os

import numpy as np
import pandas as pd
import joblib
from sklearn.ensemble import RandomForestRegressor
from sklearn.preprocessing import LabelEncoder

from utils.data_fetcher import GeoDataFetcher
from utils.feature_engineer import FEATURE_COLUMNS, build_feature_frame

MODEL_DIR = os.environ.get("MODEL_PATH", os.path.join(os.path.dirname(__file__), "models"))

# Base severity weight per issue type (used by the rule-based fallback).
ISSUE_WEIGHTS = {
    "contamination": 0.90,
    "pipe_breakage": 0.75,
    "water_logging": 0.70,
    "water_leakage": 0.55,
    "low_pressure": 0.35,
}


class PriorityScorer:
    def __init__(self):
        self.model = None
        self.encoders = {}
        self.feature_columns = FEATURE_COLUMNS
        self.fetcher = GeoDataFetcher()

    # --- data assembly -----------------------------------------------------
    def fetch_geospatial_data(self, lat, lon):
        """Fetch weather, soil, elevation, water proximity and population density."""
        return self.fetcher.fetch_all(lat, lon)

    def prepare_features(self, features):
        return build_feature_frame(features, self.encoders)

    # --- scoring -----------------------------------------------------------
    def calculate_hazard_score(self, features):
        """Return an integer priority score in the range 1-100."""
        if self.model is None:
            self.load_model()

        if self.model is None:
            base_score = self._rule_based_score(features)
        else:
            frame = self.prepare_features(features)
            base_score = float(self.model.predict(frame)[0])

        adjusted = self.apply_bhopal_factors(base_score, features)
        return int(np.clip(adjusted * 100, 1, 100))

    def _rule_based_score(self, features):
        """Transparent 0-1 score when no trained model is available."""
        score = ISSUE_WEIGHTS.get(features.get("issue_type"), 0.5)

        # Recent/active rainfall raises water-logging and leakage risk.
        rainfall = features.get("rainfall", 0) or 0
        score += min(rainfall / 100.0, 0.15)

        # Low elevation pools water.
        if features.get("elevation", 500) < 480:
            score += 0.05

        return min(score, 1.0)

    def apply_bhopal_factors(self, score, features):
        """Apply Bhopal-specific risk multipliers."""
        adj = 1.0
        # Black cotton soil expands when wet -> higher water-logging risk.
        if features.get("soil_type") == "black_cotton":
            adj *= 1.3
        # Dense areas get higher priority.
        if features.get("population_density", 0) > 5000:
            adj *= 1.2
        # Near a lake / water body.
        if features.get("proximity_to_water", 1000) < 500:
            adj *= 1.15
        return min(score * adj, 1.0)

    def explain_risk_factors(self, features):
        """Human-readable reasons behind the score (surfaced to officers)."""
        reasons = []
        issue = features.get("issue_type")
        if issue in ("contamination", "pipe_breakage"):
            reasons.append(f"{issue.replace('_', ' ').title()} is a high-severity issue type.")
        if features.get("soil_type") == "black_cotton":
            reasons.append("Black cotton soil expands when wet, worsening water logging.")
        if features.get("population_density", 0) > 5000:
            reasons.append("High population density in the affected area.")
        if features.get("proximity_to_water", 1000) < 500:
            reasons.append("Close to a water body, raising contamination/flooding risk.")
        if (features.get("rainfall", 0) or 0) > 20:
            reasons.append("Active rainfall is amplifying the hazard.")
        if not reasons:
            reasons.append("No elevated environmental risk factors detected.")
        return reasons

    # --- training / persistence -------------------------------------------
    def train_model(self, training_data):
        df = pd.read_csv(training_data)
        for col in ("issue_type", "soil_type"):
            if col in df.columns:
                self.encoders[col] = LabelEncoder()
                df[col] = self.encoders[col].fit_transform(df[col].astype(str))

        x = df[self.feature_columns]
        y = df["priority_label"]

        self.model = RandomForestRegressor(n_estimators=100, random_state=42)
        self.model.fit(x, y)

        os.makedirs(MODEL_DIR, exist_ok=True)
        joblib.dump(self.model, os.path.join(MODEL_DIR, "priority_model.pkl"))
        joblib.dump(self.encoders, os.path.join(MODEL_DIR, "encoders.pkl"))
        return self.model

    def load_model(self):
        """Load a trained model if present; otherwise stay in rule-based mode."""
        try:
            self.model = joblib.load(os.path.join(MODEL_DIR, "priority_model.pkl"))
            self.encoders = joblib.load(os.path.join(MODEL_DIR, "encoders.pkl"))
        except (OSError, ValueError):
            self.model = None  # rule-based fallback
