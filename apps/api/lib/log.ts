import pino from 'pino'

export const log = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport:
    process.env.NODE_ENV === 'development'
      ? {
          target: 'pino-pretty',
        }
      : undefined,
})

export const getLogger = (name: string) => log.child({ name })
