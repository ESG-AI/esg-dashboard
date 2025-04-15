/** @type {import('next').NextConfig}; */

const nextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '20mb' // You can adjust this value based on your needs
    }
  }
}
module.exports = nextConfig;