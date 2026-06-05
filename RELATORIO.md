# Relatório — MovieMania (N2 — Testes de Software)

## 1. Funcionalidade Escolhida

**Gerenciamento de Filmes** (CRUD) — implementado em `src/modules/movie/movieService.js`.

É a funcionalidade central do MovieMania, conforme a especificação:
"Cadastro, edição e gerenciamento de filmes" (área administrativa) e
"Exploração de filmes organizados por gênero" (área do usuário).

### Regras de Negócio

| Regra | Local | Comportamento |
|---|---|---|
| `title` é obrigatório | `movieValidator.js` | rejeita string vazia ou ausente |
| `director` é obrigatório | `movieValidator.js` | rejeita string vazia ou ausente |
| `year` deve ser inteiro entre 1888 e ano atual + 5 | `movieValidator.js` | 1888 é o ano do nascimento do cinema |
| Criação inválida não deve persistir | `movieService.create` | lança `Error` com `err.errors` antes de chamar `Movie.create` |
| Atualização de filme inexistente retorna `null` | `movieService.update` | sem efeito colateral no banco |
| Remoção de filme inexistente retorna `false` | `movieService.remove` | sem efeito colateral no banco |

## 2. Ciclo TDD Aplicado

Aplicação rigorosa do ciclo **Red → Green → Refactor**:

1. **Red**: Os testes unitários do `movieService` foram escritos primeiro, importando funções (`list`, `getById`, `create`, `update`, `remove`) que ainda não existiam. A suíte rodava com **44 falhas + 7 passes** (apenas o health passava).

2. **Green**: A camada de Service foi então implementada arquivo por arquivo:
   - `movieValidator.js` — função pura, sem dependências (passou primeiro).
   - `movieService.js` — usa os models do Sequelize e o validator; cada teste passou um a um.
   - Após cada implementação, a suíte foi rodada novamente até atingir **0 falhas**.

3. **Refactor**: Após o verde, o código foi reorganizado para o padrão `src/modules/<feature>/`, separando responsabilidades:
   - Model (`Movie.js`)
   - Validator (`movieValidator.js`)
   - Service (`movieService.js`)
   - Controller (`movieController.js`)
   - Routes (`movieRoutes.js`)
   - Tests co-localizados (`__tests__/`)

## 3. Exemplos de Testes Unitários

### Teste 1 — Verificação de chamada e retorno (mock simples)

```js
it('deve chamar Movie.findAll e retornar a lista', async () => {
  const fake = [
    { id: 1, title: 'Matrix' },
    { id: 2, title: 'Inception' },
  ];
  const spy = vi.spyOn(Movie, 'findAll').mockResolvedValue(fake);

  const result = await movieService.list();

  expect(spy).toHaveBeenCalledOnce();
  expect(result).toHaveLength(2);
  expect(result[0]).toHaveProperty('title', 'Matrix');
});
```

**O que verifica:** Que `movieService.list()` delega para `Movie.findAll` exatamente uma vez e retorna o resultado intacto. O mock isola completamente o teste do banco — não há nenhuma chamada real ao Sequelize.

### Teste 2 — Validação impede persistência (mock + asserção negativa)

```js
it('deve lançar erro quando o título estiver vazio', async () => {
  const spy = vi.spyOn(Movie, 'create');

  await expect(
    movieService.create({ title: '', director: 'X', year: 2000 })
  ).rejects.toThrow(/inválidos/);
  expect(spy).not.toHaveBeenCalled();
});
```

**O que verifica:** Dois comportamentos críticos numa só asserção:
1. `create` rejeita a Promise com `Error` contendo "inválidos" na mensagem.
2. `Movie.create` **não** é chamado — a validação acontece antes da camada de persistência.

Garante que dados inválidos jamais cheguem ao banco.

### Teste 3 — Estrutura do erro retornado (toHaveProperty + toBeInstanceOf)

```js
it('deve anexar a lista de errors ao Error lançado', async () => {
  vi.spyOn(Movie, 'create');

  try {
    await movieService.create({});
    expect.unreachable('deveria ter lançado');
  } catch (err) {
    expect(err).toBeInstanceOf(Error);
    expect(err).toHaveProperty('errors');
    expect(Array.isArray(err.errors)).toBe(true);
    expect(err.errors.length).toBeGreaterThan(0);
  }
});
```

**O que verifica:** O contrato do erro lançado — ele é uma instância de `Error` (capturável por handlers genéricos) **e** carrega a propriedade `errors` (array com a lista de problemas) para que controllers HTTP possam transformar em resposta 400 com detalhes específicos.

## 4. Resumo de Testes e Cobertura

### Testes

| Tipo | Quantidade | Localização |
|---|---|---|
| Unit — `movieService` | **18** | `src/modules/movie/__tests__/movieService.test.js` |
| Unit — `movieValidator` | 6 | `src/modules/movie/__tests__/movieValidator.test.js` |
| Unit — `userService` | 4 | `src/modules/user/__tests__/userService.test.js` |
| Unit — `userValidator` | 4 | `src/modules/user/__tests__/userValidator.test.js` |
| API | 12 | `test/api/` |
| Integração | 14 | `test/integration/` |
| **Total** | **58** | — |

Nota 7 exige ≥15 unit tests no Service da funcionalidade escolhida — temos **18** no `movieService`.

### Cobertura

`vitest run --coverage` reporta:

| Arquivo | Stmts | Branch | Funcs | Lines |
|---|---|---|---|---|
| **`movieService.js`** | **100%** | **100%** | **100%** | **100%** |
| `movieValidator.js` | 100% | 100% | 100% | 100% |
| Todos os módulos | 96.87% | 92.3% | 94.11% | 96.87% |

Nota 7 exige ≥80% no Service testado — atingimos **100%**.

## 5. Tecnologias Utilizadas

- **Node.js** com **ESM** (`"type": "module"`)
- **Vitest** ^2.1.9 — framework de testes (com `globals: true`, `environment: 'node'`, `setupFiles`)
- **@vitest/coverage-v8** — relatório de cobertura
- **Sequelize** + **SQLite** — ORM e banco (SQLite in-memory durante testes)
- **Express** — API HTTP
- **Supertest** — testes de integração HTTP
- **bcryptjs** — hash de senhas
- **`vi.fn` / `vi.spyOn` / `vi.mock`** — mocks para isolar dependências

## 6. Como Executar

```bash
npm install
npm test               # roda toda a suíte
npm run coverage       # gera relatório de cobertura (texto + HTML em coverage/)
npm start              # sobe o servidor em localhost:3000
```
