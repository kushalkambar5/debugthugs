import os
import torch
import torchxrayvision as xrv

def save_weights():
    print("Loading TorchXRayVision DenseNet (weights='densenet121-res224-all')...")
    model = xrv.models.DenseNet(weights="densenet121-res224-all")
    output_path = os.path.join(os.path.dirname(__file__), "best_chest_model.pth")
    torch.save(model.state_dict(), output_path)
    print(f"✅ Successfully saved Chest model weights to: {output_path}")

if __name__ == "__main__":
    save_weights()
