> Registro histórico de alterações anteriores. Para a configuração atual e a revisão de 25/10/2026, consulte [README.md](README.md) e [docs/REVISAO.md](docs/REVISAO.md).

# ZenTask: superfícies sólidas e categorias

As sete listas, a fonte, a preferência de tema, os chips de data e prioridade e o atalho N foram preservados. O formulário e a função de criação continuam restritos à lista Todas. Categorias têm nome, cor, ícone e contagem; podem ser criadas, editadas e excluídas. Excluir uma categoria preserva suas tarefas.

## Compatibilidade e banco

A configuração encontrada usa H2 em memória, sem URL de banco persistente. A nova tabela é criada pelo JPA nesse cenário. O relacionamento `tarefa_model.categoria_id` aceita NULL: tarefas sem vínculo continuam válidas. Não foi realizada conversão de dados de um banco externo.

Para uma instalação que use banco persistente com configuração externa, o esquema deve receber a tabela `categoria` (incluindo as restrições únicas de `nome` e `nome_normalizado`) e a coluna opcional `categoria_id` em `tarefa_model`, com chave estrangeira. Os registros existentes ficam com NULL. A coluna `descricao` deve comportar 500 caracteres, como o formulário permite. A migração precisa respeitar o dialeto e a ferramenta usados nessa instalação; não foi ativada recriação automática de um banco persistente.

Foi removida uma cópia antiga do front-end em `src/main/src/main/resources/static`. O diretório servido pelo Spring continua sendo `src/main/resources/static`, recompilado pelo Vite.

## Backend: arquivos e trechos

Caminhos abaixo relativos a `src/main/java/gerenciador_tarefas/api/`.

| Arquivo | Trecho principal | Mudança |
| --- | --- | --- |
| [model/Categoria.java](src/main/java/gerenciador_tarefas/api/model/Categoria.java) | `@Column(nullable = false, unique = true, length = 30)` | Entidade com ID gerado, nome único, cor e ícone. Nome normalizado em coluna única também evita duplicidade por caixa em operações concorrentes. |
| [model/TarefaModel.java](src/main/java/gerenciador_tarefas/api/model/TarefaModel.java) | `@ManyToOne(fetch = FetchType.LAZY, optional = true)` | Categoria opcional, sem cascata de remoção. Descrição comporta os 500 caracteres aceitos pela interface. |
| [dto/CategoriaRequest.java](src/main/java/gerenciador_tarefas/api/dto/CategoriaRequest.java) | `record CategoriaRequest(String nome, String cor, String icone)` | Contrato de entrada de categorias. |
| [dto/CategoriaResponse.java](src/main/java/gerenciador_tarefas/api/dto/CategoriaResponse.java) | `long quantidadeTarefas` | Resposta de categorias inclui contagem de todas as tarefas vinculadas. |
| [dto/TarefaRequest.java](src/main/java/gerenciador_tarefas/api/dto/TarefaRequest.java) | `String dataEntrega, Long categoriaId` | Recebe o identificador opcional. `Boolean concluido` permite manter false como padrão quando omitido. |
| [dto/TarefaResponse.java](src/main/java/gerenciador_tarefas/api/dto/TarefaResponse.java) | `t.getCategoria() == null ? null : t.getCategoria().getId()` | Retorna categoriaId sem serializar a entidade JPA. |
| [repository/CategoriaRepository.java](src/main/java/gerenciador_tarefas/api/repository/CategoriaRepository.java) | `existsByNomeIgnoreCaseAndIdNot` | Busca de duplicidade desconsidera maiúsculas e o próprio registro em edição. |
| [repository/TarefaRepository.java](src/main/java/gerenciador_tarefas/api/repository/TarefaRepository.java) | `findByCategoriaId`, `countByCategoriaId`, `desvincularCategoria` | Filtros, contagem e desvinculação em lote. |
| [service/CategoriaService.java](src/main/java/gerenciador_tarefas/api/service/CategoriaService.java) | `tarefas.desvincularCategoria(id); categorias.deleteById(id);` | Valida nome, hexadecimal e ícone; executa a exclusão e desvinculação na mesma transação. |
| [service/TarefaService.java](src/main/java/gerenciador_tarefas/api/service/TarefaService.java) | `d.categoriaId() == null ? null : categorias.buscar(d.categoriaId())` | Cria e move vínculos, valida campos, datas e prioridade e produz DTOs dentro da transação. |
| [controller/CategoriaController.java](src/main/java/gerenciador_tarefas/api/controller/CategoriaController.java) | `@RequestMapping("/categorias")` | GET, POST, PUT e DELETE nas rotas solicitadas. |
| [controller/TarefaController.java](src/main/java/gerenciador_tarefas/api/controller/TarefaController.java) | `@RequestParam(required = false) Long categoriaId` | Mantém `/tarefas`, `/tarefas/todas` e CRUD por ID, acrescentando filtro opcional. |
| [exception/ApiException.java](src/main/java/gerenciador_tarefas/api/exception/ApiException.java) | `HttpStatus status` | Exceção de domínio com status e mensagem para o cliente. |
| [exception/ApiExceptionHandler.java](src/main/java/gerenciador_tarefas/api/exception/ApiExceptionHandler.java) | `Map.of("message", e.getMessage())` | JSON de erro com 400 para dados inválidos, 404 para IDs ausentes e 409 para duplicidade/conflito de integridade. |
| [config/CategoriasIniciais.java](src/main/java/gerenciador_tarefas/api/config/CategoriasIniciais.java) | `if (repository.count() > 0) return;` | Cria Trabalho, Faculdade, Pessoal, Saúde e Finanças quando não existem categorias. |
| [config/WebConfig.java](src/main/java/gerenciador_tarefas/api/config/WebConfig.java) | `"/categorias", "/categorias/**"` | Estende a configuração CORS existente às novas rotas. |
| [application.yaml](src/main/resources/application.yaml) | `open-in-view: false` | Acesso a entidades fica nas transações dos serviços, eliminando a dependência da sessão durante a serialização. |

