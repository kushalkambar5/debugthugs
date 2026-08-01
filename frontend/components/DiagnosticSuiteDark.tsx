"use client";

import React, { useState } from "react";
import Image from "next/image";
import { MaterialIcon } from "@/components/ui/MaterialIcon";
import ScrollFloat from "@/components/ui/ScrollFloat";

export function DiagnosticSuiteDark() {
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-start">
          
          {/* Card 1: Chest X-Ray Analysis */}
          <div className="relative w-full aspect-[1536/1024] rounded-[28px] overflow-hidden bg-[#252420] border border-[#3A3831] shadow-lg group hover:border-[#F4E071] transition-all">
            <Image
              src="/homepage_images/chest.png"
              alt="Chest X-Ray Analysis"
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
            />
          </div>

          {/* Card 2: ECG & Heart Arrhythmia AI */}
          <div className="relative w-full aspect-[1024/1536] rounded-[28px] overflow-hidden bg-[#252420] border border-[#3A3831] shadow-lg group hover:border-[#FF5252] transition-all">
            <Image
              src="/homepage_images/ecg.png"
              alt="ECG & Heart Arrhythmia AI"
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
            />
          </div>

          {/* Card 3: Bone Fracture Detection */}
          <div className="relative w-full aspect-[1536/1024] rounded-[28px] overflow-hidden bg-[#252420] border border-[#3A3831] shadow-lg group hover:border-[#7BB1D1] transition-all">
            <Image
              src="/homepage_images/bone.png"
              alt="Bone Fracture Detection"
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
            />
          </div>

          {/* Card 4: Cardiovascular Risk AI */}
          <div className="relative w-full aspect-[1086/1448] rounded-[28px] overflow-hidden bg-[#252420] border border-[#3A3831] shadow-lg group hover:border-[#4EBD88] transition-all">
            <Image
              src="/homepage_images/heart_xgboost.png"
              alt="Cardiovascular Risk AI"
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
            />
          </div>

          {/* Card 5: Brain Tumor MRI Detection */}
          <div className="relative w-full aspect-[1086/1448] rounded-[28px] overflow-hidden bg-[#252420] border border-[#3A3831] shadow-lg group hover:border-[#E67CAE] transition-all">
            <Image
              src="/homepage_images/brain.png"
              alt="Brain Tumor MRI Detection"
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
            />
          </div>

          {/* Card 6: Skin Allergy & Lesion Classifier */}
          <div className="relative w-full aspect-[1086/1448] rounded-[28px] overflow-hidden bg-[#252420] border border-[#3A3831] shadow-lg group hover:border-[#F4E071] transition-all">
            <Image
              src="/homepage_images/skin.png"
              alt="Skin Allergy & Lesion Classifier"
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
            />
          </div>

        </div>

      </div>
    </section>
  );
}
