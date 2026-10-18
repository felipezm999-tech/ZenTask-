package gerenciador_tarefas.api.Controller;

import gerenciador_tarefas.api.model.TarefaModel;
import gerenciador_tarefas.api.repository.TarefaRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/tarefas")
public class TarefaController {

    @Autowired
    private TarefaRepository tarefaRepository;

    @PostMapping
    public ResponseEntity<TarefaModel> criarTarefa(@RequestBody TarefaModel tarefa) {
        TarefaModel tarefaCriada = tarefaRepository.save(tarefa);
        return ResponseEntity.status(HttpStatus.CREATED).body(tarefaCriada);
    }

    @GetMapping
    public List<TarefaModel> listarTodas() {
        return tarefaRepository.findAll();
    }

    @GetMapping("/todas")
    public List<TarefaModel> listarTodasCriadas() {
        return tarefaRepository.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<TarefaModel> buscarPorId(@PathVariable Long id) {
        Optional<TarefaModel> tarefa = tarefaRepository.findById(id);

        if (tarefa.isPresent()) {
            return ResponseEntity.ok(tarefa.get());
        }

        return ResponseEntity.notFound().build();
    }

    @PutMapping("/{id}")
    public ResponseEntity<TarefaModel> atualizarPorId(@PathVariable Long id, @RequestBody TarefaModel dadosNovos) {
        Optional<TarefaModel> tarefaExistente = tarefaRepository.findById(id);

        if (tarefaExistente.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        TarefaModel tarefaAtualizada = tarefaExistente.get();
        tarefaAtualizada.setTitulo(dadosNovos.getTitulo());
        tarefaAtualizada.setDescricao(dadosNovos.getDescricao());
        tarefaAtualizada.setConcluido(dadosNovos.isConcluido());
        tarefaAtualizada.setPrioridade(dadosNovos.getPrioridade());
        tarefaAtualizada.setDataEntrega(dadosNovos.getDataEntrega());

        TarefaModel tarefaSalva = tarefaRepository.save(tarefaAtualizada);
        return ResponseEntity.ok(tarefaSalva);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletarPorId(@PathVariable Long id) {
        if (!tarefaRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }

        tarefaRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
