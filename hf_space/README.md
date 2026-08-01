---
title: AI Digital Twin Models
emoji: ⚕️
colorFrom: blue
colorTo: green
sdk: gradio
sdk_version: "4.42.0"
app_file: app.py
pinned: false
---

# Medical AI Digital Twin API

This Space hosts 6 FastAPI-based medical AI models running inside a Gradio application wrapper for free hosting on Hugging Face.

## Base URL
The API is hosted at:
`https://bhuvanrai-ai-digital-twin-models.hf.space`

You can test the endpoints interactively by navigating to `https://bhuvanrai-ai-digital-twin-models.hf.space/docs` in your browser.

---

## Integration Guide for Web Application

This guide explains how to connect a frontend web application (e.g., React/Next.js) to the API endpoints.

### 1. Bone Fracture Detection
- **Endpoint:** `POST /predict/bone`
- **Request Type:** `multipart/form-data`
- **Body:** `{ "file": (Image File) }`
- **Response:**
  ```json
  {
    "diagnosis": "fractured",
    "confidence": 98.5
  }
  ```

### 2. Brain Tumor Detection
- **Endpoint:** `POST /predict/brain`
- **Request Type:** `multipart/form-data`
- **Body:** `{ "file": (Image File) }`
- **Response:**
  ```json
  {
    "detections": [
      {
        "class": "tumor",
        "confidence": 85.2,
        "bbox": [10.0, 20.0, 100.0, 150.0]
      }
    ],
    "tumor_found": true
  }
  ```

### 3. Chest X-Ray Analysis
- **Endpoint:** `POST /predict/chest`
- **Request Type:** `multipart/form-data`
- **Body:** `{ "file": (Image File) }`
- **Response:**
  ```json
  {
    "pathology_probabilities": {
      "Atelectasis": 50.2,
      "Cardiomegaly": 12.4,
      "...": 0.0
    }
  }
  ```

### 4. Skin Disease Classification
- **Endpoint:** `POST /predict/skin`
- **Request Type:** `multipart/form-data`
- **Body:** `{ "file": (Image File) }`
- **Response:**
  ```json
  {
    "diagnosis": "Eczema",
    "confidence": 99.1
  }
  ```

### 5. ECG Signal Analysis
- **Endpoint:** `POST /predict/ecg`
- **Request Type:** `application/json`
- **Body:**
  ```json
  {
    "signal": [0.1, 0.2, 0.3, "... (must be exactly 187 float values)"]
  }
  ```
- **Response:**
  ```json
  {
    "diagnosis": "Normal Sinus Rhythm",
    "class_id": 0,
    "confidence": 99.9
  }
  ```

### 6. Heart Disease Risk Prediction
- **Endpoint:** `POST /predict/heart`
- **Request Type:** `application/json`
- **Body:**
  ```json
  {
    "age": 65,
    "sex": 1,
    "cp": 3,
    "trestbps": 160.0,
    "chol": 280.0,
    "fbs": 1,
    "restecg": 2,
    "thalach": 110.0,
    "exang": 1,
    "oldpeak": 2.5,
    "slope": 1,
    "ca": 2,
    "thal": 3
  }
  ```
- **Response:**
  ```json
  {
    "risk_prediction": 1,
    "disease_probability": 85.4,
    "diagnosis": "High Risk"
  }
  ```

---
**Note for Frontend Developers:**
CORS is fully enabled on this backend (`allow_origins=["*"]`), so you can make `fetch()` or `axios` requests directly from your React/Next.js frontend without hitting cross-origin blocked errors.
