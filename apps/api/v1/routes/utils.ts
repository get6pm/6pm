import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'

export const zDeviceLanguageHeader = zValidator(
  'header',
  z.object({
    'x-device-language': z.string().optional(),
  }),
)
