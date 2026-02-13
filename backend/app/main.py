"""
Food Freshness Detection System — FastAPI Backend
=================================================
Entry point for the FastAPI application.

Start the server:
    uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
"""
from __future__ import annotations

import logging
import sys
from contextlib import asynccontextmanager
from typing import AsyncIterator

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config import get_settings
from app.models.loader import load_models
from app.routers import predict

# --------------------------------------------------------------------------
# Logging
# --------------------------------------------------------------------------
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-8s | %(name)s — %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
    stream=sys.stdout,
)
logger = logging.getLogger(__name__)


# --------------------------------------------------------------------------
# Lifespan: load models once at startup, free resources on shutdown
# --------------------------------------------------------------------------
@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    settings = get_settings()
    logger.info("🥦  Food Freshness Detection System starting …")
    logger.info("   YOLO weights  : %s", settings.yolo_weights_path)
    logger.info("   Freshness weights: %s", settings.freshness_weights_path)
    logger.info("   Device         : %s", settings.device)

    load_models(
        yolo_path=settings.yolo_weights_path,
        freshness_path=settings.freshness_weights_path,
        device_str=settings.device,
    )
    logger.info("✅  Models loaded and ready.")
    yield
    logger.info("🛑  Shutting down.")


# --------------------------------------------------------------------------
# App factory
# --------------------------------------------------------------------------
settings = get_settings()

app = FastAPI(
    title="Food Freshness Detection API",
    description=(
        "Vision-based food freshness detection using YOLOv8 object detection "
        "and a MobileNetV2-based freshness classifier."
    ),
    version="1.0.0",
    contact={"name": "Food Freshness Team"},
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# --------------------------------------------------------------------------
# Middleware
# --------------------------------------------------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --------------------------------------------------------------------------
# Routers
# --------------------------------------------------------------------------
app.include_router(predict.router)


# --------------------------------------------------------------------------
# Health check
# --------------------------------------------------------------------------
@app.get("/health", tags=["Health"])
async def health() -> JSONResponse:
    """Liveness probe — returns 200 when the server is up."""
    return JSONResponse({"status": "ok", "service": "food-freshness-api"})


@app.get("/", include_in_schema=False)
async def root() -> JSONResponse:
    return JSONResponse({
        "message": "Food Freshness Detection API",
        "docs": "/docs",
        "health": "/health",
    })
