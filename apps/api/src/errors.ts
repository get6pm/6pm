import type { WireError, WireErrorCode } from '@6pm/domain';
import { HTTPException } from 'hono/http-exception';
import type { ContentfulStatusCode } from 'hono/utils/http-status';

type ErrorDetail = Record<string, unknown>;

const statusByCode = {
  bad_request: 400,
  unauthorized: 401,
  not_found: 404,
  rate_limited: 429,
  internal: 500,
  model_unavailable: 503,
  model_timeout: 504,
} as const satisfies Record<WireErrorCode, ContentfulStatusCode>;

/** Whether trying the same request again can succeed. */
const retryableByCode: Record<WireErrorCode, boolean> = {
  bad_request: false,
  unauthorized: false,
  not_found: false,
  rate_limited: true,
  internal: false,
  model_unavailable: true,
  model_timeout: true,
};

/**
 * The one way a route fails on purpose. Its message and detail go to the client, so they never
 * hold an amount, a merchant, a token or anything else the user entered.
 */
export class ApiError extends Error {
  readonly code: WireErrorCode;
  readonly detail: ErrorDetail | undefined;

  constructor(code: WireErrorCode, message: string, detail?: ErrorDetail) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.detail = detail;
  }
}

function clientErrorCode(status: number): WireErrorCode {
  if (status === 401 || status === 403) return 'unauthorized';
  if (status === 404) return 'not_found';
  if (status === 429) return 'rate_limited';
  return 'bad_request';
}

/** Anything thrown, as an `ApiError`. Unknown errors become `internal` and keep their text private. */
export function toApiError(error: unknown): ApiError {
  if (error instanceof ApiError) return error;
  if (error instanceof HTTPException && error.status < 500) {
    return new ApiError(clientErrorCode(error.status), error.message || 'Invalid request');
  }
  return new ApiError('internal', 'Something went wrong');
}

export function wireError(error: ApiError): { status: ContentfulStatusCode; body: WireError } {
  return {
    status: statusByCode[error.code],
    body: {
      error: {
        code: error.code,
        message: error.message,
        retryable: retryableByCode[error.code],
        ...(error.detail === undefined ? {} : { detail: error.detail }),
      },
    },
  };
}
