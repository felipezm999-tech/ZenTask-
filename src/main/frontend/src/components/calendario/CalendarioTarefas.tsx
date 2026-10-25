import { useCategorias } from "../../hooks/useCategorias";
import { useMemo, useRef, useState } from "react";
import type { KeyboardEvent } from "react";
import { ItemTarefa } from "../tarefas/ItemTarefa";
import type { DadosTarefa, Tarefa } from "../../types/tarefa";
import { adicionarDias, criarDataLocal, dataLocalDeIso, diasDoMes, hojeLocal, isoDeDataLocal, mesmaData } from "../../utils/datas";

type CalendarioTarefasProps = {
    tarefas: Tarefa[];
    carregando: boolean;
    erro: string | null;
    recarregar: () => void;
    aoSelecionarTodas: () => void;
    atualizar: (id: number, dados: DadosTarefa) => Promise<void>;
    concluir: (id: number, concluido: boolean) => Promise<void>;
    excluir: (id: number) => Promise<void>;
};

const FORMATADOR_MES = new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric" });
const FORMATADOR_DIA_SEMANA = new Intl.DateTimeFormat("pt-BR", { weekday: "long" });
const FORMATADOR_DIA_COMPLETO = new Intl.DateTimeFormat("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric"
});
const DIAS_SEMANA = Array.from({ length: 7 }, (_, indice) =>
    FORMATADOR_DIA_SEMANA.format(new Date(2026, 0, 4 + indice)).slice(0, 1).toLocaleUpperCase("pt-BR")
);

