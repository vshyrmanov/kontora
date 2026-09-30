import type { UserRole } from '@kontora/contracts';
import type { RequestHandler } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { forbidden, unauthorized } from '../lib/http-error.js';

export interface AuthUser {
  id: string;
  role: UserRole;
}

interface TokenPayload {
  sub: string;
  role: UserRole;
}

export const signToken = (user: AuthUser) =>
  jwt.sign({ role: user.role } satisfies Omit<TokenPayload, 'sub'>, env().JWT_SECRET, {
    subject: user.id,
    expiresIn: env().JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'],
  });

/** Авторизований користувач поточного запиту (після requireAuth). */
export const currentUser = (locals: Record<string, unknown>): AuthUser => {
  const user = locals.user as AuthUser | undefined;
  if (!user) throw unauthorized();
  return user;
};

export const requireAuth: RequestHandler = (req, res, next) => {
  const header = req.get('authorization') ?? '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  if (!token) throw unauthorized();
  try {
    const payload = jwt.verify(token, env().JWT_SECRET) as TokenPayload;
    res.locals.user = { id: payload.sub, role: payload.role } satisfies AuthUser;
    next();
  } catch {
    throw unauthorized('Сесія завершилась, увійдіть знову');
  }
};

export const requireRole =
  (...roles: UserRole[]): RequestHandler =>
  (_req, res, next) => {
    if (!roles.includes(currentUser(res.locals).role)) throw forbidden();
    next();
  };
