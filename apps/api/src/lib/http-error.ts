export class HttpError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    readonly details?: unknown,
  ) {
    super(message);
    this.name = 'HttpError';
  }
}

export const notFound = (what: string) => new HttpError(404, 'NOT_FOUND', `${what} не знайдено`);
export const badRequest = (message: string, details?: unknown) =>
  new HttpError(400, 'BAD_REQUEST', message, details);
export const conflict = (message: string) => new HttpError(409, 'CONFLICT', message);
export const unauthorized = (message = 'Потрібна авторизація') => new HttpError(401, 'UNAUTHORIZED', message);
export const forbidden = (message = 'Недостатньо прав') => new HttpError(403, 'FORBIDDEN', message);
