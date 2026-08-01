"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { MaterialIcon } from "@/components/ui/MaterialIcon";

export function Footer() {
  return (
    <footer className="w-full bg-[#1C1B18] text-white pt-16 pb-12 border-t border-[#33312B]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        
        {/* Main Footer Row */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10">
          
          {/* Brand Column */}
          <div className="md:col-span-4 space-y-6">
            <Link href="/" className="flex items-center gap-3">
              <div className="relative w-10 h-10 rounded-xl overflow-hidden bg-[#FAF6E8] p-1 border border-[#E8E2CF]">
                <Image
                  src="/logo.png"
                  alt="Hippo Health Logo"
                  fill
                  className="object-contain p-1"
                />
              </div>
              <div className="flex flex-col">
                <span className="font-serif text-2xl font-bold tracking-tight text-white leading-none">
                  Hippo<span className="text-[#F4E071]">Health</span>
                </span>
                <span className="text-[10px] font-sans font-medium tracking-widest text-[#AAA595] uppercase mt-0.5">
                  Precision Clinical AI
                </span>
              </div>
            </Link>

            <p className="text-xs text-[#AAA595] leading-relaxed max-w-sm">
              Hippo Health combines RAG medical chatbots, smartwatch telemetry, 3D anatomical modeling, and 5 specialized computer vision engines with mandatory physician oversight.
            </p>

            <div className="flex items-center gap-2 text-xs text-[#F4E071]">
              <MaterialIcon name="verified_user" className="text-base text-[#F4E071]" />
              <span>HIPAA & GDPR Compliant Medical Architecture</span>
            </div>
          </div>

          {/* Nav Links Column 1 */}
          <div className="md:col-span-3 space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#F4E071]">
              Core AI Features
            </h4>
            <ul className="space-y-2.5 text-xs text-[#AAA595]">
              <li>
                <Link href="#core-services" className="hover:text-white transition-colors">
                  AI Medical Chatbot & RAG Memory
                </Link>
              </li>
              <li>
                <Link href="#interactive-showcase" className="hover:text-white transition-colors">
                  Doctor-Verified Recommendation Studio
                </Link>
              </li>
              <li>
                <Link href="#interactive-showcase" className="hover:text-white transition-colors">
                  Google Health API Smartwatch Sync
                </Link>
              </li>
              <li>
                <Link href="#interactive-showcase" className="hover:text-white transition-colors">
                  3D Human Anatomy Viewer
                </Link>
              </li>
              <li>
                <Link href="#doctor-portal" className="hover:text-white transition-colors">
                  Clinician Patient Management Suite
                </Link>
              </li>
            </ul>
          </div>

          {/* Nav Links Column 2 */}
          <div className="md:col-span-2 space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#F4E071]">
              Diagnostic Suite
            </h4>
            <ul className="space-y-2.5 text-xs text-[#AAA595]">
              <li>
                <Link href="#diagnostic-suite" className="hover:text-white transition-colors">
                  Chest X-Ray (YOLOv11)
                </Link>
              </li>
              <li>
                <Link href="#diagnostic-suite" className="hover:text-white transition-colors">
                  Bone Fracture AI
                </Link>
              </li>
              <li>
                <Link href="#diagnostic-suite" className="hover:text-white transition-colors">
                  Cardiovascular XGBoost
                </Link>
              </li>
              <li>
                <Link href="#diagnostic-suite" className="hover:text-white transition-colors">
                  Brain Tumor MRI
                </Link>
              </li>
              <li>
                <Link href="#diagnostic-suite" className="hover:text-white transition-colors">
                  Skin Allergy Classifier
                </Link>
              </li>
            </ul>
          </div>

          {/* Newsletter Column */}
          <div className="md:col-span-3 space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#F4E071]">
              Clinical AI Updates
            </h4>
            <p className="text-xs text-[#AAA595]">
              Subscribe for monthly updates on clinical model releases and medical research.
            </p>

            <div className="flex items-center gap-2">
              <input
                type="email"
                placeholder="Enter doctor or clinic email"
                className="w-full bg-[#252420] border border-[#3A3831] rounded-xl px-3 py-2 text-xs text-white placeholder-[#787363] focus:outline-none focus:ring-1 focus:ring-[#F4E071]"
              />
              <button
                onClick={() => alert("Subscribed to Hippo Health Clinical Updates!")}
                className="bg-[#F4E071] text-[#1C1B18] p-2 rounded-xl hover:bg-[#E8C838] transition-colors"
                aria-label="Subscribe"
              >
                <MaterialIcon name="arrow_forward" className="text-base text-[#1C1B18]" />
              </button>
            </div>
          </div>

        </div>

        {/* Emergency Medical Disclaimer Banner */}
        <div className="bg-[#252420] border border-[#3A3831] p-4 rounded-2xl text-[11px] text-[#A39E8F] leading-relaxed">
          <strong className="text-white">Medical Disclaimer:</strong> Hippo Health is a clinical decision support tool designed to assist healthcare professionals and provide personalized health guidance to patients. It does not replace emergency medical treatment. In the event of a medical emergency, call emergency services immediately.
        </div>

        {/* Bottom Copyright */}
        <div className="pt-6 border-t border-[#33312B] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#787363]">
          <p>© {new Date().getFullYear()} Hippo Health Inc. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-white transition-colors">Terms of Clinical Use</a>
            <a href="#" className="hover:text-white transition-colors">HIPAA Compliance</a>
          </div>
        </div>

      </div>
    </footer>
  );
}
