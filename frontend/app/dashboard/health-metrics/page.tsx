import React from "react";
import Link from "next/link";
import { HeaderNav } from "@/components/HeaderNav";
import { Footer } from "@/components/Footer";

export default function HealthMetricsPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#F6F4EF] text-[#1C1B18]">
      <HeaderNav />
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex flex-col justify-center items-center">
        <div className="max-w-2xl w-full bg-[#FAF9F5] border border-[#E6E1D3] rounded-[32px] p-8 md:p-12 text-center shadow-xs">
          <div className="w-16 h-16 rounded-full bg-[#E6F5EE] text-[#155939] flex items-center justify-center mx-auto mb-6">
            <span className="material-symbols-outlined text-3xl">monitoring</span>
          </div>
          <h2 className="font-serif text-3xl font-bold text-[#1C1B18] mb-4">My Health Metrics</h2>
          <p className="text-sm text-[#787363] font-sans mb-8 max-w-md mx-auto">
            This page is currently empty. You can implement your tracking charts, biometrics sync logs, or smartwatch activity metrics here.
          </p>
          <div className="flex gap-4 justify-center">
            <Link
              href="/dashboard"
              className="px-6 py-3 bg-[#1C1B18] hover:bg-[#2E2C26] text-white font-semibold rounded-xl text-sm transition-all shadow-xs"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
