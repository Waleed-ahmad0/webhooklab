/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: "/auth/:path*",
        destination: "https://webhooklab-production.up.railway.app/auth/:path*",
      },
    ];
  },
};

module.exports = nextConfig;