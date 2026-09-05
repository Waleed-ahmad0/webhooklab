// next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    const backendUrl = process.env.BACKEND_URL || "http://localhost:4000";
    return [
      {
        source: "/auth/:path*",
        destination: `${backendUrl}/auth/:path*`,
      },
      {
        source: "/webhook/:path*",
        destination: `${backendUrl}/webhook/:path*`,
      },
      {
        source: "/api/:path*",
        destination: `${backendUrl}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;