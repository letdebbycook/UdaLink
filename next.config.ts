import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // Supabase Storage (project-specific)
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
      // Supabase Storage (custom domain)
      {
        protocol: "https",
        hostname: "*.supabase.in",
        pathname: "/storage/v1/object/public/**",
      },
      // Unsplash (used in seed data / dummy images)
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      // Shopee CDN
      {
        protocol: "https",
        hostname: "*.shp.ee",
      },
      {
        protocol: "https",
        hostname: "*.shopee.co.id",
      },
    ],
  },
  experimental: {
    agentUpgrade: "security",
  },
  poweredByHeader: false,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