Exclusão de categoria, dentro do serviço transacional:

```java
public void excluir(Long id) {
    buscar(id);
    tarefas.desvincularCategoria(id);
    categorias.deleteById(id);
}
```

Desvinculação no repositório:

```java
@Modifying(flushAutomatically = true, clearAutomatically = true)
@Query("update TarefaModel t set t.categoria = null where t.categoria.id = :id")
void desvincularCategoria(@Param("id") Long id);
```

Exemplos de API:

```http
GET /categorias
GET /tarefas?categoriaId=1
GET /tarefas?semCategoria=true
POST /categorias
Content-Type: application/json

{"nome":"Estudos","cor":"#7C3AED","icone":"📚"}
```

```json
{
  "titulo": "Revisar matéria",
  "descricao": "Capítulo 2",
  "concluido": false,
  "prioridade": "MEDIA",
  "dataEntrega": "2026-11-01",
  "categoriaId": 2
}
```

`categoriaId: null` representa Sem categoria. Uma categoria inexistente retorna 404. Excluir retorna 204 e não exclui nenhuma tarefa.

## Front-end: arquivos e trechos

Caminhos relativos a `src/main/frontend/`.

| Arquivo | Trecho principal | Mudança |
| --- | --- | --- |
| [src/styles/tokens.css](src/main/frontend/src/styles/tokens.css) | `--superficie`, `--superficie-elevada`, `--borda`, `--sombra` | Tokens claros/escuros com superfícies sólidas e cores de texto contrastantes. Remove variáveis sem uso. |
| [src/styles/base.css](src/main/frontend/src/styles/base.css) | `background: var(--cor-fundo-principal)` | Remove fundo animado e sua animação; preserva a fonte e o foco visível. |
| [src/styles/app.css](src/main/frontend/src/styles/app.css) | `background: var(--superficie); box-shadow: var(--sombra)` | Superfícies sólidas, aba ativa com destaque sólido, estilos de categorias/modal, grade flexível e menu móvel. Remove refração/reflexos, regras do indicador removido e regras responsivas antigas sem uso. |
| [src/App.tsx](src/main/frontend/src/App.tsx) | `if (filtro !== "todas" || listaCategoria)` | Bloqueia criação fora de Todas; coordena navegação, filtros combinados, modal e contadores calculados a partir das tarefas atuais. Mantém tema e atalhos. |
| [src/components/layout/BarraLateral.tsx](src/main/frontend/src/components/layout/BarraLateral.tsx) | `aria-label="Categorias de tarefas"` | Seção CATEGORIAS, cor, ícone, contador, item Sem categoria, botão + e ações editar/excluir. Remove indicador antigo e seu estado de posição. |
| [src/components/categorias/ModalCategoria.tsx](src/main/frontend/src/components/categorias/ModalCategoria.tsx) | `dialog.current?.showModal()` | Modal nativo com foco contido, Escape e restauração de foco; nome, 10 cores e ícone. Confirma exclusão informando a contagem de tarefas preservadas. |
| [src/components/categorias/SeletorCategoria.tsx](src/main/frontend/src/components/categorias/SeletorCategoria.tsx) | `<option value="">Sem categoria</option>` | Seletor reutilizável com nome/ícone e ponto na cor escolhida, usado na criação e edição. |
| [src/components/tarefas/CampoNovaTarefa.tsx](src/main/frontend/src/components/tarefas/CampoNovaTarefa.tsx) | `const [categoriaId, setCategoriaId] = useState<number \| null>(null)` | Nova tarefa começa sem categoria e volta a esse padrão após salvar; chips existentes foram preservados. |
| [src/components/tarefas/ItemTarefa.tsx](src/main/frontend/src/components/tarefas/ItemTarefa.tsx) | `rascunho.current.categoriaId = id` | Selo com nome/cor junto da prioridade e troca de categoria durante edição. |
| [src/components/tarefas/ListaTarefas.tsx](src/main/frontend/src/components/tarefas/ListaTarefas.tsx) | `permitirCriacao && <CampoNovaTarefa ... />` | Suprime formulário em categorias; mensagem vazia contextual e acesso às concluídas. |
| [src/components/calendario/CalendarioTarefas.tsx](src/main/frontend/src/components/calendario/CalendarioTarefas.tsx) | `categorias.find(c => c.id === id)?.cor` | Pontos agrupados por categoria; tarefas sem categoria usam cinza. Preserva navegação de teclado. |
| [src/hooks/useCategorias.tsx](src/main/frontend/src/hooks/useCategorias.tsx) | `<Contexto.Provider value={...}>` | Compartilha catálogo e erro de carregamento; atualiza após criar, editar ou excluir categoria. |
| [src/hooks/useTarefas.ts](src/main/frontend/src/hooks/useTarefas.ts) | `categoriaId: tarefa.categoriaId` | Preserva categoria ao concluir/reabrir e considera categoria na reversão de atualização otimista. |
| [src/api/categorias.ts](src/main/frontend/src/api/categorias.ts) | `salvarCategoria(dados, id?)` | Integra criação, edição, listagem e exclusão com a API, reaproveitando tratamento de erros. |
| [src/api/tarefas.ts](src/main/frontend/src/api/tarefas.ts) | `listarTarefas(categoriaId?: number)` | Cliente também aceita o filtro da API, valida categoriaId na resposta e compartilha o transporte HTTP. |
| [src/types/categoria.ts](src/main/frontend/src/types/categoria.ts) | `type FiltroCategoria = number \| "todas" \| "sem"` | Tipos de categoria, payload de escrita e filtro. |
| [src/types/tarefa.ts](src/main/frontend/src/types/tarefa.ts) | `categoriaId: number \| null` | Amplia o contrato de tarefa. |
| [src/utils/filtrosTarefas.ts](src/main/frontend/src/utils/filtrosTarefas.ts) | `filtrarPorCategoria(tarefas, categoria)` | Filtragem reutilizável, combinada aos filtros de status e data já existentes. |
| [vite.config.ts](src/main/frontend/vite.config.ts) | `"/categorias": "http://localhost:8080"` | Proxy de desenvolvimento para as novas rotas. |
| [package.json](src/main/frontend/package.json) | `"test:interface": "node scripts/verificar-interface.mjs"` | Comando de regressão e dependências explícitas para esbuild/PostCSS usados na verificação. |
| [package-lock.json](src/main/frontend/package-lock.json) | `devDependencies` | Sincroniza o manifesto com o lockfile. |
| [scripts/verificar-interface.mjs](src/main/frontend/scripts/verificar-interface.mjs) | `assert.doesNotMatch(..., /nova-tarefa-titulo/)` | Verifica renderização, ausência de criação nas demais listas/categorias/calendário, estados vazios, selos, edição, filtros combinados, contraste e sintaxe CSS. |

