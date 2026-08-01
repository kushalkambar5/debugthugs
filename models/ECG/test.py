"""
INSTRUCTIONS:
1. Ensure 'best_ecg_model.pth' and 'mitbih_test.csv' are in the same folder as this script.
2. Run the script: python test_ecg_model.py
3. It will pick 5 random heartbeats from the unseen test dataset and classify them!
"""

import torch
import torch.nn as nn
import pandas as pd
import numpy as np
import random
import os

# ==========================================
# 1. DEFINE MODEL ARCHITECTURE (Must match training exactly)
# ==========================================
class ECG_1D_CNN(nn.Module):
    def __init__(self):
        super(ECG_1D_CNN, self).__init__()
        self.conv1 = nn.Conv1d(in_channels=1, out_channels=32, kernel_size=5)
        self.pool1 = nn.MaxPool1d(kernel_size=2)
        self.conv2 = nn.Conv1d(in_channels=32, out_channels=64, kernel_size=5)
        self.pool2 = nn.MaxPool1d(kernel_size=2)
        self.relu = nn.ReLU()
        self.flatten = nn.Flatten()
        self.fc1 = nn.Linear(64 * 43, 128) 
        self.fc2 = nn.Linear(128, 5)

    def forward(self, x):
        x = self.relu(self.conv1(x))
        x = self.pool1(x)
        x = self.relu(self.conv2(x))
        x = self.pool2(x)
        x = self.flatten(x)
        x = self.relu(self.fc1(x))
        x = self.fc2(x)
        return x

# Medical definitions for the 5 classes in the MIT-BIH dataset
ECG_CLASSES = {
    0: "Normal Sinus Rhythm",
    1: "Supraventricular Premature Beat",
    2: "Premature Ventricular Contraction (PVC)",
    3: "Fusion of Ventricular and Normal Beat",
    4: "Unclassifiable Beat"
}

def test_ecg_inference(model_path=r"F:\Coding\project\Medical\ECG\best_ecg_model.pth", test_csv_path=r"ECG\archive (1)\mitbih_test.csv"):
    print("="*50)
    print("🫀 ECG 1D-CNN INFERENCE TESTER")
    print("="*50)

    if not os.path.exists(model_path):
        print(f"❌ ERROR: Model not found at '{model_path}'.")
        return
    if not os.path.exists(test_csv_path):
        print(f"❌ ERROR: Test data not found at '{test_csv_path}'.")
        return

    # Load Model
    print(f"Loading model from {model_path}...")
    model = ECG_1D_CNN()
    # map_location='cpu' ensures it runs on your local laptop without needing a GPU
    model.load_state_dict(torch.load(model_path, map_location=torch.device('cpu')))
    model.eval() # Set to evaluation mode! Very important.

    # Load Test Data
    print(f"Loading test data from {test_csv_path}...")
    test_df = pd.read_csv(test_csv_path, header=None)
    
    print("\nRunning inference on 5 random heartbeats...\n")
    
    # Pick 5 random rows from the test dataset
    random_indices = random.sample(range(len(test_df)), 5)
    
    for i, idx in enumerate(random_indices, 1):
        # Extract signal (first 187 columns) and true label (last column)
        row = test_df.iloc[idx].values
        signal = row[:-1]
        true_label_id = int(row[-1])
        
        # Prepare tensor: Shape must be (Batch=1, Channels=1, Sequence=187)
        signal_tensor = torch.tensor(signal, dtype=torch.float32).unsqueeze(0).unsqueeze(0)
        
        # Run through network
        with torch.no_grad():
            output = model(signal_tensor)
            # Apply Softmax to get percentages
            probabilities = torch.nn.functional.softmax(output[0], dim=0)
            
            # Get highest prediction
            pred_label_id = torch.argmax(probabilities).item()
            confidence = probabilities[pred_label_id].item() * 100
        
        # Print results
        print(f"--- Heartbeat Sample #{i} (Dataset Row {idx}) ---")
        print(f"TRUE Diagnosis : {ECG_CLASSES[true_label_id]}")
        print(f"AI PREDICTION  : {ECG_CLASSES[pred_label_id]} (Confidence: {confidence:.2f}%)")
        
        if true_label_id == pred_label_id:
            print("✅ CORRECT PREDICTION")
        else:
            print("❌ INCORRECT PREDICTION")
        print("-" * 50)

if __name__ == "__main__":
    test_ecg_inference()