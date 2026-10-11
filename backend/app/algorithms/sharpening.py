import cv2
import numpy as np
from PIL import Image


def to_uint8(array: np.ndarray) -> np.ndarray:
    array = np.clip(array, 0, 255)
    return np.uint8(array)


def _as_float_image(image: Image.Image) -> np.ndarray:
    if image.mode in {"RGBA", "RGB", "RGBA"}:
        return np.asarray(image.convert("RGB"), dtype=np.float32)
    return np.asarray(image.convert("L"), dtype=np.float32)


def _apply_channelwise(image: Image.Image, operation):
    img_arr = np.asarray(image.convert("RGB"), dtype=np.float32)
    result = np.zeros_like(img_arr, dtype=np.float32)
    for channel in range(3):
        result[:, :, channel] = operation(img_arr[:, :, channel])
    return Image.fromarray(to_uint8(result), mode="RGB")


def apply_unsharp_mask(image: Image.Image, kernel_size: int = 5, sigma: float = 1.0, amount: float = 1.5):
    if kernel_size % 2 == 0 or kernel_size < 3:
        raise ValueError("Kernel size must be an odd integer greater than or equal to 3.")

    img_arr = _as_float_image(image)
    if img_arr.ndim == 2:
        blur = cv2.GaussianBlur(img_arr, (kernel_size, kernel_size), sigmaX=sigma, sigmaY=sigma)
        mask = img_arr - blur
        sharpened = img_arr + amount * mask
        return Image.fromarray(to_uint8(sharpened), mode="L")

    result = np.zeros_like(img_arr, dtype=np.float32)
    for channel in range(3):
        blurred = cv2.GaussianBlur(img_arr[:, :, channel], (kernel_size, kernel_size), sigmaX=sigma, sigmaY=sigma)
        detail = img_arr[:, :, channel] - blurred
        result[:, :, channel] = img_arr[:, :, channel] + amount * detail
    return Image.fromarray(to_uint8(result), mode="RGB")


def apply_laplacian_filter(image: Image.Image, kernel_type: str = "4-neighbor", alpha: float = 1.0, sigma: float = 0.0):
    if kernel_type == "8-neighbor":
        kernel = np.array([
            [1, 1, 1],
            [1, -8, 1],
            [1, 1, 1],
        ], dtype=np.float32)
    else:
        kernel = np.array([
            [0, -1, 0],
            [-1, 4, -1],
            [0, -1, 0],
        ], dtype=np.float32)

    img_arr = _as_float_image(image)
    if img_arr.ndim == 2:
        filtered = img_arr.copy()
        if sigma > 0:
            filtered = cv2.GaussianBlur(filtered, (0, 0), sigmaX=sigma, sigmaY=sigma)
        laplacian = cv2.filter2D(filtered, -1, kernel)
        sharpened = filtered + alpha * laplacian
        return Image.fromarray(to_uint8(sharpened), mode="L"), laplacian

    result = np.zeros_like(img_arr, dtype=np.float32)
    laplacian = np.zeros_like(img_arr, dtype=np.float32)
    for channel in range(3):
        channel_img = img_arr[:, :, channel]
        if sigma > 0:
            channel_img = cv2.GaussianBlur(channel_img, (0, 0), sigmaX=sigma, sigmaY=sigma)
        lap = cv2.filter2D(channel_img, -1, kernel)
        laplacian[:, :, channel] = lap
        result[:, :, channel] = channel_img + alpha * lap
    return Image.fromarray(to_uint8(result), mode="RGB"), laplacian


def apply_high_boost_filter(image: Image.Image, kernel_size: int = 5, sigma: float = 1.0, boost: float = 1.5):
    if kernel_size % 2 == 0 or kernel_size < 3:
        raise ValueError("Kernel size must be an odd integer greater than or equal to 3.")

    img_arr = _as_float_image(image)
    if img_arr.ndim == 2:
        blur = cv2.GaussianBlur(img_arr, (kernel_size, kernel_size), sigmaX=sigma, sigmaY=sigma)
        mask = img_arr - blur
        high_boost = img_arr + (boost - 1.0) * mask
        return Image.fromarray(to_uint8(high_boost), mode="L")

    result = np.zeros_like(img_arr, dtype=np.float32)
    for channel in range(3):
        blurred = cv2.GaussianBlur(img_arr[:, :, channel], (kernel_size, kernel_size), sigmaX=sigma, sigmaY=sigma)
        mask = img_arr[:, :, channel] - blurred
        result[:, :, channel] = img_arr[:, :, channel] + (boost - 1.0) * mask
    return Image.fromarray(to_uint8(result), mode="RGB")
