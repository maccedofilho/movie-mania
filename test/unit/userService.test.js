import { expect } from 'chai';
import sinon from 'sinon';
import { User } from '../../src/models/User.js';
import * as userService from '../../src/services/userService.js';

describe('userService (unit - expect)', () => {
  afterEach(() => {
    sinon.restore();
  });

  describe('register', () => {
    it('deve criar um usuário com hash de senha (não armazenar texto puro)', async () => {
      const stub = sinon.stub(User, 'create').callsFake(async (data) => ({
        id: 1,
        ...data,
      }));

      const result = await userService.register({
        name: 'João',
        email: 'joao@example.com',
        password: '123456',
      });

      expect(stub.calledOnce).to.be.true;
      const args = stub.firstCall.args[0];
      expect(args.password).to.not.equal('123456');
      expect(result).to.have.property('id', 1);
    });

    it('deve lançar erro quando o email já estiver em uso', async () => {
      sinon.stub(User, 'findOne').resolves({ id: 1, email: 'duplicado@example.com' });

      try {
        await userService.register({
          name: 'X',
          email: 'duplicado@example.com',
          password: '123456',
        });
        expect.fail('deveria ter lançado erro');
      } catch (err) {
        expect(err.message).to.match(/email/i);
      }
    });
  });

  describe('login', () => {
    it('deve retornar o usuário quando a senha estiver correta', async () => {
      const fakeUser = {
        id: 1,
        email: 'joao@example.com',
        password: 'hash-falso',
      };
      sinon.stub(User, 'findOne').resolves(fakeUser);
      sinon.stub(userService, 'verifyPassword').resolves(true);

      const result = await userService.login('joao@example.com', '123456');

      expect(result).to.have.property('id', 1);
    });

    it('deve retornar null quando o usuário não existir', async () => {
      sinon.stub(User, 'findOne').resolves(null);

      const result = await userService.login('inexistente@example.com', '123456');

      expect(result).to.be.null;
    });
  });
});
