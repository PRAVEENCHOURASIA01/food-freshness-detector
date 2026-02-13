# Model Weights Directory

Place your trained model weight files here:

| File                        | Description                                         |
|-----------------------------|-----------------------------------------------------|
| `yolov8n.pt`                | YOLOv8 Nano — food object detection                 |
| `freshness_classifier.pt`   | FreshnessNet checkpoint (state_dict format)         |

## Quick Start (pretrained COCO weights)

If you don't have custom weights yet, the backend will automatically download
`yolov8n.pt` from the Ultralytics model hub on first run.

The freshness classifier will fall back to a colour-space heuristic until you
provide a trained `freshness_classifier.pt`.

## Training the Freshness Classifier

1. Label a dataset of food images: `fresh`, `semi-fresh`, `spoiled`.
2. Use the `FreshnessNet` architecture in `app/models/freshness_net.py`.
3. Train with standard PyTorch training loop.
4. Save checkpoint: `torch.save({"state_dict": model.state_dict()}, "weights/freshness_classifier.pt")`
