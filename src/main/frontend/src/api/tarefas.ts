import {
    ErroApi,
    type RespostaExclusao,
    type RespostaListaTarefas,
    type RespostaTarefa
} from "../types/respostasApi";
import type { DadosTarefa, Prioridade } from "../types/tarefa";

import { requisitar, URL_BASE_API } from "./cliente";
export { mensagemErroDoCampo, requisitar } from "./cliente";
const URL_TAREFAS = `${URL_BASE_API}/tarefas`;

export async function listarTarefas(categoriaId?: number): Promise<RespostaListaTarefas> {
    const resposta = await requisitar(categoriaId === undefined ? URL_TAREFAS : `${URL_TAREFAS}?categoriaId=${categoriaId}`);
    return validarListaTarefas(resposta);
}

export async function buscarTarefa(id: number): Promise<RespostaTarefa> {
    const resposta = await requisitar(`${URL_TAREFAS}/${id}`);
    return validarTarefa(resposta);
}

export async function criarTarefa(dados: DadosTarefa): Promise<RespostaTarefa> {
    const resposta = await requisitar(URL_TAREFAS, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dados)
    });
    return validarTarefa(resposta);
}

export async function atualizarTarefa(id: number, dados: DadosTarefa): Promise<RespostaTarefa> {
    const resposta = await requisitar(`${URL_TAREFAS}/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dados)
    });
    return validarTarefa(resposta);
}

export async function excluirTarefa(id: number): Promise<RespostaExclusao> {
    await requisitar(`${URL_TAREFAS}/${id}`, { method: "DELETE" });
}

function validarListaTarefas(valor: unknown): RespostaListaTarefas {
    if (!Array.isArray(valor) || !valor.every(ehTarefa)) {
        throw new ErroApi("A API retornou uma lista de tarefas em formato inesperado.");
    }
    return valor;
}

function validarTarefa(valor: unknown): RespostaTarefa {
    if (!ehTarefa(valor)) {
        throw new ErroApi("A API retornou uma tarefa em formato inesperado.");
    }
    return valor;
}

function ehTarefa(valor: unknown): valor is RespostaTarefa {
    if (typeof valor !== "object" || valor === null) return false;

    const tarefa = valor as Record<string, unknown>;
    return Number.isInteger(tarefa.id)
        && typeof tarefa.titulo === "string"
        && (typeof tarefa.descricao === "string" || tarefa.descricao === null)
        && typeof tarefa.concluido === "boolean"
        && (typeof tarefa.dataEntrega === "string" || tarefa.dataEntrega === null)
        && (tarefa.categoriaId === null || Number.isInteger(tarefa.categoriaId))
        && ehPrioridade(tarefa.prioridade);
}

function ehPrioridade(valor: unknown): valor is Prioridade {
    return valor === "BAIXA" || valor === "MEDIA" || valor === "ALTA";
}
