import { useState } from "react";
import type { RefObject } from "react";
import type { DadosTarefa, Tarefa } from "../../types/tarefa";
import type { FiltroTarefas } from "../../types/filtros";
import { CampoNovaTarefa } from "./CampoNovaTarefa";
import { ItemTarefa } from "./ItemTarefa";
import { filtrarTarefas } from "../../utils/filtrosTarefas";

type ListaTarefasProps = {
    permitirCriacao?: boolean;
    mensagemCategoria?: string;
    tarefas: Tarefa[];
    filtro: FiltroTarefas;
    carregando: boolean;
    erro: string | null;
    recarregar: () => void;
    criar: (dados: DadosTarefa) => Promise<Tarefa>;
    aoSelecionarTodas: () => void;
    atualizar: (id: number, dados: DadosTarefa) => Promise<void>;
    concluir: (id: number, concluido: boolean) => Promise<void>;
    excluir: (id: number) => Promise<void>;
    refNovaTarefa: RefObject<HTMLInputElement | null>;
    dataNovaTarefa?: string | null;
};

export function ListaTarefas({
    permitirCriacao = true, mensagemCategoria,
    tarefas,
    filtro,
    carregando,
    erro,
    recarregar,
    criar,
    aoSelecionarTodas,
    atualizar,
    concluir,
    excluir,
    refNovaTarefa,
    dataNovaTarefa = null
}: ListaTarefasProps) {
    const [concluidasAbertas, setConcluidasAbertas] = useState(!permitirCriacao);
    const [tarefaEditando, setTarefaEditando] = useState<number | null>(null);
    const tarefasFiltradas = filtrarTarefas(tarefas, filtro);
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
                {pendentes.length
                    ? pendentes.map(linha)
                    : <EstadoVazio mensagem={mensagemVazia(filtro)} aoSelecionarTodas={aoSelecionarTodas} />}
            </section>
        );
    }

    if (filtro === "concluidas") {
        return (
            <section className="lista-por-filtro" aria-label="Tarefas concluídas">
                {concluidas.length
                    ? concluidas.map(linha)
                    : <EstadoVazio mensagem="Nenhuma tarefa aqui. Para criar uma, vá para a aba Todas." aoSelecionarTodas={aoSelecionarTodas} />}
            </section>
        );
    }

    if (filtro !== "todas") {
        return (
            <section className="lista-por-filtro" aria-label={`Tarefas: ${filtro}`}>
                {pendentes.length
                    ? pendentes.map(linha)
                    : <EstadoVazio mensagem="Nenhuma tarefa aqui. Para criar uma, vá para a aba Todas." aoSelecionarTodas={aoSelecionarTodas} />}
            </section>
        );
    }

    return (
        <section className="lista-todas" aria-label="Todas as tarefas">
            {permitirCriacao && <CampoNovaTarefa key={dataNovaTarefa ?? "sem-data"} aoCriar={criar} referenciaTitulo={refNovaTarefa} dataInicial={dataNovaTarefa} />}
            {pendentes.length
                ? pendentes.map(linha)
                : tarefasFiltradas.length === 0 ? <EstadoVazio mensagem={mensagemCategoria ?? "Nenhuma tarefa ainda. Que tal criar a primeira?"} /> : null}
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

function EstadoVazio({ mensagem, aoSelecionarTodas }: { mensagem: string; aoSelecionarTodas?: () => void }) {
    return (
        <div className="estado-vazio">
            <span className="icone-estado-vazio" aria-hidden="true">☼</span>
            <p>{mensagem}</p>
            {aoSelecionarTodas && (
                <button className="botao-texto" type="button" onClick={aoSelecionarTodas}>Ir para Todas</button>
            )}
        </div>
    );
}

function mensagemVazia(filtro: FiltroTarefas): string {
    const mensagens: Partial<Record<FiltroTarefas, string>> = {
        pendentes: "Nenhuma tarefa aqui. Para criar uma nova tarefa, vá para a aba Todas.",
        concluidas: "Nenhuma tarefa aqui. Para criar uma nova tarefa, vá para a aba Todas.",
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
