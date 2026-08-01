"""
INSTRUCTIONS FOR KAGGLE / GOOGLE COLAB:
1. Save this code as 'test.py' in your environment.
2. Update the MODEL_PATH and IMAGE_PATH variables below with your actual file paths.
3. Run the script using: !python test.py
"""

import os
from ultralytics import YOLO

# ==============================================================================
# SET YOUR PATHS HERE
# ==============================================================================
# Path to the weights you downloaded after training
MODEL_PATH = r"F:\Coding\project\Medical\Brain\yolo11n.pt" 

# Path to the specific MRI scan you want to test
IMAGE_PATH = r"F:\Coding\project\Medical\Brain\archive\BrainTumor\BrainTumorYolov11\train\images\5_jpg.rf.f9a2ac5006efa866bd3792829bff23b8.jpg" 
# ==============================================================================

def test_brain_tumor_model():
    print(f"Checking for image at: {IMAGE_PATH}")
    if not os.path.exists(IMAGE_PATH):
        print("❌ Error: Image file not found. Please check the IMAGE_PATH.")
        return

    print(f"Checking for model at: {MODEL_PATH}")
    if not os.path.exists(MODEL_PATH):
        print("❌ Error: Model weights not found. Please check the MODEL_PATH.")
        return

    print("\nLoading YOLO model...")
    model = YOLO(MODEL_PATH)

    print(f"Running inference on {IMAGE_PATH}...")
    
    # Run the prediction
    # conf=0.25: Only keep predictions with a confidence score of 25% or higher
    # save=True: Saves the output image with bounding boxes drawn
    results = model.predict(source=IMAGE_PATH, conf=0.25, save=True)

    # Display a summary of the findings
    for result in results:
        boxes = result.boxes
        if len(boxes) == 0:
            print("\n✅ Result: No tumors detected in this slice.")
        else:
            print(f"\n⚠️ Result: Detected {len(boxes)} potential tumor(s).")
            
            # Print confidence scores and classes for each detection
            for box in boxes:
                conf = float(box.conf[0])
                class_id = int(box.cls[0])
                class_name = model.names[class_id]
                print(f"   - {class_name} (Confidence: {conf:.2f})")

    # YOLO automatically saves the visual results in a dynamically created runs folder
    print("\n" + "="*60)
    print("Inference complete!")
    print("The annotated image has been saved. Check the 'runs/detect/predict' folder.")
    print("="*60 + "\n")

if __name__ == "__main__":
    test_brain_tumor_model()