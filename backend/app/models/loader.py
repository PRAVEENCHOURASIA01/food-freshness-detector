"""
Model Loader
============
Responsible for loading and caching ML models at application startup.
Models are loaded once and reused across requests for efficiency.

Weight paths are configured via environment variables.
If custom weights are not found, sensible fallbacks are used
(pretrained YOLOv8n for detection; rule-based heuristics for freshness).
"""
from __future__ import annotations

import logging
import os
from dataclasses import dataclass, field
from pathlib import Path
from typing import Optional

import torch

logger = logging.getLogger(__name__)


@dataclass
class ModelBundle:
    """Container holding all loaded model artefacts."""
    yolo: object  # ultralytics YOLO instance
    freshness_classifier: Optional[torch.nn.Module]
    device: torch.device
    food_labels: list[str] = field(default_factory=list)
    freshness_labels: list[str] = field(default_factory=lambda: ["fresh", "semi-fresh", "spoiled"])


_bundle: Optional[ModelBundle] = None  # module-level singleton


# ---------------------------------------------------------------------------
# Food categories the YOLO model is expected to detect.
# Replace / extend this list to match your custom dataset.
# ---------------------------------------------------------------------------
FOOD_LABELS: list[str] = [
    "apple", "banana", "orange", "strawberry", "grape",
    "mango", "pineapple", "watermelon", "lemon", "cherry",
    "carrot", "broccoli", "tomato", "cucumber", "lettuce",
    "potato", "onion", "pepper", "avocado", "corn",
    "bread", "cake", "sandwich", "pizza", "hotdog",
    "sushi", "steak", "chicken", "fish", "egg",
]


def _resolve_device(device_str: str) -> torch.device:
    """Resolve and validate compute device."""
    if device_str == "cuda" and not torch.cuda.is_available():
        logger.warning("CUDA requested but not available — falling back to CPU.")
        return torch.device("cpu")
    return torch.device(device_str)


def _load_yolo(weights_path: str, device: torch.device):
    """Load YOLOv8 model from weights file or download pretrained."""
    from ultralytics import YOLO

    path = Path(weights_path)
    if path.exists():
        logger.info("Loading YOLO weights from %s", path)
        model = YOLO(str(path))
    else:
        # Download pretrained COCO weights as a fallback.
        logger.warning(
            "YOLO weights not found at '%s'. "
            "Downloading pretrained yolov8n.pt from Ultralytics.",
            weights_path,
        )
        model = YOLO("yolov8n.pt")

    model.to(str(device))
    return model


def _load_freshness_classifier(weights_path: str, device: torch.device) -> Optional[torch.nn.Module]:
    """
    Load a custom PyTorch freshness classification head.

    The expected architecture is a simple CNN or transfer-learning head that
    outputs 3 logits: [fresh, semi-fresh, spoiled].

    If the weights file does not exist yet, None is returned and the inference
    pipeline falls back to heuristic classification.
    """
    path = Path(weights_path)
    if not path.exists():
        logger.warning(
            "Freshness classifier weights not found at '%s'. "
            "Using rule-based heuristics instead.",
            weights_path,
        )
        return None

    try:
        model = torch.load(str(path), map_location=device, weights_only=False)
        if isinstance(model, dict):
            # Checkpoint dict — import architecture and load state dict
            from app.models.freshness_net import FreshnessNet  # local architecture
            net = FreshnessNet()
            net.load_state_dict(model["state_dict"])
            net.to(device)
            net.eval()
            logger.info("Loaded freshness classifier state dict from %s", path)
            return net
        else:
            model.to(device)
            model.eval()
            logger.info("Loaded freshness classifier from %s", path)
            return model
    except Exception as exc:  # noqa: BLE001
        logger.error("Failed to load freshness classifier: %s", exc)
        return None


def load_models(yolo_path: str, freshness_path: str, device_str: str) -> ModelBundle:
    """
    Load all models and return a populated ModelBundle.
    Subsequent calls return the cached bundle without reloading.
    """
    global _bundle
    if _bundle is not None:
        return _bundle

    device = _resolve_device(device_str)
    logger.info("Loading models on device: %s", device)

    yolo = _load_yolo(yolo_path, device)
    freshness = _load_freshness_classifier(freshness_path, device)

    _bundle = ModelBundle(
        yolo=yolo,
        freshness_classifier=freshness,
        device=device,
        food_labels=FOOD_LABELS,
    )
    logger.info("All models loaded successfully.")
    return _bundle


def get_bundle() -> ModelBundle:
    """Return the cached ModelBundle. Raises if models haven't been loaded yet."""
    if _bundle is None:
        raise RuntimeError("Models have not been loaded. Call load_models() first.")
    return _bundle
