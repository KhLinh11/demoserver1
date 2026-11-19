import type { NextConfig } from "next";

const target = process.env.API_PROXY_TARGET || "http://127.0.0.1:8000";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return {
      afterFiles: [
        {
          source: "/api/:path*",
          destination: `${target}/api/:path*`,
        },
        {
          source: "/docs",
          destination: `${target}/docs`,
        },
        {
          source: "/openapi.json",
          destination: `${target}/openapi.json`,
        },
      ],
      fallback: [],
    };
  },
};

export default nextConfig;
