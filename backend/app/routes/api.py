import os
import time

from flask import Blueprint, jsonify, request, send_file
from PIL import Image

from ..algorithms.sharpening import apply_high_boost_filter, apply_laplacian_filter, apply_unsharp_mask
from ..utils.validation import safe_temp_path, validate_image_file

api_bp = Blueprint("api", __name__, url_prefix="/api")


def _parse_float(value, default):
    try:
        return float(value)
    except (TypeError, ValueError):
        return default


@api_bp.get("/health")
def health_check():
    return jsonify({"status": "ok", "message": "SharpLab backend is running."})


@api_bp.post("/process")
def process_image():
    if "file" not in request.files:
        return jsonify({"error": "No file part in the request."}), 400

    file = request.files["file"]
    valid, error = validate_image_file(file)
    if not valid:
        return jsonify({"error": error}), 400

    algorithm = request.form.get("algorithm", "unsharp")
    if algorithm not in {"unsharp", "laplacian", "highboost"}:
        return jsonify({"error": "Unsupported algorithm selection."}), 400

    try:
        kernel_size = int(request.form.get("kernel_size", 5))
        if kernel_size < 3 or kernel_size % 2 == 0:
            raise ValueError
    except ValueError:
        return jsonify({"error": "Kernel size must be an odd integer greater than or equal to 3."}), 400

    sigma = _parse_float(request.form.get("sigma", 1.0), 1.0)
    amount = _parse_float(request.form.get("amount", 1.5), 1.5)
    alpha = _parse_float(request.form.get("alpha", 1.0), 1.0)
    boost = _parse_float(request.form.get("boost", 1.5), 1.5)

    try:
        input_image = Image.open(file)
        processing_started = time.perf_counter()
        if algorithm == "laplacian":
            processed, _ = apply_laplacian_filter(
                input_image,
                kernel_type=request.form.get("kernel_type", "4-neighbor"),
                alpha=alpha,
                sigma=sigma,
            )
        elif algorithm == "highboost":
            processed = apply_high_boost_filter(input_image, kernel_size=kernel_size, sigma=sigma, boost=boost)
        else:
            processed = apply_unsharp_mask(input_image, kernel_size=kernel_size, sigma=sigma, amount=amount)
    except ValueError as exc:
        return jsonify({"error": str(exc)}), 400
    except Exception as exc:  # pragma: no cover - defensive guard
        return jsonify({"error": f"Image processing failed: {exc}"}), 500
    processing_time_ms = round((time.perf_counter() - processing_started) * 1000, 2)

    temp_dir = os.path.join(os.getcwd(), "temp")
    safe_path = safe_temp_path(temp_dir)
    target_path = safe_path + ".png"
    processed.save(target_path)

    return jsonify({
        "message": "Processing completed.",
        "algorithm": algorithm,
        "dimensions": list(processed.size),
        "output_file": target_path,
        "processing_time_ms": processing_time_ms,
    })


@api_bp.get("/download")
def download_result():
    file_path = request.args.get("path")
    if not file_path:
        return jsonify({"error": "Missing result file path."}), 400

    if not os.path.exists(file_path):
        return jsonify({"error": "Result file not found."}), 404

    return send_file(file_path, as_attachment=True, download_name=os.path.basename(file_path))


@api_bp.get("/metadata")
def metadata():
    return jsonify({
        "supported_formats": ["PNG", "JPG", "JPEG", "WEBP"],
        "max_dimension": 4000,
        "algorithms": ["unsharp", "laplacian", "highboost"],
    })
