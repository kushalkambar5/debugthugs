"""
INSTRUCTIONS:
1. Ensure 'heart_xgb_model.json' is in the same directory as this script.
2. Run the script: python test_heart_model.py
3. It will load the model and test it against two mock patient profiles.
"""

import xgboost as xgb
import numpy as np
import os

# The 13 clinical features the model expects
FEATURES = [
    'age', 'sex', 'cp', 'trestbps', 'chol', 'fbs', 'restecg', 
    'thalach', 'exang', 'oldpeak', 'slope', 'ca', 'thal'
]

def test_saved_model(model_path=r"F:\Coding\project\Medical\Heart\heart_xgb_model.json"):
    print("="*50)
    print("Starting Model Tester...")
    if not os.path.exists(model_path):
        print(f"ERROR: Model file '{model_path}' not found.")
        print("Please run 'train_heart_model.py' first to generate the model.")
        print("="*50)
        return

    print(f"Loading model from {model_path}...")
    try:
        model = xgb.XGBClassifier()
        model.load_model(model_path)
        print("Model loaded successfully!")
    except Exception as e:
        print(f"Failed to load model. Error: {e}")
        return

    # Let's create two distinct patient profiles to see how the model reacts.
    
    # Patient A: Likely Low Risk (Younger, normal BP, normal cholesterol, no chest pain)
    patient_a = [
        35,    # age
        1,     # sex (1=male)
        0,     # cp (chest pain type: 0=none)
        120.0, # trestbps (resting blood pressure)
        180.0, # chol (cholesterol)
        0,     # fbs (fasting blood sugar > 120)
        1,     # restecg (resting ECG)
        170.0, # thalach (max heart rate)
        0,     # exang (exercise induced angina)
        0.0,   # oldpeak
        2,     # slope
        0,     # ca (number of major vessels)
        1      # thal (normal)
    ]

    # Patient B: Likely High Risk (Older, high BP, high cholesterol, severe chest pain)
    patient_b = [
        65,    # age
        1,     # sex
        3,     # cp (chest pain type: 3=severe)
        160.0, # trestbps
        280.0, # chol
        1,     # fbs
        2,     # restecg
        110.0, # thalach
        1,     # exang
        2.5,   # oldpeak
        1,     # slope
        2,     # ca
        3      # thal (reversible defect)
    ]

    # Convert to 2D numpy array which XGBoost expects
    test_data = np.array([patient_a, patient_b])

    print("\nRunning predictions...\n")
    
    # predict() gives the binary outcome (0 or 1)
    predictions = model.predict(test_data)
    
    # predict_proba() gives the percentage/probability [Prob_Class_0, Prob_Class_1]
    probabilities = model.predict_proba(test_data)

    patients = ["Patient A (Healthy Profile)", "Patient B (High-Risk Profile)"]
    
    for i, name in enumerate(patients):
        pred_class = predictions[i]
        prob_disease = probabilities[i][1] * 100 # Percentage of having the disease
        
        print(f"--- {name} ---")
        print(f"Raw Input: {dict(zip(FEATURES, test_data[i]))}")
        print(f"Predicted Class: {'1 (Disease)' if pred_class == 1 else '0 (No Disease)'}")
        print(f"Risk Probability: {prob_disease:.2f}%\n")
        
    print("="*50)
    print("Testing complete. Model is ready for API integration.")
    print("="*50)

if __name__ == "__main__":
    test_saved_model()