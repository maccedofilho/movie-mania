import { describe, it, expect, vi } from 'vitest';
import { User } from '../User.js';
import * as userService from '../userService.js';

vi.mock('bcryptjs', () => ({
  default: {
    hash: vi.fn(async (pwd) => `hashed:${pwd}`),
    compare: vi.fn(async (plain, hash) => hash === `hashed:${plain}`),
  },
}));

describe('userService (unit)', () => {
  describe('register', () => {
    it('deve criar um usuário com hash de senha (não armazenar texto puro)', async () => {
      vi.spyOn(User, 'findOne').mockResolvedValue(null);
      const spy = vi.spyOn(User, 'create').mockImplementation(async (data) => ({
        id: 1,
        ...data,
      }));

      const result = await userService.register({
        name: 'João',
        email: 'joao@example.com',
        password: '123456',
      });

      expect(spy).toHaveBeenCalledOnce();
      const args = spy.mock.calls[0][0];
      expect(args.password).not.toBe('123456');
      expect(args.password).toBe('hashed:123456');
      expect(result).toHaveProperty('id', 1);
    });

    it('deve lançar erro quando o email já estiver em uso', async () => {
      vi.spyOn(User, 'findOne').mockResolvedValue({
        id: 1,
        email: 'duplicado@example.com',
      });

      await expect(
        userService.register({
          name: 'X',
          email: 'duplicado@example.com',
          password: '123456',
        })
      ).rejects.toThrow(/email/i);
    });

    it('deve lançar erro quando os dados forem inválidos', async () => {
      const findSpy = vi.spyOn(User, 'findOne');
      const createSpy = vi.spyOn(User, 'create');

      try {
        await userService.register({
          name: '',
          email: 'sem-arroba',
          password: '123',
        });
        expect.unreachable('deveria ter lançado');
      } catch (err) {
        expect(err).toBeInstanceOf(Error);
        expect(err).toHaveProperty('errors');
        expect(Array.isArray(err.errors)).toBe(true);
        expect(err.errors.length).toBeGreaterThan(0);
      }

      expect(findSpy).not.toHaveBeenCalled();
      expect(createSpy).not.toHaveBeenCalled();
    });
  });

  describe('login', () => {
    it('deve buscar o usuário pelo email', async () => {
      const spy = vi.spyOn(User, 'findOne').mockResolvedValue(null);

      await userService.login('joao@example.com', '123456').catch(() => {});

      expect(spy).toHaveBeenCalledWith({
        where: { email: 'joao@example.com' },
      });
    });

    it('deve retornar null quando o usuário não existir', async () => {
      vi.spyOn(User, 'findOne').mockResolvedValue(null);

      const result = await userService.login('inexistente@example.com', '123456');

      expect(result).toBeNull();
    });

    it('deve retornar o usuário quando a senha estiver correta', async () => {
      const fakeUser = {
        id: 1,
        email: 'joao@example.com',
        password: 'hashed:123456',
      };
      vi.spyOn(User, 'findOne').mockResolvedValue(fakeUser);

      const result = await userService.login('joao@example.com', '123456');

      expect(result).toBe(fakeUser);
      expect(result).toHaveProperty('id', 1);
    });

    it('deve retornar null quando a senha estiver incorreta', async () => {
      const fakeUser = {
        id: 1,
        email: 'joao@example.com',
        password: 'hashed:senha-certa',
      };
      vi.spyOn(User, 'findOne').mockResolvedValue(fakeUser);

      const result = await userService.login('joao@example.com', 'senha-errada');

      expect(result).toBeNull();
    });
  });

  describe('verifyPassword', () => {
    it('deve retornar true quando a senha bate com o hash', async () => {
      const result = await userService.verifyPassword('123456', 'hashed:123456');

      expect(result).toBe(true);
    });

    it('deve retornar false quando a senha não bate com o hash', async () => {
      const result = await userService.verifyPassword('senha-errada', 'hashed:outra-senha');

      expect(result).toBe(false);
    });
  });
});
