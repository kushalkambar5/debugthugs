"""
GOOGLE COLAB INSTRUCTIONS:
1. Go to Kaggle and download the "ECG Heartbeat Categorization Dataset".
2. Upload the `mitbih_train.csv` and `mitbih_test.csv` files to your Colab environment.
3. Make sure you are using a GPU runtime.
4. Run this script to train your 1D-CNN!
"""

import pandas as pd
import numpy as np
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader, TensorDataset
import os

# ==========================================
# CONFIGURATION
# ==========================================
# Change these paths to relative paths for local Windows execution
TRAIN_CSV = r"ECG\archive (1)\mitbih_train.csv"
TEST_CSV = r"ECG\archive (1)\mitbih_test.csv"
MODEL_SAVE_PATH = "best_ecg_model.pth"

class ECG_1D_CNN(nn.Module):
    def __init__(self):
        super(ECG_1D_CNN, self).__init__()
        # Input shape: (Batch, Channels=1, Sequence_Length=187)
        self.conv1 = nn.Conv1d(in_channels=1, out_channels=32, kernel_size=5)
        self.pool1 = nn.MaxPool1d(kernel_size=2)
        self.conv2 = nn.Conv1d(in_channels=32, out_channels=64, kernel_size=5)
        self.pool2 = nn.MaxPool1d(kernel_size=2)
        
        self.relu = nn.ReLU()
        
        # Flatten layer to transition from Conv1D to Linear layers
        self.flatten = nn.Flatten()
        
        # After two convs and pools, the 187 length becomes approx 43. 43 * 64 channels = 2752
        self.fc1 = nn.Linear(64 * 43, 128) 
        self.fc2 = nn.Linear(128, 5) # 5 Output classes

    def forward(self, x):
        x = self.relu(self.conv1(x))
        x = self.pool1(x)
        x = self.relu(self.conv2(x))
        x = self.pool2(x)
        x = self.flatten(x)
        x = self.relu(self.fc1(x))
        x = self.fc2(x)
        return x

def load_data():
    print("Loading CSV files...")
    train_df = pd.read_csv(TRAIN_CSV, header=None)
    test_df = pd.read_csv(TEST_CSV, header=None)
    
    # The last column (187) is the label (0 to 4)
    X_train = train_df.iloc[:, :-1].values
    y_train = train_df.iloc[:, -1].values
    
    X_test = test_df.iloc[:, :-1].values
    y_test = test_df.iloc[:, -1].values
    
    # PyTorch 1D CNNs expect input shape: (batch_size, channels, sequence_length)
    # We add a channel dimension so shape becomes (N, 1, 187)
    X_train = X_train.reshape(X_train.shape[0], 1, X_train.shape[1])
    X_test = X_test.reshape(X_test.shape[0], 1, X_test.shape[1])
    
    # Convert to PyTorch Tensors
    X_train_t = torch.tensor(X_train, dtype=torch.float32)
    y_train_t = torch.tensor(y_train, dtype=torch.long)
    
    X_test_t = torch.tensor(X_test, dtype=torch.float32)
    y_test_t = torch.tensor(y_test, dtype=torch.long)
    
    # Create DataLoaders
    train_dataset = TensorDataset(X_train_t, y_train_t)
    test_dataset = TensorDataset(X_test_t, y_test_t)
    
    train_loader = DataLoader(train_dataset, batch_size=128, shuffle=True)
    test_loader = DataLoader(test_dataset, batch_size=128, shuffle=False)
    
    return train_loader, test_loader

def train_model():
    print("="*50)
    print("1. PREPARING ECG DATASET")
    print("="*50)
    
    if not os.path.exists(TRAIN_CSV):
        print(f"❌ ERROR: Cannot find {TRAIN_CSV}")
        return
        
    train_loader, test_loader = load_data()
    
    # Setup Device
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"✅ Training on device: {device}")
    
    model = ECG_1D_CNN().to(device)
    criterion = nn.CrossEntropyLoss()
    optimizer = optim.Adam(model.parameters(), lr=0.001)
    
    epochs = 10 # 10 Epochs is usually enough for this dataset to hit 95%+
    
    print("\n" + "="*50)
    print("2. TRAINING 1D-CNN MODEL")
    print("="*50)
    
    for epoch in range(epochs):
        model.train()
        running_loss = 0.0
        
        for inputs, labels in train_loader:
            inputs, labels = inputs.to(device), labels.to(device)
            
            optimizer.zero_grad()
            outputs = model(inputs)
            loss = criterion(outputs, labels)
            loss.backward()
            optimizer.step()
            
            running_loss += loss.item()
            
        print(f"Epoch {epoch+1}/{epochs} - Loss: {running_loss/len(train_loader):.4f}")
        
    print("\n" + "="*50)
    print("3. EXPORTING WEIGHTS")
    print("="*50)
    
    # Save the model's state dictionary
    torch.save(model.state_dict(), MODEL_SAVE_PATH)
    print(f"🎉 SUCCESS! Model saved to {MODEL_SAVE_PATH}")
    print("Download 'best_ecg_model.pth' and move it to your API folder.")

if __name__ == "__main__":
    train_model()