import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: { unoptimized: true },
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: false },
  webpack: (config) => {
    // Don't try to bundle the legacy/ archive when this app builds.
    config.watchOptions = { ...config.watchOptions, ignored: /legacy\// };
    return config;
  },
};

export default nextConfig;
