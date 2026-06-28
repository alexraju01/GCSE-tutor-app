import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typedRoutes: true,
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.googleusercontent.com", // Matches lh3, lh4, etc.
        pathname: "/**", // Matches /a/... and all other paths
      },
      {
        protocol: "https",
        hostname: "www.shutterstock.com",
        pathname: "/shutterstock/photos/**",
      },
    ],
  },
};

export default nextConfig;
