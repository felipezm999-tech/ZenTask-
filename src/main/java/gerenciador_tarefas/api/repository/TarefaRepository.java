package gerenciador_tarefas.api.repository;

import gerenciador_tarefas.api.model.TarefaModel;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;

public interface TarefaRepository extends JpaRepository<TarefaModel, Long> {
    List<TarefaModel> findByCategoriaId(Long categoriaId);
    List<TarefaModel> findByCategoriaIsNull();
    long countByCategoriaId(Long categoriaId);
    @Modifying(flushAutomatically = true, clearAutomatically = true)
    @Query("update TarefaModel t set t.categoria = null where t.categoria.id = :id")
    void desvincularCategoria(@Param("id") Long id);
}
