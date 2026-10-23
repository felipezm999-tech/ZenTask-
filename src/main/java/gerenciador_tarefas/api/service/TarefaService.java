package gerenciador_tarefas.api.service;

import gerenciador_tarefas.api.model.TarefaModel;
import gerenciador_tarefas.api.repository.TarefaRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class TarefaService {

    private final TarefaRepository tarefaRepository;

    public TarefaService(TarefaRepository tarefaRepository) {
        this.tarefaRepository = tarefaRepository;
    }

    public TarefaModel criar(TarefaModel tarefa) {
        return tarefaRepository.save(tarefa);
    }

    public List<TarefaModel> listarTodas() {
        return tarefaRepository.findAll();
    }

    public Optional<TarefaModel> buscarPorId(Long id) {
        return tarefaRepository.findById(id);
    }

    public Optional<TarefaModel> atualizar(Long id, TarefaModel dadosNovos) {
        return tarefaRepository.findById(id)
                .map(tarefa -> {
                    tarefa.setTitulo(dadosNovos.getTitulo());
                    tarefa.setDescricao(dadosNovos.getDescricao());
                    tarefa.setConcluido(dadosNovos.isConcluido());
                    tarefa.setPrioridade(dadosNovos.getPrioridade());
                    tarefa.setDataEntrega(dadosNovos.getDataEntrega());
                    return tarefaRepository.save(tarefa);
                });
    }

    public boolean deletar(Long id) {
        if (!tarefaRepository.existsById(id)) {
            return false;
        }

        tarefaRepository.deleteById(id);
        return true;
    }
}
