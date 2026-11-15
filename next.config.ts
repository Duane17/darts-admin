import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Shared hosting caps process count; default (one worker per CPU) fails with spawn EAGAIN.
  experimental: { cpus: 1, workerThreads: false },
  eslint: { ignoreDuringBuilds: true },
  output: "export",
  trailingSlash: true,
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
        port: "4000",
        pathname: "/uploads/**",
      },
      {
        protocol: "http",
        hostname: "localhost",
        port: "4000",
        pathname: "/images/**",
      },
      {
        protocol: "https",
        hostname: "api.dartsmalawi.org",
        pathname: "/uploads/**",
      },
    ],
  },
};

export default nextConfig;
