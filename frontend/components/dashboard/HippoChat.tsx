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

  const librechatUrl = process.env.NEXT_PUBLIC_LIBRECHAT_URL || "http://localhost:3080";

  useEffect(() => {
    const initLibreChatAuth = async () => {
      if (!session) {
        setLoading(false);
        return;
      }

      try {
        const tokenRes = await fetch("/api/librechat-token");
        if (tokenRes.ok) {
          const { token } = await tokenRes.json();
          setIframeUrl(`${librechatUrl}/?autoLoginToken=${encodeURIComponent(token)}`);
        } else {
          console.error("Failed to fetch LibreChat token");
          setIframeUrl(librechatUrl);
        }
      } catch (err) {
        console.error("Error setting up LibreChat auth:", err);
        setIframeUrl(librechatUrl);
      } finally {
        setLoading(false);
      }
    };

    initLibreChatAuth();
  }, [session, librechatUrl]);

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
