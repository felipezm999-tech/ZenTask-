package gerenciador_tarefas.api;

import org.junit.jupiter.api.Test;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.test.web.servlet.MockMvc;
import gerenciador_tarefas.api.config.CategoriasIniciais;
import gerenciador_tarefas.api.model.Categoria;
import gerenciador_tarefas.api.repository.CategoriaRepository;
import tools.jackson.databind.ObjectMapper;
import tools.jackson.databind.JsonNode;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class CategoriasApiTests {
    @Autowired MockMvc mvc;
    @Autowired CategoriaRepository categorias;
    @Autowired CategoriasIniciais seed;
    private final ObjectMapper json = new ObjectMapper();

    private JsonNode criarCategoria(String nome) throws Exception {
        String corpo = mvc.perform(post("/categorias").contentType("application/json")
            .content("{\"nome\":\"" + nome + "\",\"cor\":\"#2563EB\",\"icone\":\"\"}"))
            .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString();
        return json.readTree(corpo);
    }
    private JsonNode criarTarefa(Long categoriaId) throws Exception {
        String corpo = mvc.perform(post("/tarefas").contentType("application/json")
            .content("{\"titulo\":\"Teste de vínculo\",\"prioridade\":\"MEDIA\",\"categoriaId\":" + categoriaId + "}"))
            .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString();
        return json.readTree(corpo);
    }
    private long contagem(long id) throws Exception {
        JsonNode categorias = json.readTree(mvc.perform(get("/categorias")).andExpect(status().isOk()).andReturn().getResponse().getContentAsString());
        for (JsonNode c : categorias) if (c.get("id").asLong() == id) return c.get("quantidadeTarefas").asLong();
        throw new AssertionError("Categoria não encontrada");
    }
    @Test void categoriasPadrao() throws Exception {
        JsonNode corpo = json.readTree(mvc.perform(get("/categorias")).andExpect(status().isOk()).andReturn().getResponse().getContentAsString());
        String[] nomes = {"Trabalho", "Faculdade", "Pessoal", "Saúde", "Financeiro"};
        String[] cores = {"#2563EB", "#7C3AED", "#15803D", "#DC2626", "#CA8A04"};
        assertEquals(5, corpo.size());
        for (int indice = 0; indice < nomes.length; indice++) {
            assertEquals(nomes[indice], corpo.get(indice).get("nome").asText());
            assertEquals("", corpo.get(indice).get("icone").asText());
            assertEquals(cores[indice], corpo.get(indice).get("cor").asText());
            assertEquals(indice + 1, corpo.get(indice).get("id").asLong());
        }
    }
    @Test void corrigeSeedLegadoSemPerderIdsNemVinculos() throws Exception {
        Categoria legado = categorias.findById(5L).orElseThrow();
        legado.setNome("Finanças");
        legado.setIcone("");
        categorias.saveAndFlush(legado);

        seed.run();

        mvc.perform(get("/categorias")).andExpect(status().isOk())
                .andExpect(jsonPath("$[4].id").value(5))
                .andExpect(jsonPath("$[4].nome").value("Financeiro"))
                .andExpect(jsonPath("$[4].icone").value(""));
    }
    @Test void naoSobrescreveCategoriasEditadasNemRodaSeedComTabelaPreenchida() {
        Categoria editada = categorias.findById(1L).orElseThrow();
        editada.setNome("Minha categoria");
        categorias.saveAndFlush(editada);

        seed.run();

        assertEquals(5, categorias.count());
        assertEquals("Minha categoria", categorias.findById(1L).orElseThrow().getNome());
    }
    @Test void naoPermiteManipularRegistroLegadoComNomeReservado() throws Exception {
        Categoria legado = new Categoria();
        legado.setNome("Sem categoria");
        legado.setCor("#808080");
        legado.setIcone("");
        long id = categorias.saveAndFlush(legado).getId();

        mvc.perform(put("/categorias/{id}", id).contentType("application/json")
                        .content("{\"nome\":\"Outra\",\"cor\":\"#2563EB\",\"icone\":\"\"}"))
                .andExpect(status().isConflict());
        mvc.perform(delete("/categorias/{id}", id)).andExpect(status().isConflict());
    }
    @Test void moverFiltrarExcluirPreservaTarefasEContadores() throws Exception {
        long a = criarCategoria("Integração A").get("id").asLong();
        long b = criarCategoria("Integração B").get("id").asLong();
        long tarefa = criarTarefa(a).get("id").asLong();
        assertEquals(1, contagem(a));
        mvc.perform(get("/tarefas").param("categoriaId", "" + a)).andExpect(status().isOk()).andExpect(jsonPath("$[0].id").value(tarefa));
        mvc.perform(put("/tarefas/{id}", tarefa).contentType("application/json")
            .content("{\"titulo\":\"Movida\",\"categoriaId\":" + b + "}"))
            .andExpect(status().isOk()).andExpect(jsonPath("$.categoriaId").value(b));
        assertEquals(0, contagem(a)); assertEquals(1, contagem(b));
        mvc.perform(delete("/categorias/{id}", b)).andExpect(status().isNoContent());
        mvc.perform(get("/tarefas/{id}", tarefa)).andExpect(status().isOk()).andExpect(jsonPath("$.categoriaId").isEmpty());
        mvc.perform(get("/tarefas").param("semCategoria", "true")).andExpect(status().isOk()).andExpect(jsonPath("$[?(@.id == " + tarefa + ")]").isNotEmpty());
        mvc.perform(delete("/tarefas/{id}", tarefa)).andExpect(status().isNoContent());
        mvc.perform(delete("/categorias/{id}", a)).andExpect(status().isNoContent());
    }
    @Test void validacaoDuplicidadeEIdsInexistentes() throws Exception {
        long id = criarCategoria("Nome único").get("id").asLong();
        mvc.perform(post("/categorias").contentType("application/json").content("{\"nome\":\"NOME ÚNICO\",\"cor\":\"#2563EB\",\"icone\":\"\"}"))
            .andExpect(status().isConflict()).andExpect(jsonPath("$.message").exists());
        mvc.perform(post("/categorias").contentType("application/json").content("{\"nome\":\"sem CATEGORIA\",\"cor\":\"#2563EB\",\"icone\":\"\"}"))
            .andExpect(status().isConflict()).andExpect(jsonPath("$.message").exists());
        for (String corpo : new String[]{"{}", "{\"nome\":\"   \",\"cor\":\"#2563EB\",\"icone\":\"\"}", "{\"nome\":\" nome \",\"cor\":\"#2563EB\",\"icone\":\"\"}", "{\"nome\":\"Invalida\",\"cor\":\"red\",\"icone\":\"\"}", "{\"nome\":\"1234567890123456789012345678901\",\"cor\":\"#2563EB\",\"icone\":\"\"}"})
            mvc.perform(post("/categorias").contentType("application/json").content(corpo)).andExpect(status().isBadRequest());
        mvc.perform(put("/categorias/{id}", id).contentType("application/json")
                .content("{\"nome\":\"Sem categoria\",\"cor\":\"#15803D\",\"icone\":\"\"}"))
            .andExpect(status().isConflict()).andExpect(jsonPath("$.message").exists());
        mvc.perform(put("/categorias/{id}", id).contentType("application/json").content("{\"nome\":\"Atualizada\",\"cor\":\"#15803D\",\"icone\":\"\"}"))
            .andExpect(status().isOk()).andExpect(jsonPath("$.nome").value("Atualizada"));
        mvc.perform(put("/categorias/999999").contentType("application/json").content("{}" )).andExpect(status().isNotFound());
        mvc.perform(delete("/categorias/999999")).andExpect(status().isNotFound());
        mvc.perform(get("/tarefas").param("categoriaId", "999999")).andExpect(status().isNotFound());
        mvc.perform(post("/tarefas").contentType("application/json").content("{\"titulo\":\"Sem vínculo válido\",\"categoriaId\":999999}")).andExpect(status().isNotFound());
        mvc.perform(post("/tarefas").contentType("application/json").content("{\"titulo\":\"Data inválida\",\"dataEntrega\":\"2026-02-30\"}")).andExpect(status().isBadRequest());
        mvc.perform(get("/tarefas").param("categoriaId", "abc")).andExpect(status().isBadRequest());
        mvc.perform(delete("/categorias/{id}", id)).andExpect(status().isNoContent());
    }
    @Test void tarefaLegadaSemCategoriaEExclusaoAtualizaContagem() throws Exception {
        JsonNode semCategoria = criarTarefa(null);
        assertTrue(semCategoria.get("categoriaId").isNull());
        long id = criarCategoria("Excluir tarefa").get("id").asLong();
        long tarefa = criarTarefa(id).get("id").asLong();
        assertEquals(1, contagem(id));
        mvc.perform(delete("/tarefas/{id}", tarefa)).andExpect(status().isNoContent());
        assertEquals(0, contagem(id));
        mvc.perform(delete("/tarefas/{id}", semCategoria.get("id").asLong())).andExpect(status().isNoContent());
        mvc.perform(delete("/categorias/{id}", id)).andExpect(status().isNoContent());
    }
    @Test void descricaoNoLimiteDoFormulario() throws Exception {
        String corpo = "{\"titulo\":\"Descrição completa\",\"descricao\":\"" + "a".repeat(500) + "\"}";
        String resposta = mvc.perform(post("/tarefas").contentType("application/json").content(corpo))
            .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString();
        long id = json.readTree(resposta).get("id").asLong();
        mvc.perform(post("/tarefas").contentType("application/json")
            .content("{\"titulo\":\"Muito longa\",\"descricao\":\"" + "a".repeat(501) + "\"}"))
            .andExpect(status().isBadRequest());
        mvc.perform(delete("/tarefas/{id}", id)).andExpect(status().isNoContent());
    }

    @Test void contagemIncluiConcluidasECategoriasVazias() throws Exception {
        long id = criarCategoria("Contagem agregada").get("id").asLong();
        assertEquals(0, contagem(id));
        criarTarefa(id);
        long concluida = criarTarefa(id).get("id").asLong();
        mvc.perform(put("/tarefas/{id}", concluida).contentType("application/json")
                .content("{\"titulo\":\"Concluída\",\"concluido\":true,\"categoriaId\":" + id + "}"))
            .andExpect(status().isOk());
        assertEquals(2, contagem(id));
    }

    @Test void atualizarCategoriaMantemVinculosEIconeInformado() throws Exception {
        long id = criarCategoria("Categoria original").get("id").asLong();
        long tarefa = criarTarefa(id).get("id").asLong();
        mvc.perform(put("/categorias/{id}", id).contentType("application/json")
                .content("{\"nome\":\"Categoria revisada\",\"cor\":\"#15803D\",\"icone\":\"\"}"))
            .andExpect(status().isOk()).andExpect(jsonPath("$.icone").value(""))
            .andExpect(jsonPath("$.quantidadeTarefas").value(1));
        mvc.perform(get("/tarefas/{id}", tarefa)).andExpect(status().isOk())
            .andExpect(jsonPath("$.categoriaId").value(id));
    }

}
