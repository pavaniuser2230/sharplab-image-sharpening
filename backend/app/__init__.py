import os
from flask import Flask
from flask_cors import CORS
from dotenv import load_dotenv

from .config import Config
from .routes.api import api_bp

load_dotenv()


def create_app() -> Flask:
    app = Flask(__name__)
    app.config.from_object(Config)

    CORS(
        app,
        resources={r"/api/*": {"origins": app.config["CORS_ORIGINS"]}},
        supports_credentials=True,
    )

    app.register_blueprint(api_bp)

    os.makedirs(app.config["UPLOAD_FOLDER"], exist_ok=True)
    return app
