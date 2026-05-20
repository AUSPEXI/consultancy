/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },
  images: { unoptimized: true },
  async redirects() {
    return [
      { source: '/strategy', destination: '/#strategy', permanent: false },
      { source: '/testimonials', destination: '/#testimonials', permanent: false },
    ];
  },
  webpack: (config) => {
    config.externals = [...(config.externals || [])];
    return config;
  },
};

module.exports = nextConfig;
