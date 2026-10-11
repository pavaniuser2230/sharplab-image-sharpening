from pathlib import Path

from PIL import Image

from app import create_app


def test_process_upload_success():
    app = create_app()
    client = app.test_client()

    image = Image.new("RGB", (32, 32), color=(50, 100, 150))
    image_bytes = Path(__file__).resolve().parent / "sample_upload.png"
    image.save(image_bytes)

    with open(image_bytes, "rb") as sample:
        response = client.post(
            "/api/process",
            data={
                "file": (sample, "sample_upload.png"),
                "algorithm": "unsharp",
                "kernel_size": "5",
                "sigma": "1.0",
                "amount": "1.5",
            },
            content_type="multipart/form-data",
        )

    assert response.status_code == 200
    payload = response.get_json()
    assert payload["algorithm"] == "unsharp"
    assert payload["dimensions"] == [32, 32]
    assert 0 <= payload["processing_time_ms"] < 60_000

    image_bytes.unlink(missing_ok=True)
