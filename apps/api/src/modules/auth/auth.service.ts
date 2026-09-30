import type { AuthResponse, LoginInput, UserDto, UserRole } from '@kontora/contracts';
import bcrypt from 'bcryptjs';
import { notFound, unauthorized } from '../../lib/http-error.js';
import { signToken } from '../../middleware/auth.js';
import { User } from '../../models/user.model.js';

const toUserDto = (u: { _id: unknown; email: string; name: string; role: string }): UserDto => ({
  id: String(u._id),
  email: u.email,
  name: u.name,
  role: u.role as UserRole,
});

export const hashPassword = (password: string) => bcrypt.hash(password, 12);

// хеш-заглушка: порівнюємо навіть без користувача, щоб час відповіді не видавав наявність email
let dummyHash: Promise<string> | undefined;

export async function login({ email, password }: LoginInput): Promise<AuthResponse> {
  const user = await User.findOne({ email }).select('+passwordHash').lean();
  const ok = await bcrypt.compare(password, user?.passwordHash ?? (await (dummyHash ??= hashPassword('dummy-password'))));
  if (!user || !ok) throw unauthorized('Невірний email або пароль');
  const dto = toUserDto(user);
  return { token: signToken({ id: dto.id, role: dto.role }), user: dto };
}

export async function getUser(id: string): Promise<UserDto> {
  const user = await User.findById(id).lean();
  if (!user) throw notFound('Користувача');
  return toUserDto(user);
}
