# 🥦 FreshScan — Vision-Based Food Freshness Detection System

A production-ready full-stack system that uses **YOLOv8** object detection and a **MobileNetV2** freshness classifier to analyse food freshness in real time via a web camera.

```
User → webcam → capture → FastAPI → YOLOv8 + FreshnessNet → JSON → Next.js UI
```

---

## Project Structure

```
food-freshness-detector/
├── backend/                     # FastAPI Python backend
│   ├── app/
│   │   ├── main.py              # FastAPI app & lifespan
│   │   ├── config.py            # Pydantic settings
│   │   ├── routers/
│   │   │   └── predict.py       # POST /predict endpoint
│   │   ├── models/
│   │   │   ├── loader.py        # Model loading & caching
│   │   │   └── freshness_net.py # MobileNetV2 architecture
│   │   ├── inference/
│   │   │   └── pipeline.py      # Detection + classification pipeline
│   │   └── utils/
│   │       └── preprocessing.py # Image utilities
│   ├── weights/                 # Place .pt weight files here
│   │   └── README.md
│   ├── requirements.txt
│   └── .env.example
│
└── frontend/                    # Next.js 14 frontend
    ├── app/
    │   ├── layout.tsx           # Root layout
    │   ├── page.tsx             # Main page & state orchestration
    │   ├── globals.css          # Tailwind + custom CSS (CRT aesthetic)
    │   └── components/
    │       ├── CameraCapture.tsx  # Webcam preview + capture
    │       ├── ResultCard.tsx     # Freshness result display
    │       └── LoadingIndicator.tsx
    ├── lib/
    │   └── api.ts               # Axios API client
    ├── next.config.js
    ├── tailwind.config.ts
    ├── tsconfig.json
    └── .env.example
```

---

## Quick Start

### Prerequisites
- Python 3.10
- Node.js 18+
- A webcam

---

### 1 — Backend Setup

```bash
cd backend

# Create & activate virtual environment
python3.10 -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env as needed

# Run server
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

The server will:
- Auto-download **YOLOv8n.pt** pretrained weights if `weights/yolov8n.pt` is missing.
- Use a colour-space heuristic for freshness if `weights/freshness_classifier.pt` is absent.

**API docs**: http://localhost:8000/docs

---

### 2 — Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Configure environment
cp .env.example .env.local
# Set NEXT_PUBLIC_API_URL=http://localhost:8000

# Run dev server
npm run dev
```

Open http://localhost:3000 in your browser.

---

## API Reference

### `POST /predict`

Accepts a multipart file upload (JPEG / PNG / WebP, max 10 MB).

**Request:**
```
Content-Type: multipart/form-data
file: <image binary>
```

**Response (200):**
```json
{
  "food": "banana",
  "freshness": "fresh",
  "confidence": 0.94,
  "detected": true,
  "inference_time_ms": 87.4
}
```

**Freshness values:** `fresh` | `semi-fresh` | `spoiled` | `unknown`

### `GET /health`
```json
{ "status": "ok", "service": "food-freshness-api" }
```

---

## Model Weights

| File                        | Source                                        |
|-----------------------------|-----------------------------------------------|
| `weights/yolov8n.pt`        | Auto-downloaded by Ultralytics on first run   |
| `weights/freshness_classifier.pt` | Train your own (see `app/models/freshness_net.py`) |

### Training the Freshness Classifier

1. Prepare a labelled dataset with 3 classes: `fresh`, `semi-fresh`, `spoiled`.
2. Use the `FreshnessNet` architecture in `app/models/freshness_net.py`.
3. Run a standard PyTorch training loop.
4. Save the checkpoint:
   ```python
   torch.save({"state_dict": model.state_dict()}, "weights/freshness_classifier.pt")
   ```

---

## Production Deployment

### Backend (Railway / Render / Fly.io)
1. Set `APP_RELOAD=false`, `DEVICE=cpu` (or `cuda`).
2. Set `ALLOWED_ORIGINS=https://your-frontend.vercel.app`.
3. Deploy as a Docker container or via the platform CLI.

### Frontend (Vercel)
1. Set env var: `NEXT_PUBLIC_API_URL=https://your-backend.railway.app`
2. `vercel deploy`

---

## Tech Stack

| Layer      | Technology              |
|------------|-------------------------|
| Detection  | YOLOv8 (Ultralytics)    |
| Classifier | MobileNetV2 (PyTorch)   |
| Backend    | FastAPI + Uvicorn       |
| Frontend   | Next.js 14 + Tailwind CSS |
| HTTP       | Axios                   |
| Images     | Pillow + OpenCV         |

---

## License

MIT
