import type { NextConfig } from "next";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:5000";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/backend/:path*",
        destination: `${BACKEND_URL}/:path*`,
      },
      {
        source: "/api/models/:path*",
        destination: `${BACKEND_URL}/api/models/:path*`,
      },
      {
        source: "/api/chatbot/:path*",
        destination: `${BACKEND_URL}/api/chatbot/:path*`,
      },
    ];
  },
};

export default nextConfig;
