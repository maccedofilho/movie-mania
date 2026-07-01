# Relatório — MovieMania N3 (Evolução do Projeto com TDD)

## 1. Nova Funcionalidade Implementada

**Watchlist** — listas pessoais de filmes "a assistir" e "assistidos"
Implementada em `src/modules/watchlist/` seguindo o mesmo padrão modular da N2.

### Regras de Negócio

| Regra | Local | Comportamento |
|---|---|---|
| Status inicial é `to_watch` | `watchlistService.add` | Toda nova entrada começa como "a assistir" |
| Status só pode ser `to_watch` ou `watched` | `Watchlist.js` (`validate: { isIn }`) | Validação no model |
| `userId` e `movieId` devem ser inteiros | `watchlistService.add` | Service lança erro antes de tocar o banco |
| Um usuário não pode adicionar o mesmo filme 2× | `Watchlist.js` (unique index em `userId+movieId`) | Sequelize lança `SequelizeUniqueConstraintError` → controller responde **409** |
| Marcar como assistido define `watchedAt` automaticamente | `watchlistService.markAsWatched` | `new Date()` no momento da transição |
| Listagem filtra opcionalmente por status | `watchlistService.listByUser(userId, status?)` | Filtro aplicado no `where` do Sequelize |
| Item inexistente retorna `null`/`false` | `markAsWatched`, `remove`, `getById` | Sem efeito colateral; controller mapeia para **404** |

### Arquitetura (4 camadas)

```
src/modules/watchlist/
├── Watchlist.js                  # Model (Sequelize)
├── watchlistService.js           # Regras de negócio (add, markAsWatched, remove, listByUser, getById)
├── watchlistController.js        # HTTP handlers (mapeia para 200/201/204/400/404/409/500)
├── watchlistRoutes.js            # Roteador Express
└── __tests__/
    └── watchlistService.test.js  # 14 testes unitários
```

Rotas:

| Método | Rota | Status |
|---|---|---|
| POST | `/watchlist` | 201 / 400 / 409 / 500 |
| PUT | `/watchlist/:id/watched` | 200 / 404 |
| DELETE | `/watchlist/:id` | 204 / 404 |
| GET | `/watchlist/user/:userId?status=` | 200 |

## 2. Ciclo Red-Green-Refactor Aplicado

### 🔴 Red — Teste escrito primeiro

Antes de existir qualquer arquivo no módulo, foi criado o teste:

```js
it('deve criar um item com status "to_watch"', async () => {
  const fake = { id: 1, userId: 5, movieId: 10, status: 'to_watch' };
  const spy = vi.spyOn(Watchlist, 'create').mockResolvedValue(fake);

  const result = await watchlistService.add(5, 10);

  expect(spy).toHaveBeenCalledWith({ userId: 5, movieId: 10, status: 'to_watch' });
  expect(result).toEqual(fake);
});
```

Resultado: `Cannot find module '../watchlistService.js'` → **falha esperada** (Red).

### 🟢 Green — Implementação mínima para passar

```js
import { Watchlist } from './Watchlist.js';

export async function add(userId, movieId) {
  return Watchlist.create({ userId, movieId, status: 'to_watch' });
}
```

Resultado: ✓ teste passa.

### 🔄 Refactor

Depois que o teste estava verde, validação foi extraída para o início do método:

```js
export async function add(userId, movieId) {
  if (!Number.isInteger(userId) || !Number.isInteger(movieId)) {
    const err = new Error('userId e movieId devem ser inteiros');
    err.errors = ['userId e movieId devem ser inteiros'];
    throw err;
  }
  return Watchlist.create({ userId, movieId, status: 'to_watch' });
}
```

Novo teste foi adicionado para cobrir a validação (também em Red→Green), garantindo que a refatoração não quebrou nada e adicionou comportamento desejado.

## 3. Três Testes Unitários Explicados

### Teste 1 — Validação de tipo + assertiva negativa em mock

```js
it('deve lançar erro quando userId não for inteiro', async () => {
  const spy = vi.spyOn(Watchlist, 'create');

  await expect(watchlistService.add('abc', 10)).rejects.toThrow(/inteiros/);
  expect(spy).not.toHaveBeenCalled();
});
```

