/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: false,  // Disable SWC completely for Termux
  compiler: {
    removeConsole: false,
  },
  experimental: {
    esmExternals: false,
  },
  images: {
    domains: [],
  },
}

module.exports = nextConfig


