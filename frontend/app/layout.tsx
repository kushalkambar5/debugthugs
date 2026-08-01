import type { Metadata } from "next";
import "./globals.css";
import ClickSpark from "@/components/ClickSpark";
import ExtensionErrorFilter from "@/components/ExtensionErrorFilter";
import { Providers } from "@/components/providers";


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
        <link rel="manifest" href="/site.webmanifest" crossOrigin="use-credentials" />
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
                function shouldFilter(args) {
                  for (var i = 0; i < args.length; i++) {
                    var arg = args[i];
                    if (!arg) continue;
                    var s = typeof arg === 'string' ? arg : (arg.stack || arg.message || String(arg));
                    if (
                      s.includes('chrome-extension://') ||
                      s.includes('nkbihfbeogaeaoehlefnkodbefgpgknn') ||
                      s.includes('MetaMask') ||
                      s.includes('inpage.js') ||
                      s.includes('contentscript.js') ||
                      s.includes('MaxListenersExceededWarning') ||
                      s.includes('ObjectMultiplex') ||
                      s.includes('app-init-liveness') ||
                      s.includes('React DevTools')
                    ) {
                      return true;
                    }
                  }
                  return false;
                }

                // Patch console methods before any other script executes
                var originalError = console.error;
                console.error = function() {
                  if (shouldFilter(arguments)) return;
                  originalError.apply(console, arguments);
                };

                var originalWarn = console.warn;
                console.warn = function() {
                  if (shouldFilter(arguments)) return;
                  originalWarn.apply(console, arguments);
                };

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
        <Providers>
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
        </Providers>
      </body>
    </html>
  );
}
