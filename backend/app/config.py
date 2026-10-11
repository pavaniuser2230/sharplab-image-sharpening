import os


class Config:
    SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret-key")
    CORS_ORIGINS = os.getenv("CORS_ORIGINS", "http://localhost:5173")
    UPLOAD_FOLDER = os.getenv("UPLOAD_FOLDER", "temp/uploads")
    MAX_CONTENT_LENGTH = int(os.getenv("MAX_CONTENT_LENGTH", "16777216"))
    ALLOWED_EXTENSIONS = {"png", "jpg", "jpeg", "webp"}
    MAX_DIMENSION = 4000
