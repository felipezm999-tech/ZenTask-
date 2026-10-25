# ZenTask — Gerenciador de Tarefas

## Visão geral

Aplicação para organizar tarefas pessoais, com API REST em Spring Boot e interface React com TypeScript. Os dados são armazenados localmente em um banco H2 persistente.

## Funcionalidades

- Criar, editar, concluir, reabrir e excluir tarefas.
- Definir descrição, prioridade, data de entrega e categoria.
- Consultar listas de tarefas pendentes, concluídas, para hoje, futuras e atrasadas.
- Visualizar tarefas em um calendário com navegação por teclado.
- Criar, editar e excluir categorias, com cores e contagem de tarefas.
- Alternar entre temas claro e escuro, com preferência salva no navegador.
- Utilizar navegação adaptada para dispositivos móveis.

Na interface, novas tarefas são criadas pela aba **Todas**. O atalho **N** abre essa aba e foca o campo de criação quando o usuário não está digitando em outro campo ou usando um modal. Excluir uma categoria mantém suas tarefas, que passam a aparecer em **Sem categoria**. A lista **Próximos dias** inclui todas as tarefas pendentes com data futura.

## Tecnologias

| Camada | Tecnologias |
| --- | --- |
| Backend | Java 21, Spring Boot 4.1.1, Spring Web MVC e Spring Data JPA |
| Banco de dados | H2 em arquivo na aplicação e em memória nos testes |
| Frontend | React 19, TypeScript e Vite 6 |
| Build e testes | Maven Wrapper, npm, JUnit, MockMvc e scripts de verificação do frontend |

## Estrutura do projeto

```text
src/main/java/gerenciador_tarefas/api/
├── config/      # CORS e categorias iniciais
├── controller/  # Endpoints HTTP
├── dto/         # Contratos de entrada e saída
├── exception/   # Erros e tradução para respostas HTTP
├── model/       # Entidades JPA
├── repository/  # Persistência e consultas
└── service/     # Validação, regras e transações

src/main/frontend/
├── scripts/             # Verificações automatizadas
└── src/
    ├── api/             # Cliente HTTP compartilhado, tarefas e categorias
    ├── components/
    │   ├── calendario/  # Calendário e navegação entre datas
    │   ├── categorias/  # Modal e seletor de categoria
    │   ├── layout/      # Barra lateral
    │   └── tarefas/     # Criação, edição e listas
    ├── contexts/        # Provider e contexto de categorias
    ├── hooks/           # Hooks de tarefas e categorias
    ├── styles/          # Tokens, base, interface, calendário e categorias
    ├── types/           # Tipos compartilhados
    └── utils/           # Datas e filtros

src/main/resources/     # Configuração e interface compilada para o Spring
src/test/java/          # Testes de inicialização e integração da API
src/test/resources/     # Banco H2 em memória exclusivo dos testes
docs/                   # Relatório de revisão
```

## Requisitos

- Java 21
- Node.js compatível com as dependências do frontend e npm

O Maven é executado pelo Wrapper incluído no repositório. No Windows, substitua `./mvnw` por `mvnw.cmd`. A primeira execução pode precisar de acesso à internet para baixar as dependências.

## Executando em desenvolvimento

### Backend

Na raiz do projeto:

```bash
./mvnw spring-boot:run
```

O backend estará disponível em `http://localhost:8080`.

### Frontend

Em outro terminal, a partir da raiz do projeto:

```bash
cd src/main/frontend
npm ci
npm run dev
```

Abra `http://localhost:5173`. O servidor de desenvolvimento encaminha as chamadas `/tarefas` e `/categorias` para o backend.

Para uma API externa, configure `VITE_API_URL` em `src/main/frontend/.env.local`, usando [`.env.example`](src/main/frontend/.env.example) como referência. Para utilizar o proxy local, deixe a variável vazia:

```dotenv
VITE_API_URL=
```

A variável é incorporada ao frontend durante o build; a API externa precisa permitir a origem da interface no CORS.

## API REST

Base URL: `http://localhost:8080`. Requisições com corpo usam `Content-Type: application/json`.

