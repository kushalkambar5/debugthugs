"use client";

import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

interface HippoChatProps {
  fullHeight?: boolean;
}

export default function HippoChat({ fullHeight = false }: HippoChatProps) {
  const { data: session } = useSession();
  const [iframeUrl, setIframeUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Helper to determine the default LibreChat URL based on environment and host context
  const getLibrechatUrl = () => {
    if (typeof window !== "undefined") {
      // 1. If custom chatbot URL is set via local storage, use it
      const customChatbotUrl = localStorage.getItem("hippo_chatbot_url");
      if (customChatbotUrl) {
        return customChatbotUrl;
      }

      // 2. If custom backend is set, route through custom backend's /librechat proxy
      const customBackend = localStorage.getItem("custom_backend_url");
      if (customBackend) {
        return `${customBackend}/librechat`;
      }
      
      // 3. If we are accessing from Vercel / remote host, default to the public backend tunnel URL
      const isLocalhost = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
      if (!isLocalhost) {
        let defaultBackend = process.env.NEXT_PUBLIC_API_URL 
          ? process.env.NEXT_PUBLIC_API_URL.replace(/\/api$/, "") 
          : "";
        
        // If the environment variable is empty or points to localhost, fall back to the public tunnel URL
        if (!defaultBackend || defaultBackend.includes("localhost") || defaultBackend.includes("127.0.0.1")) {
          defaultBackend = "https://daringly-openchain-caden.ngrok-free.dev";
        }
        return `${defaultBackend}/librechat`;
      }
    }
    
    // 4. Otherwise (localhost), use the standard environment variable or default port 3080
    return process.env.NEXT_PUBLIC_LIBRECHAT_URL || "http://localhost:3080";
  };

  useEffect(() => {
    const initLibreChatAuth = async () => {
      if (!session) {
        setLoading(false);
        return;
      }

      const baseUrl = getLibrechatUrl();

      try {
        const tokenRes = await fetch("/api/librechat-token");
        if (tokenRes.ok) {
          const { token } = await tokenRes.json();
          setIframeUrl(`${baseUrl}/?autoLoginToken=${encodeURIComponent(token)}`);
        } else {
          console.error("Failed to fetch LibreChat token");
          setIframeUrl(baseUrl);
        }
      } catch (err) {
        console.error("Error setting up LibreChat auth:", err);
        setIframeUrl(baseUrl);
      } finally {
        setLoading(false);
      }
    };

    initLibreChatAuth();
  }, [session]);

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-[#FAF9F5] rounded-[32px] border border-[#E6E1D3]">
        <svg className="animate-spin h-8 w-8 text-[#8C6B1F] mb-3" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        <span className="text-xs text-[#787363]">Authenticating with clinical chatbot...</span>
      </div>
    );
  }

  if (!iframeUrl) {
    return null;
  }

  return (
    <div
      className={`w-full bg-[#FAF9F5] border border-[#E6E1D3] rounded-[32px] overflow-hidden shadow-xs flex flex-col ${
        fullHeight ? "flex-1 min-h-0" : "h-[650px]"
      }`}
    >
      <iframe
        src={iframeUrl}
        className="flex-1 w-full border-0"
        title="LibreChat"
        allow="microphone; clipboard-write"
      />
    </div>
  );
}
