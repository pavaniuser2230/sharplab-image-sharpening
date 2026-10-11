import os
from PIL import Image, UnidentifiedImageError


def allowed_file(filename: str) -> bool:
    return "." in filename and filename.rsplit(".", 1)[1].lower() in {"png", "jpg", "jpeg", "webp"}


def validate_image_file(file_storage) -> tuple[bool, str | None]:
    if file_storage is None:
        return False, "No file uploaded."

    filename = file_storage.filename or ""
    if not allowed_file(filename):
        return False, "Unsupported file type. Please upload a PNG, JPG, JPEG, or WEBP image."

    try:
        with Image.open(file_storage) as img:
            img.verify()
    except (UnidentifiedImageError, OSError):
        return False, "Uploaded file could not be read as an image."

    file_storage.seek(0)
    return True, None


def safe_temp_path(directory: str, prefix: str = "sharp_lab") -> str:
    os.makedirs(directory, exist_ok=True)
    return os.path.join(directory, f"{prefix}_{os.urandom(8).hex()}")
