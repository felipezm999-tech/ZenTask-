package gerenciador_tarefas.api;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;
import tools.jackson.databind.ObjectMapper;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class TarefasApiTests {
    @Autowired
    private MockMvc mvc;

    private final ObjectMapper json = new ObjectMapper();

    @Test
    void criarBuscarAtualizarConcluirReabrirEExcluir() throws Exception {
        String resposta = mvc.perform(post("/tarefas").contentType("application/json")
                        .content("""
                            {"titulo":"  Revisar projeto  ","descricao":"Detalhes",
                             "prioridade":"ALTA","dataEntrega":"2028-02-29"}
                            """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.titulo").value("Revisar projeto"))
                .andExpect(jsonPath("$.concluido").value(false))
                .andExpect(jsonPath("$.categoriaId").isEmpty())
                .andReturn().getResponse().getContentAsString();
        long id = json.readTree(resposta).get("id").asLong();

        mvc.perform(get("/tarefas/{id}", id)).andExpect(status().isOk())
                .andExpect(jsonPath("$.descricao").value("Detalhes"));
        mvc.perform(get("/tarefas/todas")).andExpect(status().isOk())
                .andExpect(jsonPath("$[?(@.id == " + id + ")]").isNotEmpty());
        mvc.perform(put("/tarefas/{id}", id).contentType("application/json")
                        .content("{\"titulo\":\"Revisado\",\"concluido\":true}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.prioridade").value("MEDIA"))
                .andExpect(jsonPath("$.dataEntrega").isEmpty())
                .andExpect(jsonPath("$.concluido").value(true));
        mvc.perform(put("/tarefas/{id}", id).contentType("application/json")
                        .content("{\"titulo\":\"Reaberta\",\"concluido\":false}"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.concluido").value(false));
        mvc.perform(delete("/tarefas/{id}", id)).andExpect(status().isNoContent());
        mvc.perform(get("/tarefas/{id}", id)).andExpect(status().isNotFound());
        mvc.perform(delete("/tarefas/{id}", id)).andExpect(status().isNotFound());
    }

    @Test
    void rejeitarCamposInvalidosSemPersistir() throws Exception {
        for (String corpo : new String[]{
                "{}", "{\"titulo\":null}", "{\"titulo\":\"   \"}",
                "{\"titulo\":\"" + "a".repeat(121) + "\"}",
                "{\"titulo\":\"Teste\",\"prioridade\":\"URGENTE\"}",
                "{\"titulo\":\"Teste\",\"descricao\":\"" + "a".repeat(501) + "\"}"}) {
            mvc.perform(post("/tarefas").contentType("application/json").content(corpo))
                    .andExpect(status().isBadRequest()).andExpect(jsonPath("$.message").isString());
        }
    }

    @Test
    void datasDevemSerCalendariasEUsarQuatroDigitosNoAno() throws Exception {
        for (String data : new String[]{"2026-02-29", "2026-02-30", "2026-13-01",
                "25/10/2026", "", "0000-01-01", "+10000-01-01", "2026-1-1"}) {
            mvc.perform(post("/tarefas").contentType("application/json")
                            .content("{\"titulo\":\"Data\",\"dataEntrega\":\"" + data + "\"}"))
                    .andExpect(status().isBadRequest()).andExpect(jsonPath("$.message").isString());
        }
    }

    @Test
    void rejeitarJsonCorrompidoTiposInvalidosEIdentificadoresAusentes() throws Exception {
        for (String corpo : new String[]{"null", "[]", "{", "{\"titulo\":\"Teste\",\"categoriaId\":\"abc\"}"}) {
            mvc.perform(post("/tarefas").contentType("application/json").content(corpo))
                    .andExpect(status().isBadRequest()).andExpect(jsonPath("$.message").isString());
        }
        mvc.perform(get("/tarefas/abc")).andExpect(status().isBadRequest());
        mvc.perform(get("/tarefas/999999")).andExpect(status().isNotFound());
        mvc.perform(put("/tarefas/999999").contentType("application/json")
                        .content("{\"titulo\":\"Ausente\"}"))
                .andExpect(status().isNotFound());
    }

    @Test
    void corsPermiteFrontendLocalERejeitaOrigemDesconhecida() throws Exception {
        mvc.perform(options("/tarefas").header("Origin", "http://localhost:5173")
                        .header("Access-Control-Request-Method", "POST")
                        .header("Access-Control-Request-Headers", "Content-Type"))
                .andExpect(status().isOk())
                .andExpect(header().string("Access-Control-Allow-Origin", "http://localhost:5173"));
        mvc.perform(options("/categorias").header("Origin", "https://origem-desconhecida.example")
                        .header("Access-Control-Request-Method", "DELETE"))
                .andExpect(status().isForbidden());
    }
}
