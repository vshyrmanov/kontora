import type { ApiErrorBody } from '@kontora/contracts';
import type { ErrorRequestHandler, RequestHandler } from 'express';
import mongoose from 'mongoose';
import { ZodError } from 'zod';
import { HttpError } from '../lib/http-error.js';

const body = (code: string, message: string, details?: unknown): ApiErrorBody => ({
  error: details === undefined ? { code, message } : { code, message, details },
});

export const notFoundHandler: RequestHandler = (req, res) => {
  res.status(404).json(body('NOT_FOUND', `Маршрут ${req.method} ${req.path} не існує`));
};

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof HttpError) {
    res.status(err.status).json(body(err.code, err.message, err.details));
    return;
  }
  if (err instanceof ZodError) {
    res.status(400).json(body('VALIDATION_ERROR', 'Перевірте введені дані', err.flatten()));
    return;
  }
  if (err instanceof mongoose.Error.CastError) {
    res.status(400).json(body('INVALID_ID', 'Некоректний ідентифікатор'));
    return;
  }
  if (typeof err === 'object' && err !== null && 'code' in err && err.code === 11000) {
    res.status(409).json(body('CONFLICT', 'Запис із такими даними вже існує'));
    return;
  }
  if (typeof err === 'object' && err !== null && 'type' in err && err.type === 'entity.parse.failed') {
    res.status(400).json(body('INVALID_JSON', 'Тіло запиту має бути коректним JSON'));
    return;
  }
  console.error(err);
  res.status(500).json(body('INTERNAL_ERROR', 'Внутрішня помилка сервера'));
};
