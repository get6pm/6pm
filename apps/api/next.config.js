/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  rewrites: () => [{ source: '/v1/:path*', destination: '/api/v1/:path*' }],
  transpilePackages: ['@6pm/validation', '@6pm/utilities'],
}

module.exports = nextConfig
