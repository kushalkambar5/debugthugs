"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { HeaderNav } from "@/components/HeaderNav";
import { Footer } from "@/components/Footer";
import { MaterialIcon } from "@/components/ui/MaterialIcon";

export default function HealthMetricsPage() {
  const router = useRouter();
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (status === "authenticated" && session && !session.user.onboardingComplete) {
      router.push("/onboarding");
    }
  }, [status, session, router]);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex flex-col bg-[#F6F4EF] justify-center items-center font-sans">
        <svg className="animate-spin h-10 w-10 text-[#8C6B1F] mb-4" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        <span className="text-sm font-semibold text-[#787363]">Loading...</span>
      </div>
    );
  }

  if (status === "unauthenticated" || !session) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#F6F4EF] text-[#1C1B18]">
      <HeaderNav />
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-2xl text-[#8C6B1F]">monitoring</span>
          <div>
            <h1 className="font-serif text-3xl font-bold text-[#1C1B18] leading-tight">Health Metrics</h1>
            <p className="text-xs text-[#787363] font-sans mt-0.5">Biometrics, activity tracking &amp; smartwatch sync</p>
          </div>
        </div>

        {/* Placeholder metrics grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            { icon: "favorite", label: "Heart Rate", value: "—", unit: "bpm", color: "text-rose-500", bg: "bg-rose-50 border-rose-100" },
            { icon: "thermostat", label: "Body Temperature", value: "—", unit: "°C", color: "text-orange-500", bg: "bg-orange-50 border-orange-100" },
            { icon: "water_drop", label: "Blood Oxygen", value: "—", unit: "%", color: "text-blue-500", bg: "bg-blue-50 border-blue-100" },
            { icon: "directions_walk", label: "Steps Today", value: "—", unit: "steps", color: "text-green-600", bg: "bg-green-50 border-green-100" },
            { icon: "bedtime", label: "Sleep Duration", value: "—", unit: "hrs", color: "text-violet-500", bg: "bg-violet-50 border-violet-100" },
            { icon: "local_fire_department", label: "Calories Burned", value: "—", unit: "kcal", color: "text-amber-500", bg: "bg-amber-50 border-amber-100" },
          ].map((metric) => (
            <div
              key={metric.label}
              className="bg-[#FAF9F5] border border-[#E6E1D3] rounded-[28px] p-6 shadow-xs flex items-center gap-4"
            >
              <div className={`w-14 h-14 rounded-2xl border flex items-center justify-center shrink-0 ${metric.bg}`}>
                <span className={`material-symbols-outlined text-2xl ${metric.color}`}>{metric.icon}</span>
              </div>
              <div>
                <p className="text-xs font-sans text-[#787363] font-medium">{metric.label}</p>
                <p className="font-serif text-2xl font-bold text-[#1C1B18] leading-tight">
                  {metric.value} <span className="text-sm font-sans font-normal text-[#A8A28E]">{metric.unit}</span>
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Coming soon notice */}
        <div className="bg-[#FAF9F5] border border-[#E6E1D3] rounded-[32px] p-10 text-center shadow-xs flex flex-col justify-center items-center min-h-[280px]">
          <div className="w-16 h-16 rounded-full bg-[#FAF6E8] text-[#8C6B1F] flex items-center justify-center mb-6">
            <MaterialIcon name="sync" className="text-3xl" />
          </div>
          <h2 className="font-serif text-2xl font-bold text-[#1C1B18] mb-2">Sync Your Devices</h2>
          <p className="text-xs text-[#787363] font-sans mb-1 max-w-sm leading-relaxed">
            Connect your smartwatch, fitness tracker, or wearable to start seeing live biometrics, activity charts, and health trends here.
          </p>
          <p className="text-[10px] font-bold tracking-widest uppercase text-[#A8A28E] font-sans mt-4 border border-[#E6E1D3] px-3 py-1 rounded-full">
            Smartwatch Integration — Coming Soon
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
