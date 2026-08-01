"use client";

import React, { useState } from "react";
import { MaterialIcon } from "@/components/ui/MaterialIcon";
import ScrollFloat from "@/components/ui/ScrollFloat";

export function DiagnosticSuiteDark() {
  // Cardiovascular XGBoost Calculator State
  const [age, setAge] = useState(54);
  const [systolicBP, setSystolicBP] = useState(132);
  const [cholesterol, setCholesterol] = useState(210);

  const calculateCardioRisk = () => {
    // Realistic risk scoring logic for interactive showcase
    let risk = (age - 30) * 0.4 + (systolicBP - 120) * 0.3 + (cholesterol - 180) * 0.2;
    risk = Math.min(Math.max(Math.round(risk), 4), 68);
    return risk;
  };

  const currentRisk = calculateCardioRisk();

  return (
    <section id="diagnostic-suite" className="w-full bg-[#1C1B18] text-white py-20 my-12 border-y border-[#33312B]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        
        {/* Header (Matches "Our Featured Product" in reference image) */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-[#33312B] pb-8">
          <div className="space-y-3">
            <ScrollFloat
              as="h2"
              animationDuration={1}
              ease="back.inOut(2)"
              stagger={0.03}
              containerClassName="font-serif text-4xl sm:text-5xl lg:text-6xl font-normal text-white tracking-tight"
            >
              Our Advanced <span className="text-[#F4E071]">AI Diagnostic</span> Suite
            </ScrollFloat>
            <p className="text-sm sm:text-base text-[#AAA595] font-sans max-w-xl">
              High-precision computer vision, XGBoost risk stratification, and neural network classification models engineered for clinical decision support.
            </p>
          </div>

          <a
            href="#interactive-showcase"
            className="inline-flex items-center gap-2 bg-[#F4E071] hover:bg-[#E8C838] text-[#1C1B18] px-6 py-3 rounded-full text-xs font-bold uppercase tracking-wider transition-all self-start md:self-end"
          >
            <span>EXPLORE DIAGNOSTICS</span>
            <MaterialIcon name="chevron_right" className="text-base text-[#1C1B18]" />
          </a>
        </div>

        {/* 6 Clinical AI Engine Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          
          {/* Card 1: Chest X-Ray Analysis */}
          <div className="bg-[#252420] border border-[#3A3831] rounded-[28px] p-6 space-y-5 hover:border-[#8C6B1F] transition-all group flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider bg-[#33312B] text-[#F4E071] px-3 py-1 rounded-full border border-[#474439]">
                  YOLOv11 & TorchXRayVision
                </span>
                <MaterialIcon name="document_scanner" className="text-xl text-[#F4E071]" />
              </div>

              <h3 className="font-serif text-2xl font-bold text-white tracking-tight">
                Chest X-Ray Analysis
              </h3>

              <p className="text-xs text-[#BAB4A3] leading-relaxed">
                Automatic detection of Pneumonia, Lung Opacity, Tuberculosis, Cardiomegaly, Pulmonary Edema, Atelectasis & Nodules.
              </p>

              {/* Simulated Bounding Box Graphic */}
              <div className="relative w-full h-36 bg-[#161513] rounded-xl border border-[#3A3831] overflow-hidden flex items-center justify-center p-2">
                <div className="w-24 h-24 rounded-full border border-dashed border-[#F4E071]/40 flex items-center justify-center">
                  <div className="w-16 h-12 border-2 border-red-500 bg-red-500/10 rounded flex flex-col items-center justify-between p-1">
                    <span className="text-[8px] bg-red-500 text-white font-bold px-1 rounded">
                      Nodule 98.4%
                    </span>
                  </div>
                </div>
                <span className="absolute bottom-2 left-2 text-[9px] text-[#8C8878]">
                  Heatmaps & Bounding Box Localization
                </span>
              </div>
            </div>

            <div className="pt-2 border-t border-[#3A3831] flex items-center justify-between text-xs text-[#8C8778]">
              <span>Risk Prediction: Active</span>
              <span className="text-[#F4E071] font-bold">Confidence 98.4%</span>
            </div>
          </div>

          {/* Card 2: ECG & Heart Arrhythmia AI */}
          <div className="bg-[#252420] border border-[#3A3831] rounded-[28px] p-6 space-y-5 hover:border-[#FF5252] transition-all group flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider bg-[#33312B] text-[#FF5252] px-3 py-1 rounded-full border border-[#474439]">
                  12-Lead ECG & Arrhythmia AI
                </span>
                <MaterialIcon name="monitor_heart" className="text-xl text-[#FF5252] animate-pulse" />
              </div>

              <h3 className="font-serif text-2xl font-bold text-white tracking-tight">
                ECG & Heart Arrhythmia AI
              </h3>

              <p className="text-xs text-[#BAB4A3] leading-relaxed">
                Real-time 12-lead ECG waveform signal processing for automated detection of Atrial Fibrillation, ST-Elevation (STEMI), PVCs & Tachy/Bradycardia.
              </p>

              {/* Animated ECG Waveform Graphic */}
              <div className="relative w-full h-36 bg-[#161513] rounded-xl border border-[#3A3831] overflow-hidden flex flex-col justify-between p-3">
                <div className="flex items-center justify-between z-10">
                  <span className="text-[10px] font-bold text-[#FF5252] flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#FF5252] animate-ping" />
                    LIVE SENSOR SYNC
                  </span>
                  <span className="text-xs font-mono font-bold text-white bg-[#252420] px-2 py-0.5 rounded border border-[#3A3831]">
                    72 BPM
                  </span>
                </div>

                {/* SVG ECG Line Waveform */}
                <div className="w-full h-16 flex items-center overflow-hidden my-auto">
                  <svg className="w-full h-full stroke-[#FF5252]" viewBox="0 0 300 60" fill="none">
                    <path
                      d="M0 30 L40 30 L50 20 L55 45 L65 5 L75 55 L85 30 L100 30 L140 30 L150 20 L155 45 L165 5 L175 55 L185 30 L200 30 L240 30 L250 20 L255 45 L265 5 L275 55 L285 30 L300 30"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>

                <div className="flex items-center justify-between text-[10px] text-[#BAB4A3] z-10 pt-1 border-t border-[#2B2924]">
                  <span>P-Q-R-S-T Interval</span>
                  <span className="text-[#4EBD88] font-bold">Normal Sinus Rhythm ✓</span>
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-[#3A3831] flex items-center justify-between text-xs text-[#8C8778]">
              <span>Cardiac AI Engine</span>
              <span className="text-[#FF5252] font-bold">Arrhythmia 99.2%</span>
            </div>
          </div>

          {/* Card 3: Bone Fracture Detection */}
          <div className="bg-[#252420] border border-[#3A3831] rounded-[28px] p-6 space-y-5 hover:border-[#8C6B1F] transition-all group flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider bg-[#33312B] text-[#7BB1D1] px-3 py-1 rounded-full border border-[#474439]">
                  Universal Radiograph Vision
                </span>
                <MaterialIcon name="skeleton" className="text-xl text-[#7BB1D1]" />
              </div>

              <h3 className="font-serif text-2xl font-bold text-white tracking-tight">
                Bone Fracture Detection
              </h3>

              <p className="text-xs text-[#BAB4A3] leading-relaxed">
                Universal radiograph ingestion for any bone (Femur, Radius, Clavicle, Tibia). Automated fracture localization & clinical assessment support.
              </p>

              <div className="bg-[#161513] rounded-xl border border-[#3A3831] p-3 space-y-2">
                <div className="flex items-center justify-between text-xs text-[#BAB4A3]">
                  <span>Fracture Ingestion:</span>
                  <span className="text-[#7BB1D1] font-bold">Standard DICOM/X-Ray</span>
                </div>
                <div className="flex items-center justify-between text-xs text-[#BAB4A3]">
                  <span>Auto Bounding Box:</span>
                  <span className="text-[#4EBD88] font-bold">Enabled ✓</span>
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-[#3A3831] flex items-center justify-between text-xs text-[#8C8778]">
              <span>Clinical Support Tool</span>
              <span className="text-[#7BB1D1] font-bold">Instant Assessment</span>
            </div>
          </div>

          {/* Card 4: Cardiovascular Risk (Interactive XGBoost Calculator) */}
          <div className="bg-[#252420] border border-[#3A3831] rounded-[28px] p-6 space-y-5 hover:border-[#8C6B1F] transition-all group flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider bg-[#33312B] text-[#4EBD88] px-3 py-1 rounded-full border border-[#474439]">
                  XGBoost ML Engine
                </span>
                <MaterialIcon name="vital_signs" className="text-xl text-[#4EBD88]" />
              </div>

              <h3 className="font-serif text-2xl font-bold text-white tracking-tight">
                Cardiovascular Risk AI
              </h3>

              <p className="text-xs text-[#BAB4A3] leading-relaxed">
                XGBoost ML algorithm calculating cardiovascular risk % from age, blood pressure, cholesterol & structured health data.
              </p>

              {/* Interactive Calculator Sliders */}
              <div className="bg-[#161513] rounded-xl border border-[#3A3831] p-3 space-y-3">
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] text-[#BAB4A3]">
                    <span>Age: <strong>{age} yrs</strong></span>
                    <span>BP: <strong>{systolicBP} mmHg</strong></span>
                  </div>
                  <input
                    type="range"
                    min="30"
                    max="80"
                    value={age}
                    onChange={(e) => setAge(Number(e.target.value))}
                    className="w-full accent-[#4EBD88]"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] text-[#BAB4A3]">
                    <span>Cholesterol: <strong>{cholesterol} mg/dL</strong></span>
                  </div>
                  <input
                    type="range"
                    min="140"
                    max="300"
                    value={cholesterol}
                    onChange={(e) => setCholesterol(Number(e.target.value))}
                    className="w-full accent-[#4EBD88]"
                  />
                </div>

                <div className="pt-2 border-t border-[#33312B] flex items-center justify-between">
                  <span className="text-xs text-[#BAB4A3]">Estimated Risk:</span>
                  <span className={`text-base font-serif font-bold ${currentRisk > 25 ? "text-red-400" : "text-[#4EBD88]"}`}>
                    {currentRisk}% Risk
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-[#3A3831] flex items-center justify-between text-xs text-[#8C8778]">
              <span>XGBoost Classifier</span>
              <span className="text-[#4EBD88] font-bold">Personalized Recs</span>
            </div>
          </div>

          {/* Card 5: Brain Tumor MRI Detection */}
          <div className="bg-[#252420] border border-[#3A3831] rounded-[28px] p-6 space-y-5 hover:border-[#8C6B1F] transition-all group flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider bg-[#33312B] text-[#E67CAE] px-3 py-1 rounded-full border border-[#474439]">
                  MRI Volumetric AI
                </span>
                <MaterialIcon name="psychology" className="text-xl text-[#E67CAE]" />
              </div>

              <h3 className="font-serif text-2xl font-bold text-white tracking-tight">
                Brain Tumor MRI Detection
              </h3>

              <p className="text-xs text-[#BAB4A3] leading-relaxed">
                MRI scan analysis, lesion localization, tumor probability scoring, risk stratification & interactive neuro-diagnostic dashboard.
              </p>

              <div className="bg-[#161513] rounded-xl border border-[#3A3831] p-3 space-y-1.5 text-xs text-[#BAB4A3]">
                <div className="flex items-center justify-between">
                  <span>Lesion Localization:</span>
                  <span className="text-[#E67CAE] font-bold">3D Mesh Ready</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Probability Stratification:</span>
                  <span className="text-white font-bold">High Precision</span>
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-[#3A3831] flex items-center justify-between text-xs text-[#8C8778]">
              <span>Neuro-Oncology AI</span>
              <span className="text-[#E67CAE] font-bold">Diagnostic Dashboard</span>
            </div>
          </div>

          {/* Card 6: Skin Allergy & Lesion Classifier */}
          <div className="bg-[#252420] border border-[#3A3831] rounded-[28px] p-6 space-y-5 hover:border-[#8C6B1F] transition-all group flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider bg-[#33312B] text-[#F4E071] px-3 py-1 rounded-full border border-[#474439]">
                  Smartphone & Dermatoscope Vision
                </span>
                <MaterialIcon name="bolt" className="text-xl text-[#F4E071]" />
              </div>

              <h3 className="font-serif text-2xl font-bold text-white tracking-tight">
                Skin Allergy & Dermatoscope Lesion Classifier
              </h3>

              <p className="text-xs text-[#BAB4A3] leading-relaxed">
                Ingests both standard smartphone images and high-resolution dermatoscope photography to classify skin allergies, benign lesions & melanoma risk.
              </p>

              <div className="bg-[#161513] rounded-xl border border-[#3A3831] p-3 space-y-1.5 text-xs text-[#BAB4A3]">
                <div className="flex items-center justify-between">
                  <span>Image Ingestion:</span>
                  <span className="text-white font-bold">Mobile & Dermatoscope</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Detection Scope:</span>
                  <span className="text-[#F4E071] font-bold">Melanoma & Rash</span>
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-[#3A3831] flex items-center justify-between text-xs text-[#8C8778]">
              <span className="flex items-center gap-1 text-white">
                <MaterialIcon name="check_circle" className="text-sm text-[#4EBD88]" />
                Clinical AI
              </span>
              <a
                href="#interactive-showcase"
                className="text-[#F4E071] font-bold hover:underline flex items-center gap-1"
              >
                <span>TEST CLASSIFIER</span>
                <MaterialIcon name="chevron_right" className="text-sm text-[#F4E071]" />
              </a>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
}
