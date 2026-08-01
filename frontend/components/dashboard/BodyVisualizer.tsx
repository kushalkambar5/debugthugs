"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";

interface LayerPosition {
  top: string;
  left: string;
  width: string;
  transform: string;
  height?: string;
}

interface DetailedStage {
  stage: number;
  id: string;
  name: string;
  file: string;
  type: "full-body" | "organ";
  zIndex: number;
  color: string;
  emoji: string;
  description: string;
  position?: LayerPosition;
  positions?: LayerPosition[];
}

interface KeyFrameStage {
  stage: number;
  name: string;
  color: string;
  emoji: string;
  description: string;
  layers: string[];
}

const DETAILED_STAGES: DetailedStage[] = [
  {
    stage: 1,
    id: "skeleton",
    name: "Skeleton Structure",
    file: "/human_body_parts/human_skeleton.png",
    type: "full-body",
    zIndex: 1,
    color: "#38bdf8",
    emoji: "🦴",
    description: "Group 1: Completely isolated full skeleton view.",
  },
  {
    stage: 2,
    id: "circulatory",
    name: "Circulatory System",
    file: "/human_body_parts/human_circulatory_system.png",
    type: "full-body",
    zIndex: 2,
    color: "#ef4444",
    emoji: "🩸",
    description: "Group 2: Completely isolated circulatory system view.",
  },
  {
    stage: 3,
    id: "urinary",
    name: "Urinary System",
    file: "/human_body_parts/human_urinary_system.png",
    type: "organ",
    zIndex: 3,
    color: "#f97316",
    emoji: "🫘",
    position: { top: "38%", left: "50%", width: "28%", transform: "translateX(-50%)" },
    description: "Group 3 (Internal Organs): Start of organ group accumulation (Stage 3).",
  },
  {
    stage: 4,
    id: "digestive",
    name: "Digestive System",
    file: "/human_body_parts/human_digestive_system.png",
    type: "organ",
    zIndex: 4,
    color: "#f59e0b",
    emoji: "🫄",
    position: { top: "27%", left: "50%", width: "30%", transform: "translateX(-50%)" },
    description: "Group 3 (Internal Organs): Accumulating organ group members (Stage 3-4).",
  },
  {
    stage: 5,
    id: "gallbladder",
    name: "Gallbladder",
    file: "/human_body_parts/human_Gallbladder.png",
    type: "organ",
    zIndex: 5,
    color: "#84cc16",
    emoji: "🟢",
    position: { top: "34%", left: "42%", width: "10%", transform: "translateX(-50%)" },
    description: "Group 3 (Internal Organs): Accumulating organ group members (Stage 3-5).",
  },
  {
    stage: 6,
    id: "liver",
    name: "Liver",
    file: "/human_body_parts/human_liver.png",
    type: "organ",
    zIndex: 6,
    color: "#dc2626",
    emoji: "🫁",
    position: { top: "30%", left: "49%", width: "20%", transform: "translateX(-50%)" },
    description: "Group 3 (Internal Organs): Accumulating organ group members (Stage 3-6).",
  },
  {
    stage: 7,
    id: "diaphragm",
    name: "Diaphragm",
    file: "/human_body_parts/human_diafragma.png",
    type: "organ",
    zIndex: 7,
    color: "#a855f7",
    emoji: "🫧",
    position: { top: "30%", left: "50%", width: "28%", transform: "translateX(-50%)" },
    description: "Group 3 (Internal Organs): Accumulating organ group members (Stage 3-7).",
  },
  {
    stage: 8,
    id: "heart",
    name: "Heart",
    file: "/human_body_parts/human_heart.png",
    type: "organ",
    zIndex: 8,
    color: "#e11d48",
    emoji: "❤️",
    position: { top: "22%", left: "51%", width: "14%", transform: "translateX(-50%)" },
    description: "Group 3 (Internal Organs): Accumulating organ group members (Stage 3-8).",
  },
  {
    stage: 9,
    id: "lungs",
    name: "Lungs",
    file: "/human_body_parts/human_lungs.png",
    type: "organ",
    zIndex: 9,
    color: "#fb7185",
    emoji: "🫁",
    position: { top: "18.5%", left: "50%", width: "50%", transform: "translateX(-50%)" },
    description: "Group 3 (Internal Organs): Complete set of internal organs (Stage 3-9).",
  },
  {
    stage: 10,
    id: "brain",
    name: "Brain",
    file: "/human_body_parts/human_brain.png",
    type: "organ",
    zIndex: 10,
    color: "#ec4899",
    emoji: "🧠",
    position: { top: "4.2%", left: "50%", width: "16%", transform: "translateX(-50%)" },
    description: "Group 3 (Internal Organs & Head): Accumulating organ & brain group members (Stage 3-10).",
  },
  {
    stage: 11,
    id: "eyes",
    name: "Eyes",
    file: "/human_body_parts/human_eye.png",
    type: "organ",
    zIndex: 11,
    color: "#06b6d4",
    emoji: "👁️",
    positions: [
      { top: "12%", left: "46.8%", width: "4.5%", transform: "translateX(-50%)" },
      { top: "12%", left: "53.2%", width: "4.5%", transform: "translateX(-50%)" },
    ],
    description: "Group 3 (Internal Organs & Head): Complete set of organs, brain, and eyes (Stage 3-11).",
  },
  {
    stage: 12,
    id: "muscles",
    name: "Muscular System",
    file: "/human_body_parts/human_muscles_body.png",
    type: "full-body",
    zIndex: 12,
    color: "#ea580c",
    emoji: "💪",
    description: "Group 4: Completely isolated muscular system view.",
  },
  {
    stage: 13,
    id: "skin",
    name: "Full Body (Skin)",
    file: "/human_body_parts/human_skin_body.png",
    type: "full-body",
    zIndex: 13,
    color: "#f59e0b",
    emoji: "🧑",
    description: "Group 5 (Stage 13): Completely isolated full body skin cover.",
  },
];

