import { describe, it, expect } from 'vitest';
import { validateUser } from '../userValidator.js';

describe('userValidator (unit)', () => {
  describe('validateUser', () => {
    it('deve retornar valid=true para um usuário com todos os campos válidos', () => {
      const result = validateUser({
        name: 'João Silva',
        email: 'joao@example.com',
        password: '123456',
      });

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('deve invalidar quando o email não tiver formato válido', () => {
      const result = validateUser({
        name: 'João',
        email: 'sem-arroba',
        password: '123456',
      });

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('email inválido');
    });

    it('deve invalidar quando a senha tiver menos de 6 caracteres', () => {
      const result = validateUser({
        name: 'João',
        email: 'joao@example.com',
        password: '123',
      });

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('password deve ter no mínimo 6 caracteres');
    });

    it('deve invalidar quando o nome estiver vazio', () => {
      const result = validateUser({
        name: '',
        email: 'joao@example.com',
        password: '123456',
      });

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('name é obrigatório');
    });
  });
});
