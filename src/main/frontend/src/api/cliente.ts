import { ErroApi } from "../types/respostasApi";

export const URL_BASE_API = (import.meta.env.VITE_API_URL || "").replace(/\/+$/, "");

export function mensagemErroDoCampo(erro: unknown, campo: string): string | undefined {
    if (!(erro instanceof ErroApi) || typeof erro.resposta !== "object" || erro.resposta === null) {
        return undefined;
    }

    const resposta = erro.resposta as Record<string, unknown>;
    const erros = resposta.fieldErrors ?? resposta.errors;
    if (Array.isArray(erros)) {
        const erroDoCampo = erros.find((item) =>
            typeof item === "object"
            && item !== null
            && "field" in item
            && item.field === campo
        );
        if (typeof erroDoCampo === "object" && erroDoCampo !== null) {
            const mensagem = "defaultMessage" in erroDoCampo
                ? erroDoCampo.defaultMessage
                : "message" in erroDoCampo
                    ? erroDoCampo.message
                    : undefined;
            if (typeof mensagem === "string") return mensagem;
        }
    }

    if (typeof erros === "object" && erros !== null) {
        const mensagem = (erros as Record<string, unknown>)[campo];
        if (typeof mensagem === "string") return mensagem;
    }
    return undefined;
}

export async function requisitar(url: string, opcoes?: RequestInit): Promise<unknown> {
    let resposta: Response;

    try {
        resposta = await fetch(url, opcoes);
    } catch (erro) {
        throw new ErroApi(
            "Não foi possível conectar à API. Verifique se o servidor está ativo.",
            undefined,
            erro
        );
    }

    if (resposta.status === 204) {
        if (!resposta.ok) {
            throw new ErroApi("A API não conseguiu concluir a operação.", resposta.status);
        }
        return undefined;
    }

    const corpo = await lerCorpo(resposta);
    if (!resposta.ok) {
        throw new ErroApi(
            extrairMensagemErro(corpo, resposta.statusText),
            resposta.status,
            corpo
        );
    }

    return corpo;
}

async function lerCorpo(resposta: Response): Promise<unknown> {
    const texto = await resposta.text();
    if (!texto) return undefined;

    try {
        return JSON.parse(texto) as unknown;
    } catch {
        return texto;
    }
}

function extrairMensagemErro(corpo: unknown, mensagemPadrao: string): string {
    if (typeof corpo === "string" && corpo.trim()) return corpo;
    if (typeof corpo !== "object" || corpo === null) {
        return mensagemPadrao || "A API não conseguiu concluir a operação.";
    }

    const registro = corpo as Record<string, unknown>;
    if (typeof registro.detail === "string") return registro.detail;
    if (typeof registro.message === "string") return registro.message;
    const erros = registro.fieldErrors ?? registro.errors;
    if (Array.isArray(erros)) {
        const mensagens = erros.flatMap((erro) => {
            if (typeof erro !== "object" || erro === null) return [];
            const mensagem = "defaultMessage" in erro
                ? erro.defaultMessage
                : "message" in erro
                    ? erro.message
                    : undefined;
            return typeof mensagem === "string" ? [mensagem] : [];
        });
        if (mensagens.length) return mensagens.join(" ");
    }
    return mensagemPadrao || "A API não conseguiu concluir a operação.";
}
