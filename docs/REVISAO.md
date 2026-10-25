# Revisão do projeto — 25/10/2026

A revisão cobriu os fontes próprios do backend e frontend, contratos da API, persistência, configuração, compilação, testes e documentação. A estrutura Maven e as rotas existentes foram mantidas. Não foi feita uma atualização de versões de dependências.

## Preservação dos arquivos e do trabalho existente

O projeto já tinha alterações locais, arquivos novos e arquivos gerados ausentes quando a revisão começou. Esse estado não foi revertido. Os componentes foram movidos e seus imports foram atualizados; métodos, endpoints e funcionalidades existentes foram mantidos. Nenhum arquivo presente no início foi descartado.

Backup anterior à revisão:

```text
/home/felipezm/backups/api_gerenciador_tarefas-antes-revisao-20261025-143412/
├── fontes.tar.gz
├── alteracoes-existentes.patch
└── status-inicial.txt
```

O arquivo compactado contém os fontes, configurações e documentos existentes, incluindo arquivos ignorados presentes nessas pastas. Não inclui `.git`, `node_modules`, `target`, `.idea` ou `.vercel`. O patch registra as alterações rastreadas anteriores à revisão. O backup fica fora do repositório e deve ser mantido privado, pois inclui configurações locais.

A conferência comparou os 67 arquivos do backup com o estado final, considerando os sete movimentos de componentes: nenhum ficou ausente. O Git pode mostrar os caminhos antigos como excluídos e os novos como não rastreados até que as alterações sejam adicionadas ao índice; os arquivos foram movidos. Não foram criados commits nem alterado o índice do Git.

## Organização

A separação Java em `controller`, `service`, `repository`, `model`, `dto`, `exception` e `config` já atende ao tamanho atual do projeto. Ela foi preservada para evitar renomear entidades, tabelas ou contratos sem necessidade. Imports genéricos nos arquivos revisados foram substituídos por imports explícitos e métodos compactados foram expandidos para facilitar a leitura.

No frontend, os arquivos continuam em `src/main/frontend`, preservando os caminhos de execução e publicação existentes:

| Caminho anterior em `src/` | Caminho atual em `src/` |
| --- | --- |
| `components/BarraLateral.tsx` | `components/layout/BarraLateral.tsx` |
| `components/CalendarioTarefas.tsx` | `components/calendario/CalendarioTarefas.tsx` |
| `components/ModalCategoria.tsx` | `components/categorias/ModalCategoria.tsx` |
| `components/SeletorCategoria.tsx` | `components/categorias/SeletorCategoria.tsx` |
| `components/CampoNovaTarefa.tsx` | `components/tarefas/CampoNovaTarefa.tsx` |
| `components/ItemTarefa.tsx` | `components/tarefas/ItemTarefa.tsx` |
| `components/ListaTarefas.tsx` | `components/tarefas/ListaTarefas.tsx` |

O transporte HTTP e a leitura de erros foram extraídos de `api/tarefas.ts` para `api/cliente.ts`. Os exports antigos de `requisitar` e `mensagemErroDoCampo` continuam disponíveis por compatibilidade. O provider foi separado em `contexts/CategoriasContexto.tsx`; o hook e o export anterior do provider continuam em `hooks/useCategorias.tsx`.

O CSS foi distribuído entre `interface.css`, `calendario.css`, `ajustes.css` e `categorias.css`, importados por `app.css` na ordem original. Todas as regras anteriores foram preservadas, incluindo ajustes e sobrescritas. A extração conferiu que a concatenação dos quatro arquivos reproduzia integralmente o CSS anterior antes das correções adicionais.

## Problemas corrigidos

| Problema identificado | Correção |
| --- | --- |
| Testes carregavam a configuração do H2 persistente da aplicação | `src/test/resources/application.yaml` fornece banco em memória exclusivo por contexto e desativa o console H2. Testes de integração usam transações com rollback. |
| Categorias faziam uma consulta de contagem para cada registro listado | Consulta agregada com `left join`, contagem e ordem por ID; categorias vazias permanecem na resposta e tarefas concluídas entram na contagem. O método anterior de contagem continua disponível. |
| Datas podiam aceitar anos fora do contrato de quatro dígitos | API exige formato `AAAA-MM-DD`, ano 0001–9999 e uma data válida no calendário. |
| JavaScript interpreta anos de 0 a 99 no construtor como 1900–1999 | Utilitário `criarDataLocal` usa `setFullYear`; conversão ISO, operações com dias e navegação de meses preservam o ano. |
| Cliente de categorias fazia cast de qualquer resposta para `Categoria` | Validação de lista, ID, nome, cor, ícone e contagem antes de atualizar o React; respostas inesperadas geram erro legível. |
| URLs com várias barras finais geravam caminhos inconsistentes | Normalização centralizada em `api/cliente.ts`. |
| Edição de categoria enviava sempre ícone vazio | Modal preserva o ícone da categoria ao salvar nome ou cor. |
| Enter no formulário de edição interceptava também botões como Cancelar | Atalho limitado aos inputs, com `requestSubmit()` para respeitar validação nativa; composição de texto não dispara o atalho. |
| Controles permitiam iniciar edição durante outra operação da tarefa | Controles de edição e ações ficam desabilitados durante a operação; cancelamento não interrompe um salvamento pendente. |
| Escape em nova tarefa deixava descrição, prioridade e data do rascunho anterior | Limpeza inclui esses campos, respeitando eventual data inicial. |
| Respostas antigas de carregamento de categorias podiam substituir respostas mais recentes | Provider aplica somente a requisição mais recente e invalida cargas anteriores ao desmontar. |
| Regra CSS posterior reduzia a barra lateral para z-index 5, abaixo do fundo móvel em 11 | Menu móvel aberto usa z-index 12. |
| Grade do calendário não tinha linhas semânticas | Cabeçalho e seis semanas recebem `role="row"`, preservando as sete colunas com `display: contents`. Escape volta ao mês do dia selecionado. |
| Build apagava o diretório estático antes de gerar a interface | `emptyOutDir: false` preserva os arquivos existentes. HTML passa a apontar para os bundles atuais. |
| `.env.example` era ignorado pela regra final `.env*` | Exceção adicionada nos dois `.gitignore`, mantendo outros arquivos de ambiente ignorados. |
| README descrevia H2 em memória e não documentava categorias | Documentação atualizada para banco em arquivo, categorias, filtros, contratos PUT, testes e compilação. Links dos componentes no histórico foram atualizados. |

