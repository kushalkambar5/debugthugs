"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { MaterialIcon } from "@/components/ui/MaterialIcon";
import SpecularButton from "@/components/SpecularButton";
import { useSession, signOut } from "next-auth/react";
import { ProfileModal } from "@/components/ProfileModal";
import { usePathname } from "next/navigation";


export function HeaderNav() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { data: session, status } = useSession();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);


  return (
    <header className="sticky top-0 z-50 w-full bg-[#F6F4EF]/90 backdrop-blur-md border-b border-[#E6E1D3]/60 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="relative w-10 h-10 rounded-xl overflow-hidden bg-[#FAF6E8] p-1 shadow-sm border border-[#E8E2CF] group-hover:scale-105 transition-transform">
            <Image
              src="/logo.png"
              alt="Hippo Health Logo"
              fill
              className="object-contain p-1"
              priority
            />
          </div>
          <div className="flex flex-col">
            <span className="font-serif text-2xl font-bold tracking-tight text-[#1C1B18] leading-none">
              Hippo<span className="text-[#8C6B1F]">Health</span>
            </span>
            <span className="text-[10px] font-sans font-medium tracking-widest text-[#787363] uppercase mt-0.5">
              Precision Clinical AI
            </span>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-8">
          {status === "authenticated" && (
            <>
<>
  <Link href="/dashboard" className={`text-sm font-sans transition-colors ${pathname === "/dashboard" ? "font-bold text-[#8C6B1F]" : "font-medium text-[#4D493E] hover:text-[#1C1B18]"}`}>
    Dashboard
  </Link>
  <Link href="/visualize-body" className={`text-sm font-sans transition-colors ${pathname === "/visualize-body" ? "font-bold text-[#8C6B1F]" : "font-medium text-[#4D493E] hover:text-[#1C1B18]"}`}>
    Visualize Body
  </Link>
  <Link href="/detect-disease" className={`text-sm font-sans transition-colors ${pathname === "/detect-disease" ? "font-bold text-[#8C6B1F]" : "font-medium text-[#4D493E] hover:text-[#1C1B18]"}`}>
    Detect Disease
  </Link>
  <Link href="/chat-with-hippo" className={`text-sm font-sans transition-colors ${pathname === "/chat-with-hippo" ? "font-bold text-[#8C6B1F]" : "font-medium text-[#4D493E] hover:text-[#1C1B18]"}`}>
    Chat with Hippo
  </Link>
  <Link href="/health-metrics" className={`text-sm font-sans transition-colors ${pathname === "/health-metrics" ? "font-bold text-[#8C6B1F]" : "font-medium text-[#4D493E] hover:text-[#1C1B18]"}`}>
    Health Metrics
  </Link>
  <Link href="/medical-history" className={`text-sm font-sans transition-colors ${pathname === "/medical-history" ? "font-bold text-[#8C6B1F]" : "font-medium text-[#4D493E] hover:text-[#1C1B18]"}`}>
    Medical History
  </Link>
  <Link href="/chat" className={`text-sm font-sans transition-colors flex items-center gap-1 ${pathname === "/chat" ? "font-bold text-[#1C5396]" : "font-medium text-[#4D493E] hover:text-[#1C5396]"}`}>
    Clinical Chat
  </Link>
  {session?.user?.role === "PATIENT" && (
    <Link href="/manage-doctors" className={`text-sm font-sans transition-colors ${pathname === "/manage-doctors" ? "font-bold text-[#8C6B1F]" : "font-medium text-[#4D493E] hover:text-[#1C1B18]"}`}>
      Manage Doctors
    </Link>
  )}
</>
            </>
          )}
          {/* Keep original links for unauthenticated users */}
          {status !== "authenticated" && (
            <>
              <Link href="#core-services" className="text-sm font-sans font-medium text-[#4D493E] hover:text-[#1C1B18] transition-colors">Core Services</Link>
              <Link href="#interactive-showcase" className="text-sm font-sans font-medium text-[#4D493E] hover:text-[#1C1B18] transition-colors flex items-center gap-1">Live AI Demos</Link>
              <Link href="#diagnostic-suite" className="text-sm font-sans font-medium text-[#4D493E] hover:text-[#1C1B18] transition-colors">Diagnostic AI</Link>
              <Link href="#doctor-portal" className="text-sm font-sans font-medium text-[#4D493E] hover:text-[#1C1B18] transition-colors">Doctor Verification</Link>
              <Link href="#medical-team" className="text-sm font-sans font-medium text-[#4D493E] hover:text-[#1C1B18] transition-colors">Our Experts</Link>
              <Link href="#reviews" className="text-sm font-sans font-medium text-[#4D493E] hover:text-[#1C1B18] transition-colors">Reviews</Link>
            </>
          )}
        </nav>

        {/* Right CTA Actions */}
        <div className="hidden md:flex items-center gap-3 relative">
          {status === "authenticated" && session?.user ? (
            <div className="relative">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                aria-label="User Account"
                className="w-10 h-10 rounded-full border border-[#DCD5C5] bg-white flex items-center justify-center text-[#1C1B18] hover:bg-[#FAF6E8] transition-colors shadow-xs cursor-pointer overflow-hidden relative"
              >
                {session.user.image || (session.user as any).picture ? (
                  <Image
                    src={session.user.image || (session.user as any).picture}
                    alt={session.user.name || "User Avatar"}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <MaterialIcon name="person" className="text-xl" />
                )}
              </button>

              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-2xl border border-[#E6E1D3] bg-[#FAF9F5] p-2.5 shadow-md z-50 animate-fade-in font-sans">
                  <div className="px-3 py-2 border-b border-[#E8E2D4] mb-1.5">
                    <p className="text-sm font-semibold text-[#1C1B18] truncate">
                      {session.user.name || "User"}
                    </p>
                    <p className="text-xs text-[#787363] truncate">
                      {session.user.email}
                    </p>
                    <span className="inline-block mt-1.5 px-2 py-0.5 text-[9px] font-bold tracking-wider text-[#8C6B1F] bg-[#FAF6E8] border border-[#E8E2CF] rounded-md uppercase">
                      {session.user.role || "PATIENT"}
                    </span>
                  </div>

                  {!session.user.onboardingComplete && (
                    <Link
                      href="/onboarding"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-[#8C6B1F] hover:bg-[#FAF6E8] rounded-lg transition-colors"
                    >
                      <MaterialIcon name="error" className="text-sm" />
                      <span>Complete Onboarding</span>
                    </Link>
                  )}

                  <Link
                    href="/dashboard"
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-[#8C6B1F] hover:bg-[#FAF6E8] rounded-lg transition-colors"
                  >
                    <MaterialIcon name="dashboard" className="text-sm" />
                    <span>My Dashboard</span>
                  </Link>

                  <button
                    onClick={() => {
                      setDropdownOpen(false);
                      setProfileModalOpen(true);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-[#8C6B1F] hover:bg-[#FAF6E8] rounded-lg transition-colors border-b border-[#E8E2D4]/50 mb-1 cursor-pointer text-left"
                  >
                    <MaterialIcon name="photo_camera" className="text-sm" />
                    <span>Change Profile Photo</span>
                  </button>

                  <button
                    onClick={() => {
                      setDropdownOpen(false);
                      signOut();
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-[#B34515] hover:bg-[#FAF0E6] rounded-lg transition-colors text-left cursor-pointer"
                  >
                    <MaterialIcon name="logout" className="text-sm" />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link
                href="/login"
                className="px-4 py-2 text-xs font-semibold text-[#4D493E] hover:text-[#1C1B18] transition-colors font-sans"
              >
                Sign In
              </Link>
              <SpecularButton
                href="/signup"
                size="custom"
                radius={9999}
                tint="#1C1B18"
                tintOpacity={1}
                textColor="#ffffff"
                lineColor="#ffffff"
                baseColor="#525252"
                intensity={1.2}
                shineSize={12}
                shineFade={35}
                thickness={1.5}
                speed={0.4}
                followMouse={true}
                proximity={250}
                className="px-5 py-2.5 text-xs font-semibold tracking-wide uppercase group font-sans"
              >
                <span>Get Started</span>
                <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center group-hover:translate-x-0.5 transition-transform">
                  <MaterialIcon name="arrow_outward" className="text-sm text-white" />
                </span>
              </SpecularButton>
            </>
          )}
        </div>

        {/* Mobile menu button */}
        <div className="flex md:hidden items-center gap-2">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg text-[#1C1B18] hover:bg-[#EBE6D8]"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? (
              <MaterialIcon name="close" className="text-2xl" />
            ) : (
              <MaterialIcon name="menu" className="text-2xl" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#F6F4EF] border-b border-[#E6E1D3] px-6 py-6 space-y-4">
          <nav className="flex flex-col gap-4 text-base font-medium text-[#1C1B18]">
            {/* Mobile Drawer Navigation Links */}
            {status === "authenticated" && (
              <>
                <Link href="/dashboard" onClick={() => setMobileMenuOpen(false)} className={`py-1 border-b border-[#E8E2D4] ${pathname === "/dashboard" ? "font-bold text-[#8C6B1F]" : "font-medium text-[#1C1B18]"}`}>
                  Dashboard
                </Link>
                <Link href="/visualize-body" onClick={() => setMobileMenuOpen(false)} className={`py-1 border-b border-[#E8E2D4] ${pathname === "/visualize-body" ? "font-bold text-[#8C6B1F]" : "font-medium text-[#1C1B18]"}`}>
                  Visualize Body
                </Link>
                <Link href="/detect-disease" onClick={() => setMobileMenuOpen(false)} className={`py-1 border-b border-[#E8E2D4] ${pathname === "/detect-disease" ? "font-bold text-[#8C6B1F]" : "font-medium text-[#1C1B18]"}`}>
                  Detect Disease
                </Link>
                <Link href="/chat-with-hippo" onClick={() => setMobileMenuOpen(false)} className={`py-1 border-b border-[#E8E2D4] flex items-center gap-2 ${pathname === "/chat-with-hippo" ? "font-bold text-[#8C6B1F]" : "font-medium text-[#1C1B18]"}`}>
                  Chat with Hippo
                </Link>
                <Link href="/health-metrics" onClick={() => setMobileMenuOpen(false)} className={`py-1 border-b border-[#E8E2D4] ${pathname === "/health-metrics" ? "font-bold text-[#8C6B1F]" : "font-medium text-[#1C1B18]"}`}>
                  Health Metrics
                </Link>
                <Link href="/medical-history" onClick={() => setMobileMenuOpen(false)} className={`py-1 border-b border-[#E8E2D4] ${pathname === "/medical-history" ? "font-bold text-[#8C6B1F]" : "font-medium text-[#1C1B18]"}`}>
                  Medical History
                </Link>
                <Link href="/chat" onClick={() => setMobileMenuOpen(false)} className={`py-1 border-b border-[#E8E2D4] flex items-center gap-2 ${pathname === "/chat" ? "font-bold text-[#1C5396]" : "font-medium text-[#1C1B18] hover:text-[#1C5396]"}`}>
                  Clinical Chat
                </Link>
                {session?.user?.role === "PATIENT" && (
                  <Link href="/manage-doctors" onClick={() => setMobileMenuOpen(false)} className={`py-1 border-b border-[#E8E2D4] ${pathname === "/manage-doctors" ? "font-bold text-[#8C6B1F]" : "font-medium text-[#1C1B18]"}`}>
                    Manage Doctors
                  </Link>
                )}
              </>
            )}
            {status !== "authenticated" && (
              <>
                <Link href="#core-services" onClick={() => setMobileMenuOpen(false)} className="py-1 border-b border-[#E8E2D4]">
                  Core Services
                </Link>
                <Link href="#interactive-showcase" onClick={() => setMobileMenuOpen(false)} className="py-1 border-b border-[#E8E2D4] flex items-center gap-2">
                  <MaterialIcon name="auto_awesome" className="text-lg text-[#C49A24]" />
                  Live AI Demos
                </Link>
                <Link href="#diagnostic-suite" onClick={() => setMobileMenuOpen(false)} className="py-1 border-b border-[#E8E2D4]">
                  Diagnostic AI
                </Link>
                <Link href="#doctor-portal" onClick={() => setMobileMenuOpen(false)} className="py-1 border-b border-[#E8E2D4]">
                  Doctor Verification
                </Link>
                <Link href="#medical-team" onClick={() => setMobileMenuOpen(false)} className="py-1 border-b border-[#E8E2D4]">
                  Our Experts
                </Link>
                <Link href="#reviews" onClick={() => setMobileMenuOpen(false)} className="py-1">
                  Reviews
                </Link>
              </>
            )}
          </nav>
          <div className="pt-4 border-t border-[#E8E2D4] flex flex-col gap-3 font-sans">
            {status === "authenticated" && session?.user ? (
              <>
                <div className="flex items-center gap-3 py-1">
                  <div className="relative w-10 h-10 rounded-full overflow-hidden bg-[#FAF6E8] border border-[#E6E1D3] shrink-0">
                    {session.user.image || (session.user as any).picture ? (
                      <Image
                        src={session.user.image || (session.user as any).picture}
                        alt="Avatar"
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <MaterialIcon name="person" className="text-xl" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-[#1C1B18] truncate">
                      {session.user.name || "User"}
                    </p>
                    <p className="text-xs text-[#787363] truncate">
                      {session.user.email}
                    </p>
                  </div>
                </div>

                {!session.user.onboardingComplete && (
                  <Link
                    href="/onboarding"
                    onClick={() => setMobileMenuOpen(false)}
                    className="py-2 text-sm font-semibold text-[#8C6B1F] flex items-center gap-2"
                  >
                    <MaterialIcon name="error" className="text-lg" />
                    <span>Complete Onboarding</span>
                  </Link>
                )}

                <Link
                  href="/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="py-2 text-sm font-semibold text-[#8C6B1F] flex items-center gap-2 border-b border-[#E8E2D4]/50"
                >
                  <MaterialIcon name="dashboard" className="text-lg" />
                  <span>My Dashboard</span>
                </Link>

                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    signOut();
                  }}
                  className="w-full py-2 text-sm font-semibold text-[#B34515] flex items-center gap-2 text-left cursor-pointer"
                >
                  <MaterialIcon name="logout" className="text-lg" />
                  <span>Sign Out</span>
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center py-2.5 text-sm font-semibold text-[#1C1B18] bg-white border border-[#DCD5C5] rounded-xl hover:bg-[#FAF6E8] transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  href="/signup"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center py-2.5 text-sm font-semibold text-white bg-[#1C1B18] rounded-xl hover:bg-[#2E2C26] transition-colors"
                >
                  Sign Up / Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      )}

      {/* Cloudflare R2 Profile Upload Modal */}
      <ProfileModal
        isOpen={profileModalOpen}
        onClose={() => setProfileModalOpen(false)}
      />
    </header>
  );
}
