"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, useScroll, useTransform, useMotionValueEvent } from "motion/react";
import { MaterialIcon } from "@/components/ui/MaterialIcon";

import ScrollFloat from "@/components/ui/ScrollFloat";

export function InteractiveFeatureShowcase() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const [maxScrollX, setMaxScrollX] = useState(0);
  const [activeStep, setActiveStep] = useState(0);

  // Setup vertical-to-horizontal scroll driver
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end end"],
  });

  // Calculate maximum X offset for responsive horizontal scrolling
  useEffect(() => {
    const calculateWidth = () => {
      if (trackRef.current) {
        const totalTrackWidth = trackRef.current.scrollWidth;
        const visibleWidth = window.innerWidth;
        const maxScroll = totalTrackWidth - visibleWidth;
        setMaxScrollX(maxScroll > 0 ? maxScroll : 0);
      }
    };

    calculateWidth();
    window.addEventListener("resize", calculateWidth);
    return () => window.removeEventListener("resize", calculateWidth);
  }, []);

  const x = useTransform(scrollYProgress, [0, 0.05, 0.95, 1], [0, 0, -maxScrollX, -maxScrollX]);

  // Sync active tab state with scroll progress
  useMotionValueEvent(scrollYProgress, "change", (latest) => {
    if (latest < 0.20) setActiveStep(0);
    else if (latest < 0.50) setActiveStep(1);
    else if (latest < 0.80) setActiveStep(2);
    else setActiveStep(3);
  });

  // Smooth scroll page to the target feature slide
  const scrollToStep = (index: number) => {
    if (!sectionRef.current) return;
    const rect = sectionRef.current.getBoundingClientRect();
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const sectionTop = rect.top + scrollTop;
    const sectionHeight = sectionRef.current.offsetHeight - window.innerHeight;

    // Target position corresponding to step keyframes (0.05 to 0.95)
    const targetProgress = 0.05 + (index / 3) * 0.90;
    const stepTarget = sectionTop + targetProgress * sectionHeight;
    window.scrollTo({
      top: stepTarget,
      behavior: "smooth",
    });
  };

  // Chatbot State
  const [chatMessages, setChatMessages] = useState([
    {
      sender: "ai",
      text: "Hello! I am Hippo Health AI Chatbot with Retrieval-Augmented Generation (RAG). How can I assist you with your health or uploaded medical reports today?",
    },
    {
      sender: "user",
      text: "I recently uploaded my blood test. Can you check my cholesterol and give me personalized diet advice?",
    },
    {
      sender: "ai",
      text: "Based on your uploaded lab report (Ref #L-902), your Total Cholesterol is 215 mg/dL (slightly elevated) and HDL is 55 mg/dL. I recommend increasing soluble fiber intake (oats, legumes) and omega-3 fatty acids, while keeping saturated fats under 7% of total calories. I have queued this draft for Dr. Chen's verification.",
    },
  ]);
  const [chatInput, setChatInput] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [ragEnabled, setRagEnabled] = useState(true);

  const handleSendMessage = (textToSend?: string) => {
    const message = textToSend || chatInput;
    if (!message.trim()) return;

    const newMsgs = [...chatMessages, { sender: "user", text: message }];
    setChatMessages(newMsgs);
    setChatInput("");

    setTimeout(() => {
      let reply = "Thank you for sharing your symptoms. I am processing your query against Hippo Health's medical knowledge base. I recommend monitoring your symptoms for 24 hours and consulting Dr. Chen through your Hippo portal.";
      if (message.toLowerCase().includes("headache") || message.toLowerCase().includes("pain")) {
        reply = "I note your symptom description. Ensure adequate hydration and rest. If pain persists above 6/10 or is accompanied by vision changes, seek immediate clinical evaluation.";
      }
      setChatMessages((prev) => [...prev, { sender: "ai", text: reply }]);
    }, 800);
  };

  // Doctor Verification State
  const [doctorNotes, setDoctorNotes] = useState(
    "Approved. Added recommendation for daily 30-min brisk walk. Adjust sodium intake to < 2,000mg/day."
  );
  const [isApproved, setIsApproved] = useState(false);

  // Smartwatch State
  const [heartRate, setHeartRate] = useState(72);
  const [spO2, setSpO2] = useState(98);
  const [sleepHrs, setSleepHrs] = useState(7.5);

  // Anatomy State
  const [selectedSystem, setSelectedSystem] = useState<"cardio" | "respiratory" | "neuro" | "skeletal">("cardio");
  const [highlightedOrgan, setHighlightedOrgan] = useState<string>("Heart & Coronary Arteries");

  const anatomyDetails = {
    cardio: {
      title: "Cardiovascular System",
      organ: "Heart & Coronary Arteries",
      disease: "Coronary Artery Disease & Atherosclerosis",
      symptoms: "Chest tightness, shortness of breath, fatigue during exertion",
      explanation:
        "Plaque buildup narrows coronary arteries, reducing oxygen delivery to heart muscle. AI predicts risk via XGBoost model.",
    },
    respiratory: {
      title: "Respiratory System",
      organ: "Lungs & Pulmonary Alveoli",
      disease: "Pneumonia & Pulmonary Edema",
      symptoms: "Persistent cough, fever, localized rales, decreased SpO₂",
      explanation:
        "Infection causes fluid accumulation in alveoli. Detected using YOLOv11 & TorchXRayVision bounding boxes.",
    },
    neuro: {
      title: "Nervous System",
      organ: "Cerebral Cortex & Brain Stem",
      disease: "Glioma & Meningioma Lesions",
      symptoms: "Localized headaches, cognitive shifts, motor weakness",
      explanation:
        "MRI volume analysis identifies space-occupying lesions with probability stratification.",
    },
    skeletal: {
      title: "Skeletal System",
      organ: "Radius, Femur & Tibia Bones",
      disease: "Acute Bone Fractures & Fissures",
      symptoms: "Localized acute trauma pain, swelling, deformity",
      explanation:
        "Universal radiograph vision model automatically ingests X-rays and draws precise bounding boxes around fractures.",
    },
  };

  const stepsInfo = [
    { title: "1. AI Medical Chatbot", icon: "chat", color: "text-[#8C6B1F]" },
    { title: "2. Doctor-Verified AI", icon: "stethoscope", color: "text-[#1C5396]" },
    { title: "3. Smartwatch Sync", icon: "watch", color: "text-[#1E734C]" },
    { title: "4. 3D Anatomy Viewer", icon: "visibility", color: "text-[#942A5C]" },
  ];

  return (
    <section
      ref={sectionRef}
      id="interactive-showcase"
      className="relative h-[450vh] sm:h-[500vh] bg-[#F6F4EF]"
    >
      {/* Sticky Viewport Container */}
      <div className="sticky top-0 h-screen w-full flex flex-col justify-between overflow-hidden py-4 sm:py-6 px-3 sm:px-6 lg:px-8">
        
        {/* Header and Step Controls */}
        <div className="w-full max-w-7xl mx-auto space-y-3 shrink-0 pt-2">
          <div className="text-center space-y-1">
            <ScrollFloat
              as="h2"
              animationDuration={1}
              ease="back.inOut(2)"
              stagger={0.03}
              containerClassName="font-serif text-3xl sm:text-4xl lg:text-5xl font-normal text-[#1C1B18] tracking-tight"
            >
              Experience Hippo Health <span className="text-[#8C6B1F]">Live</span>
            </ScrollFloat>
            <p className="text-xs sm:text-sm text-[#595446] font-sans max-w-xl mx-auto">
              Scroll down to explore interactive AI medical chatbots, doctor verification, smartwatch sync, and 3D organ modeling in horizontal motion.
            </p>
          </div>

          {/* Interactive Step Navigator Pills */}
          <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
            {stepsInfo.map((step, idx) => (
              <button
                key={idx}
                onClick={() => scrollToStep(idx)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all border ${
                  activeStep === idx
                    ? "bg-[#1C1B18] text-white border-[#1C1B18] shadow-md scale-105"
                    : "bg-white text-[#4D493E] border-[#E3DAC4] hover:bg-[#FAF6E8]"
                }`}
              >
                <MaterialIcon name={step.icon} className={`text-sm ${activeStep === idx ? "text-[#F4E071]" : step.color}`} />
                <span>{step.title}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Horizontal Track Viewport */}
        <div className="w-full overflow-hidden my-auto py-2">
          <motion.div
            ref={trackRef}
            style={{ x }}
            className="flex items-center gap-6 sm:gap-10 px-4 sm:px-12 w-max"
          >
            {/* PART 1: AI MEDICAL CHATBOT SIMULATOR */}
            <div className="w-[90vw] sm:w-[82vw] lg:w-[75vw] xl:w-[70vw] max-w-5xl shrink-0 bg-white border border-[#E6E1D3] rounded-[28px] sm:rounded-[36px] p-5 sm:p-8 shadow-lg">
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#EBE6D8] gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#2C7A4D] animate-pulse" />
                      <h3 className="font-serif text-xl sm:text-2xl font-bold text-[#1C1B18]">
                        1. Hippo AI Medical Assistant & RAG Engine
                      </h3>
                    </div>
                    <p className="text-xs text-[#736E5E] mt-0.5">
                      Context-aware memory active • Upload lab reports • Voice input support
                    </p>
                  </div>

                  <button
                    onClick={() => setRagEnabled(!ragEnabled)}
                    className={`text-xs px-3.5 py-1.5 rounded-full font-semibold border transition-all self-start sm:self-auto ${
                      ragEnabled
                        ? "bg-[#E6F5EE] border-[#B2E6CF] text-[#1E734C]"
                        : "bg-gray-100 border-gray-300 text-gray-500"
                    }`}
                  >
                    {ragEnabled ? "✓ RAG Knowledge Base ON" : "RAG Standard"}
                  </button>
                </div>

                {/* Chat Box Display */}
                <div className="h-64 sm:h-72 overflow-y-auto space-y-3 p-4 bg-[#FAF6E8]/60 border border-[#EDE4CD] rounded-2xl">
                  {chatMessages.map((msg, i) => (
                    <div
                      key={i}
                      className={`flex items-start gap-3 ${
                        msg.sender === "user" ? "flex-row-reverse" : ""
                      }`}
                    >
                      <div
                        className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                          msg.sender === "user"
                            ? "bg-[#1C1B18] text-white"
                            : "bg-[#8C6B1F] text-white"
                        }`}
                      >
                        {msg.sender === "user" ? "You" : <MaterialIcon name="smart_toy" className="text-sm sm:text-base text-white" />}
                      </div>
                      <div
                        className={`max-w-xl text-xs sm:text-sm p-3.5 sm:p-4 rounded-2xl shadow-2xs font-sans leading-relaxed ${
                          msg.sender === "user"
                            ? "bg-[#1C1B18] text-white rounded-tr-none"
                            : "bg-white text-[#1C1B18] border border-[#E3DAC4] rounded-tl-none"
                        }`}
                      >
                        {msg.text}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Quick Prompt Suggestions */}
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <span className="text-xs font-bold text-[#787363]">Sample Prompts:</span>
                  <button
                    onClick={() => handleSendMessage("Analyze my uploaded chest X-ray report")}
                    className="text-xs bg-[#FAF6E8] hover:bg-[#F4E071]/50 border border-[#E3DAC4] px-3 py-1 rounded-full text-[#594918] transition-colors"
                  >
                    &quot;Analyze chest X-ray&quot;
                  </button>
                  <button
                    onClick={() => handleSendMessage("What diet is best for low SpO2 recovery?")}
                    className="text-xs bg-[#FAF6E8] hover:bg-[#F4E071]/50 border border-[#E3DAC4] px-3 py-1 rounded-full text-[#594918] transition-colors"
                  >
                    &quot;Diet for low SpO2&quot;
                  </button>
                </div>

                {/* Input Bar */}
                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={() => alert("Simulated File Upload: Select PDF/Image Lab Report")}
                    className="p-2.5 sm:p-3 bg-[#F6F4EF] hover:bg-[#EBE6D8] border border-[#E3DAC4] rounded-xl text-[#1C1B18] transition-colors"
                    title="Upload Report"
                  >
                    <MaterialIcon name="upload" className="text-base" />
                  </button>
                  <button
                    onClick={() => setIsRecording(!isRecording)}
                    className={`p-2.5 sm:p-3 border rounded-xl transition-colors ${
                      isRecording
                        ? "bg-red-500 text-white border-red-600 animate-pulse"
                        : "bg-[#F6F4EF] hover:bg-[#EBE6D8] border-[#E3DAC4] text-[#1C1B18]"
                    }`}
                    title="Voice Input"
                  >
                    <MaterialIcon name="mic" className="text-base" />
                  </button>

                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                    placeholder="Ask Hippo AI any medical question..."
                    className="flex-1 bg-[#F6F4EF] border border-[#E3DAC4] rounded-xl px-4 py-2.5 text-xs sm:text-sm text-[#1C1B18] focus:outline-none focus:ring-2 focus:ring-[#8C6B1F]"
                  />

                  <button
                    onClick={() => handleSendMessage()}
                    className="bg-[#1C1B18] hover:bg-[#33312B] text-white px-4 sm:px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-colors"
                  >
                    <span>Send</span>
                    <MaterialIcon name="send" className="text-sm text-white" />
                  </button>
                </div>
              </div>
            </div>

            {/* PART 2: DOCTOR-VERIFIED AI WORKFLOW */}
            <div className="w-[90vw] sm:w-[82vw] lg:w-[75vw] xl:w-[70vw] max-w-5xl shrink-0 bg-white border border-[#E6E1D3] rounded-[28px] sm:rounded-[36px] p-5 sm:p-8 shadow-lg">
              <div className="space-y-4">
                <div className="pb-3 border-b border-[#EBE6D8]">
                  <h3 className="font-serif text-xl sm:text-2xl font-bold text-[#1C1B18]">
                    2. Doctor Verification & Clinical Co-Pilot Studio
                  </h3>
                  <p className="text-xs text-[#736E5E] mt-0.5">
                    AI generates baseline recommendations → Licensed doctors review, modify & verify before final release to patient.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                  {/* Left Column: AI Draft Recommendation */}
                  <div className="bg-[#FAF6E8] border border-[#EDE4CD] rounded-2xl p-4 sm:p-5 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <MaterialIcon name="smart_toy" className="text-base text-[#8C6B1F]" />
                        <span className="text-xs font-bold text-[#1C1B18] uppercase tracking-wider">
                          AI Draft Recommendation
                        </span>
                      </div>
                      <span className="text-[10px] bg-white border border-[#E3DAC4] text-[#8C6B1F] px-2 py-0.5 rounded-full font-bold">
                        Confidence: 97.8%
                      </span>
                    </div>

                    <div className="space-y-2 text-xs text-[#423E34] font-sans">
                      <p><strong>Patient:</strong> Marcus Vance (ID: #PV-9041)</p>
                      <p><strong>Primary Symptoms:</strong> Recurrent fatigue, resting heart rate 86 bpm, elevated LDL cholesterol.</p>
                      <div className="bg-white border border-[#E3DAC4] p-3 rounded-xl space-y-1">
                        <p className="font-bold text-[#1C1B18]">Proposed AI Action Plan:</p>
                        <ul className="list-disc pl-4 space-y-1 text-[#524E43]">
                          <li>Initiate lipid-lowering Mediterranean dietary protocol.</li>
                          <li>Schedule baseline 12-lead ECG & Echocardiogram.</li>
                          <li>Smartwatch continuous SpO₂ and sleep apnea screening.</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Doctor Review & Approval Editor */}
                  <div className="bg-[#E8F2FC]/70 border border-[#B5D5F5] rounded-2xl p-4 sm:p-5 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <MaterialIcon name="person_check" className="text-base text-[#1C5396]" />
                        <span className="text-xs font-bold text-[#1C5396] uppercase tracking-wider">
                          Doctor Review Workspace
                        </span>
                      </div>
                      <span className="text-[10px] bg-[#1C5396] text-white px-2 py-0.5 rounded-full font-bold">
                        Dr. Sarah Chen, MD
                      </span>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold text-[#1C5396] flex items-center gap-1">
                        <MaterialIcon name="edit" className="text-sm text-[#1C5396]" />
                        Doctor Clinical Notes & Modifications:
                      </label>
                      <textarea
                        value={doctorNotes}
                        onChange={(e) => setDoctorNotes(e.target.value)}
                        rows={3}
                        className="w-full bg-white border border-[#B5D5F5] rounded-xl p-3 text-xs text-[#1C1B18] focus:outline-none focus:ring-2 focus:ring-[#1C5396]"
                      />
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <button
                        onClick={() => setIsApproved(!isApproved)}
                        className={`w-full py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                          isApproved
                            ? "bg-[#2C7A4D] text-white shadow-md"
                            : "bg-[#1C5396] hover:bg-[#154178] text-white shadow-sm"
                        }`}
                      >
                        {isApproved ? (
                          <>
                            <MaterialIcon name="check" className="text-base" />
                            <span>FINAL CARE PLAN APPROVED & VERIFIED</span>
                          </>
                        ) : (
                          <>
                            <MaterialIcon name="check_circle" className="text-base" />
                            <span>APPROVE & RELEASE TO PATIENT</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Bottom Status Banner */}
                {isApproved && (
                  <div className="bg-[#E6F5EE] border border-[#B2E6CF] p-3 rounded-xl flex items-center gap-3 text-xs text-[#155939] font-medium">
                    <MaterialIcon name="check_circle" className="text-xl text-[#2C7A4D] shrink-0" />
                    <span>
                      Care plan verified by Dr. Sarah Chen, MD. Patient Marcus Vance will receive notification with verified clinical instructions and updated smartwatch target metrics.
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* PART 3: SMARTWATCH HEALTH SYNC DASHBOARD */}
            <div className="w-[90vw] sm:w-[82vw] lg:w-[75vw] xl:w-[70vw] max-w-5xl shrink-0 bg-white border border-[#E6E1D3] rounded-[28px] sm:rounded-[36px] p-5 sm:p-8 shadow-lg">
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#EBE6D8] gap-2">
                  <div>
                    <h3 className="font-serif text-xl sm:text-2xl font-bold text-[#1C1B18]">
                      3. Smartwatch Integration & Google Health API Engine
                    </h3>
                    <p className="text-xs text-[#736E5E] mt-0.5">
                      Real-time telemetry sync • Automated AI Diet & Activity Recommendations
                    </p>
                  </div>
                  <span className="text-xs bg-[#E6F5EE] border border-[#B2E6CF] text-[#1E734C] px-3 py-1 rounded-full font-bold self-start sm:self-auto">
                    ● Live API Connected
                  </span>
                </div>

                {/* Biometric Cards Grid */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  <div className="bg-[#FAF6E8] border border-[#EDE4CD] p-3 rounded-2xl space-y-1.5">
                    <div className="flex items-center justify-between text-[#8C6B1F]">
                      <MaterialIcon name="favorite" className="text-base text-[#8C6B1F]" fill />
                      <span className="text-[10px] font-bold uppercase">Heart Rate</span>
                    </div>
                    <div className="text-xl sm:text-2xl font-serif font-bold text-[#1C1B18]">
                      {heartRate} <span className="text-xs font-sans font-normal text-[#787363]">bpm</span>
                    </div>
                    <input
                      type="range"
                      min="55"
                      max="120"
                      value={heartRate}
                      onChange={(e) => setHeartRate(Number(e.target.value))}
                      className="w-full accent-[#8C6B1F]"
                    />
                  </div>

                  <div className="bg-[#E8F2FC] border border-[#B5D5F5] p-3 rounded-2xl space-y-1.5">
                    <div className="flex items-center justify-between text-[#1C5396]">
                      <MaterialIcon name="vital_signs" className="text-base text-[#1C5396]" />
                      <span className="text-[10px] font-bold uppercase">SpO₂ Level</span>
                    </div>
                    <div className="text-xl sm:text-2xl font-serif font-bold text-[#1C1B18]">{spO2}%</div>
                    <input
                      type="range"
                      min="92"
                      max="100"
                      value={spO2}
                      onChange={(e) => setSpO2(Number(e.target.value))}
                      className="w-full accent-[#1C5396]"
                    />
                  </div>

                  <div className="bg-[#E6F5EE] border border-[#B2E6CF] p-3 rounded-2xl space-y-1.5">
                    <div className="flex items-center justify-between text-[#1E734C]">
                      <MaterialIcon name="bedtime" className="text-base text-[#1E734C]" />
                      <span className="text-[10px] font-bold uppercase">Sleep</span>
                    </div>
                    <div className="text-xl sm:text-2xl font-serif font-bold text-[#1C1B18]">
                      {sleepHrs} <span className="text-xs font-sans font-normal text-[#787363]">hrs</span>
                    </div>
                    <input
                      type="range"
                      min="4"
                      max="10"
                      step="0.5"
                      value={sleepHrs}
                      onChange={(e) => setSleepHrs(Number(e.target.value))}
                      className="w-full accent-[#1E734C]"
                    />
                  </div>

                  <div className="bg-[#FBEBF2] border border-[#F5C4DB] p-3 rounded-2xl space-y-1.5">
                    <div className="flex items-center justify-between text-[#942A5C]">
                      <MaterialIcon name="footprint" className="text-base text-[#942A5C]" />
                      <span className="text-[10px] font-bold uppercase">Steps</span>
                    </div>
                    <div className="text-xl sm:text-2xl font-serif font-bold text-[#1C1B18]">8,420</div>
                    <span className="text-[10px] text-[#942A5C] font-semibold">Goal: 10,000 steps</span>
                  </div>

                  <div className="bg-[#FAF2D6] border border-[#E8DAA8] p-3 rounded-2xl space-y-1.5 col-span-2 md:col-span-1">
                    <div className="flex items-center justify-between text-[#6B571B]">
                      <MaterialIcon name="local_fire_department" className="text-base text-[#6B571B]" fill />
                      <span className="text-[10px] font-bold uppercase">Calories</span>
                    </div>
                    <div className="text-xl sm:text-2xl font-serif font-bold text-[#1C1B18]">
                      2,150 <span className="text-xs font-sans font-normal text-[#787363]">kcal</span>
                    </div>
                    <span className="text-[10px] text-[#6B571B] font-semibold">Active: 620 kcal</span>
                  </div>
                </div>

                {/* AI Generated Diet & Recovery Panel */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                  <div className="bg-[#FAF6E8] border border-[#EDE4CD] rounded-2xl p-4 space-y-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-[#8C6B1F] flex items-center gap-2">
                      <MaterialIcon name="auto_awesome" className="text-base text-[#8C6B1F]" />
                      AI Personalized Diet Plan
                    </h4>
                    <div className="space-y-1.5 text-xs text-[#38352E]">
                      <div className="p-2 bg-white rounded-lg border border-[#E3DAC4]">
                        <strong>Breakfast:</strong> Oats, blueberries & almond milk (350 kcal)
                      </div>
                      <div className="p-2 bg-white rounded-lg border border-[#E3DAC4]">
                        <strong>Lunch:</strong> Wild salmon salad & lemon vinaigrette (520 kcal)
                      </div>
                    </div>
                  </div>

                  <div className="bg-[#E6F5EE] border border-[#B2E6CF] rounded-2xl p-4 space-y-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-[#1E734C] flex items-center gap-2">
                      <MaterialIcon name="bolt" className="text-base text-[#1E734C]" />
                      Recovery & Timetable Insights
                    </h4>
                    <div className="space-y-1.5 text-xs text-[#155939]">
                      <p>
                        <strong>Recovery Score: 88% (Optimal)</strong> — Muscle recovery is elevated based on {sleepHrs}h sleep.
                      </p>
                      <div className="p-2 bg-white rounded-lg border border-[#B2E6CF]">
                        <span className="font-bold">AI Timetable:</span> 17:30 30-min Jogging • 19:00 Hydration (2.5L)
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* PART 4: 3D HUMAN ANATOMY VIEWER */}
            <div className="w-[90vw] sm:w-[82vw] lg:w-[75vw] xl:w-[70vw] max-w-5xl shrink-0 bg-white border border-[#E6E1D3] rounded-[28px] sm:rounded-[36px] p-5 sm:p-8 shadow-lg">
              <div className="space-y-4">
                <div className="pb-3 border-b border-[#EBE6D8]">
                  <h3 className="font-serif text-xl sm:text-2xl font-bold text-[#1C1B18]">
                    4. 3D Human Anatomy & Organ Disease Visualizer
                  </h3>
                  <p className="text-xs text-[#736E5E] mt-0.5">
                    Interactive anatomical explorer for patient education & clinical diagnostic reference.
                  </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                  {/* Left Column: System Toggles & Sphere */}
                  <div className="lg:col-span-5 flex flex-col items-center bg-[#FAF6E8] border border-[#EDE4CD] rounded-2xl p-4 space-y-4">
                    {/* System Buttons */}
                    <div className="grid grid-cols-2 gap-2 w-full">
                      <button
                        onClick={() => {
                          setSelectedSystem("cardio");
                          setHighlightedOrgan("Heart & Coronary Arteries");
                        }}
                        className={`p-2 rounded-xl text-xs font-bold transition-all ${
                          selectedSystem === "cardio"
                            ? "bg-[#1C1B18] text-white"
                            : "bg-white text-[#4D493E] hover:bg-[#EBE6D8]"
                        }`}
                      >
                        🫀 Cardio
                      </button>
                      <button
                        onClick={() => {
                          setSelectedSystem("respiratory");
                          setHighlightedOrgan("Lungs & Alveoli");
                        }}
                        className={`p-2 rounded-xl text-xs font-bold transition-all ${
                          selectedSystem === "respiratory"
                            ? "bg-[#1C1B18] text-white"
                            : "bg-white text-[#4D493E] hover:bg-[#EBE6D8]"
                        }`}
                      >
                        🫁 Respiratory
                      </button>
                      <button
                        onClick={() => {
                          setSelectedSystem("neuro");
                          setHighlightedOrgan("Brain Cortex");
                        }}
                        className={`p-2 rounded-xl text-xs font-bold transition-all ${
                          selectedSystem === "neuro"
                            ? "bg-[#1C1B18] text-white"
                            : "bg-white text-[#4D493E] hover:bg-[#EBE6D8]"
                        }`}
                      >
                        🧠 Nervous
                      </button>
                      <button
                        onClick={() => {
                          setSelectedSystem("skeletal");
                          setHighlightedOrgan("Femur & Radius");
                        }}
                        className={`p-2 rounded-xl text-xs font-bold transition-all ${
                          selectedSystem === "skeletal"
                            ? "bg-[#1C1B18] text-white"
                            : "bg-white text-[#4D493E] hover:bg-[#EBE6D8]"
                        }`}
                      >
                        🦴 Skeletal
                      </button>
                    </div>

                    {/* Simulated 3D Graphic */}
                    <div className="relative w-40 h-44 bg-white border border-[#E3DAC4] rounded-full flex flex-col items-center justify-center p-3 shadow-inner">
                      <div className="w-14 h-14 rounded-full bg-[#FAF6E8] border border-[#8C6B1F] flex items-center justify-center text-2xl animate-bounce">
                        {selectedSystem === "cardio" && "🫀"}
                        {selectedSystem === "respiratory" && "🫁"}
                        {selectedSystem === "neuro" && "🧠"}
                        {selectedSystem === "skeletal" && "🦴"}
                      </div>
                      <span className="mt-3 text-[10px] uppercase font-bold text-[#8C6B1F] bg-[#FAF6E8] px-2.5 py-0.5 rounded-full border border-[#E8DAA8]">
                        {highlightedOrgan}
                      </span>
                    </div>
                  </div>

                  {/* Right Column: Educational Detail Panel */}
                  <div className="lg:col-span-7 space-y-3">
                    <div className="bg-[#E8F2FC] border border-[#B5D5F5] p-4 sm:p-5 rounded-2xl space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-[#1C5396] uppercase tracking-wider">
                          {anatomyDetails[selectedSystem].title}
                        </span>
                        <span className="text-[10px] bg-[#1C5396] text-white px-2 py-0.5 rounded-full font-bold">
                          3D Model
                        </span>
                      </div>

                      <h4 className="font-serif text-xl sm:text-2xl font-bold text-[#1C1B18]">
                        {anatomyDetails[selectedSystem].organ}
                      </h4>

                      <div className="space-y-1.5 text-xs text-[#38352E]">
                        <p>
                          <strong className="text-[#1C1B18]">Associated Condition:</strong>{" "}
                          {anatomyDetails[selectedSystem].disease}
                        </p>
                        <p>
                          <strong className="text-[#1C1B18]">Clinical Symptoms:</strong>{" "}
                          {anatomyDetails[selectedSystem].symptoms}
                        </p>
                        <div className="p-3 bg-white rounded-xl border border-[#B5D5F5] text-[#423E34] leading-relaxed">
                          <strong className="text-[#1C5396]">Pathology & AI Explanation:</strong>{" "}
                          {anatomyDetails[selectedSystem].explanation}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </motion.div>
        </div>

        {/* Bottom Horizontal Progress Bar Indicator */}
        <div className="w-full max-w-xl mx-auto space-y-2 shrink-0 pb-2">
          <div className="flex items-center justify-between text-xs font-bold text-[#787363]">
            <span>Part {activeStep + 1} of 4</span>
            <span className="hidden sm:inline-block text-[#8C6B1F]">
              Scroll down to navigate horizontally →
            </span>
          </div>
          <div className="w-full h-1.5 bg-[#E6E1D3] rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-[#1C1B18] rounded-full"
              style={{
                width: useTransform(scrollYProgress, [0, 1], ["25%", "100%"]),
              }}
            />
          </div>
        </div>

      </div>
    </section>
  );
}
