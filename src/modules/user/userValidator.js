const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateUser(data = {}) {
  const errors = [];

  if (!data.name || data.name.trim() === '') {
    errors.push('name é obrigatório');
  }

  if (!data.email || !EMAIL_REGEX.test(data.email)) {
    errors.push('email inválido');
  }

  if (!data.password || data.password.length < 6) {
    errors.push('password deve ter no mínimo 6 caracteres');
  }

  return { valid: errors.length === 0, errors };
}
