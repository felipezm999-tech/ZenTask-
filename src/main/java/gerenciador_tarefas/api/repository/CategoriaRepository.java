package gerenciador_tarefas.api.repository;

import gerenciador_tarefas.api.model.Categoria;
import gerenciador_tarefas.api.dto.CategoriaResponse;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.util.List;

public interface CategoriaRepository extends JpaRepository<Categoria, Long> {
    boolean existsByNomeIgnoreCaseAndIdNot(String nome, Long id);

    @Query("""
        select new gerenciador_tarefas.api.dto.CategoriaResponse(
            c.id, c.nome, c.cor, c.icone, count(t.id))
        from Categoria c left join TarefaModel t on t.categoria = c
        group by c.id, c.nome, c.cor, c.icone
        order by c.id
        """)
    List<CategoriaResponse> listarComContagem();
}
