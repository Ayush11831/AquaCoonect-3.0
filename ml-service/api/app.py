# ml-service/api/app.py
from flask import Flask, request, jsonify
from flask_cors import CORS
from priority_model import PriorityScorer
import logging

app = Flask(__name__)
CORS(app)
scorer = PriorityScorer()

@app.route('/health', methods=['GET'])
def health():
    return jsonify({"status": "healthy"})

@app.route('/predict/priority', methods=['POST'])
def predict_priority():
    try:
        data = request.json
        required_fields = ['latitude', 'longitude', 'issue_type']
        
        if not all(field in data for field in required_fields):
            return jsonify({"error": "Missing required fields"}), 400
        
        # Fetch geospatial data
        geo_data = scorer.fetch_geospatial_data(
            data['latitude'], 
            data['longitude']
        )
        
        # Combine with complaint data
        features = {
            **data,
            **geo_data
        }
        
        # Calculate priority score
        priority_score = scorer.calculate_hazard_score(features)
        
        # Get risk factors explanation
        explanation = scorer.explain_risk_factors(features)
        
        return jsonify({
            "priority_score": priority_score,
            "risk_level": get_risk_level(priority_score),
            "explanation": explanation,
            "factors_considered": list(features.keys())
        })
        
    except Exception as e:
        logging.error(f"Error in prediction: {str(e)}")
        return jsonify({"error": str(e)}), 500

def get_risk_level(score):
    if score >= 80:
        return "CRITICAL"
    elif score >= 60:
        return "HIGH"
    elif score >= 40:
        return "MEDIUM"
    elif score >= 20:
        return "LOW"
    else:
        return "MINOR"