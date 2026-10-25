package gerenciador_tarefas.api.dto;

import gerenciador_tarefas.api.model.TarefaModel;

public record TarefaResponse(Long id, String titulo, String descricao, boolean concluido,
                             String prioridade, String dataEntrega, Long categoriaId) {
    public static TarefaResponse de(TarefaModel t) {
        return new TarefaResponse(t.getId(), t.getTitulo(), t.getDescricao(), t.isConcluido(),
            t.getPrioridade(), t.getDataEntrega(), t.getCategoria() == null ? null : t.getCategoria().getId());
    }
}
