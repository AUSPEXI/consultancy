/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },
  images: { unoptimized: true },
  async headers() {
    return [
      {
        // Allow Google Sign-In popup to communicate with the parent window.
        // 'same-origin' (the Next.js default) blocks window.closed checks from popups.
        source: '/(.*)',
        headers: [
          { key: 'Cross-Origin-Opener-Policy', value: 'same-origin-allow-popups' },
        ],
      },
      {
        // Keep the app itself out of search/AI indexes — robots.txt only blocks
        // crawling, not indexing of already-known URLs.
        source: '/dashboard/:path*',
        headers: [
          { key: 'X-Robots-Tag', value: 'noindex, nofollow' },
        ],
      },
      {
        source: '/dashboard',
        headers: [
          { key: 'X-Robots-Tag', value: 'noindex, nofollow' },
        ],
      },
    ];
  },
  async redirects() {
    return [
      // ── Existing anchors ─────────────────────────────────────────────────
      { source: '/strategy',    destination: '/#strategy',    permanent: false },
      { source: '/testimonials',destination: '/#testimonials',permanent: false },

      // ── Old AethergenAI pages → sensible new destinations (301) ──────────
      // Account/user flows
      { source: '/account',              destination: '/dashboard',  permanent: true },
      { source: '/pricing',              destination: '/#pricing',   permanent: true },
      { source: '/pilot',                destination: '/',           permanent: true },
      { source: '/funding',              destination: '/',           permanent: true },

      // Old product / demo pages
      { source: '/ai',                   destination: '/',           permanent: true },
      { source: '/evidence',             destination: '/',           permanent: true },
      { source: '/context-dashboard',    destination: '/dashboard',  permanent: true },
      { source: '/context-engineering',  destination: '/',           permanent: true },
      { source: '/choose-model',         destination: '/',           permanent: true },
      { source: '/zero-trust-calibration',destination: '/',          permanent: true },
      { source: '/hero-art',             destination: '/',           permanent: true },
      { source: '/ab-experiment',        destination: '/',           permanent: true },
      { source: '/marketplace-demo',     destination: '/',           permanent: true },
      { source: '/automotive-demo',      destination: '/',           permanent: true },
      { source: '/efficiency-demo',      destination: '/',           permanent: true },
      { source: '/cards-demo',           destination: '/',           permanent: true },
      { source: '/starter/lam',          destination: '/',           permanent: true },
      { source: '/starter/slm',          destination: '/',           permanent: true },
      { source: '/starter/sam',          destination: '/',           permanent: true },
      { source: '/starter/moe',          destination: '/',           permanent: true },

      // Old path prefixes (wildcard)
      { source: '/press/:path*',         destination: '/',           permanent: true },
      { source: '/docs/:path*',          destination: '/',           permanent: true },
      { source: '/notebooks/:path*',     destination: '/',           permanent: true },
      { source: '/experiments/:path*',   destination: '/',           permanent: true },
      { source: '/marketing/:path*',     destination: '/',           permanent: true },
      { source: '/cv/:path*',            destination: '/',           permanent: true },
      { source: '/starter/:path*',       destination: '/',           permanent: true },
    ];
  },
  webpack: (config) => {
    config.externals = [...(config.externals || [])];
    // Force single Three.js instance — @react-three/fiber and @react-three/drei
    // both pull in Three.js causing the "Multiple instances" warning.
    config.resolve.alias = {
      ...config.resolve.alias,
      three: require.resolve('three'),
    };
    return config;
  },
};

module.exports = nextConfig;
