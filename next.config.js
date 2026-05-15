/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Avoid blocking production deploys on lint warnings; run `npm run lint` in CI separately.
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
};

module.exports = nextConfig;
