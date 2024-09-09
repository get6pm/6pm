import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'

export const zDeviceLanguageHeader = ({
  required = false,
}: { required?: boolean } = {}) =>
  zValidator(
    'header',
    z.object({
      'x-device-language': required ? z.string() : z.string().optional(),
    }),
  )

export const zDeviceCurrencyHeader = ({
  required = false,
}: { required?: boolean } = {}) =>
  zValidator(
    'header',
    z.object({
      'x-device-currency': required ? z.string() : z.string().optional(),
    }),
  )
