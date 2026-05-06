import { assert } from 'chai';
import { validateMovie } from '../../src/utils/movieValidator.js';

describe('movieValidator (unit - assert)', () => {
  describe('validateMovie', () => {
    it('deve retornar valid=true para um filme com todos os campos obrigatórios', () => {
      const result = validateMovie({
        title: 'Matrix',
        director: 'Wachowski',
        year: 1999,
      });

      assert.isTrue(result.valid);
      assert.isArray(result.errors);
      assert.lengthOf(result.errors, 0);
    });

    it('deve invalidar quando o título estiver vazio', () => {
      const result = validateMovie({
        title: '',
        director: 'Wachowski',
        year: 1999,
      });

      assert.isFalse(result.valid);
      assert.include(result.errors, 'title é obrigatório');
    });

    it('deve invalidar quando o diretor estiver ausente', () => {
      const result = validateMovie({
        title: 'Matrix',
        year: 1999,
      });

      assert.isFalse(result.valid);
      assert.include(result.errors, 'director é obrigatório');
    });

    it('deve invalidar quando o ano for menor que 1888', () => {
      const result = validateMovie({
        title: 'Antigo',
        director: 'X',
        year: 1800,
      });

      assert.isFalse(result.valid);
      assert.include(result.errors, 'year inválido');
    });

    it('deve invalidar quando o ano for maior que o ano atual + 5', () => {
      const result = validateMovie({
        title: 'Futuro',
        director: 'X',
        year: new Date().getFullYear() + 10,
      });

      assert.isFalse(result.valid);
      assert.include(result.errors, 'year inválido');
    });

    it('deve acumular múltiplos erros quando vários campos forem inválidos', () => {
      const result = validateMovie({
        title: '',
        director: '',
        year: 1500,
      });

      assert.isFalse(result.valid);
      assert.isAtLeast(result.errors.length, 3);
    });
  });
});
