import os
from ultralytics import YOLO

# 1. Load your custom-trained model weights
model = YOLO(r'F:\Coding\project\Medical\trianing\Skin\best.pt')

# 2. Path to the image you want to test
IMAGE_PATH = r'F:\Coding\project\Medical\trianing\Skin\Skin disease.v1i.folder\train\Eczema\0_4_jpeg_jpg.rf.2ad822e65fe61f8a01bbf5ac88513001.jpg'  # <-- Replace with your image file name/path

if not os.path.exists(IMAGE_PATH):
    print(f"❌ Error: Could not find image at '{IMAGE_PATH}'")
else:
    # 3. Run prediction on the image
    results = model(IMAGE_PATH)

    # 4. Extract and print classification results
    for r in results:
        # Get index and name of the predicted class with highest score
        top_class_id = r.probs.top1
        predicted_label = r.names[top_class_id]
        
        # Get confidence score (0 to 1)
        confidence = r.probs.top1conf.item() * 100

        print("\n" + "=" * 40)
        print(f"🔍 PREDICTION RESULT:")
        print(f"🏷️  Condition:  {predicted_label}")
        print(f"📊 Confidence: {confidence:.2f}%")
        print("=" * 40)

        # Print all class probability breakdown
        print("\n📈 Probability Breakdown for All Classes:")
        for idx, prob in enumerate(r.probs.data):
            class_name = r.names[idx]
            score = prob.item() * 100
            print(f"  • {class_name:<20}: {score:.2f}%")