### Tarefas

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/tarefas` | Lista tarefas |
| GET | `/tarefas/todas` | Lista tarefas pela rota de compatibilidade |
| GET | `/tarefas/{id}` | Busca uma tarefa |
| POST | `/tarefas` | Cria uma tarefa |
| PUT | `/tarefas/{id}` | Atualiza uma tarefa |
| DELETE | `/tarefas/{id}` | Exclui uma tarefa |

Exemplo de corpo para criar ou atualizar uma tarefa:

```json
{
  "titulo": "Estudar Java",
  "descricao": "Revisar conceitos de Spring Boot e JPA",
  "concluido": false,
  "prioridade": "ALTA",
  "dataEntrega": "2026-11-01",
  "categoriaId": null
}
```

As tarefas também aceitam `categoriaId` (número ou `null`). A listagem aceita `?categoriaId=1` ou `?semCategoria=true`; quando os dois parâmetros são enviados, `categoriaId` tem precedência. `/tarefas/todas` permanece disponível por compatibilidade.

### Categorias

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/categorias` | Lista categorias com contagem de tarefas |
| POST | `/categorias` | Cria categoria |
| PUT | `/categorias/{id}` | Atualiza categoria |
| DELETE | `/categorias/{id}` | Exclui categoria e mantém as tarefas sem vínculo |

Exemplo de categoria:

```json
{"nome":"Estudos","cor":"#2563EB","icone":"📚"}
```

### Validação e erros

O `PUT` substitui os dados da tarefa: envie todos os campos que deseja manter. Título é obrigatório (até 120 caracteres); descrição aceita até 500; prioridade aceita `BAIXA`, `MEDIA` ou `ALTA`; data usa `AAAA-MM-DD` (ano 0001 a 9999). Categoria usa nome de até 30 caracteres, cor `#RRGGBB` e ícone de até 16 caracteres. Erros retornam a propriedade `message`:

```json
{"message":"Tarefa não encontrada."}
```

| Status | Significado |
| --- | --- |
| `200` | Consulta ou atualização concluída |
| `201` | Registro criado |
| `204` | Exclusão concluída, sem corpo de resposta |
| `400` | Corpo, campo ou identificador em formato inválido |
| `404` | Tarefa ou categoria não encontrada |
| `409` | Categoria duplicada ou conflito de integridade |

## Persistência

A aplicação usa H2 em arquivo em `${user.home}/.zentask/zentask-db`, com `ddl-auto: update`. Os dados permanecem após reiniciar. Os testes usam outro banco, em memória, e não acessam esse arquivo. As categorias **Trabalho**, **Faculdade**, **Pessoal**, **Saúde** e **Finanças** são criadas quando o catálogo está vazio na inicialização.

O console H2 fica disponível em `http://localhost:8080/h2-console`. Para conectar, use a URL JDBC configurada em [application.yaml](src/main/resources/application.yaml), substituindo `${user.home}` pelo diretório do usuário que executa o backend. O usuário padrão é `sa`, com senha vazia.

## Testes

Na raiz, execute os testes Java e gere o JAR:

```bash
./mvnw verify
```

No frontend:

```bash
cd src/main/frontend
npm ci
npm test
```

`npm test` verifica o cliente da API, datas, renderização React, filtros, contraste e sintaxe CSS. Também é possível executar os grupos separadamente:

```bash
npm run test:api
npm run test:interface
```

Essas verificações não incluem automação em navegador real.

## Gerando a aplicação completa

A partir da raiz, compile o frontend antes de empacotar o backend para incluir a interface atualizada no JAR:

```bash
cd src/main/frontend
npm ci
npm run build
cd ../../..
./mvnw verify
java -jar target/api-0.0.1-SNAPSHOT.jar
```

Abra `http://localhost:8080`. O comando `npm run build` valida TypeScript e gera a interface em `src/main/resources/static`, preservando os arquivos já existentes. O Maven executa o build Java; a etapa npm precisa ser executada separadamente.

Se `.env.local` apontar para uma API externa e você quiser gerar a interface usando a API da mesma origem, substitua a etapa de build por `VITE_API_URL= npm run build` no Linux/macOS. Essa substituição vale apenas para o comando.

### Publicação do frontend

A configuração existente em [vercel.json](src/main/frontend/vercel.json) gera o frontend em `dist`. Para utilizá-la, configure `src/main/frontend` como diretório raiz do projeto na Vercel e defina `VITE_API_URL` para o endereço do backend acessível pela interface. O backend precisa permitir essa origem em sua configuração CORS.

## Documentação complementar

O [relatório de revisão](docs/REVISAO.md) registra as correções, a preservação dos fontes e os limites da validação.

## Autor

Felipe ZM

## Licença

O repositório ainda não possui um arquivo de licença definido.
