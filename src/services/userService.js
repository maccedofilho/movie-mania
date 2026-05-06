import crypto from 'node:crypto';
import { User } from '../models/User.js';
import { validateUser } from '../utils/userValidator.js';

function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

export async function verifyPassword(plain, hash) {
  return hashPassword(plain) === hash;
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

  return User.create({
    name: data.name,
    email: data.email,
    password: hashPassword(data.password),
  });
}

export async function login(email, password) {
  const user = await User.findOne({ where: { email } });
  if (!user) return null;

  const ok = await verifyPassword(password, user.password);
  if (!ok) return null;

  return user;
}
