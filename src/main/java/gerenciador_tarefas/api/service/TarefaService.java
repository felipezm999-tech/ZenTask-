package gerenciador_tarefas.api.service;

import gerenciador_tarefas.api.dto.TarefaRequest;
import gerenciador_tarefas.api.dto.TarefaResponse;
import gerenciador_tarefas.api.exception.ApiException;
import gerenciador_tarefas.api.model.TarefaModel;
import gerenciador_tarefas.api.repository.TarefaRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.format.DateTimeParseException;
import java.util.List;

@Service
@Transactional
public class TarefaService {
    private final TarefaRepository tarefas;
    private final CategoriaService categorias;

    public TarefaService(TarefaRepository tarefas, CategoriaService categorias) {
        this.tarefas = tarefas;
        this.categorias = categorias;
    }

    public TarefaResponse criar(TarefaRequest dados) {
        return salvar(new TarefaModel(), dados);
    }

    @Transactional(readOnly = true)
    public List<TarefaResponse> listar(Long categoriaId, boolean semCategoria) {
        if (categoriaId != null) {
            categorias.buscar(categoriaId);
        }
        var lista = categoriaId != null ? tarefas.findByCategoriaId(categoriaId)
                : semCategoria ? tarefas.findByCategoriaIsNull() : tarefas.findAll();
        return lista.stream().map(TarefaResponse::de).toList();
    }

    private TarefaModel buscar(Long id) {
        return tarefas.findById(id).orElseThrow(() ->
                new ApiException(HttpStatus.NOT_FOUND, "Tarefa não encontrada."));
    }

    @Transactional(readOnly = true)
    public TarefaResponse buscarPorId(Long id) {
        return TarefaResponse.de(buscar(id));
    }

    public TarefaResponse atualizar(Long id, TarefaRequest dados) {
        return salvar(buscar(id), dados);
    }

    private TarefaResponse salvar(TarefaModel tarefa, TarefaRequest dados) {
        if (dados.titulo() == null || dados.titulo().isBlank() || dados.titulo().strip().length() > 120) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Informe um título de até 120 caracteres.");
        }
        if (dados.descricao() != null && dados.descricao().length() > 500) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "A descrição deve ter até 500 caracteres.");
        }
        String prioridade = dados.prioridade() == null ? "MEDIA" : dados.prioridade();
        if (!List.of("BAIXA", "MEDIA", "ALTA").contains(prioridade)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Prioridade inválida. Use BAIXA, MEDIA ou ALTA.");
        }
        if (dados.dataEntrega() != null) {
            if (!dados.dataEntrega().matches("[0-9]{4}-[0-9]{2}-[0-9]{2}") || dados.dataEntrega().startsWith("0000")) {
                throw new ApiException(HttpStatus.BAD_REQUEST,
                        "Data inválida. Use AAAA-MM-DD com ano entre 0001 e 9999.");
            }
            try {
                LocalDate.parse(dados.dataEntrega());
            } catch (DateTimeParseException e) {
                throw new ApiException(HttpStatus.BAD_REQUEST, "Data inválida. Use AAAA-MM-DD.");
            }
        }
        tarefa.setTitulo(dados.titulo().strip());
        tarefa.setDescricao(dados.descricao());
        tarefa.setConcluido(Boolean.TRUE.equals(dados.concluido()));
        tarefa.setPrioridade(prioridade);
        tarefa.setDataEntrega(dados.dataEntrega());
        tarefa.setCategoria(dados.categoriaId() == null ? null : categorias.buscar(dados.categoriaId()));
        return TarefaResponse.de(tarefas.save(tarefa));
    }

    public void deletar(Long id) {
        tarefas.delete(buscar(id));
    }
}
