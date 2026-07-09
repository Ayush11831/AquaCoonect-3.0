# ml-service/api/app.py
import os
import sys

# Ensure the ml-service root is importable when run as `python api/app.py`.
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from flask import Flask
from flask_cors import CORS

from api.routes import bp


def create_app():
    app = Flask(__name__)
    CORS(app)
    app.register_blueprint(bp)
    return app


app = create_app()

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", 5000)))