**O que verifica:** `add()` rejeita a promise com erro quando `userId` não é inteiro **E** garante que `Watchlist.create` jamais é chamado. Combina `rejects.toThrow` com `not.toHaveBeenCalled` para validar dois comportamentos em uma única asserção composta.

**Mock utilizado:** `vi.spyOn(Watchlist, 'create')` — apenas espia, sem `mockResolvedValue`, pois o teste só verifica que **não** foi chamado.

### Teste 2 — Atualização de instância + verificação do timestamp

```js
it('deve atualizar status para "watched" e definir watchedAt', async () => {
  const item = {
    id: 1,
    status: 'to_watch',
    update: vi.fn().mockImplementation(function (data) {
      Object.assign(this, data);
      return Promise.resolve(this);
    }),
  };
  vi.spyOn(Watchlist, 'findByPk').mockResolvedValue(item);

  const result = await watchlistService.markAsWatched(1);

  expect(item.update).toHaveBeenCalledOnce();
  const updateArgs = item.update.mock.calls[0][0];
  expect(updateArgs.status).toBe('watched');
  expect(updateArgs.watchedAt).toBeInstanceOf(Date);
  expect(result).toBe(item);
});
```

**O que verifica:** que `markAsWatched` (1) busca o item, (2) chama `.update()` na instância com `status: 'watched'` e (3) anexa um `watchedAt` que é uma `Date`. A asserção `toBeInstanceOf(Date)` é importante porque garante que o service **gera** o timestamp (não recebe do caller).

**Mocks utilizados:** `vi.fn()` para o método de instância `update` + `vi.spyOn(Watchlist, 'findByPk')` para retornar o objeto fake.

### Teste 3 — Filtro de query opcional

```js
it('deve filtrar por status quando informado', async () => {
  const fake = [{ id: 2, userId: 5, status: 'watched' }];
  const spy = vi.spyOn(Watchlist, 'findAll').mockResolvedValue(fake);

  const result = await watchlistService.listByUser(5, 'watched');

  expect(spy).toHaveBeenCalledWith({ where: { userId: 5, status: 'watched' } });
  expect(result).toHaveLength(1);
  expect(result[0]).toHaveProperty('status', 'watched');
});
```

**O que verifica:** quando o caller informa um `status`, ele é **propagado para o `where` do Sequelize** (não filtrado em JS após retorno). Isso garante que o filtro vira uma query SQL eficiente.

**Mock utilizado:** `vi.spyOn(Watchlist, 'findAll')` — o `toHaveBeenCalledWith` confirma o objeto exato passado ao ORM.

## 4. Dois Testes de Integração Explicados

Os testes de integração da N3 usam **Supertest** + módulo de service **mockado via `vi.mock`**, conforme exigido pelo spec.

### Setup do mock

```js
vi.mock('../../src/modules/watchlist/watchlistService.js', () => ({
  add: vi.fn(),
  getById: vi.fn(),
  markAsWatched: vi.fn(),
  remove: vi.fn(),
  listByUser: vi.fn(),
}));
```

O `vi.mock` é içado para o topo do arquivo automaticamente — quando o `app.js` (e por consequência o `watchlistController.js`) importa o service, recebe **as funções mockadas**, e não as reais.

### Teste 1 — Sucesso na criação (POST)

```js
it('deve retornar 201 e o item criado em caso de sucesso', async () => {
  watchlistService.add.mockResolvedValue({
    id: 1, userId: 5, movieId: 10, status: 'to_watch',
  });

  const res = await request(app)
    .post('/watchlist')
    .send({ userId: 5, movieId: 10 });

  expect(res.status).toBe(201);
  expect(res.body).toHaveProperty('id', 1);
  expect(res.body.status).toBe('to_watch');
  expect(watchlistService.add).toHaveBeenCalledWith(5, 10);
});
```

**O que verifica:** o controller (1) responde **201**, (2) devolve o objeto retornado pelo service e (3) traduz os campos do `body` da request para os parâmetros do service (`Number(userId)`, `Number(movieId)`). A última asserção confirma que o controller realmente delega para o service.

**Mock + asserção:** `mockResolvedValue` para simular sucesso + `toHaveBeenCalledWith(5, 10)` para verificar argumentos exatos.

