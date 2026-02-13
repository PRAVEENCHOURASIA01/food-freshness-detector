"""
FreshnessNet
============
Lightweight MobileNetV2-based classification head for freshness scoring.
Outputs 3 classes: [fresh, semi-fresh, spoiled].

To train this model:
1. Prepare a dataset of food images labelled fresh / semi-fresh / spoiled.
2. Instantiate FreshnessNet(), attach to a training loop.
3. Save checkpoint: torch.save({"state_dict": model.state_dict()}, path)
4. Set FRESHNESS_WEIGHTS_PATH in .env to the saved checkpoint path.
"""
import torch
import torch.nn as nn
from torchvision import models


class FreshnessNet(nn.Module):
    """Transfer-learning classifier built on MobileNetV2."""

    NUM_CLASSES: int = 3  # fresh | semi-fresh | spoiled

    def __init__(self, pretrained: bool = False) -> None:
        super().__init__()
        # Backbone
        self.backbone = models.mobilenet_v2(
            weights=models.MobileNet_V2_Weights.DEFAULT if pretrained else None
        )
        # Replace the final classifier layer
        in_features = self.backbone.classifier[1].in_features
        self.backbone.classifier = nn.Sequential(
            nn.Dropout(p=0.2),
            nn.Linear(in_features, self.NUM_CLASSES),
        )

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        return self.backbone(x)

    @torch.no_grad()
    def predict(self, x: torch.Tensor) -> tuple[int, float]:
        """Return (class_index, confidence) for a single pre-processed image tensor."""
        logits = self.forward(x)
        probs = torch.softmax(logits, dim=-1)
        confidence, idx = probs.max(dim=-1)
        return idx.item(), confidence.item()
