# ml-service/priority_model.py
import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestRegressor
from sklearn.preprocessing import LabelEncoder
import joblib
import requests
from datetime import datetime

class PriorityScorer:
    def __init__(self):
        self.model = None
        self.encoders = {}
        self.feature_columns = [
            'issue_type', 'soil_type', 'rainfall', 'wind_speed',
            'temperature', 'humidity', 'elevation', 'proximity_to_water',
            'population_density', 'time_since_last_rain'
        ]
        
    def fetch_geospatial_data(self, lat, lon):
        """Fetch environmental data from various APIs"""
        data = {}
        
        # Fetch weather data (OpenWeatherMap)
        weather_data = self.fetch_weather_data(lat, lon)
        data.update(weather_data)
        
        # Fetch soil data (FAO Soil Database or local Bhopal data)
        data['soil_type'] = self.get_soil_type(lat, lon)
        
        # Fetch elevation data (OpenTopoData)
        data['elevation'] = self.get_elevation(lat, lon)
        
        # Calculate proximity to water bodies
        data['proximity_to_water'] = self.get_water_proximity(lat, lon)
        
        # Get population density (WorldPop or Census data)
        data['population_density'] = self.get_population_density(lat, lon)
        
        return data
    
    def fetch_weather_data(self, lat, lon):
        """Fetch current weather and forecast"""
        # Using OpenWeatherMap API
        api_key = "YOUR_OPENWEATHER_API_KEY"
        url = f"https://api.openweathermap.org/data/2.5/weather?lat={lat}&lon={lon}&appid={api_key}"
        
        response = requests.get(url).json()
        
        return {
            'temperature': response['main']['temp'] - 273.15,  # Convert to Celsius
            'humidity': response['main']['humidity'],
            'wind_speed': response['wind']['speed'] * 3.6,  # Convert to km/h
            'rainfall': response.get('rain', {}).get('1h', 0),
            'time_since_last_rain': self.calculate_time_since_rain(lat, lon)
        }
    
    def get_soil_type(self, lat, lon):
        """Get soil type for location (using Bhopal-specific data)"""
        # This would use Bhopal's soil map data
        # For Bhopal, common soil types: Black cotton soil, Alluvial, Red soil
        soil_types = {
            'coordinates': {
                (23.2599, 77.4126): 'black_cotton',  # Example coordinates
                (23.2000, 77.3000): 'alluvial',
                # Add more coordinates for Bhopal
            }
        }
        
        # Find nearest soil type
        return self.find_nearest_soil_type(lat, lon)
    
    def calculate_hazard_score(self, features):
        """Calculate priority score 1-100"""
        if self.model is None:
            self.load_model()
        
        # Prepare features
        features_df = self.prepare_features(features)
        
        # Get base prediction
        base_score = self.model.predict(features_df)[0]
        
        # Apply Bhopal-specific adjustments
        adjusted_score = self.apply_bhopal_factors(base_score, features)
        
        # Normalize to 1-100
        final_score = np.clip(adjusted_score * 100, 1, 100)
        
        return int(final_score)
    
    def prepare_features(self, features):
        """Prepare features for model prediction"""
        # Encode categorical features
        for col in ['issue_type', 'soil_type']:
            if col in features and col in self.encoders:
                features[col] = self.encoders[col].transform([features[col]])[0]
        
        # Create feature vector in correct order
        feature_vector = []
        for col in self.feature_columns:
            feature_vector.append(features.get(col, 0))
        
        return pd.DataFrame([feature_vector], columns=self.feature_columns)
    
    def apply_bhopal_factors(self, score, features):
        """Apply Bhopal-specific risk factors"""
        # Bhopal-specific adjustments
        adjustments = 1.0
        
        # Black cotton soil expands when wet - higher risk for water logging
        if features.get('soil_type') == 'black_cotton':
            adjustments *= 1.3
        
        # High population areas - higher priority
        if features.get('population_density', 0) > 5000:  # persons per sq km
            adjustments *= 1.2
        
        # Areas near Upper Lake or other water bodies
        if features.get('proximity_to_water', 1000) < 500:  # meters
            adjustments *= 1.15
        
        return score * adjustments
    
    def train_model(self, training_data):
        """Train or retrain the model"""
        # Load and prepare training data
        df = pd.read_csv(training_data)
        
        # Encode categorical variables
        for col in ['issue_type', 'soil_type']:
            if col in df.columns:
                self.encoders[col] = LabelEncoder()
                df[col] = self.encoders[col].fit_transform(df[col])
        
        # Split features and target
        X = df[self.feature_columns]
        y = df['priority_label']  # 0-1 normalized priority
        
        # Train model
        self.model = RandomForestRegressor(n_estimators=100, random_state=42)
        self.model.fit(X, y)
        
        # Save model
        joblib.dump(self.model, 'models/priority_model.pkl')
        joblib.dump(self.encoders, 'models/encoders.pkl')
        
    def load_model(self):
        """Load pre-trained model"""
        try:
            self.model = joblib.load('models/priority_model.pkl')
            self.encoders = joblib.load('models/encoders.pkl')
        except:
            # If no model exists, create a simple rule-based one
            self.create_rule_based_model()