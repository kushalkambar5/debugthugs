"use client";

import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { MaterialIcon } from "@/components/ui/MaterialIcon";

interface HippoChatProps {
  fullHeight?: boolean;
}

export default function HippoChat({ fullHeight = false }: HippoChatProps) {
  const { data: session } = useSession();
  const [iframeUrl, setIframeUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Custom chatbot URL configuration
  const [librechatUrl, setLibrechatUrl] = useState<string>("");
  const [inputUrl, setInputUrl] = useState<string>("");
  const [showConfig, setShowConfig] = useState(false);
  const [reloadTrigger, setReloadTrigger] = useState(0);

  // Helper to determine the default LibreChat URL based on environment and host context
  const getDefaultLibrechatUrl = () => {
    let baseUrl = "";
    if (typeof window !== "undefined") {
      baseUrl = localStorage.getItem("hippo_chatbot_url") || "";
      if (!baseUrl) {
        const customBackend = localStorage.getItem("custom_backend_url");
        if (customBackend) {
          baseUrl = `${customBackend}/librechat`;
        } else {
          // If we are accessing from a remote host (like Vercel) and no custom backend is set,
          // default to the main backend's tunnel URL rather than client's localhost.
          const isLocalhost = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
          if (!isLocalhost) {
            let defaultBackend = process.env.NEXT_PUBLIC_API_URL 
              ? process.env.NEXT_PUBLIC_API_URL.replace(/\/api$/, "") 
              : "";
            
            // If the environment variable is empty or points to localhost, it's invalid on a remote host.
            // Fall back to the public tunnel url.
            if (!defaultBackend || defaultBackend.includes("localhost") || defaultBackend.includes("127.0.0.1")) {
              defaultBackend = "https://daringly-openchain-caden.ngrok-free.dev";
            }
            baseUrl = `${defaultBackend}/librechat`;
          }
        }
      }
    }
    return baseUrl || process.env.NEXT_PUBLIC_LIBRECHAT_URL || "http://localhost:3080";
  };

  useEffect(() => {
    const baseUrl = getDefaultLibrechatUrl();
    setLibrechatUrl(baseUrl);
    setInputUrl(baseUrl);

    const initLibreChatAuth = async () => {
      if (!session) {
        setLoading(false);
        return;
      }

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
  }, [session, reloadTrigger]);

  const handleSaveUrl = () => {
    let formattedUrl = inputUrl.trim();
    if (formattedUrl && !/^https?:\/\//i.test(formattedUrl)) {
      formattedUrl = "http://" + formattedUrl;
    }
    localStorage.setItem("hippo_chatbot_url", formattedUrl);
    setLibrechatUrl(formattedUrl);
    setShowConfig(false);
    setLoading(true);
    setReloadTrigger((prev) => prev + 1);
  };

  const handleResetUrl = () => {
    localStorage.removeItem("hippo_chatbot_url");
    const defaultUrl = getDefaultLibrechatUrl();
    setLibrechatUrl(defaultUrl);
    setInputUrl(defaultUrl);
    setShowConfig(false);
    setLoading(true);
    setReloadTrigger((prev) => prev + 1);
  };

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
      {/* Dynamic connection settings header */}
      <div className="px-6 py-3 border-b border-[#E6E1D3] bg-[#F5F2EA] flex items-center justify-between text-xs flex-wrap gap-2">
        <div className="flex items-center gap-2 text-[#787363]">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>
            Chatbot URL: <code className="bg-[#EAE5D8] px-1.5 py-0.5 rounded text-[#5C574A] select-all">{librechatUrl}</code>
          </span>
        </div>
        <button
          onClick={() => setShowConfig(!showConfig)}
          className="flex items-center gap-1 px-2.5 py-1 rounded-lg border border-[#D1C9B7] bg-[#FAF9F5] text-[#5C574A] hover:bg-[#EAE5D8] transition-colors"
        >
          <MaterialIcon name="settings" className="text-sm" />
          <span>Configure Connection</span>
        </button>
      </div>

      {showConfig && (
        <div className="p-4 border-b border-[#E6E1D3] bg-[#F0EBE0] flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-[#5C574A]">Configure Chatbot Server URL</span>
            <span className="text-[11px] text-[#787363] leading-relaxed">
              If accessing this site via HTTPS (e.g. on Vercel) from another device, modern browsers will block standard HTTP links like <code>http://localhost:3080</code> due to <strong>mixed content</strong> security. To fix this, use an HTTPS tunnel (e.g. ngrok: <code>https://your-tunnel.ngrok-free.app</code>).
            </span>
          </div>
          <div className="flex gap-2 flex-wrap">
            <input
              type="text"
              value={inputUrl}
              onChange={(e) => setInputUrl(e.target.value)}
              placeholder="e.g., https://your-tunnel.ngrok-free.app"
              className="flex-1 min-w-[200px] px-3 py-1.5 rounded-lg border border-[#D1C9B7] bg-[#FAF9F5] text-xs text-[#333] focus:outline-none focus:border-[#8C6B1F]"
            />
            <button
              onClick={handleSaveUrl}
              className="px-4 py-1.5 rounded-lg bg-[#8C6B1F] text-[#FAF9F5] text-xs hover:bg-[#705518] transition-colors font-medium"
            >
              Save & Reconnect
            </button>
            <button
              onClick={handleResetUrl}
              className="px-3 py-1.5 rounded-lg border border-[#D1C9B7] bg-[#FAF9F5] text-xs text-[#5C574A] hover:bg-[#EAE5D8] transition-colors"
            >
              Reset to Default
            </button>
          </div>
        </div>
      )}

      <iframe
        src={iframeUrl}
        className="flex-1 w-full border-0"
        title="LibreChat"
        allow="microphone; clipboard-write"
      />
    </div>
  );
}
