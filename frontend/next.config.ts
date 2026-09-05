// next.config.ts
/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    const backendUrl = process.env.BACKEND_URL || "http://localhost:4000";
    return [
      {
        source: "/auth/:path*",
        destination: `${backendUrl}/auth/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;