Tokens de superfícies:

```css
:root, [data-theme="light"] {
    --superficie: #FFFFFF;
    --superficie-elevada: #FFFFFF;
    --borda: #D5DBE5;
    --sombra: 0 4px 18px rgba(35,46,67,.07);
}
[data-theme="dark"] {
    --superficie: #2B303B;
    --superficie-elevada: #343B48;
    --borda: #4A5363;
    --sombra: 0 4px 18px rgba(0,0,0,.18);
}
```

Restrição adicional na função que efetivamente cria uma tarefa:

```tsx
function criar(dados: DadosTarefa): Promise<Tarefa> {
    if (filtro !== "todas" || listaCategoria) {
        return Promise.reject(new Error("Novas tarefas só podem ser criadas na aba Todas."));
    }
    return criarTarefa(dados);
}
```

A API continua recebendo POST normalmente: a regra de abas pertence à interface, pois uma chamada REST não possui contexto de navegação.

## Artefatos e remoções

- [src/main/resources/static/index.html](src/main/resources/static/index.html), `assets/index-C1oQu-7q.js` (bundle histórico já ausente antes desta revisão) e [assets/index-ErTK0Jcc.css](src/main/resources/static/assets/index-ErTK0Jcc.css) foram regenerados pelo build. O HTML aponta para os bundles atuais; os antigos foram removidos.
- `src/main/src/main/resources/static/index.html` e seus bundles foram removidos: pertenciam à cópia antiga sem uso.
- A classe de efeito foi removida dos componentes, bem como o indicador animado da navegação, seus imports e seu cálculo de posição.
- O diretório gerado `src/main/frontend/dist` também foi removido: continha uma compilação antiga fora de uso. O build principal publica em `src/main/resources/static`; o comando de publicação externo pode recriar `dist`.
- Nenhuma dependência de produção foi acrescentada.

