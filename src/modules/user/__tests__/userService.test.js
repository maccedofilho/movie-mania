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
  });
});
