# ml-service/utils/data_fetcher.py
"""Fetches the environmental / geospatial signals used to score complaint priority.

Every fetch degrades gracefully: if an external API key is missing or the call
fails, a sensible Bhopal-typical default is returned so the model can still score
a complaint offline. This keeps the demo runnable without any API keys.
"""
import json
import math
import os
from datetime import datetime

import requests

DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data")


def _load_json(filename, default):
    path = os.path.join(DATA_DIR, filename)
    try:
        with open(path, "r", encoding="utf-8") as fh:
            return json.load(fh)
    except (OSError, ValueError):
        return default


def _haversine_m(lat1, lon1, lat2, lon2):
    """Great-circle distance between two points in metres."""
    r = 6371000.0
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlmb = math.radians(lon2 - lon1)
    a = math.sin(dphi / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dlmb / 2) ** 2
    return r * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


class GeoDataFetcher:
    def __init__(self):
        self.openweather_key = os.environ.get("OPENWEATHER_API_KEY")
        self.soil_zones = _load_json("bhopal_soil_map.json", {"zones": []})
        self.water_bodies = _load_json("water_bodies.geojson", {"features": []})

    # --- weather -----------------------------------------------------------
    def fetch_weather_data(self, lat, lon):
        if not self.openweather_key:
            return self._default_weather()
        try:
            url = (
                "https://api.openweathermap.org/data/2.5/weather"
                f"?lat={lat}&lon={lon}&appid={self.openweather_key}"
            )
            resp = requests.get(url, timeout=6).json()
            return {
                "temperature": resp["main"]["temp"] - 273.15,
                "humidity": resp["main"]["humidity"],
                "wind_speed": resp["wind"]["speed"] * 3.6,
                "rainfall": resp.get("rain", {}).get("1h", 0),
                "time_since_last_rain": self.calculate_time_since_rain(lat, lon),
            }
        except Exception:  # network/parse errors -> offline defaults
            return self._default_weather()

    @staticmethod
    def _default_weather():
        return {
            "temperature": 28.0,
            "humidity": 60,
            "wind_speed": 10.0,
            "rainfall": 0.0,
            "time_since_last_rain": 48,
        }

    def calculate_time_since_rain(self, lat, lon):
        # Without a history API we assume a dry spell; overridden by real data if present.
        return 48

    # --- terrain -----------------------------------------------------------
    def get_elevation(self, lat, lon):
        try:
            url = f"https://api.opentopodata.org/v1/aster30m?locations={lat},{lon}"
            resp = requests.get(url, timeout=6).json()
            elev = resp["results"][0]["elevation"]
            if elev is not None:
                return float(elev)
        except Exception:
            pass
        return 500.0  # Bhopal sits on a plateau ~500 m ASL.

    def get_soil_type(self, lat, lon):
        nearest, best = "alluvial", float("inf")
        for zone in self.soil_zones.get("zones", []):
            d = _haversine_m(lat, lon, zone["lat"], zone["lon"])
            if d < best:
                best, nearest = d, zone["soil_type"]
        return nearest

    def get_water_proximity(self, lat, lon):
        """Distance in metres to the nearest mapped water body (point features)."""
        best = 5000.0
        for feat in self.water_bodies.get("features", []):
            geom = feat.get("geometry", {})
            if geom.get("type") == "Point":
                wlon, wlat = geom["coordinates"]
                best = min(best, _haversine_m(lat, lon, wlat, wlon))
        return best

    def get_population_density(self, lat, lon):
        # Coarse proxy: denser near the city centre (Upper Lake area).
        d_km = _haversine_m(lat, lon, 23.2599, 77.4126) / 1000.0
        return max(1500, int(9000 - d_km * 600))

    def fetch_all(self, lat, lon):
        data = self.fetch_weather_data(lat, lon)
        data["soil_type"] = self.get_soil_type(lat, lon)
        data["elevation"] = self.get_elevation(lat, lon)
        data["proximity_to_water"] = self.get_water_proximity(lat, lon)
        data["population_density"] = self.get_population_density(lat, lon)
        return data
