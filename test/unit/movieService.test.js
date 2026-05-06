import { expect } from 'chai';
import sinon from 'sinon';
import { Movie } from '../../src/models/Movie.js';
import * as movieService from '../../src/services/movieService.js';

describe('movieService (unit - expect)', () => {
  afterEach(() => {
    sinon.restore();
  });

  describe('list', () => {
    it('deve chamar Movie.findAll e retornar a lista', async () => {
      const fake = [
        { id: 1, title: 'Matrix' },
        { id: 2, title: 'Inception' },
      ];
      const stub = sinon.stub(Movie, 'findAll').resolves(fake);

      const result = await movieService.list();

      expect(stub.calledOnce).to.be.true;
      expect(result).to.have.lengthOf(2);
      expect(result[0]).to.have.property('title', 'Matrix');
    });

    it('deve retornar array vazio quando não há filmes', async () => {
      sinon.stub(Movie, 'findAll').resolves([]);

      const result = await movieService.list();

      expect(result).to.be.an('array').that.is.empty;
    });
  });

  describe('getById', () => {
    it('deve chamar Movie.findByPk com o id correto', async () => {
      const stub = sinon.stub(Movie, 'findByPk').resolves({ id: 7, title: 'X' });

      const result = await movieService.getById(7);

      expect(stub.calledOnceWith(7)).to.be.true;
      expect(result).to.have.property('id', 7);
    });

    it('deve retornar null quando o filme não existir', async () => {
      sinon.stub(Movie, 'findByPk').resolves(null);

      const result = await movieService.getById(9999);

      expect(result).to.be.null;
    });
  });

  describe('create', () => {
    it('deve criar um filme com dados válidos', async () => {
      const payload = { title: 'Matrix', director: 'Wachowski', year: 1999 };
      const created = { id: 1, ...payload };
      const stub = sinon.stub(Movie, 'create').resolves(created);

      const result = await movieService.create(payload);

      expect(stub.calledOnceWith(payload)).to.be.true;
      expect(result).to.deep.equal(created);
    });

    it('deve lançar erro quando os dados forem inválidos', async () => {
      const stub = sinon.stub(Movie, 'create');

      try {
        await movieService.create({ title: '' });
        expect.fail('deveria ter lançado um erro');
      } catch (err) {
        expect(err).to.be.an('error');
        expect(stub.called).to.be.false;
      }
    });
  });

  describe('update', () => {
    it('deve atualizar e retornar o filme quando ele existir', async () => {
      const movie = { id: 1, title: 'Antigo', update: sinon.stub().resolvesThis() };
      sinon.stub(Movie, 'findByPk').resolves(movie);

      const result = await movieService.update(1, { title: 'Novo' });

      expect(movie.update.calledOnceWith({ title: 'Novo' })).to.be.true;
      expect(result).to.equal(movie);
    });

    it('deve retornar null quando o filme não existir', async () => {
      sinon.stub(Movie, 'findByPk').resolves(null);

      const result = await movieService.update(9999, { title: 'X' });

      expect(result).to.be.null;
    });
  });

  describe('remove', () => {
    it('deve remover e retornar true quando o filme existir', async () => {
      const movie = { destroy: sinon.stub().resolves() };
      sinon.stub(Movie, 'findByPk').resolves(movie);

      const result = await movieService.remove(1);

      expect(movie.destroy.calledOnce).to.be.true;
      expect(result).to.be.true;
    });

    it('deve retornar false quando o filme não existir', async () => {
      sinon.stub(Movie, 'findByPk').resolves(null);

      const result = await movieService.remove(9999);

      expect(result).to.be.false;
    });
  });
});