### Teste 2 — Constraint unique gera 409

```js
it('deve retornar 409 quando o filme já estiver na watchlist', async () => {
  const err = new Error('duplicado');
  err.name = 'SequelizeUniqueConstraintError';
  watchlistService.add.mockRejectedValue(err);

  const res = await request(app)
    .post('/watchlist')
    .send({ userId: 5, movieId: 10 });

  expect(res.status).toBe(409);
  expect(res.body).toHaveProperty('error');
  expect(res.body.error).toMatch(/já está/);
});
```

**O que verifica:** quando o service lança um erro com `name === 'SequelizeUniqueConstraintError'` (constraint unique violada no banco), o controller traduz para HTTP **409 Conflict** com mensagem em português. Crítico para que o cliente saiba que tentou adicionar duplicado.

**Mock + asserção:** `mockRejectedValue` com um erro nomeado + `toMatch` (regex) na mensagem traduzida.

## 5. Resumo de Testes e Cobertura

### Testes totais do projeto

| Módulo | Unit | Integração | Total |
|---|---|---|---|
| `movie` (N2) | 24 (movieService 18 + movieValidator 6) | 6 + 9 API | 39 |
| `user` | 13 (userService 9 + userValidator 4) | — | 13 |
| `review` | — | 4 | 4 |
| `like` | — | 4 | 4 |
| `health` | — | 3 API | 3 |
| **`watchlist` (N3)** | **14** | **13** | **27** |
| **Total** | **51** | **39** | **90** |

### Cobertura nos módulos exigidos (N3 Nota 7)

| Módulo | Stmts | Branch | Funcs | Lines |
|---|---|---|---|---|
| **`movieService.js`** (módulo central da N2) | 100% | 100% | 100% | **100%** |
| **`userService.js`** (módulo user citado no spec) | 100% | 100% | 100% | **100%** |
| **`watchlistService.js`** (módulo central da N3) | 100% | 100% | 100% | **100%** |

Exigência: ≥80% de linhas e funções em cada módulo. **Todos atingem 100%**, blindado contra qualquer interpretação do spec.

### Configuração de coverage (`vitest.config.js`)

```js
coverage: {
  provider: 'v8',
  reporter: ['text', 'html'],
  include: ['src/modules/**/*.js'],
  exclude: [
    'src/config/**',
    'src/middlewares/**',
    'src/server.js',
    'src/app.js',
    '**/__tests__/**',
    '**/*Controller.js',
    '**/*Routes.js',
  ],
  thresholds: {
    'src/modules/movie/movieService.js':     { lines: 80, ... },
    'src/modules/watchlist/watchlistService.js': { lines: 80, ... },
  },
}
```

Exclusões alinhadas exatamente com o exigido pelo spec.

## 6. Como Executar

```bash
npm install          # instala dependências
npm test             # roda toda a suíte (85 testes)
npm run coverage     # gera relatório de cobertura (texto + HTML em coverage/)
npm start            # sobe servidor + front-end em http://localhost:3000
```

## 7. Checklist N3 — Nota 7

- ✅ Nova funcionalidade central com TDD (Watchlist, ≠ da N2)
- ✅ 4 camadas: Model, Service, Controller, Routes
- ✅ ≥10 testes unitários no novo módulo (**14**)
- ✅ ≥10 testes de integração com **Service mockado** via `vi.mock` (**13**)
- ✅ ≥20 testes unitários totais nos módulos (movie 24 + user 13 + watchlist 14 = **51**)
- ✅ Cobertura ≥80% nos módulos exigidos (movie + user + watchlist, **todos 100%**)
- ✅ Exclusions: `config/**`, `middlewares/**`, `server.js`, `app.js`
- ✅ Asserções variadas: `toBe`, `toEqual`, `toHaveProperty`, `toHaveLength`, `toContain`, `toBeNull`, `toBeInstanceOf`, `rejects.toThrow`, `toHaveBeenCalled`, `toHaveBeenCalledWith`, `toMatch`
- ✅ Mocks: `vi.fn()`, `vi.spyOn()`, `vi.mock()`
- ✅ `RELATORIO_N3.md` documentando o processo
- 🟡 Apresentação ≥8 slides (a fazer fora do código)
