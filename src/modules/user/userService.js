import bcrypt from 'bcryptjs';
import { User } from './User.js';
import { validateUser } from './userValidator.js';

const SALT_ROUNDS = 10;

export async function verifyPassword(plain, hash) {
  return bcrypt.compare(plain, hash);
}

export async function register(data) {
  const { valid, errors } = validateUser(data);
  if (!valid) {
    const err = new Error(`dados inválidos: ${errors.join(', ')}`);
    err.errors = errors;
    throw err;
  }

  const existing = await User.findOne({ where: { email: data.email } });
  if (existing) {
    throw new Error('email já está em uso');
  }

  const hashed = await bcrypt.hash(data.password, SALT_ROUNDS);

  return User.create({
    name: data.name,
    email: data.email,
    password: hashed,
  });
}

export async function login(email, password) {
  const user = await User.findOne({ where: { email } });
  if (!user) return null;

  const ok = await verifyPassword(password, user.password);
  if (!ok) return null;

  return user;
}