## Arquivos examinados

| Área | Arquivos próprios examinados |
| --- | --- |
| Inicialização e configuração Java | `ApiApplication`, `WebConfig`, `CategoriasIniciais`, `application.yaml` |
| HTTP e contratos Java | `TarefaController`, `CategoriaController`, quatro DTOs, `ApiException`, `ApiExceptionHandler` |
| Regras e persistência Java | `TarefaService`, `CategoriaService`, `TarefaRepository`, `CategoriaRepository`, `TarefaModel`, `Categoria` |
| Aplicação React | `App.tsx`, `main.tsx`, sete componentes e hooks de tarefas/categorias |
| Comunicação e tipos | Clientes de tarefas/categorias, tipos de tarefa, categoria, filtros e respostas |
| Utilitários e estilos | `datas.ts`, `filtrosTarefas.ts`, `app.css`, `base.css`, `tokens.css` |
| Configuração frontend | `index.html`, `vite-env.d.ts`, três `tsconfig`, `vite.config.ts`, `vercel.json`, manifests npm e regras de ignore |
| Build e documentação | `pom.xml`, configuração do Maven Wrapper, README e histórico de alterações |
| Testes | Teste de contexto, testes de categorias e script de interface existentes; novos testes de tarefas, cliente HTTP e datas |

Arquivos de dependências em `node_modules`, bundles minificados e ferramentas Maven são artefatos de terceiros ou gerados; não foram refatorados como código da aplicação. As versões declaradas foram mantidas.

## Validação realizada

- Antes da alteração: seis testes Java existentes aprovados, com URL H2 temporária fornecida na linha de comando; script de interface e compilação TypeScript aprovados.
- `./mvnw -o verify`: 13 testes Java aprovados, sem falhas ou erros; JAR executável gerado.
- `npm test`: seis testes do cliente HTTP/datas aprovados, além das verificações de renderização React, formulário restrito a Todas, filtros, categorias, edição, calendário, estados vazios, contraste e CSS.
- Contraste de texto verificado pelo script nos dois temas: mínimo 5,24:1 entre os pares avaliados.
- `VITE_API_URL= npm run build`: TypeScript e Vite aprovados, gerando a interface para a API da mesma origem e mantendo os assets anteriores.
- `./mvnw -o package -DskipTests`: reempacotamento após a compilação do frontend, para incluir os bundles atuais no JAR. Os testes já tinham sido executados em `verify`.
- Conteúdo do JAR comparado com o HTML e os dois bundles referenciados em `src/main/resources/static`: arquivos idênticos.
- `git diff --check`: conferência de whitespace.
- Conferência dos arquivos do backup: nenhum arquivo anterior ausente após considerar as movimentações.

Os testes Java cobrem CRUD de tarefas, conclusão/reabertura, categorias iniciais, duplicidade de categoria, vínculos, filtros, contagens, exclusão de categoria preservando tarefas, limites de descrição, entradas inválidas, datas, IDs inexistentes e CORS local.

## Limites e pontos mantidos

A revisão e os testes não comprovam ausência de todos os defeitos. Não foi executada automação em navegador real; interação por teclado, foco dos modais e apresentação responsiva devem ser avaliados visualmente. Os testes de renderização não substituem essa avaliação.

Não houve execução contra o banco pessoal em arquivo, migração de dados existentes, publicação ou consulta a uma API externa. O comportamento com dados antigos não compatíveis com o contrato atual depende desses dados e merece validação em uma cópia do banco.

O repositório já rastreava arquivos de `node_modules` e bundles antigos. Eles não foram removidos nem retirados do índice para respeitar a preservação solicitada. Builds também mantêm assets antigos; eles podem ocupar espaço, mas não devem ser apagados sem uma decisão posterior.

O banco continua com `ddl-auto: update`, console H2 habilitado na aplicação e as configurações de execução local existentes. O catálogo inicial continua sendo recriado quando está completamente vazio na inicialização. Os filtros continuam com a semântica existente: Próximos dias inclui todas as tarefas futuras e `categoriaId` tem precedência sobre `semCategoria`.

A API continua com PUT de substituição e sem controle de versão concorrente das entidades. Edições simultâneas em múltiplos clientes podem sobrescrever dados; autenticação, migrações versionadas e controle de concorrência exigiriam um trabalho de escopo próprio. O frontend externo depende de URL e CORS configurados para sua origem; a publicação existente não foi alterada.
