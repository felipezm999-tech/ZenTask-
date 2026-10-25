export type Categoria = { id: number; nome: string; cor: string; icone: string; quantidadeTarefas: number };
export type DadosCategoria = Omit<Categoria, "id" | "quantidadeTarefas">;
export type FiltroCategoria = number | "todas" | "sem";
