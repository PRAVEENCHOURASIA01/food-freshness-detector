"""
Preprocessing Utilities
=======================
Shared image pre-processing helpers used by the inference pipeline.
All functions are stateless and operate on PIL Images or NumPy arrays.
"""
from __future__ import annotations

import io
import logging

import cv2
import numpy as np
from PIL import Image
import torch
from torchvision import transforms

logger = logging.getLogger(__name__)

# ---- Standard ImageNet normalization (used by torchvision models) ----
_IMAGENET_MEAN = (0.485, 0.456, 0.406)
_IMAGENET_STD = (0.229, 0.224, 0.225)

# Transform applied before feeding crops into the freshness classifier
FRESHNESS_TRANSFORM = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize(mean=_IMAGENET_MEAN, std=_IMAGENET_STD),
])


def bytes_to_pil(image_bytes: bytes) -> Image.Image:
    """
    Decode raw image bytes (JPEG, PNG, WebP …) into a PIL RGB image.

    Args:
        image_bytes: Raw bytes from the uploaded file.

    Returns:
        PIL Image in RGB mode.

    Raises:
        ValueError: If the bytes cannot be decoded as an image.
    """
    try:
        img = Image.open(io.BytesIO(image_bytes))
        return img.convert("RGB")
    except Exception as exc:
        raise ValueError(f"Cannot decode image: {exc}") from exc


def pil_to_cv2(pil_image: Image.Image) -> np.ndarray:
    """Convert a PIL RGB image to a BGR NumPy array (OpenCV convention)."""
    return cv2.cvtColor(np.array(pil_image), cv2.COLOR_RGB2BGR)


def cv2_to_pil(bgr_array: np.ndarray) -> Image.Image:
    """Convert a BGR NumPy array back to a PIL RGB image."""
    return Image.fromarray(cv2.cvtColor(bgr_array, cv2.COLOR_BGR2RGB))


def crop_bbox(pil_image: Image.Image, box: list[float], padding: float = 0.05) -> Image.Image:
    """
    Crop a region from *pil_image* with optional padding.

    Args:
        pil_image: Source image.
        box: Bounding box [x1, y1, x2, y2] in pixel coordinates.
        padding: Fractional padding added around the box (default 5 %).

    Returns:
        Cropped PIL image.
    """
    w, h = pil_image.size
    x1, y1, x2, y2 = box
    pad_x = (x2 - x1) * padding
    pad_y = (y2 - y1) * padding
    x1 = max(0, x1 - pad_x)
    y1 = max(0, y1 - pad_y)
    x2 = min(w, x2 + pad_x)
    y2 = min(h, y2 + pad_y)
    return pil_image.crop((x1, y1, x2, y2))


def to_freshness_tensor(pil_image: Image.Image) -> torch.Tensor:
    """
    Apply the standard freshness classifier transform and add batch dimension.

    Args:
        pil_image: PIL RGB image of any size.

    Returns:
        Tensor of shape [1, 3, 224, 224].
    """
    return FRESHNESS_TRANSFORM(pil_image).unsqueeze(0)


def enhance_contrast(bgr_array: np.ndarray) -> np.ndarray:
    """
    Apply CLAHE (Contrast Limited Adaptive Histogram Equalisation) to improve
    visibility of colour-based freshness cues in uneven lighting.

    Args:
        bgr_array: BGR uint8 image.

    Returns:
        Contrast-enhanced BGR uint8 image.
    """
    lab = cv2.cvtColor(bgr_array, cv2.COLOR_BGR2LAB)
    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
    lab[:, :, 0] = clahe.apply(lab[:, :, 0])
    return cv2.cvtColor(lab, cv2.COLOR_LAB2BGR)
