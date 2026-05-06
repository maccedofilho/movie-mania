export function validateMovie(data = {}) {
  const errors = [];
  const currentYear = new Date().getFullYear();

  if (!data.title || data.title.trim() === '') {
    errors.push('title é obrigatório');
  }

  if (!data.director || data.director.trim() === '') {
    errors.push('director é obrigatório');
  }

  if (!Number.isInteger(data.year) || data.year < 1888 || data.year > currentYear + 5) {
    errors.push('year inválido');
  }

  return { valid: errors.length === 0, errors };
}
