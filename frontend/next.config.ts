import type { NextConfig } from "next";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:5000";
const MODELS_URL = process.env.MODELS_URL || "http://localhost:8000";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/backend/:path*",
        destination: `${BACKEND_URL}/:path*`,
      },
      {
        source: "/api/models/:path*",
        destination: `${MODELS_URL}/:path*`,
      },
    ];
  },
};

export default nextConfig;
