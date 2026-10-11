/** Why a call to the 6pm server did not give an answer. */
export type ApiFailure =
  /** No answer came: offline, a dropped connection or a server that could not be reached. */
  | 'network'
  /** The call took longer than it was allowed to. */
  | 'timeout'
  /** The server would not take this device's token, even after registering again. */
  | 'unauthorized'
  | 'rate_limited'
  /** The server or its model had a problem; trying again can help. */
  | 'unavailable'
  /** The server refused the request as sent. */
  | 'bad_request'
  /** The server answered with something this app does not understand. */
  | 'bad_response';

/**
 * A failed server call. The message names a path and a status only: a request can hold a
 * question about the user's spending and the token is a credential, so neither is ever put here.
 */
export class ApiRequestError extends Error {
  readonly failure: ApiFailure;
  /** Whether asking again could work. */
  readonly retryable: boolean;

  constructor(failure: ApiFailure, message: string, retryable: boolean) {
    super(message);
    this.name = 'ApiRequestError';
    this.failure = failure;
    this.retryable = retryable;
  }
}
