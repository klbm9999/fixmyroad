/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@fixmyroad/shared'],
  output: 'standalone',
};

module.exports = nextConfig;
