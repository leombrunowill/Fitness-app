/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    NEXT_PUBLIC_FEATURE_BARCODE: process.env.NEXT_PUBLIC_FEATURE_BARCODE || 'false',
  },
};

module.exports = nextConfig;
