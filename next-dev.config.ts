import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
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
      // you can add production domains here later, e.g.:
      // {
      //   protocol: "https",
      //   hostname: "api.dartsmalawi.org",
      //   pathname: "/uploads/**",
      // },
    ],
  },
};

export default nextConfig;
