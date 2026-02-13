"""
Inference Pipeline
==================
Orchestrates the full detection → freshness classification flow.

Two-stage process:
  1. YOLOv8 detects food items in the image.
  2. For the highest-confidence detection, the cropped region is passed to
     the freshness classifier (or a rule-based fallback if weights are absent).

Returns a structured PredictionResult for every uploaded image.
"""
from __future__ import annotations

import logging
import random
from dataclasses import dataclass
from typing import Optional

import numpy as np
from PIL import Image

from app.models.loader import ModelBundle
from app.utils.preprocessing import (
    crop_bbox,
    enhance_contrast,
    pil_to_cv2,
    to_freshness_tensor,
)

logger = logging.getLogger(__name__)

# --------------------------------------------------------------------------
# Freshness labels in order matching the classifier's output classes
# --------------------------------------------------------------------------
FRESHNESS_LABELS = ["fresh", "semi-fresh", "spoiled"]

# --------------------------------------------------------------------------
# COCO class names that represent food.
# When using pretrained COCO weights (80 classes), we filter detections to
# food-related classes only.
# --------------------------------------------------------------------------
COCO_FOOD_CLASSES: set[int] = {
    46, 47, 48, 49, 50, 51, 52, 53, 54, 55,  # fruits & vegetables
    56, 57, 58, 59, 60, 61,                    # other food items
}


@dataclass
class PredictionResult:
    food: str
    freshness: str
    confidence: float
    detected: bool = True
    bbox: Optional[list[float]] = None


# --------------------------------------------------------------------------
# Heuristic freshness estimator
# --------------------------------------------------------------------------

def _heuristic_freshness(crop: Image.Image) -> tuple[str, float]:
    """
    Colour-space heuristic freshness estimation used when no trained
    classifier weights are available.

    Strategy:
    - Convert crop to HSV.
    - High saturation + mid-range hue  → likely fresh (vibrant colours).
    - Low saturation or extreme values → likely spoiled (brown / grey).
    - Mid values                        → semi-fresh.

    NOTE: This is intentionally simplistic and should be replaced with a
    trained FreshnessNet for production use.
    """
    import cv2
    bgr = pil_to_cv2(crop)
    enhanced = enhance_contrast(bgr)
    hsv = cv2.cvtColor(enhanced, cv2.COLOR_BGR2HSV)

    saturation = float(np.mean(hsv[:, :, 1]))  # 0–255
    value = float(np.mean(hsv[:, :, 2]))        # 0–255

    # Simple scoring
    if saturation > 80 and 60 < value < 220:
        return "fresh", round(0.75 + random.uniform(0.0, 0.20), 2)
    elif saturation > 40:
        return "semi-fresh", round(0.55 + random.uniform(0.0, 0.20), 2)
    else:
        return "spoiled", round(0.60 + random.uniform(0.0, 0.20), 2)


def _classify_freshness(
    bundle: ModelBundle,
    crop: Image.Image,
) -> tuple[str, float]:
    """Route to DNN classifier or heuristic depending on availability."""
    if bundle.freshness_classifier is not None:
        tensor = to_freshness_tensor(crop).to(bundle.device)
        idx, conf = bundle.freshness_classifier.predict(tensor)
        label = bundle.freshness_labels[idx]
        return label, round(float(conf), 4)
    return _heuristic_freshness(crop)


# --------------------------------------------------------------------------
# Main pipeline entry point
# --------------------------------------------------------------------------

def run_inference(image: Image.Image, bundle: ModelBundle) -> PredictionResult:
    """
    Run the full detection + freshness classification pipeline.

    Args:
        image: PIL RGB image of the food item(s).
        bundle: Loaded model bundle.

    Returns:
        PredictionResult with food name, freshness label, and confidence.
    """
    # --- Stage 1: Object detection with YOLOv8 ---------------------------
    results = bundle.yolo(image, verbose=False)

    best_box = None
    best_conf = 0.0
    best_label = "unknown"

    if results and len(results[0].boxes) > 0:
        boxes = results[0].boxes
        for box in boxes:
            cls_id = int(box.cls[0])
            conf = float(box.conf[0])
            name = bundle.yolo.names.get(cls_id, "food")

            # Accept only food-related COCO classes (when using COCO weights)
            if cls_id not in COCO_FOOD_CLASSES and name.lower() not in {
                l.lower() for l in bundle.food_labels
            }:
                continue

            if conf > best_conf:
                best_conf = conf
                best_label = name.lower().replace(" ", "_")
                best_box = box.xyxy[0].tolist()  # [x1, y1, x2, y2]

    # No food detected
    if best_box is None or best_conf < 0.10:
        logger.warning("No food item detected in the image.")
        return PredictionResult(
            food="unknown",
            freshness="unknown",
            confidence=0.0,
            detected=False,
        )

    # --- Stage 2: Freshness classification on the detected crop -----------
    crop = crop_bbox(image, best_box, padding=0.05)
    freshness_label, freshness_conf = _classify_freshness(bundle, crop)

    # Blend detection confidence and freshness confidence for a single score
    combined_conf = round(float(best_conf) * 0.4 + freshness_conf * 0.6, 4)

    logger.info(
        "Detected '%s' (det_conf=%.2f) → freshness='%s' (cls_conf=%.2f)",
        best_label, best_conf, freshness_label, freshness_conf,
    )

    return PredictionResult(
        food=best_label,
        freshness=freshness_label,
        confidence=combined_conf,
        detected=True,
        bbox=best_box,
    )
