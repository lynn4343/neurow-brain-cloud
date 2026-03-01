import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  images: {
    unoptimized: true,
  },
  // CRITICAL for Electron: relative paths so file:// protocol resolves assets correctly
  assetPrefix: process.env.NODE_ENV === 'production' ? './' : undefined,
  // Ensure clean routing for static export
  trailingSlash: true,
};

export default nextConfig;
