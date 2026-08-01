"""
INSTRUCTIONS:
1. Ensure you have the ultralytics library installed: pip install ultralytics
2. Place your trained model (e.g., 'best_fracture_classifier.pt') in the same folder.
3. Place a test X-ray image (e.g., 'test_xray.png') in the same folder.
4. Update the MODEL_PATH and IMAGE_PATH variables below.
5. Run the script: python test_fracture_classifier.py
"""

import os
from ultralytics import YOLO

# ==========================================
# CONFIGURATION (UPDATE THESE PATHS)
# ==========================================
MODEL_PATH = r"F:\Coding\project\Medical\Bone\best_fracture_classifier.pt"  # Your trained weights
IMAGE_PATH = r"F:\Coding\project\Medical\Bone\archive\FracAtlas\images\Non_fractured\IMG0000018.jpg"                # The image you want to test

def test_image_classification(model_path, image_path):
    print("="*50)
    print("🦴 BONE FRACTURE CLASSIFICATION TESTER")
    print("="*50)

    # 1. Verify files exist
    if not os.path.exists(model_path):
        print(f"❌ ERROR: Model not found at '{model_path}'.")
        return
    if not os.path.exists(image_path):
        print(f"❌ ERROR: Image not found at '{image_path}'.")
        return

    # 2. Load the trained YOLO classification model
    print(f"Loading model from {model_path}...")
    model = YOLO(model_path)

    # 3. Run inference on the image
    print(f"\nAnalyzing image: {image_path}...")
    # save=False because we just want the text output, not a saved image
    results = model.predict(source=image_path, save=False)

    # 4. Extract classification probabilities
    # YOLO classification models output a 'probs' object
    probs = results[0].probs
    class_names = model.names

    print("\n" + "-"*30)
    print("📊 INFERENCE RESULTS:")
    print("-" * 30)

    # 5. Print the confidence for every class
    for i in range(len(class_names)):
        class_name = class_names[i]
        confidence = float(probs.data[i]) * 100
        print(f"{class_name}: {confidence:.2f}%")

    print("-" * 30)
    
    # 6. Get the most likely prediction
    top_class_id = probs.top1
    top_class_name = class_names[top_class_id]
    top_confidence = float(probs.top1conf) * 100
    
    print(f"🩺 DIAGNOSIS: {top_class_name} (Confidence: {top_confidence:.2f}%)")
    print("="*50)

if __name__ == "__main__":
    test_image_classification(MODEL_PATH, IMAGE_PATH)