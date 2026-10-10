import { z } from 'zod';

/** Every failure the API sends: `{error: {code, message, retryable, detail?}}`. */
export const wireErrorCodeSchema = z.enum([
  'bad_request',
  'unauthorized',
  'not_found',
  'rate_limited',
  'internal',
  'model_unavailable',
  'model_timeout',
]);
export type WireErrorCode = z.infer<typeof wireErrorCodeSchema>;

export const wireErrorSchema = z.object({
  error: z.object({
    code: wireErrorCodeSchema,
    message: z.string(),
    retryable: z.boolean(),
    detail: z.record(z.string(), z.unknown()).optional(),
  }),
});
export type WireError = z.infer<typeof wireErrorSchema>;

export const languageSchema = z.enum(['en', 'vi']);
export type ApiLanguage = z.infer<typeof languageSchema>;

/** A device token: URL-safe, long enough that guessing one is hopeless. */
export const deviceTokenPattern = /^[A-Za-z0-9_-]{32,128}$/;

export const registerDeviceRequestSchema = z.object({
  token: z.string().regex(deviceTokenPattern).optional(),
  language: languageSchema,
});
export const registerDeviceResponseSchema = z.object({
  token: z.string().regex(deviceTokenPattern),
});

export const healthResponseSchema = z.object({
  commit: z.string(),
  environment: z.enum(['dev', 'prd']),
  database: z.literal('ok'),
});
