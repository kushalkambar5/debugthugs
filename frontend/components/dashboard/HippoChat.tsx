"use client";

import React from "react";

interface HippoChatProps {
  fullHeight?: boolean;
}

export default function HippoChat({ fullHeight = false }: HippoChatProps) {
  const librechatUrl = process.env.NEXT_PUBLIC_LIBRECHAT_URL || "http://localhost:3080";

  return (
    <div
      className={`w-full bg-[#FAF9F5] border border-[#E6E1D3] rounded-[32px] overflow-hidden shadow-xs flex flex-col ${
        fullHeight ? "flex-1 min-h-0" : "h-[650px]"
      }`}
    >
      <iframe
        src={librechatUrl}
        className="flex-1 w-full border-0"
        title="LibreChat"
        allow="microphone; clipboard-write"
      />
    </div>
  );
}
