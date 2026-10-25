package gerenciador_tarefas.api.dto;

public record TarefaRequest(String titulo, String descricao, Boolean concluido, String prioridade,
                            String dataEntrega, Long categoriaId) {}
