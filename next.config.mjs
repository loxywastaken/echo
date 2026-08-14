/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: {
    // We ship our own lint pipeline; don't fail production builds on lint.
    ignoreDuringBuilds: true,
  },
  images: {
    // Media is served from local /uploads and a few avatar CDNs used in seed data.
    remotePatterns: [
      { protocol: "https", hostname: "**" },
    ],
  },
  experimental: {
    serverComponentsExternalPackages: ["bcryptjs"],
  },
};

export default nextConfig;
