import type { Tarefa } from "./tarefa";

export type RespostaListaTarefas = Tarefa[];
export type RespostaTarefa = Tarefa;
export type RespostaExclusao = void;

export class ErroApi extends Error {
    constructor(
        mensagem: string,
        public readonly status?: number,
        public readonly resposta?: unknown
    ) {
        super(mensagem);
        this.name = "ErroApi";
    }
}
