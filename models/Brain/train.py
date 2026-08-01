"""
INSTRUCTIONS FOR KAGGLE / GOOGLE COLAB:
1. Open a new Notebook with a GPU enabled (Runtime -> Change runtime type -> T4 GPU in Colab).
2. Upload your YOLO-formatted Brain Tumor Dataset to the environment.
3. Run the installation command below in a notebook cell.

!pip install ultralytics opencv-python-headless
"""

import os
import shutil
from ultralytics import YOLO

# In YOLO, datasets are defined by a 'data.yaml' file. 
# This file tells the model where your images are and what the classes are.
# Example data.yaml content (you should have this in your downloaded dataset):
# train: ./dataset/images/train
# val: ./dataset/images/val
# nc: 4
# names: ['Glioma', 'Meningioma', 'No Tumor', 'Pituitary']

DATASET_YAML_PATH = "path/to/your/dataset/data.yaml" # UPDATE THIS PATH IN YOUR NOTEBOOK

def train_brain_tumor_model():
    print("Initializing YOLOv11 Nano model...")
    # We use the 'nano' (yolo11n.pt) version. It is the fastest and smallest,
    # making it perfect for rapid hackathon prototyping and web API deployment.
    # The weights will automatically download the first time you run this.
    model = YOLO('yolo11n.pt') 

    print(f"Starting training using dataset config: {DATASET_YAML_PATH}")
    
    # Train the model
    # epochs=50: A good starting point for hackathons to get decent accuracy quickly.
    # imgsz=640: Standard image size for YOLO models.
    # batch=16: How many images to process at once (adjust based on GPU memory).
    results = model.train(
        data=DATASET_YAML_PATH,
        epochs=50, 
        imgsz=640,
        batch=16,
        patience=10,      # Stop early if the model isn't improving for 10 epochs
        project='brain_tumor_project', # Folder name to save results
        name='yolov11_run'             # Subfolder for this specific run
    )

    print("Training complete. Running validation on unseen data...")
    # This checks how accurate your model is on the validation set
    metrics = model.val()
    
    print(f"Mean Average Precision (mAP50-95): {metrics.box.map}")

    # YOLO automatically saves the best performing weights during training.
    # We will locate this file so you know exactly what to download.
    best_weights_path = os.path.join('brain_tumor_project', 'yolov11_run', 'weights', 'best.pt')
    
    if os.path.exists(best_weights_path):
        print("\n" + "="*50)
        print("SUCCESS! Model training is complete.")
        print(f"Your model weights are saved at: {best_weights_path}")
        print("Download 'best.pt' and rename it to 'best_brain_tumor_YOLOv11.pt' for your API.")
        print("="*50 + "\n")
        
        # Optional: Copy it to the current working directory for easy download in Colab
        shutil.copy(best_weights_path, './best_brain_tumor_YOLOv11.pt')
        print("Copied to current directory as 'best_brain_tumor_YOLOv11.pt' for easy downloading.")
    else:
        print("Warning: Could not locate the best.pt file. Check the runs directory.")

if __name__ == "__main__":
    # To run this, ensure your dataset is loaded and the YAML path is correct.
    # train_brain_tumor_model()
    print("Ready to train. Please update DATASET_YAML_PATH and uncomment the function call.")