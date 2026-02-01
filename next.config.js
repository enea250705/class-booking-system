/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Disable TypeScript type checking during build if needed
  typescript: {
    // Warning: This allows production builds to successfully complete even if
    // your project has type errors.
    ignoreBuildErrors: true,
  },
  // Turbopack config for Next.js 16 (webpack removed)
  turbopack: {},
};

module.exports = nextConfig; 