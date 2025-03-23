/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@6pm/ui'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'img.clerk.com',
      },
    ],
  },
}

export default nextConfig
