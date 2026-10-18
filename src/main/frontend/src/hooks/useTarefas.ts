import { useCallback, useEffect, useState } from "react";
import { atualizarTarefa, criarTarefa, excluirTarefa, listarTarefas } from "../api/tarefas";
import { ErroApi } from "../types/respostasApi";
import type { DadosTarefa, Tarefa } from "../types/tarefa";

type ResultadoTarefas = {
    tarefas: Tarefa[];
    carregando: boolean;
    erro: string | null;
    aviso: string | null;
    limparAviso: () => void;
    recarregar: () => Promise<void>;
    criar: (dados: DadosTarefa) => Promise<Tarefa>;
    atualizar: (id: number, dados: DadosTarefa) => Promise<void>;
    concluir: (id: number, concluido: boolean) => Promise<void>;
    excluir: (id: number) => Promise<void>;
};

export function useTarefas(): ResultadoTarefas {
    const [tarefas, setTarefas] = useState<Tarefa[]>([]);
    const [carregando, setCarregando] = useState(true);
    const [erro, setErro] = useState<string | null>(null);
    const [aviso, setAviso] = useState<string | null>(null);

    const recarregar = useCallback(async () => {
        setCarregando(true);
        setErro(null);
        try {
            setTarefas(await listarTarefas());
        } catch (falha) {
            setErro(mensagemDaFalha(falha));
        } finally {
            setCarregando(false);
        }
    }, []);

    useEffect(() => {
        void recarregar();
    }, [recarregar]);

    const criar = useCallback(async (dados: DadosTarefa) => {
        const tarefaCriada = await criarTarefa(dados);
        setTarefas((atuais) => [...atuais, tarefaCriada]);
        setAviso(null);
        return tarefaCriada;
    }, []);

    const atualizar = useCallback(async (id: number, dados: DadosTarefa) => {
        const anterior = tarefas.find((tarefa) => tarefa.id === id);
        if (!anterior) throw new ErroApi("Esta tarefa não está mais na lista.");

        const otimista: Tarefa = { ...anterior, ...dados };
        setTarefas((atuais) => atuais.map((tarefa) => tarefa.id === id ? otimista : tarefa));
        setAviso(null);

        try {
            const atualizada = await atualizarTarefa(id, dados);
            setTarefas((atuais) => atuais.map((tarefa) => tarefa.id === id ? atualizada : tarefa));
        } catch (falha) {
            setTarefas((atuais) => atuais.map((tarefa) =>
                tarefa.id === id && mesmosDados(tarefa, otimista) ? anterior : tarefa
            ));
            const mensagem = mensagemDaFalha(falha);
            setAviso(`${mensagem} A alteração foi desfeita.`);
            throw falha;
        }
    }, [tarefas]);

    const concluir = useCallback((id: number, concluido: boolean) => {
        const tarefa = tarefas.find((item) => item.id === id);
        if (!tarefa) return Promise.reject(new ErroApi("Esta tarefa não está mais na lista."));
        return atualizar(id, {
            titulo: tarefa.titulo,
            descricao: tarefa.descricao,
            prioridade: tarefa.prioridade,
            concluido,
            dataEntrega: tarefa.dataEntrega
        });
    }, [atualizar, tarefas]);

    const excluir = useCallback(async (id: number) => {
        await excluirTarefa(id);
        setTarefas((atuais) => atuais.filter((tarefa) => tarefa.id !== id));
        setAviso(null);
    }, []);

    return {
        tarefas,
        carregando,
        erro,
        aviso,
        limparAviso: () => setAviso(null),
        recarregar,
        criar,
        atualizar,
        concluir,
        excluir
    };
}

function mesmosDados(atual: Tarefa, otimista: Tarefa): boolean {
    return atual.titulo === otimista.titulo
        && atual.descricao === otimista.descricao
        && atual.prioridade === otimista.prioridade
        && atual.dataEntrega === otimista.dataEntrega
        && atual.concluido === otimista.concluido;
}

function mensagemDaFalha(falha: unknown): string {
    return falha instanceof Error ? falha.message : "Ocorreu um erro inesperado.";
}
