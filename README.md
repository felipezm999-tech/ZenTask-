# Gerenciador de Tarefas


## Visão geral

Este projeto permite:



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

api_gerenciador_tarefas/
│   ├── src/
│   ├── package.json
│   ├── package-lock.json
│   └── vite.config.ts
├── src/
│   ├── main/
├── .gitignore
├── pom.xml
├── mvnw
├── README.md
└── .mvn/
```

## Requisitos

- npm

## Executando o backend

Na raiz do projeto, execute:

```bash
./mvnw spring-boot:run
```

O backend estará disponível em:

```bash
```

## Executando o frontend


```bash
cd frontend
npm install
npm run dev
```


http://localhost:5173
```

## API REST

Base URL:

http://localhost:8080/tarefas
```

| Método | Endpoint | Descrição |


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


## Autor

Felipe ZM

## Licença

