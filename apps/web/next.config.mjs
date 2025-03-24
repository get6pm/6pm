import { PrismaPlugin } from '@prisma/nextjs-monorepo-workaround-plugin'
import createNextIntlPlugin from 'next-intl/plugin'

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
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.plugins = [...config.plugins, new PrismaPlugin()]
    }
    return config
  },
}

const withNextIntl = createNextIntlPlugin('./lib/i18n-request.ts')

export default withNextIntl(nextConfig)
