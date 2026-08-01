import type { Metadata } from "next";
import "./globals.css";
import ClickSpark from "@/components/ClickSpark";
import ExtensionErrorFilter from "@/components/ExtensionErrorFilter";

export const metadata: Metadata = {
  title: "Hippo Health — Precision AI & Clinical Healthcare Platform",
  description:
    "AI Medical Chatbot, Doctor-Verified Recommendations, Smartwatch Sync, 3D Anatomy Visualization & Advanced Clinical AI Diagnostics.",
  icons: {
    icon: [
      { url: "/favicon-96x96.png", sizes: "96x96", type: "image/png" },
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon.ico" },
    ],
    shortcut: "/favicon.ico",
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  manifest: "/site.webmanifest",
  appleWebApp: {
    title: "MyWebSite",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className="h-full antialiased scroll-smooth"
    >
      <head>
        <link
          rel="stylesheet"
          href="https://fonts.cdnfonts.com/css/google-sans"
        />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap"
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                function isExtError(str) {
                  if (!str) return false;
                  var s = String(str);
                  return s.includes('chrome-extension://') ||
                         s.includes('nkbihfbeogaeaoehlefnkodbefgpgknn') ||
                         s.includes('MetaMask') ||
                         s.includes('inpage.js');
                }
                window.addEventListener('unhandledrejection', function(e) {
                  var reason = e.reason;
                  var errStr = reason ? (reason.stack || reason.message || String(reason)) : '';
                  if (isExtError(errStr)) {
                    e.stopImmediatePropagation();
                    e.preventDefault();
                  }
                }, true);
                window.addEventListener('error', function(e) {
                  var errStr = (e.message || '') + ' ' + (e.filename || '') + ' ' + (e.error ? (e.error.stack || '') : '');
                  if (isExtError(errStr)) {
                    e.stopImmediatePropagation();
                    e.preventDefault();
                  }
                }, true);
              })();
            `,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-[#F6F4EF] text-[#1C1B18] font-sans selection:bg-[#F4E071] selection:text-[#1C1B18]">
        <ExtensionErrorFilter />
        <ClickSpark
          sparkColor="#10B981"
          sparkSize={10}
          sparkRadius={15}
          sparkCount={8}
          duration={400}
        >
          {children}
        </ClickSpark>
      </body>
    </html>
  );
}
