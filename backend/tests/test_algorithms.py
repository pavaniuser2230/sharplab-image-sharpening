import numpy as np
from PIL import Image

from app.algorithms.sharpening import apply_high_boost_filter, apply_laplacian_filter, apply_unsharp_mask


def build_sample_image(size=(32, 32), center_value=180):
    image = np.zeros(size, dtype=np.uint8)
    image[10:22, 10:22] = center_value
    return Image.fromarray(image)


def test_unsharp_mask_returns_image():
    img = build_sample_image()
    result = apply_unsharp_mask(img, kernel_size=5, sigma=1.0, amount=1.5)
    assert isinstance(result, Image.Image)
    assert result.size == img.size


def test_laplacian_filter_returns_sharpened_image_and_response():
    img = build_sample_image()
    result, response = apply_laplacian_filter(img, kernel_type="4-neighbor", alpha=1.0, sigma=0.0)
    assert isinstance(result, Image.Image)
    assert result.size == img.size
    assert response.shape == (32, 32)


def test_high_boost_filter_returns_image():
    img = build_sample_image()
    result = apply_high_boost_filter(img, kernel_size=5, sigma=1.0, boost=1.8)
    assert isinstance(result, Image.Image)
    assert result.size == img.size
