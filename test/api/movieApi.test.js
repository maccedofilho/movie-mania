import { should } from 'chai';
import request from 'supertest';
import { app } from '../../src/app.js';
import { sequelize } from '../../src/config/database.js';

should();

describe('Movie API (should)', () => {
  before(async () => {
    await sequelize.sync({ force: true });
  });

  describe('POST /movies', () => {
    it('deve criar um filme e retornar 201', async () => {
      const res = await request(app)
        .post('/movies')
        .send({ title: 'Matrix', director: 'Wachowski', year: 1999 });

      res.status.should.equal(201);
      res.body.should.have.property('id');
      res.body.title.should.equal('Matrix');
      res.body.director.should.equal('Wachowski');
      res.body.year.should.equal(1999);
    });

    it('deve retornar 400 quando dados forem inválidos', async () => {
      const res = await request(app).post('/movies').send({});

      res.status.should.equal(400);
      res.body.should.have.property('errors');
      res.body.errors.should.be.an('array').that.is.not.empty;
    });
  });

  describe('GET /movies', () => {
    it('deve retornar 200 e uma lista de filmes', async () => {
      const res = await request(app).get('/movies');

      res.status.should.equal(200);
      res.body.should.be.an('array');
    });
  });

  describe('GET /movies/:id', () => {
    it('deve retornar 200 e o filme quando existir', async () => {
      const created = await request(app)
        .post('/movies')
        .send({ title: 'Inception', director: 'Nolan', year: 2010 });

      const res = await request(app).get(`/movies/${created.body.id}`);

      res.status.should.equal(200);
      res.body.title.should.equal('Inception');
    });

    it('deve retornar 404 quando o filme não existir', async () => {
      const res = await request(app).get('/movies/999999');

      res.status.should.equal(404);
    });
  });

  describe('PUT /movies/:id', () => {
    it('deve atualizar o filme e retornar 200', async () => {
      const created = await request(app)
        .post('/movies')
        .send({ title: 'Old', director: 'X', year: 2000 });

      const res = await request(app)
        .put(`/movies/${created.body.id}`)
        .send({ title: 'Novo Título' });

      res.status.should.equal(200);
      res.body.title.should.equal('Novo Título');
    });

    it('deve retornar 404 ao atualizar filme inexistente', async () => {
      const res = await request(app)
        .put('/movies/999999')
        .send({ title: 'Qualquer' });

      res.status.should.equal(404);
    });
  });

  describe('DELETE /movies/:id', () => {
    it('deve deletar o filme e retornar 204', async () => {
      const created = await request(app)
        .post('/movies')
        .send({ title: 'Descartável', director: 'X', year: 2005 });

      const res = await request(app).delete(`/movies/${created.body.id}`);

      res.status.should.equal(204);
    });

    it('deve retornar 404 ao deletar filme inexistente', async () => {
      const res = await request(app).delete('/movies/999999');

      res.status.should.equal(404);
    });
  });
});
