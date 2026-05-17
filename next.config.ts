import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  basePath: "/mstravel/scroller",
  images: {
    unoptimized: true,
  },
  async redirects() {
    return [
      {
        source: "/",
        destination: "/mstravel/scroller",
        permanent: false,
        basePath: false,
      },
    ];
  },
};

export default nextConfig;
