import type { FiltroTarefas } from "../types/filtros";
import type { Tarefa } from "../types/tarefa";
import { hojeLocal, isoDeDataLocal } from "./datas";

type FiltroComContagem = Exclude<FiltroTarefas, "calendario">;
export type QuantidadesTarefas = Record<FiltroComContagem, number>;

export function filtrarTarefas(tarefas: Tarefa[], filtro: FiltroTarefas): Tarefa[] {
    return filtrarTarefasNaData(tarefas, filtro, isoDeDataLocal(hojeLocal()));
}

function filtrarTarefasNaData(tarefas: Tarefa[], filtro: FiltroTarefas, hoje: string): Tarefa[] {
    switch (filtro) {
        case "pendentes":
            return tarefas.filter((tarefa) => !tarefa.concluido);
        case "concluidas":
            return tarefas.filter((tarefa) => tarefa.concluido);
        case "hoje":
            return tarefas.filter((tarefa) => !tarefa.concluido && tarefa.dataEntrega === hoje);
        case "proximos-dias":
            return tarefas.filter((tarefa) =>
                !tarefa.concluido && tarefa.dataEntrega !== null && tarefa.dataEntrega > hoje
            );
        case "atrasadas":
            return tarefas.filter((tarefa) =>
                !tarefa.concluido && tarefa.dataEntrega !== null && tarefa.dataEntrega < hoje
            );
        default:
            return tarefas;
    }
}

export function contarTarefas(tarefas: Tarefa[]): QuantidadesTarefas {
    const pendentes = tarefas.filter((tarefa) => !tarefa.concluido).length;
    const hoje = isoDeDataLocal(hojeLocal());

    return {
        todas: tarefas.length,
        pendentes,
        concluidas: tarefas.length - pendentes,
        hoje: filtrarTarefasNaData(tarefas, "hoje", hoje).length,
        "proximos-dias": filtrarTarefasNaData(tarefas, "proximos-dias", hoje).length,
        atrasadas: filtrarTarefasNaData(tarefas, "atrasadas", hoje).length
    };
}