const KEYFRAME_STAGES: KeyFrameStage[] = [
  {
    stage: 1,
    name: "Frame 1: Bone Structure",
    color: "#38bdf8",
    emoji: "🦴",
    description: "Isolated view of the skeletal system without muscles or skin.",
    layers: ["skeleton"],
  },
  {
    stage: 2,
    name: "Frame 2: Circulatory System",
    color: "#ef4444",
    emoji: "🩸",
    description: "Isolated view of the circulatory blood vessel & neural pathway network.",
    layers: ["circulatory"],
  },
  {
    stage: 3,
    name: "Frame 3: Internal Organs",
    color: "#e11d48",
    emoji: "🫀",
    description: "Isolated view of major internal organs (Heart, Lungs, Brain, Eyes, Digestive, Liver, Urinary, Diaphragm).",
    layers: ["brain", "eyes", "lungs", "heart", "liver", "gallbladder", "digestive", "urinary", "diaphragm"],
  },
  {
    stage: 4,
    name: "Frame 4: Muscular System",
    color: "#ea580c",
    emoji: "💪",
    description: "Isolated view of the muscular system responsible for movement.",
    layers: ["muscles"],
  },
  {
    stage: 5,
    name: "Frame 5: Full Body",
    color: "#f59e0b",
    emoji: "🧑",
    description: "Isolated view of the complete human body skin surface.",
    layers: ["skin"],
  },
];

