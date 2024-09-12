import pino from 'pino'

const IS_DEV = process.env.NODE_ENV === 'development'
const IS_PROD = process.env.NODE_ENV === 'production'

export const log = pino({
  level: process.env.LOG_LEVEL || 'debug',
  transport: IS_DEV
    ? {
        target: 'pino-pretty',
      }
    : undefined,
  base: IS_PROD
    ? {
        env: process.env.NODE_ENV,
        revision: process.env.VERCEL_GIT_COMMIT_SHA,
      }
    : undefined,
})

export const getLogger = (name: string) => log.child({ name })
