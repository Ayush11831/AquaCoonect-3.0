# ml-service/utils/feature_engineer.py
"""Turns a raw feature dict into the ordered numeric frame the model expects."""
import pandas as pd

FEATURE_COLUMNS = [
    "issue_type",
    "soil_type",
    "rainfall",
    "wind_speed",
    "temperature",
    "humidity",
    "elevation",
    "proximity_to_water",
    "population_density",
    "time_since_last_rain",
]

CATEGORICAL = ["issue_type", "soil_type"]


def encode_categoricals(features, encoders):
    """Apply fitted LabelEncoders; unseen labels fall back to 0."""
    encoded = dict(features)
    for col in CATEGORICAL:
        if col in encoded and col in encoders:
            try:
                encoded[col] = int(encoders[col].transform([str(encoded[col])])[0])
            except ValueError:
                encoded[col] = 0
    return encoded


def build_feature_frame(features, encoders):
    encoded = encode_categoricals(features, encoders)
    row = [encoded.get(col, 0) for col in FEATURE_COLUMNS]
    return pd.DataFrame([row], columns=FEATURE_COLUMNS)