## Verificação e limites

- `./mvnw test`: seis testes aprovados (inicialização e cinco cenários de API). A execução adicional de `./mvnw clean verify` limpou os artefatos e repetiu os seis testes com sucesso, mas a etapa de JAR foi bloqueada por dependências de empacotamento ausentes no cache e falta de acesso ao Maven Central. Suíte de inicialização e testes HTTP com MockMvc/H2. [CategoriasApiTests.java](src/test/java/gerenciador_tarefas/api/CategoriasApiTests.java) cobre padrões, validação, 400/404/409, atualização de categoria, filtro, movimentação, contagem e preservação das tarefas após excluir categoria. Inclui tarefa sem categoria e descrição de 500 caracteres.
- `npm run test:interface`: renderização dos componentes em React, filtros combinados, formulário restrito, selos, seletor de edição, calendário e estados vazios. Usa categorias de teste em memória e não depende de servidor HTTP.
- Contraste calculado dos textos principais, secundários, terciários, destaque e erro sobre fundos/superfícies, abas ativas e chips: mínimo **5,24:1** nos dois temas. A cor da categoria é marcador decorativo; o nome usa a cor de texto do tema.
- `npm run build`: TypeScript e Vite concluídos; artefatos do Spring atualizados.
- `git diff --check`: sem erros de whitespace.
- Busca por `glass`, `vidro`, `backdrop`, `blur`, `feTurbulence` e `feDisplacementMap`: nenhuma ocorrência nos fontes da aplicação nem no CSS publicado. O JavaScript publicado contém nomes de eventos de foco do runtime React com `blur`; isso não aplica efeito visual. Dependências e esta documentação contêm referências textuais e não foram adulteradas.
- **Limite de empacotamento:** não foi produzido JAR. O `maven-jar-plugin` precisa baixar dependências como `maven-archiver:3.6.6`, e o ambiente não resolve/acessa `repo.maven.apache.org`. As classes e os recursos foram compilados, e `target/classes/static` contém somente os bundles atuais.
- **Limite do ambiente:** abrir portas locais é bloqueado (`SocketException: Operation not permitted`), e o navegador headless não iniciou. Não foi possível certificar console do navegador nem inspecionar visualmente todos os tamanhos de 360px a 1920px. A aplicação Spring foi carregada nos testes sem iniciar servidor de rede; o teste de servidor separado não pôde ser executado por essa restrição.

Para a verificação visual local: iniciar `./mvnw spring-boot:run`, abrir `http://localhost:8080` e conferir ambos os temas em 360, 768, 1024 e 1920px. Criar categoria e tarefas, editar/mover uma tarefa, combinar filtros, conferir pontos do calendário e excluir uma categoria com tarefas; conferir o contador Sem categoria e a preservação de todas as tarefas.
