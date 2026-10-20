Copie e cole este conteúdo no arquivo `README.md` do GitHub:

````markdown
# Gerenciador de Tarefas

Aplicação full stack para gerenciamento de tarefas, com backend em Spring Boot e frontend em React + TypeScript.

## Visão geral

Este projeto permite:

- Criar tarefas
- Listar todas as tarefas
- Buscar uma tarefa por ID
- Atualizar dados de uma tarefa
- Excluir tarefas
- Usar uma interface web para gerenciar as tarefas

## Tecnologias

- Java 21
- Spring Boot 4.1.1
- Spring Web MVC
- Spring Data JPA
- H2 Database
- React 19
- TypeScript
- Vite
- Maven

## Estrutura do projeto

```text
api_gerenciador_tarefas/
├── frontend/                 # Aplicação React
│   ├── src/
│   ├── package.json
│   ├── package-lock.json
│   └── vite.config.ts
├── src/
│   ├── main/
│   │   ├── java/             # Backend Spring Boot
│   │   └── resources/        # Configurações e arquivos estáticos
│   └── test/                 # Testes
├── .gitignore
├── pom.xml
├── mvnw
├── README.md
└── .mvn/
```

## Requisitos

- Java 21 ou superior
- Node.js 18 ou superior
- npm
- Maven ou Maven Wrapper

## Executando o backend

Na raiz do projeto, execute:

```bash
./mvnw spring-boot:run
```

O backend estará disponível em:

```text
http://localhost:8080
```

No Windows, use:

```bash
mvnw.cmd spring-boot:run
```

## Executando o frontend

Em outro terminal, entre na pasta `frontend` e execute:

```bash
cd frontend
npm install
npm run dev
```

A interface estará disponível em:

```text
http://localhost:5173
```

## API REST

Base URL:

```text
http://localhost:8080/tarefas
```

| Método | Endpoint | Descrição |
| --- | --- | --- |
| `POST` | `/tarefas` | Cria uma tarefa |
| `GET` | `/tarefas` | Lista todas as tarefas |
| `GET` | `/tarefas/{id}` | Busca uma tarefa por ID |
| `PUT` | `/tarefas/{id}` | Atualiza uma tarefa |
| `DELETE` | `/tarefas/{id}` | Exclui uma tarefa |

### Exemplo de requisição para criar uma tarefa

```json
{
  "titulo": "Estudar Java",
  "descricao": "Revisar conceitos de Spring Boot e JPA",
  "concluido": false,
  "prioridade": "ALTA",
  "dataEntrega": "2026-10-20"
}
```

## Banco de dados

O projeto utiliza o H2 em memória, configurado em `src/main/resources/application.yaml`.

## Autor

Felipe ZM

## Licença

Projeto desenvolvido para fins de estudo.
````
