"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { HeaderNav } from "@/components/HeaderNav";
import { Footer } from "@/components/Footer";
import { MaterialIcon } from "@/components/ui/MaterialIcon";
import Link from "next/link";

type TabType = "body" | "disease" | "chat" | "metrics";

export default function DashboardPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  // Doctor-specific view state: "personal" (My Dashboard) or "patients" (Patients Dashboard)
  const [doctorView, setDoctorView] = useState<"personal" | "patients">("personal");

  // Redirect if not authenticated or onboarding incomplete
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
        <span className="text-sm font-semibold text-[#787363]">Verifying clinical session...</span>
      </div>
    );
  }

  if (status === "unauthenticated" || !session) {
    return null;
  }

  const role = session.user.role || "PATIENT";
  const name = session.user.name || "User";

  // Tab definitions with dedicated page routes
  const tabs = [
    { id: "body" as TabType, label: "Visualize My Body", icon: "accessibility_new", href: "/visualize-body" },
    { id: "disease" as TabType, label: "Detect Disease", icon: "biotech", href: "/detect-disease" },
    { id: "chat" as TabType, label: "Chat with Hippo", icon: "forum", href: "/chat-with-hippo" },
    { id: "metrics" as TabType, label: "See my Health Metrics", icon: "monitoring", href: "/health-metrics" },
  ];

  // Doctor tabs for personal view
  const doctorPersonalTabs = [
    { id: "body" as TabType, label: "Visualize My Body", icon: "accessibility_new", href: "/visualize-body" },
    { id: "disease" as TabType, label: "Detect Disease", icon: "biotech", href: "/detect-disease" },
    { id: "chat" as TabType, label: "Chat with Hippo", icon: "forum", href: "/chat-with-hippo" },
    { id: "metrics" as TabType, label: "See my Health Metrics", icon: "monitoring", href: "/health-metrics" },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#F6F4EF] text-[#1C1B18]">
      <HeaderNav />

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Welcome Section */}
        <section className="flex flex-col md:flex-row justify-between items-start md:items-center bg-[#FAF9F5] border border-[#E6E1D3] p-6 rounded-[32px] gap-4 shadow-2xs">
          <div>
            <span className="text-[10px] font-bold tracking-wider text-[#8C6B1F] bg-[#FAF6E8] border border-[#E6E1D3] px-3 py-1 rounded-full uppercase">
              Dashboard Status: Online
            </span>
            <h2 className="font-serif text-3xl font-bold text-[#1C1B18] mt-3">
              Welcome back, {role === "DOCTOR" ? `Dr. ${name}` : name}
            </h2>
            <p className="text-xs text-[#787363] font-sans mt-1">
              Hippo Clinical AI Hub — Logged in as{" "}
              <strong className="text-[#8C6B1F] uppercase font-bold">{role}</strong>.
            </p>
          </div>

          {/* Doctor view switcher */}
          {role === "DOCTOR" && (
            <div className="flex gap-2 p-1 bg-[#FAF6E8] border border-[#E6E1D3] rounded-2xl w-full md:w-auto">
              <button
                onClick={() => setDoctorView("personal")}
                className={`flex-1 md:flex-initial px-5 py-2.5 rounded-xl font-sans text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  doctorView === "personal"
                    ? "bg-[#1C1B18] text-white shadow-2xs"
                    : "text-[#787363] hover:text-[#1C1B18]"
                }`}
              >
                <MaterialIcon name="person" className="text-sm" />
                <span>My Dashboard</span>
              </button>
              <button
                onClick={() => setDoctorView("patients")}
                className={`flex-1 md:flex-initial px-5 py-2.5 rounded-xl font-sans text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  doctorView === "patients"
                    ? "bg-[#1C1B18] text-white shadow-2xs"
                    : "text-[#787363] hover:text-[#1C1B18]"
                }`}
              >
                <MaterialIcon name="groups" className="text-sm" />
                <span>Patients Dashboard</span>
              </button>
            </div>
          )}
        </section>

        {/* Dynamic section loading */}
        {role === "DOCTOR" && doctorView === "patients" ? (
          // Doctor View: Patients Dashboard Section
          <section className="space-y-6">
            <div className="border-b border-[#E6E1D3] pb-2">
              <h3 className="font-serif text-2xl font-bold text-[#1C1B18]">Patients Directory</h3>
              <p className="text-xs text-[#787363] font-sans">
                Review and monitor biological diagnostics, biometrics, and disease scans of your patients.
              </p>
            </div>
            {/* Lazy load PatientsDashboard component */}
            <PatientsDashboardWrapper />
          </section>
        ) : (
          // Standard User View (or Doctor Personal View "My Dashboard")
          <section className="space-y-6">
            {/* Quick-access navigation cards */}
            <div className={`grid gap-4 ${role === "PATIENT" ? "grid-cols-2 md:grid-cols-5" : "grid-cols-2 md:grid-cols-4"}`}>
              {(role === "DOCTOR" ? doctorPersonalTabs : tabs).map((tab) => (
                <Link
                  key={tab.id}
                  href={tab.href}
                  className="group px-5 py-5 rounded-2xl border border-[#E6E1D3] bg-[#FAF9F5] hover:bg-[#FAF6E8] hover:border-[#C49A24]/40 text-[#4D493E] hover:text-[#1C1B18] transition-all flex flex-col items-center gap-2.5 shadow-xs cursor-pointer"
                >
                  <div className="w-12 h-12 rounded-xl bg-[#FAF6E8] border border-[#E6E1D3] group-hover:bg-[#F0E8C8] flex items-center justify-center transition-colors">
                    <MaterialIcon name={tab.icon} className="text-xl text-[#8C6B1F]" />
                  </div>
                  <span className="text-[11px] font-bold font-sans tracking-wide text-center leading-tight">{tab.label}</span>
                </Link>
              ))}
              {/* Patient-only: Chat with Doctor card */}
              {role === "PATIENT" && (
                <Link
                  href="/chat"
                  className="group px-5 py-5 rounded-2xl border border-[#1C5396]/20 bg-[#EAF3FB] hover:bg-[#C8DEF5]/40 hover:border-[#1C5396]/40 text-[#1C5396] transition-all flex flex-col items-center gap-2.5 shadow-xs cursor-pointer"
                >
                  <div className="w-12 h-12 rounded-xl bg-[#C8DEF5]/50 border border-[#1C5396]/20 group-hover:bg-[#C8DEF5]/80 flex items-center justify-center transition-colors">
                    <MaterialIcon name="chat" className="text-xl text-[#1C5396]" />
                  </div>
                  <span className="text-[11px] font-bold font-sans tracking-wide text-center leading-tight">Chat with Doctor</span>
                </Link>
              )}
            </div>
          </section>
        )}
      </main>

      <Footer />
    </div>
  );
}

// Lazy loaded PatientsDashboard wrapper
function PatientsDashboardWrapper() {
  const [Component, setComponent] = useState<any>(null);

  useEffect(() => {
    import("@/components/dashboard/PatientsDashboard").then((mod) => {
      setComponent(() => mod.default);
    });
  }, []);

  if (!Component) {
    return (
      <div className="py-20 flex flex-col items-center justify-center gap-3">
        <svg className="animate-spin h-8 w-8 text-[#8C6B1F]" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        <span className="text-xs text-[#787363] font-sans">Assembling physician interface...</span>
      </div>
    );
  }

  return <Component />;
}
