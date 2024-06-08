/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  rewrites: () => [
    { source: '/v1/:path*', destination: '/api/v1/:path*' },
  ]
}

module.exports = nextConfig
