import { useState } from "react";
import type { RefObject } from "react";
import type { DadosTarefa, Tarefa } from "../types/tarefa";
import type { FiltroTarefas } from "../types/filtros";
import { CampoNovaTarefa } from "./CampoNovaTarefa";
import { ItemTarefa } from "./ItemTarefa";
import { hojeLocal, isoDeDataLocal } from "../utils/datas";

type ListaTarefasProps = {
    tarefas: Tarefa[];
    filtro: FiltroTarefas;
    carregando: boolean;
    erro: string | null;
    recarregar: () => void;
    criar: (dados: DadosTarefa) => Promise<Tarefa>;
    atualizar: (id: number, dados: DadosTarefa) => Promise<void>;
    concluir: (id: number, concluido: boolean) => Promise<void>;
    excluir: (id: number) => Promise<void>;
    refNovaTarefa: RefObject<HTMLInputElement | null>;
    dataNovaTarefa?: string | null;
};

export function ListaTarefas({
    tarefas,
    filtro,
    carregando,
    erro,
    recarregar,
    criar,
    atualizar,
    concluir,
    excluir,
    refNovaTarefa,
    dataNovaTarefa = null
}: ListaTarefasProps) {
    const [concluidasAbertas, setConcluidasAbertas] = useState(false);
    const [tarefaEditando, setTarefaEditando] = useState<number | null>(null);
    const hoje = isoDeDataLocal(hojeLocal());
    const tarefasFiltradas = filtro === "hoje"
        ? tarefas.filter((tarefa) => !tarefa.concluido && tarefa.dataEntrega === hoje)
        : filtro === "proximos-dias"
            ? tarefas.filter((tarefa) => !tarefa.concluido && Boolean(tarefa.dataEntrega) && tarefa.dataEntrega! > hoje)
            : filtro === "atrasadas"
                ? tarefas.filter((tarefa) => !tarefa.concluido && Boolean(tarefa.dataEntrega) && tarefa.dataEntrega! < hoje)
                : tarefas;
    const pendentes = tarefasFiltradas.filter((tarefa) => !tarefa.concluido);
    const concluidas = tarefasFiltradas.filter((tarefa) => tarefa.concluido);

    function linha(tarefa: Tarefa) {
        return (
            <ItemTarefa
                key={tarefa.id}
                tarefa={tarefa}
                aoConcluir={concluir}
                aoAtualizar={atualizar}
                aoExcluir={excluir}
                editando={tarefaEditando === tarefa.id}
                aoAbrirEdicao={setTarefaEditando}
                aoFecharEdicao={() => setTarefaEditando(null)}
            />
        );
    }

    if (carregando) return <Esqueleto />;

    if (erro) {
        return (
            <section className="estado-lista estado-erro" role="alert">
                <h2>Não foi possível carregar as tarefas</h2>
                <p>{erro}</p>
                <button className="botao-texto" type="button" onClick={recarregar}>Tentar de novo</button>
            </section>
        );
    }

    if (filtro === "pendentes") {
        return (
            <section className="lista-por-filtro" aria-label="Tarefas pendentes">
                <CampoNovaTarefa key={dataNovaTarefa ?? "sem-data"} aoCriar={criar} referenciaTitulo={refNovaTarefa} dataInicial={dataNovaTarefa} />
                {pendentes.length
                    ? pendentes.map(linha)
                    : <EstadoVazio mensagem={mensagemVazia(filtro)} />}
            </section>
        );
    }

    if (filtro === "concluidas") {
        return (
            <section className="lista-por-filtro" aria-label="Tarefas concluídas">
                {concluidas.length
                    ? concluidas.map(linha)
                    : <EstadoVazio mensagem="Nenhuma tarefa concluída." />}
            </section>
        );
    }

    return (
        <section className="lista-todas" aria-label="Todas as tarefas">
            <CampoNovaTarefa key={dataNovaTarefa ?? "sem-data"} aoCriar={criar} referenciaTitulo={refNovaTarefa} dataInicial={dataNovaTarefa} />
            {pendentes.length
                ? pendentes.map(linha)
                : <EstadoVazio mensagem={mensagemVazia(filtro)} />}
            {concluidas.length > 0 && (
                <section className="secao-concluidas">
                    <button
                        className="botao-secao"
                        type="button"
                        aria-expanded={concluidasAbertas}
                        onClick={() => setConcluidasAbertas((abertas) => !abertas)}
                    >
                        <span>Concluídas</span>
                        <span className="contagem-secao">{concluidas.length}</span>
                        <span className={`seta-secao${concluidasAbertas ? " aberta" : ""}`} aria-hidden="true" />
                    </button>
                    {concluidasAbertas && concluidas.map(linha)}
                </section>
            )}
        </section>
    );
}

function EstadoVazio({ mensagem }: { mensagem: string }) {
    return <p className="estado-vazio">{mensagem}</p>;
}

function mensagemVazia(filtro: FiltroTarefas): string {
    const mensagens: Partial<Record<FiltroTarefas, string>> = {
        hoje: "Nenhuma tarefa para hoje.",
        "proximos-dias": "Nenhuma tarefa para os próximos dias.",
        atrasadas: "Nenhuma tarefa atrasada."
    };
    return mensagens[filtro] ?? "Nenhuma tarefa pendente.";
}

function Esqueleto() {
    return (
        <div className="esqueleto-lista" aria-label="Carregando tarefas">
            <span />
            <span />
            <span />
        </div>
    );
}
