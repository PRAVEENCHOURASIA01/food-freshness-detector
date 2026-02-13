"""
Predict Router
==============
Exposes the POST /predict endpoint.

Request:  multipart/form-data with a single "file" field (image).
Response: JSON payload with food label, freshness, and confidence.
"""
from __future__ import annotations

import logging
import time

from fastapi import APIRouter, File, HTTPException, UploadFile, status
from pydantic import BaseModel, Field

from app.inference.pipeline import run_inference
from app.models.loader import get_bundle
from app.utils.preprocessing import bytes_to_pil

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/predict", tags=["Inference"])

# --------------------------------------------------------------------------
# Request / Response schemas
# --------------------------------------------------------------------------

SUPPORTED_CONTENT_TYPES = {"image/jpeg", "image/png", "image/webp", "image/bmp"}
MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024  # 10 MB


class PredictionResponse(BaseModel):
    food: str = Field(..., examples=["banana"], description="Detected food item")
    freshness: str = Field(..., examples=["fresh"], description="Freshness classification")
    confidence: float = Field(..., ge=0.0, le=1.0, examples=[0.94], description="Combined confidence score")
    detected: bool = Field(True, description="Whether a food item was successfully detected")
    inference_time_ms: float = Field(..., description="Server-side inference latency in milliseconds")


# --------------------------------------------------------------------------
# Endpoint
# --------------------------------------------------------------------------

@router.post(
    "",
    response_model=PredictionResponse,
    summary="Detect food item and classify its freshness",
    responses={
        400: {"description": "Invalid or unsupported image"},
        422: {"description": "File too large"},
        500: {"description": "Inference error"},
    },
)
async def predict(
    file: UploadFile = File(..., description="Food image (JPEG / PNG / WebP)"),
) -> PredictionResponse:
    """
    Accept an uploaded food image, run detection + freshness inference,
    and return a structured result.
    """
    # --- Validate content type -------------------------------------------
    if file.content_type not in SUPPORTED_CONTENT_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                f"Unsupported content type '{file.content_type}'. "
                f"Accepted: {', '.join(sorted(SUPPORTED_CONTENT_TYPES))}"
            ),
        )

    # --- Read & size-check image bytes -----------------------------------
    image_bytes = await file.read()
    if len(image_bytes) > MAX_FILE_SIZE_BYTES:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"File too large ({len(image_bytes) // 1024} KB). Max 10 MB allowed.",
        )

    # --- Decode ----------------------------------------------------------
    try:
        pil_image = bytes_to_pil(image_bytes)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc

    # --- Run inference ---------------------------------------------------
    try:
        bundle = get_bundle()
        t0 = time.perf_counter()
        result = run_inference(pil_image, bundle)
        elapsed_ms = round((time.perf_counter() - t0) * 1000, 2)
    except RuntimeError as exc:
        logger.error("Inference error: %s", exc, exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Model inference failed. Please try again.",
        ) from exc

    return PredictionResponse(
        food=result.food,
        freshness=result.freshness,
        confidence=result.confidence,
        detected=result.detected,
        inference_time_ms=elapsed_ms,
    )
