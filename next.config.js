/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true,
  },
  // Disable filesystem webpack cache in dev to avoid race conditions with rm -rf .next
  webpack: (config, { dev }) => {
    if (dev) {
      config.cache = false;
    }
    return config;
  },
}

module.exports = nextConfig
