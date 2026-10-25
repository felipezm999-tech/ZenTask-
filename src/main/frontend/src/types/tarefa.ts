export type Prioridade = "BAIXA" | "MEDIA" | "ALTA";

export type Tarefa = {
    id: number;
    categoriaId: number | null;
    titulo: string;
    descricao: string | null;
    concluido: boolean;
    prioridade: Prioridade;
    dataEntrega: string | null;
};

export type DadosTarefa = Omit<Tarefa, "id">;
