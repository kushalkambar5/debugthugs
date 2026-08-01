import os
import zipfile
import shutil

# 1. Install required libraries
# We use 'split-folders' to easily separate the dataset into train/val folders
!pip install ultralytics opencv-python-headless split-folders
import splitfolders
from ultralytics import YOLO

# ==========================================
# CONFIGURATION
# ==========================================
ZIP_FILE_PATH = "/content/archive.zip" 
EXTRACTION_FOLDER = "/content/extracted_archive"
YOLO_DATASET_DIR = "/content/yolo_formatted_dataset"

def find_dataset_root(base_path):
    """
    Finds the directory containing the 'Fractured' and 'Non_fractured' folders.
    """
    for root, dirs, files in os.walk(base_path):
        lower_dirs = [d.lower() for d in dirs]
        if "fractured" in lower_dirs and "non_fractured" in lower_dirs:
            return root
    return None

def main():
    print("="*50)
    print("1. PREPARING FRACTURE CLASSIFICATION DATASET")
    print("="*50)
    
    if not os.path.exists(ZIP_FILE_PATH):
        print(f"❌ ERROR: Zip file not found at {ZIP_FILE_PATH}")
        return

    # Clean up old folders
    if os.path.exists(EXTRACTION_FOLDER): shutil.rmtree(EXTRACTION_FOLDER)
    if os.path.exists(YOLO_DATASET_DIR): shutil.rmtree(YOLO_DATASET_DIR)
        
    print(f"Unzipping {ZIP_FILE_PATH}...")
    with zipfile.ZipFile(ZIP_FILE_PATH, 'r') as zip_ref:
        zip_ref.extractall(EXTRACTION_FOLDER)
    
    target_root = find_dataset_root(EXTRACTION_FOLDER)
    
    if not target_root:
        print("❌ ERROR: Could not find class folders.")
        return
        
    print(f"✅ Found class folders at: {target_root}")
    
    # 2. Split the dataset using split-folders
    # This automatically creates train/val folders and moves the images, 
    # maintaining the class folder structure.
    print("Splitting data into Training (80%) and Validation (20%) sets...")
    splitfolders.ratio(
        target_root, 
        output=YOLO_DATASET_DIR, 
        seed=1337, 
        ratio=(0.8, 0.2), # 80% train, 20% validation
        group_prefix=None
    )
    print("✅ Dataset formatted for YOLO Classification!")

    print("\n" + "="*50)
    print("3. INITIALIZING MODEL TRAINING")
    print("="*50)
    
    # Load the YOLO classification model
    model = YOLO('yolo11n-cls.pt')
    
    # Train the model
    # We point 'data' to the output directory created by split-folders
    model.train(
        data=YOLO_DATASET_DIR,
        epochs=30,             
        imgsz=224,             
        project='/content/bone_fracture_project', 
        name='yolov11_fracture_cls'
    )

    print("\n" + "="*50)
    print("4. EXPORTING WEIGHTS")
    print("="*50)
    
    best_weights = '/content/bone_fracture_project/yolov11_fracture_cls/weights/best.pt'
    final_export_path = '/content/best_fracture_classifier.pt'
    
    if os.path.exists(best_weights):
        shutil.copy(best_weights, final_export_path)
        print("🎉 SUCCESS! Bone Fracture Training is fully complete.")
        print(f"✅ Your model weights have been copied to: {final_export_path}")
    else:
        print("⚠️ Warning: Could not find best.pt.")

if __name__ == "__main__":
    main()