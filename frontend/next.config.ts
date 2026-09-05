// next.config.ts
/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    const backendUrl =  "http://localhost:4000";
    return [
      {
        source: "/auth/:path*",
        destination: `${backendUrl}/auth/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;