export function CalendarioTarefas(props: CalendarioTarefasProps) {
    const { categorias } = useCategorias();
    const hoje = hojeLocal();
    const [mesVisivel, setMesVisivel] = useState(() => criarDataLocal(hoje.getFullYear(), hoje.getMonth(), 1));
    const [diaAtivo, setDiaAtivo] = useState(() => isoDeDataLocal(hoje));
    const [diaFocado, setDiaFocado] = useState(() => isoDeDataLocal(hoje));
    const [tarefaEditando, setTarefaEditando] = useState<number | null>(null);
    const dias = useMemo(() => diasDoMes(mesVisivel), [mesVisivel]);
    const tarefasComData = useMemo(() => {
        const agrupadas = new Map<string, Tarefa[]>();
        for (const tarefa of props.tarefas) {
            if (!tarefa.dataEntrega) continue;
            const lista = agrupadas.get(tarefa.dataEntrega) ?? [];
            lista.push(tarefa);
            agrupadas.set(tarefa.dataEntrega, lista);
        }
        return agrupadas;
    }, [props.tarefas]);
    const botoesDias = useRef<Map<string, HTMLButtonElement>>(new Map());

    function focarDia(chave: string) {
        setDiaFocado(chave);
        window.requestAnimationFrame(() => botoesDias.current.get(chave)?.focus());
    }

    function moverMes(deslocamento: number) {
        const proximo = criarDataLocal(mesVisivel.getFullYear(), mesVisivel.getMonth() + deslocamento, 1);
        const chave = isoDeDataLocal(proximo);
        setMesVisivel(proximo);
        focarDia(chave);
        setDiaAtivo(chave);
    }

    function tratarTeclaDia(evento: KeyboardEvent<HTMLButtonElement>, data: Date) {
        const deslocamentos: Record<string, number> = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 };
        const deslocamento = deslocamentos[evento.key];
        if (deslocamento !== undefined) {
            evento.preventDefault();
            const proximo = adicionarDias(data, deslocamento);
            focarDia(isoDeDataLocal(proximo));
            if (proximo.getMonth() !== mesVisivel.getMonth()) {
                setMesVisivel(criarDataLocal(proximo.getFullYear(), proximo.getMonth(), 1));
            }
        } else if (evento.key === "Enter" || evento.key === " ") {
            evento.preventDefault();
            setDiaAtivo(isoDeDataLocal(data));
        } else if (evento.key === "Escape") {
            evento.preventDefault();
            const selecionado = dataLocalDeIso(diaAtivo);
            setMesVisivel(criarDataLocal(selecionado.getFullYear(), selecionado.getMonth(), 1));
            focarDia(diaAtivo);
        }
    }

    const tarefasDoDia = tarefasComData.get(diaAtivo) ?? [];
    const tituloDia = FORMATADOR_DIA_COMPLETO.format(dataLocalDeIso(diaAtivo));
    const chaveMes = `${mesVisivel.getFullYear()}-${mesVisivel.getMonth()}`;

    return (
        <section className="calendario" aria-label="Calendário de tarefas">
            <div className="cabecalho-calendario">
                <h2>{FORMATADOR_MES.format(mesVisivel)}</h2>
                <div className="controles-calendario">
                    <button
                        type="button"
                        className="botao-calendario"
                        onClick={() => moverMes(-1)}
                        aria-label="Mês anterior"
                    >
                        <IconeSeta direcao="anterior" />
                    </button>
                    <button type="button" className="botao-texto" onClick={() => {
                        setMesVisivel(criarDataLocal(hoje.getFullYear(), hoje.getMonth(), 1));
                        setDiaAtivo(isoDeDataLocal(hoje));
                        focarDia(isoDeDataLocal(hoje));
                    }}>Hoje</button>
                    <button
                        type="button"
                        className="botao-calendario"
                        onClick={() => moverMes(1)}
                        aria-label="Próximo mês"
                    >
                        <IconeSeta direcao="proximo" />
                    </button>
                </div>
            </div>
            <div
                className="grade-calendario"
                role="grid"
                key={chaveMes}
                aria-label={`Calendário de ${FORMATADOR_MES.format(mesVisivel)}`}
            >
                <div className="linha-calendario" role="row">
                {DIAS_SEMANA.map((dia, indice) => (
                    <div
                        className={`cabecalho-dia-semana${indice === 0 || indice === 6 ? " fim-de-semana" : ""}`}
                        role="columnheader"
                        key={`${dia}-${indice}`}
                        aria-label={FORMATADOR_DIA_SEMANA.format(new Date(2026, 0, 4 + indice))}
                    >
                        {dia}
                    </div>
                ))}
                </div>
                {Array.from({ length: 6 }, (_, semana) => (
                    <div className="linha-calendario" role="row" key={semana}>
                    {dias.slice(semana * 7, semana * 7 + 7).map((data) => {
                    const chave = isoDeDataLocal(data);
                    const tarefas = tarefasComData.get(chave) ?? [];
                    const foraDoMes = data.getMonth() !== mesVisivel.getMonth();
                    const selecionado = chave === diaAtivo;
                    const focado = chave === diaFocado;
                    const fimDeSemana = data.getDay() === 0 || data.getDay() === 6;
                    return (
                        <button
                            key={chave}
                            ref={(elemento) => {
                                if (elemento) botoesDias.current.set(chave, elemento);
                                else botoesDias.current.delete(chave);
                            }}
                            className={`dia-calendario${foraDoMes ? " fora-do-mes" : ""}${fimDeSemana ? " fim-de-semana" : ""}${mesmaData(data, hoje) ? " dia-hoje" : ""}${selecionado ? " dia-selecionado" : ""}`}
                            type="button"
                            role="gridcell"
                            tabIndex={focado ? 0 : -1}
                            aria-current={mesmaData(data, hoje) ? "date" : undefined}
                            aria-selected={selecionado}
                            aria-label={`${FORMATADOR_DIA_COMPLETO.format(data)}, ${tarefas.length} ${tarefas.length === 1 ? "tarefa" : "tarefas"}`}
                            onClick={() => {
                                setDiaAtivo(chave);
                                focarDia(chave);
                            }}
                            onKeyDown={(evento) => tratarTeclaDia(evento, data)}
                        >
                            <span className="numero-dia">{data.getDate()}</span>
                            <span className="marcadores-dia" aria-hidden="true">{[...new Set(tarefas.map(t => t.categoriaId))].slice(0, 5).map(id => <span key={id ?? "sem"} className="marcador-tarefa" style={{ backgroundColor: categorias.find(c => c.id === id)?.cor ?? "#808080" }} />)}</span>
                        </button>
                    );
                    })}
                    </div>
                ))}
            </div>
            <section className="tarefas-do-dia" aria-labelledby="titulo-tarefas-dia">
                <h3 id="titulo-tarefas-dia">{tituloDia}</h3>
                {props.carregando ? (
                    <div className="esqueleto-lista" aria-label="Carregando tarefas"><span /><span /><span /></div>
                ) : props.erro ? (
                    <div className="estado-lista estado-erro" role="alert">
                        <p>{props.erro}</p>
                        <button className="botao-texto" type="button" onClick={props.recarregar}>Tentar de novo</button>
                    </div>
                ) : (
                    <>
                        {tarefasDoDia.length
                            ? tarefasDoDia.map((tarefa) => (
                                <ItemTarefa
                                    key={tarefa.id}
                                    tarefa={tarefa}
                                    aoConcluir={props.concluir}
                                    aoAtualizar={props.atualizar}
                                    aoExcluir={props.excluir}
                                    editando={tarefaEditando === tarefa.id}
                                    aoAbrirEdicao={setTarefaEditando}
                                    aoFecharEdicao={() => setTarefaEditando(null)}
                                />
                            ))
                            : (
                                <div className="estado-vazio">
                                    <span className="icone-estado-vazio" aria-hidden="true">☼</span>
                                    <p>Nenhuma tarefa aqui. Para criar uma, vá para a aba Todas.</p>
                                    <button className="botao-texto" type="button" onClick={props.aoSelecionarTodas}>
                                        Ir para Todas
                                    </button>
                                </div>
                            )}
                    </>
                )}
            </section>
        </section>
    );
}

function IconeSeta({ direcao }: { direcao: "anterior" | "proximo" }) {
    return (
        <svg
            aria-hidden="true"
            viewBox="0 0 20 20"
            fill="none"
            className={direcao === "anterior" ? "seta-anterior" : undefined}
        >
            <path d="m7.5 4.5 5.5 5.5-5.5 5.5" />
        </svg>
    );
}
