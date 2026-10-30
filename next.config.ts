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
      {
        protocol: "https",
        hostname: "*.susercontent.com",
      },
      // Tokopedia CDN
      {
        protocol: "https",
        hostname: "*.tokopedia.net",
      },
      // Lazada CDN
      {
        protocol: "https",
        hostname: "*.alicdn.com",
      },
      // TikTok CDN
      {
        protocol: "https",
        hostname: "*.tiktokcdn.com",
      },
      {
        protocol: "https",
        hostname: "*.byteoversea.com",
      },
    ],
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
