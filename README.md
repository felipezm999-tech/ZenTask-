# ZenTask

**Gerenciador de tarefas pessoais com API REST em Java e interface em React.**

O ZenTask reúne tarefas, prazos e categorias em uma única aplicação. Permite acompanhar atividades pendentes e concluídas, consultar entregas no calendário e organizar a rotina com prioridades e filtros. O backend utiliza Spring Boot e persiste os dados em um banco H2 local; o frontend utiliza React com TypeScript.

## Índice

- [Funcionalidades](#funcionalidades)
- [Tecnologias](#tecnologias)
- [Primeiros passos](#primeiros-passos)
- [Configuração](#configuração)
- [Estrutura e arquitetura](#estrutura-e-arquitetura)
- [API REST](#api-rest)
- [Testes e verificações](#testes-e-verificações)
- [Build e execução do JAR](#build-e-execução-do-jar)
- [Publicação do frontend](#publicação-do-frontend)
- [Documentação complementar](#documentação-complementar)
- [Autor e licença](#autor-e-licença)

## Funcionalidades

- **Gestão de tarefas:** criação, edição, conclusão, reabertura e exclusão de atividades.
- **Organização por prioridade:** níveis baixo, médio e alto, com descrição e data de entrega opcionais.
- **Filtros de acompanhamento:** tarefas pendentes, concluídas, de hoje, futuras e atrasadas.
- **Calendário:** visualização de tarefas por data, com navegação por teclado.
- **Categorias personalizadas:** criação, edição e exclusão de categorias com cores e contagem de tarefas.
- **Preferências visuais:** temas claro e escuro, com escolha salva no navegador.
- **Interface responsiva:** navegação adaptada para dispositivos móveis.

### Comportamentos da interface

Novas tarefas são criadas na aba **Todas**. O atalho **N** abre essa aba e foca o campo de criação quando não há outro campo em edição ou modal aberto.

A visualização **Próximos dias** reúne todas as tarefas pendentes com data futura. Ao excluir uma categoria, suas tarefas são preservadas e passam a aparecer em **Sem categoria**, uma opção fixa da aplicação.

## Tecnologias

| Camada | Tecnologias |
| --- | --- |
| Backend | Java 21, Spring Boot 4.1.1, Spring Web MVC, Spring Data JPA e Lombok |
| Frontend | React 19, TypeScript 5.8 e Vite 6 |
| Persistência | H2 em arquivo para a aplicação e em memória para os testes |
| Build | Maven Wrapper e npm |
| Verificação | JUnit, MockMvc e scripts de verificação do frontend em Node.js |

As versões e dependências estão definidas no [pom.xml](pom.xml) e no [package.json](src/main/frontend/package.json).

## Primeiros passos

### Pré-requisitos

- JDK 21, com `java` disponível no terminal.
- Node.js e npm compatíveis com as dependências do frontend.
- Acesso à internet na instalação inicial das dependências.

O repositório inclui o Maven Wrapper, dispensando a instalação global do Maven. Execute os comandos a seguir a partir da raiz do projeto. No Windows, substitua `./mvnw` por `mvnw.cmd`.

### 1. Iniciar o backend

```bash
./mvnw spring-boot:run
```

A API estará disponível em <http://localhost:8080>.

### 2. Iniciar o frontend

Em outro terminal:

```bash
cd src/main/frontend
npm ci
npm run dev
```

Acesse **<http://localhost:5173>**. O servidor Vite encaminha as requisições de `/tarefas` e `/categorias` para o backend na porta `8080`.

## Configuração

### Endereço da API

Sem uma URL configurada, o frontend utiliza a mesma origem da página. Em desenvolvimento, as chamadas passam pelo proxy do Vite.

Para definir outra API, crie `src/main/frontend/.env.local`, tomando [`.env.example`](src/main/frontend/.env.example) como referência:

```dotenv
VITE_API_URL=http://localhost:8080
```

Deixe `VITE_API_URL` vazia para utilizar o proxy local. A variável é incorporada durante o build; alterações exigem reiniciar o servidor de desenvolvimento ou gerar um novo build.

### CORS

A configuração em [WebConfig.java](src/main/java/gerenciador_tarefas/api/config/WebConfig.java) permite as origens `http://localhost:5173` e `http://127.0.0.1:5173`. Para hospedar a interface em outro domínio, inclua a origem correspondente na configuração do backend.

### Banco de dados

As configurações do backend ficam em [application.yaml](src/main/resources/application.yaml).

| Propriedade | Valor padrão |
| --- | --- |
| Banco | H2 em arquivo |
| URL JDBC | `jdbc:h2:file:${user.home}/.zentask/zentask-db` |
| Usuário | `sa` |
| Senha | Vazia |
| Atualização do esquema | `spring.jpa.hibernate.ddl-auto: update` |
| Console H2 | `http://localhost:8080/h2-console` |

Os dados permanecem após reiniciar a aplicação. Quando o catálogo está vazio, são criadas as categorias **Trabalho**, **Faculdade**, **Pessoal**, **Saúde** e **Financeiro**.

Para acessar o console H2, utilize a URL JDBC acima, substituindo `${user.home}` pelo diretório do usuário que executa o backend. Os testes utilizam um banco separado, em memória, com o console desativado.

## Estrutura e arquitetura

O backend é organizado em camadas: os controllers expõem os endpoints, os services concentram as regras de negócio e os repositories realizam o acesso aos dados. DTOs definem os contratos da API, e o tratamento centralizado de exceções padroniza as respostas de erro.

No frontend, componentes compõem a interface, hooks coordenam os dados e o cliente HTTP centraliza a comunicação com a API.

```text
.
├── pom.xml                         # Dependências e build Java
├── mvnw / mvnw.cmd                 # Maven Wrapper
├── docs/                           # Documentação técnica
└── src/
    ├── main/
    │   ├── java/gerenciador_tarefas/api/
    │   │   ├── config/             # CORS e categorias iniciais
    │   │   ├── controller/         # Endpoints REST
    │   │   ├── dto/                # Contratos de entrada e saída
    │   │   ├── exception/          # Tratamento de erros
    │   │   ├── model/              # Entidades JPA
    │   │   ├── repository/         # Persistência e consultas
    │   │   └── service/            # Regras de negócio e transações
    │   ├── frontend/
    │   │   ├── scripts/            # Verificações automatizadas
    │   │   └── src/
    │   │       ├── api/            # Cliente HTTP
    │   │       ├── components/     # Tarefas, calendário, categorias e layout
    │   │       ├── contexts/       # Contexto compartilhado de categorias
    │   │       ├── hooks/          # Gestão de tarefas e categorias
    │   │       ├── styles/         # Estilos e tokens visuais
    │   │       ├── types/          # Tipos TypeScript
    │   │       └── utils/          # Datas e filtros
    │   └── resources/
    │       ├── application.yaml    # Configuração do backend
    │       └── static/             # Interface compilada
    └── test/
        ├── java/                   # Testes de inicialização e integração
        └── resources/              # Configuração do banco de testes
```

## API REST

**URL base local:** `http://localhost:8080`.

Requisições com corpo utilizam `Content-Type: application/json`.

### Tarefas

| Método | Endpoint | Descrição |
| --- | --- | --- |
| `GET` | `/tarefas` | Lista tarefas, com filtros opcionais de categoria |
| `GET` | `/tarefas/todas` | Alternativa de listagem mantida por compatibilidade |
| `GET` | `/tarefas/{id}` | Consulta uma tarefa pelo identificador |
| `POST` | `/tarefas` | Cria uma tarefa |
| `PUT` | `/tarefas/{id}` | Substitui os dados de uma tarefa |
| `DELETE` | `/tarefas/{id}` | Exclui uma tarefa |

Exemplo de criação:

```bash
curl -X POST http://localhost:8080/tarefas \
  -H 'Content-Type: application/json' \
  -d '{
    "titulo": "Estudar Java",
    "descricao": "Revisar conceitos de Spring Boot e JPA",
    "concluido": false,
    "prioridade": "ALTA",
    "dataEntrega": "2026-11-01",
    "categoriaId": null
  }'
```

| Campo | Regra |
| --- | --- |
| `titulo` | Obrigatório; até 120 caracteres após remover espaços nas extremidades |
| `descricao` | Opcional; até 500 caracteres |
| `concluido` | Booleano; assume `false` quando omitido ou nulo |
| `prioridade` | `BAIXA`, `MEDIA` ou `ALTA`; assume `MEDIA` quando omitida ou nula |
| `dataEntrega` | Opcional; data válida em `AAAA-MM-DD`, com ano entre 0001 e 9999 |
| `categoriaId` | Identificador de uma categoria existente ou `null` para remover o vínculo |

O `PUT` utiliza o mesmo corpo do `POST` e substitui os dados: envie todos os campos que deseja preservar.

A listagem aceita `?categoriaId=1` para filtrar por categoria e `?semCategoria=true` para listar tarefas sem vínculo. Se os dois parâmetros forem enviados, `categoriaId` tem precedência.

### Categorias

| Método | Endpoint | Descrição |
| --- | --- | --- |
| `GET` | `/categorias` | Lista categorias com contagem de tarefas |
| `POST` | `/categorias` | Cria uma categoria |
| `PUT` | `/categorias/{id}` | Atualiza uma categoria |
| `DELETE` | `/categorias/{id}` | Exclui uma categoria e preserva suas tarefas sem vínculo |

Exemplo de corpo para criação ou atualização:

```json
{
  "nome": "Estudos",
  "cor": "#2563EB"
}
```

O nome é obrigatório, deve ter até 30 caracteres e não pode conter espaços nas extremidades. Nomes duplicados são rejeitados sem distinguir maiúsculas e minúsculas. **Sem categoria** é um nome reservado. A cor deve seguir o formato hexadecimal `#RRGGBB`.

O campo `icone` permanece no contrato da API e aceita até 16 caracteres, mas o serviço atualmente salva seu valor como uma string vazia.

### Respostas e erros

| Status HTTP | Significado |
| --- | --- |
| `200 OK` | Consulta ou atualização concluída |
| `201 Created` | Registro criado |
| `204 No Content` | Exclusão concluída, sem corpo de resposta |
| `400 Bad Request` | Corpo, campo ou identificador em formato inválido |
| `404 Not Found` | Tarefa ou categoria não encontrada |
| `409 Conflict` | Nome de categoria reservado, duplicidade ou conflito de integridade |

Erros tratados pela API retornam a propriedade `message`:

```json
{
  "message": "Tarefa não encontrada."
}
```

## Testes e verificações

Para executar os testes Java e gerar o JAR, na raiz do projeto:

```bash
./mvnw verify
```

Para executar as verificações do frontend:

```bash
cd src/main/frontend
npm ci
npm test
```

Os scripts verificam o cliente HTTP, utilitários de datas, filtros, renderização React, contraste e sintaxe CSS. Também podem ser executados separadamente:

| Comando | Escopo |
| --- | --- |
| `npm run test:api` | Cliente de comunicação com a API |
| `npm run test:interface` | Verificações de interface e utilitários |

As verificações do frontend não incluem automação em navegador real.

## Build e execução do JAR

O frontend deve ser compilado antes do empacotamento Java para incluir a interface atualizada no JAR. Execute a partir da raiz:

```bash
cd src/main/frontend
npm ci
npm run build
cd ../../..
./mvnw verify
java -jar target/api-0.0.1-SNAPSHOT.jar
```

A aplicação completa estará disponível em **<http://localhost:8080>**.

O comando `npm run build` verifica o TypeScript e gera a interface em `src/main/resources/static`, preservando os arquivos existentes. O Maven empacota esses arquivos junto com o backend; ele não executa a etapa npm automaticamente.

Se `.env.local` definir uma API externa, mas o JAR precisar utilizar a API da mesma origem, substitua o comando de build por este no Linux/macOS:

```bash
VITE_API_URL= npm run build
```

## Publicação do frontend

O repositório contém uma configuração de build para a Vercel em [vercel.json](src/main/frontend/vercel.json).

1. Configure `src/main/frontend` como diretório raiz do projeto na Vercel.
2. Defina `VITE_API_URL` com o endereço do backend acessível pela interface.
3. Inclua a origem publicada na configuração CORS do backend.

Nessa configuração, a saída do frontend é gerada em `dist`. A publicação do backend deve ser realizada separadamente.

## Documentação complementar

Consulte o [relatório de revisão técnica](docs/REVISAO.md) para informações sobre as correções registradas, a preservação dos fontes e os limites da validação realizada.

## Autor e licença

Desenvolvido por **Felipe ZM**.

O repositório ainda não possui um arquivo de licença definido.
