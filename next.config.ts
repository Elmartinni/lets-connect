import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '', // Keep empty unless a specific port is needed
        pathname: '/**', // Allow any path on this hostname
      },
      // Add other domains here if needed in the future
      // {
      //   protocol: 'https',
      //   hostname: 'another-domain.com',
      // },
    ],
  },
  /* config options here */
};

export default nextConfig;
