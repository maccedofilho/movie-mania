import { describe, it, expect } from 'vitest';
import { validateMovie } from '../movieValidator.js';

describe('movieValidator (unit)', () => {
  describe('validateMovie', () => {
    it('deve retornar valid=true para um filme com todos os campos obrigatórios', () => {
      const result = validateMovie({
        title: 'Matrix',
        director: 'Wachowski',
        year: 1999,
      });

      expect(result.valid).toBe(true);
      expect(Array.isArray(result.errors)).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('deve invalidar quando o título estiver vazio', () => {
      const result = validateMovie({
        title: '',
        director: 'Wachowski',
        year: 1999,
      });

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('title é obrigatório');
    });

    it('deve invalidar quando o diretor estiver ausente', () => {
      const result = validateMovie({
        title: 'Matrix',
        year: 1999,
      });

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('director é obrigatório');
    });

    it('deve invalidar quando o ano for menor que 1888', () => {
      const result = validateMovie({
        title: 'Antigo',
        director: 'X',
        year: 1800,
      });

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('year inválido');
    });

    it('deve invalidar quando o ano for maior que o ano atual + 5', () => {
      const result = validateMovie({
        title: 'Futuro',
        director: 'X',
        year: new Date().getFullYear() + 10,
      });

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('year inválido');
    });

    it('deve acumular múltiplos erros quando vários campos forem inválidos', () => {
      const result = validateMovie({
        title: '',
        director: '',
        year: 1500,
      });

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThanOrEqual(3);
    });
  });
});
