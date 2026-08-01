import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, classification_report
import xgboost as xgb
import os

# Define the standard 13 clinical features typically found in Kaggle heart datasets
FEATURES = [
    'age', 'sex', 'cp', 'trestbps', 'chol', 'fbs', 'restecg', 
    'thalach', 'exang', 'oldpeak', 'slope', 'ca', 'thal'
]
TARGET = 'target' # 1 = Disease, 0 = No Disease

def train_heart_disease_model(csv_path="heart.csv"):
    print("Initializing XGBoost Classifier for Heart Disease Prediction...")
    
    # --- DATA LOADING ---
    if os.path.exists(csv_path):
        print(f"Loading data from {csv_path}...")
        df = pd.read_csv(csv_path)
    else:
        print(f"Warning: {csv_path} not found. Generating dummy clinical data for hackathon testing...")
        # Generates synthetic data so you can test the script before downloading Kaggle data
        np.random.seed(42)
        dummy_data = np.random.rand(500, len(FEATURES))
        # Scale some features to look like real medical data
        dummy_data[:, 0] = dummy_data[:, 0] * 50 + 30  # Age 30-80
        dummy_data[:, 3] = dummy_data[:, 3] * 80 + 100 # BP 100-180
        dummy_data[:, 4] = dummy_data[:, 4] * 150 + 150 # Chol 150-300
        
        df = pd.DataFrame(dummy_data, columns=FEATURES)
        df[TARGET] = np.random.randint(0, 2, size=500) # Binary target

    # --- DATA SPLITTING ---
    X = df[FEATURES]
    y = df[TARGET]
    
    # Split into 80% training and 20% testing
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    # --- MODEL TRAINING ---
    # XGBoost hyperparameters tuned for small-to-medium clinical datasets
    model = xgb.XGBClassifier(
        objective='binary:logistic',
        eval_metric='logloss',
        max_depth=4,         # Prevent overfitting on medical data
        learning_rate=0.05,
        n_estimators=100,
        use_label_encoder=False
    )
    
    print("Training model...")
    model.fit(X_train, y_train)
    
    # --- EVALUATION ---
    print("\nEvaluating model on test data...")
    predictions = model.predict(X_test)
    accuracy = accuracy_score(y_test, predictions)
    print(f"Model Accuracy: {accuracy * 100:.2f}%\n")
    print("Classification Report:")
    print(classification_report(y_test, predictions))
    
    # --- SAVE MODEL ---
    model_filename = 'heart_xgb_model.json'
    model.save_model(model_filename)
    print("="*50)
    print(f"SUCCESS! Model saved as '{model_filename}'")
    print("Move this file to your API directory to start serving predictions.")
    print("="*50)

if __name__ == "__main__":
    # Ensure you have your heart.csv in the same folder, or it will use dummy data
    train_heart_disease_model("heart.csv")