"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { MaterialIcon } from "@/components/ui/MaterialIcon";
import SpecularButton from "@/components/SpecularButton";

export function HeaderNav() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
          <Link
            href="#core-services"
            className="text-sm font-sans font-medium text-[#4D493E] hover:text-[#1C1B18] transition-colors"
          >
            Core Services
          </Link>
          <Link
            href="#interactive-showcase"
            className="text-sm font-sans font-medium text-[#4D493E] hover:text-[#1C1B18] transition-colors flex items-center gap-1"
          >
            Live AI Demos
          </Link>
          <Link
            href="#diagnostic-suite"
            className="text-sm font-sans font-medium text-[#4D493E] hover:text-[#1C1B18] transition-colors"
          >
            Diagnostic AI
          </Link>
          <Link
            href="#doctor-portal"
            className="text-sm font-sans font-medium text-[#4D493E] hover:text-[#1C1B18] transition-colors"
          >
            Doctor Verification
          </Link>
          <Link
            href="#medical-team"
            className="text-sm font-sans font-medium text-[#4D493E] hover:text-[#1C1B18] transition-colors"
          >
            Our Experts
          </Link>
          <Link
            href="#reviews"
            className="text-sm font-sans font-medium text-[#4D493E] hover:text-[#1C1B18] transition-colors"
          >
            Reviews
          </Link>
        </nav>

        {/* Right CTA Actions */}
        <div className="hidden md:flex items-center gap-3">
          <button
            aria-label="User Account"
            className="w-10 h-10 rounded-full border border-[#DCD5C5] bg-white flex items-center justify-center text-[#1C1B18] hover:bg-[#FAF6E8] transition-colors shadow-xs"
          >
            <MaterialIcon name="person" className="text-xl" />
          </button>
          <SpecularButton
            href="#interactive-showcase"
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
            <Link
              href="#core-services"
              onClick={() => setMobileMenuOpen(false)}
              className="py-1 border-b border-[#E8E2D4]"
            >
              Core Services
            </Link>
            <Link
              href="#interactive-showcase"
              onClick={() => setMobileMenuOpen(false)}
              className="py-1 border-b border-[#E8E2D4] flex items-center gap-2"
            >
              <MaterialIcon name="auto_awesome" className="text-lg text-[#C49A24]" />
              Live AI Demos
            </Link>
            <Link
              href="#diagnostic-suite"
              onClick={() => setMobileMenuOpen(false)}
              className="py-1 border-b border-[#E8E2D4]"
            >
              Diagnostic AI
            </Link>
            <Link
              href="#doctor-portal"
              onClick={() => setMobileMenuOpen(false)}
              className="py-1 border-b border-[#E8E2D4]"
            >
              Doctor Verification
            </Link>
            <Link
              href="#medical-team"
              onClick={() => setMobileMenuOpen(false)}
              className="py-1 border-b border-[#E8E2D4]"
            >
              Our Experts
            </Link>
            <Link
              href="#reviews"
              onClick={() => setMobileMenuOpen(false)}
              className="py-1"
            >
              Reviews
            </Link>
          </nav>
          <div className="pt-4 flex flex-col gap-3">
            <SpecularButton
              href="#interactive-showcase"
              onClick={() => setMobileMenuOpen(false)}
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
              className="w-full text-center justify-center py-3 text-sm font-semibold tracking-wide font-sans"
            >
              LAUNCH PLATFORM →
            </SpecularButton>
          </div>
        </div>
      )}
    </header>
  );
}