export default function BodyVisualizer() {
  const [mode, setMode] = useState<"detailed" | "keyframe">("detailed");
  const [stage, setStage] = useState<number>(1);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [tooltip, setTooltip] = useState<{ text: string; x: number; y: number; visible: boolean }>({
    text: "",
    x: 0,
    y: 0,
    visible: false,
  });
  const [hoveredLayer, setHoveredLayer] = useState<string | null>(null);
  const [pulseLayer, setPulseLayer] = useState<number | null>(null);

  const activeList = mode === "detailed" ? DETAILED_STAGES : KEYFRAME_STAGES;
  const maxStages = activeList.length;
  const activeStage = activeList[stage - 1] || activeList[0];

  // Trigger layer pulse animation when stage changes
  useEffect(() => {
    setPulseLayer(stage);
    const timer = setTimeout(() => setPulseLayer(null), 600);
    return () => clearTimeout(timer);
  }, [stage, mode]);

  // Handle Autoplay Loop
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    if (isPlaying) {
      timer = setInterval(() => {
        setStage((prev) => {
          if (prev < maxStages) {
            return prev + 1;
          } else {
            setIsPlaying(false);
            return prev;
          }
        });
      }, 1800);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isPlaying, maxStages]);

  const handlePrev = () => {
    setIsPlaying(false);
    if (stage > 1) setStage(stage - 1);
  };

  const handleNext = () => {
    setIsPlaying(false);
    if (stage < maxStages) setStage(stage + 1);
  };

  const handlePlayToggle = () => {
    if (isPlaying) {
      setIsPlaying(false);
    } else {
      if (stage >= maxStages) {
        setStage(1);
      }
      setIsPlaying(true);
    }
  };

  const handleTimelineClick = (num: number) => {
    setIsPlaying(false);
    setStage(num);
  };

  const handleModeChange = (newMode: "detailed" | "keyframe") => {
    setIsPlaying(false);
    setMode(newMode);
    setStage(1);
  };

  // Determine Layer Visibility
  const isLayerVisible = (stageItem: DetailedStage) => {
    if (mode === "detailed") {
      if (stage === 1) return stageItem.stage === 1;
      if (stage === 2) return stageItem.stage === 2;
      if (stage >= 3 && stage <= 11) {
        return stageItem.stage >= 3 && stageItem.stage <= stage;
      }
      if (stage === 12) return stageItem.stage === 12;
      if (stage === 13) return stageItem.stage === 13;
      return false;
    } else {
      const allowedGroups = new Set((activeStage as KeyFrameStage).layers || []);
      return allowedGroups.has(stageItem.id);
    }
  };

  // Tooltip Handlers
  const handleMouseEnter = (e: React.MouseEvent, labelText: string, id: string) => {
    setHoveredLayer(id);
    setTooltip({
      text: labelText,
      x: e.clientX + 16,
      y: e.clientY - 10,
      visible: true,
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    setTooltip((prev) => ({
      ...prev,
      x: e.clientX + 16,
      y: e.clientY - 10,
    }));
  };

  const handleMouseLeave = () => {
    setHoveredLayer(null);
    setTooltip((prev) => ({ ...prev, visible: false }));
  };

  const progressPercent = ((stage - 1) / (maxStages - 1)) * 100;

  return (
    <div className="flex flex-col lg:flex-row min-h-[700px] w-full bg-[#FAF9F5] border border-[#E6E1D3] rounded-[32px] overflow-hidden shadow-xs relative">
      {/* Tooltip */}
      {tooltip.visible && (
        <div
          className="fixed pointer-events-none bg-[#1C1B18]/95 backdrop-blur-md text-[#F6F4EF] px-3.5 py-1.5 rounded-lg text-xs font-medium border border-[#8C6B1F]/30 shadow-md z-[9999] transition-opacity duration-150"
          style={{ left: tooltip.x, top: tooltip.y }}
        >
          {tooltip.text}
        </div>
      )}

      {/* Control Panel (Sidebar) */}
      <aside className="w-full lg:w-96 p-6 border-b lg:border-b-0 lg:border-r border-[#E6E1D3] flex flex-col gap-6 bg-[#FAF9F5] shrink-0">
        {/* Mode Switcher */}
        <div className="flex gap-2 p-1 bg-[#FAF6E8] border border-[#E6E1D3] rounded-2xl">
          <button
            onClick={() => handleModeChange("detailed")}
            className={`flex-1 py-2.5 rounded-xl font-sans text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              mode === "detailed"
                ? "bg-[#1C1B18] text-white shadow-xs"
                : "text-[#787363] hover:text-[#1C1B18]"
            }`}
          >
            <span>🔢</span> Step-by-Step (13)
          </button>
          <button
            onClick={() => handleModeChange("keyframe")}
            className={`flex-1 py-2.5 rounded-xl font-sans text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              mode === "keyframe"
                ? "bg-[#1C1B18] text-white shadow-xs"
                : "text-[#787363] hover:text-[#1C1B18]"
            }`}
          >
            <span>🖼️</span> 5 Key Frames
          </button>
        </div>

        {/* Panel Header */}
        <div className="space-y-1.5">
          <h3 className="font-serif text-xl font-bold text-[#1C1B18] flex items-center gap-2">
            <span className="w-1 h-5 bg-[#8C6B1F] rounded-full" />
            {mode === "detailed" ? "Detailed Layer Slider" : "5 Key Frames Slider"}
          </h3>
          <p className="text-xs text-[#787363] font-sans">
            {mode === "detailed"
              ? "Reveal cumulative anatomical components step-by-step."
              : "Slide through 5 isolated systems: Bones, Circulatory, Organs, Muscles, or Skin."}
          </p>
        </div>

        {/* Active Stage Card */}
        <div
          className="p-4 border rounded-2xl bg-white shadow-2xs transition-all duration-300"
          style={{ borderColor: activeStage.color }}
        >
          <span
            className="inline-block text-[10px] font-bold tracking-wider uppercase px-2.5 py-0.5 rounded-md mb-2 bg-[#FAF6E8] border"
            style={{ color: activeStage.color, borderColor: `${activeStage.color}30` }}
          >
            Stage {stage} of {maxStages}
          </span>
          <div className="text-3xl mb-2">{activeStage.emoji}</div>
          <h4 className="font-serif text-lg font-bold text-[#1C1B18] mb-1">{activeStage.name}</h4>
          <p className="text-xs text-[#615C4F] font-sans leading-relaxed">{activeStage.description}</p>
        </div>

        {/* Slider & Play Controls */}
        <div className="p-4 bg-[#FAF6E8] border border-[#E6E1D3] rounded-2xl space-y-4">
          <div className="flex justify-between text-[10px] font-bold text-[#787363] font-sans">
            <span>{mode === "detailed" ? "🦴 SKELETON" : "🦴 BONE"}</span>
            <span>🧑 FULL BODY</span>
          </div>

          {/* Slider input */}
          <div className="relative w-full h-2 flex items-center">
            <input
              type="range"
              min="1"
              max={maxStages}
              value={stage}
              onChange={(e) => {
                setIsPlaying(false);
                setStage(parseInt(e.target.value, 10));
              }}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
            />
            {/* Custom Track */}
            <div className="absolute left-0 right-0 h-2 bg-[#E6E1D3] rounded-full z-0 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-75"
                style={{
                  width: `${progressPercent}%`,
                  background: `linear-gradient(90deg, #38bdf8, #ef4444, #f97316, #ea580c, #f59e0b)`,
                }}
              />
            </div>
            {/* Custom Thumb */}
            <div
              className="absolute w-5 h-5 bg-white border-2 rounded-full z-10 -ml-2.5 flex items-center justify-center shadow-xs pointer-events-none transition-all duration-75"
              style={{
                left: `${progressPercent}%`,
                borderColor: activeStage.color,
              }}
            >
              <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: activeStage.color }} />
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handlePrev}
              disabled={stage === 1}
              className="flex-1 py-2 bg-white hover:bg-[#FAF6E8] border border-[#DCD5C5] disabled:opacity-40 disabled:hover:bg-white rounded-xl text-xs font-bold text-[#1C1B18] transition-all cursor-pointer flex items-center justify-center gap-1"
            >
              ◀ Prev
            </button>
            <button
              onClick={handlePlayToggle}
              className={`flex-1 py-2 border rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                isPlaying
                  ? "bg-[#B34515] text-white border-transparent"
                  : "bg-white hover:bg-[#FAF6E8] border border-[#DCD5C5] text-[#1C1B18]"
              }`}
            >
              {isPlaying ? (
                <>
                  <span>⏸</span> Pause
                </>
              ) : (
                <>
                  <span>▶</span> Auto Play
                </>
              )}
            </button>
            <button
              onClick={handleNext}
              disabled={stage === maxStages}
              className="flex-1 py-2 bg-white hover:bg-[#FAF6E8] border border-[#DCD5C5] disabled:opacity-40 disabled:hover:bg-white rounded-xl text-xs font-bold text-[#1C1B18] transition-all cursor-pointer flex items-center justify-center gap-1"
            >
              Next ▶
            </button>
          </div>
        </div>

        {/* Stages Timeline List */}
        <div className="flex-1 overflow-y-auto max-h-[220px] pr-1 space-y-2 custom-scrollbar">
          <div className="text-[10px] font-bold text-[#787363] uppercase tracking-wider mb-2">Stage Timeline</div>
          {activeList.map((stageItem) => {
            const isActive = stageItem.stage === stage;
            const isPassed = stageItem.stage < stage;

            return (
              <div
                key={stageItem.stage}
                onClick={() => handleTimelineClick(stageItem.stage)}
                className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                  isActive
                    ? "bg-white border-[#8C6B1F] shadow-2xs font-semibold"
                    : isPassed
                    ? "bg-[#FAF6E8]/40 border-[#E6E1D3]/50 opacity-80"
                    : "bg-white/50 border-[#E6E1D3]/30 opacity-60 hover:opacity-90"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold transition-all ${
                      isActive
                        ? "bg-[#1C1B18] text-white"
                        : isPassed
                        ? "bg-[#E6F5EE] text-[#155939] border border-[#B2E6CF]"
                        : "bg-[#E6E1D3]/30 text-[#787363]"
                    }`}
                  >
                    {stageItem.stage}
                  </div>
                  <span className="text-xs text-[#1C1B18]">
                    {stageItem.emoji} {stageItem.name}
                  </span>
                </div>
                <span className="text-[10px] font-bold">
                  {isActive ? "👁️" : isPassed ? "✓" : "○"}
                </span>
              </div>
            );
          })}
        </div>
      </aside>

      {/* Body Viewer (Main Content Area) */}
      <section className="flex-1 min-h-[500px] flex items-center justify-center p-6 relative overflow-hidden bg-radial from-[#F4E071]/5 to-transparent">
        {/* Glow behind body */}
        <div
          className="absolute w-80 h-[500px] rounded-full blur-3xl opacity-20 pointer-events-none transition-all duration-500"
          style={{
            backgroundColor: activeStage.color,
          }}
        />

        {/* Body Model Relative Stack Container */}
        <div className="relative w-[340px] h-[600px] sm:w-[400px] sm:h-[700px]">
          {DETAILED_STAGES.map((stageItem) => {
            const visible = isLayerVisible(stageItem);
            const isPulse = pulseLayer === stageItem.stage;
            const positions = stageItem.positions || (stageItem.position ? [stageItem.position] : [null]);

            return positions.map((pos, idx) => {
              const uniqueId = positions.length > 1 ? `${stageItem.id}-${idx}` : stageItem.id;
              const isHovered = hoveredLayer === uniqueId;
              const labelText =
                positions.length > 1
                  ? `${stageItem.name} (${idx === 0 ? "Left" : "Right"})`
                  : stageItem.name;

              // Compute inline styles based on image type
              const baseStyles: React.CSSProperties = {
                position: "absolute",
                zIndex: stageItem.zIndex,
                transition: "opacity 0.4s ease, transform 0.4s ease, filter 0.2s ease",
                opacity: visible ? 1 : 0,
                pointerEvents: visible && stageItem.type === "organ" ? "auto" : "none",
              };

              if (stageItem.type === "full-body") {
                baseStyles.top = 0;
                baseStyles.left = "50%";
                baseStyles.transform = `translateX(-50%) ${visible ? "scale(1)" : "scale(0.97)"}`;
                baseStyles.width = "auto";
                baseStyles.height = "100%";
                baseStyles.objectFit = "contain";
              } else if (pos) {
                baseStyles.top = pos.top;
                baseStyles.left = pos.left;
                baseStyles.width = pos.width;
                if (pos.height) baseStyles.height = pos.height;
                baseStyles.transform = `${pos.transform} ${visible ? "scale(1)" : "scale(0.85)"}`;
                baseStyles.objectFit = "contain";
              }

              // Active filter configurations
              let filterString = "";
              if (isHovered) {
                filterString = "drop-shadow(0 0 10px rgba(140, 107, 31, 0.8)) brightness(1.05)";
              } else if (isPulse) {
                filterString = "drop-shadow(0 0 12px rgba(28, 27, 24, 0.7))";
              }
              if (filterString) {
                baseStyles.filter = filterString;
              }

              return (
                <div
                  key={uniqueId}
                  style={baseStyles}
                  className={`select-none ${visible ? "" : "pointer-events-none"}`}
                  onMouseEnter={(e) => handleMouseEnter(e, `${stageItem.emoji} ${labelText}`, uniqueId)}
                  onMouseMove={handleMouseMove}
                  onMouseLeave={handleMouseLeave}
                >
                  <img
                    src={stageItem.file}
                    alt={stageItem.name}
                    draggable={false}
                    className="w-full h-full object-contain"
                  />
                </div>
              );
            });
          })}
        </div>
      </section>
    </div>
  );
}
