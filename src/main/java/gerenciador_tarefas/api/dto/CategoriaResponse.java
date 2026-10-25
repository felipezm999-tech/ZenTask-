package gerenciador_tarefas.api.dto;

public record CategoriaResponse(Long id, String nome, String cor, String icone, long quantidadeTarefas) {}
