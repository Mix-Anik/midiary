import type { Context } from 'hono';
import type { StatusCode } from 'hono/utils/http-status';

/** Structured error thrown by route handlers to produce specific HTTP responses. */
export class HttpError extends Error {
  constructor(
    public readonly status: StatusCode,
    message: string,
  ) {
    super(message);
    this.name = 'HttpError';
  }
}

export function errorHandler(err: Error, c: Context) {
  if (err instanceof HttpError) {
    return c.json({ error: err.message }, err.status);
  }

  console.error('[unhandled error]', err);
  return c.json({ error: 'Internal server error' }, 500);
}
