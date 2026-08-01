import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "pub-cfc018712725461fa8bcd1c2e0a4a1e7.r2.dev",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
