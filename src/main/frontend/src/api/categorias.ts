import { requisitar, URL_BASE_API } from "./cliente";
import type { Categoria, DadosCategoria } from "../types/categoria";
import { ErroApi } from "../types/respostasApi";

const url = `${URL_BASE_API}/categorias`;

export async function listarCategorias(): Promise<Categoria[]> {
    const resposta = await requisitar(url);
    if (!Array.isArray(resposta) || !resposta.every(ehCategoria)) {
        throw new ErroApi("A API retornou uma lista de categorias em formato inesperado.");
    }
    return resposta;
}

export async function salvarCategoria(dados: DadosCategoria, id?: number): Promise<Categoria> {
    const resposta = await requisitar(id === undefined ? url : `${url}/${id}`, {
        method: id === undefined ? "POST" : "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dados)
    });
    if (!ehCategoria(resposta)) {
        throw new ErroApi("A API retornou uma categoria em formato inesperado.");
    }
    return resposta;
}

export async function excluirCategoria(id: number): Promise<void> {
    await requisitar(`${url}/${id}`, { method: "DELETE" });
}

function ehCategoria(valor: unknown): valor is Categoria {
    if (typeof valor !== "object" || valor === null) return false;
    const categoria = valor as Record<string, unknown>;
    return Number.isSafeInteger(categoria.id)
        && Number(categoria.id) > 0
        && typeof categoria.nome === "string"
        && typeof categoria.cor === "string"
        && /^#[0-9a-fA-F]{6}$/.test(categoria.cor)
        && typeof categoria.icone === "string"
        && Number.isSafeInteger(categoria.quantidadeTarefas)
        && Number(categoria.quantidadeTarefas) >= 0;
}
