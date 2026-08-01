"use client";

import { useEffect } from "react";

export default function ExtensionErrorFilter() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const reasonStr = String(event.reason?.stack || event.reason?.message || event.reason || "");
      if (
        reasonStr.includes("chrome-extension://") ||
        reasonStr.includes("MetaMask") ||
        reasonStr.includes("inpage.js")
      ) {
        event.stopImmediatePropagation();
        event.preventDefault();
      }
    };

    const handleError = (event: ErrorEvent) => {
      if (
        event.filename?.includes("chrome-extension://") ||
        event.message?.includes("MetaMask") ||
        event.message?.includes("inpage.js")
      ) {
        event.stopImmediatePropagation();
        event.preventDefault();
      }
    };

    window.addEventListener("unhandledrejection", handleUnhandledRejection);
    window.addEventListener("error", handleError);

    return () => {
      window.removeEventListener("unhandledrejection", handleUnhandledRejection);
      window.removeEventListener("error", handleError);
    };
  }, []);

  return null;
}
