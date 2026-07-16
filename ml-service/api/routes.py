# ml-service/api/routes.py
import logging

from flask import Blueprint, jsonify, request

from priority_model import PriorityScorer

bp = Blueprint("priority", __name__)
scorer = PriorityScorer()


def get_risk_level(score):
    if score >= 80:
        return "CRITICAL"
    if score >= 60:
        return "HIGH"
    if score >= 40:
        return "MEDIUM"
    if score >= 20:
        return "LOW"
    return "MINOR"


@bp.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "healthy", "service": "aquaconnect-ml"})


@bp.route("/predict/priority", methods=["POST"])
def predict_priority():
    try:
        data = request.get_json(force=True) or {}
        required = ["latitude", "longitude", "issue_type"]
        if not all(field in data for field in required):
            return jsonify({"error": "Missing required fields", "required": required}), 400

        geo_data = scorer.fetch_geospatial_data(data["latitude"], data["longitude"])
        features = {**data, **geo_data}

        priority_score = scorer.calculate_hazard_score(features)
        explanation = scorer.explain_risk_factors(features)

        return jsonify(
            {
                "priority_score": priority_score,
                "risk_level": get_risk_level(priority_score),
                "explanation": explanation,
                "factors_considered": list(features.keys()),
            }
        )
    except Exception as exc:  # noqa: BLE001 - surface a clean 500 to the caller
        logging.exception("Error in prediction")
        return jsonify({"error": str(exc)}), 500
