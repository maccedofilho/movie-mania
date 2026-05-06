import { assert } from 'chai';
import { validateUser } from '../../src/utils/userValidator.js';

describe('userValidator (unit - assert)', () => {
  describe('validateUser', () => {
    it('deve retornar valid=true para um usuário com todos os campos válidos', () => {
      const result = validateUser({
        name: 'João Silva',
        email: 'joao@example.com',
        password: '123456',
      });

      assert.isTrue(result.valid);
      assert.isArray(result.errors);
      assert.lengthOf(result.errors, 0);
    });

    it('deve invalidar quando o email não tiver formato válido', () => {
      const result = validateUser({
        name: 'João',
        email: 'sem-arroba',
        password: '123456',
      });

      assert.isFalse(result.valid);
      assert.include(result.errors, 'email inválido');
    });

    it('deve invalidar quando a senha tiver menos de 6 caracteres', () => {
      const result = validateUser({
        name: 'João',
        email: 'joao@example.com',
        password: '123',
      });

      assert.isFalse(result.valid);
      assert.include(result.errors, 'password deve ter no mínimo 6 caracteres');
    });

    it('deve invalidar quando o nome estiver vazio', () => {
      const result = validateUser({
        name: '',
        email: 'joao@example.com',
        password: '123456',
      });

      assert.isFalse(result.valid);
      assert.include(result.errors, 'name é obrigatório');
    });
  });
});
