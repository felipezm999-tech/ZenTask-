# Gerenciador de Tarefas

## Visão geral

Aplicação de gerenciamento de tarefas com API REST em Spring Boot e interface React.

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
src/main/java/gerenciador_tarefas/api/
├── controller/  # Endpoints HTTP
├── model/       # Entidades JPA
├── repository/  # Persistência
└── service/     # Regras e operações da aplicação

src/main/frontend/
├── src/api/         # Comunicação com a API
├── src/components/  # Componentes React
├── src/hooks/       # Estado e operações de tarefas
├── src/styles/      # Estilos
├── src/types/       # Tipos compartilhados
└── src/utils/       # Funções utilitárias
```

## Requisitos

- Java 21
- Node.js e npm

## Executando o backend

Na raiz do projeto:

```bash
./mvnw spring-boot:run
```

O backend estará disponível em `http://localhost:8080`.

## Executando o frontend

```bash
cd src/main/frontend
npm ci
npm run dev
```

Abra `http://localhost:5173`. O servidor de desenvolvimento encaminha as chamadas `/tarefas` para o backend.

## API REST

Base URL: `http://localhost:8080/tarefas`

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/tarefas` | Lista tarefas |
| GET | `/tarefas/{id}` | Busca uma tarefa |
| POST | `/tarefas` | Cria uma tarefa |
| PUT | `/tarefas/{id}` | Atualiza uma tarefa |
| DELETE | `/tarefas/{id}` | Exclui uma tarefa |

```json
{
  "titulo": "Estudar Java",
  "descricao": "Revisar conceitos de Spring Boot e JPA",
  "concluido": false,
  "prioridade": "ALTA",
  "dataEntrega": "2026-10-20"
}
```

O H2 é usado como banco de dados em memória.

## Autor

Felipe ZM

## Licença
