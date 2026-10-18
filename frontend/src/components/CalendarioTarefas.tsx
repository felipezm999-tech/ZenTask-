import { useMemo, useRef, useState } from "react";
import type { KeyboardEvent, RefObject } from "react";
import { CampoNovaTarefa } from "./CampoNovaTarefa";
import { ItemTarefa } from "./ItemTarefa";
import type { DadosTarefa, Tarefa } from "../types/tarefa";
import { adicionarDias, dataLocalDeIso, diasDoMes, hojeLocal, isoDeDataLocal, mesmaData } from "../utils/datas";

type CalendarioTarefasProps = {
    tarefas: Tarefa[];
    carregando: boolean;
    erro: string | null;
    recarregar: () => void;
    criar: (dados: DadosTarefa) => Promise<Tarefa>;
    atualizar: (id: number, dados: DadosTarefa) => Promise<void>;
    concluir: (id: number, concluido: boolean) => Promise<void>;
    excluir: (id: number) => Promise<void>;
    refNovaTarefa: RefObject<HTMLInputElement | null>;
};

const DIAS_SEMANA = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

export function CalendarioTarefas(props: CalendarioTarefasProps) {
    const hoje = hojeLocal();
    const [mesVisivel, setMesVisivel] = useState(() => new Date(hoje.getFullYear(), hoje.getMonth(), 1));
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
        const proximo = new Date(mesVisivel.getFullYear(), mesVisivel.getMonth() + deslocamento, 1);
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
                setMesVisivel(new Date(proximo.getFullYear(), proximo.getMonth(), 1));
            }
        } else if (evento.key === "Enter" || evento.key === " ") {
            evento.preventDefault();
            setDiaAtivo(isoDeDataLocal(data));
        }
    }

    const tarefasDoDia = tarefasComData.get(diaAtivo) ?? [];
    const tituloDia = dataLocalDeIso(diaAtivo).toLocaleDateString("pt-BR", {
        weekday: "long",
        day: "numeric",
        month: "long"
    });

    return (
        <section className="calendario" aria-label="Calendário de tarefas">
            <div className="cabecalho-calendario">
                <h2>{mesVisivel.toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}</h2>
                <div className="controles-calendario">
                    <button type="button" className="botao-texto" onClick={() => moverMes(-1)} aria-label="Mês anterior">‹</button>
                    <button type="button" className="botao-texto" onClick={() => {
                        setMesVisivel(new Date(hoje.getFullYear(), hoje.getMonth(), 1));
                        setDiaAtivo(isoDeDataLocal(hoje));
                        focarDia(isoDeDataLocal(hoje));
                    }}>Hoje</button>
                    <button type="button" className="botao-texto" onClick={() => moverMes(1)} aria-label="Próximo mês">›</button>
                </div>
            </div>
            <div className="grade-calendario" role="grid" aria-label={mesVisivel.toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}>
                {DIAS_SEMANA.map((dia, indice) => (
                    <div className="cabecalho-dia-semana" role="columnheader" key={`${dia}-${indice}`} aria-label={dia}>{dia}</div>
                ))}
                {dias.map((data) => {
                    const chave = isoDeDataLocal(data);
                    const tarefas = tarefasComData.get(chave) ?? [];
                    const pendentes = tarefas.filter((tarefa) => !tarefa.concluido);
                    const concluidas = tarefas.filter((tarefa) => tarefa.concluido);
                    const foraDoMes = data.getMonth() !== mesVisivel.getMonth();
                    const selecionado = chave === diaAtivo;
                    const focado = chave === diaFocado;
                    return (
                        <button
                            key={chave}
                            ref={(elemento) => {
                                if (elemento) botoesDias.current.set(chave, elemento);
                                else botoesDias.current.delete(chave);
                            }}
                            className={`dia-calendario${foraDoMes ? " fora-do-mes" : ""}${mesmaData(data, hoje) ? " dia-hoje" : ""}${selecionado ? " dia-selecionado" : ""}`}
                            type="button"
                            role="gridcell"
                            tabIndex={focado ? 0 : -1}
                            aria-label={`${data.toLocaleDateString("pt-BR", { day: "numeric", month: "long" })}, ${tarefas.length} ${tarefas.length === 1 ? "tarefa" : "tarefas"}`}
                            onClick={() => {
                                setDiaAtivo(chave);
                                focarDia(chave);
                            }}
                            onKeyDown={(evento) => tratarTeclaDia(evento, data)}
                        >
                            <span className="numero-dia">{data.getDate()}</span>
                            <span className="marcadores-dia" aria-hidden="true">
                                {pendentes.slice(0, 3).map((tarefa) => (
                                    <i key={tarefa.id} className={`marcador-tarefa${chave < isoDeDataLocal(hoje) ? " marcador-vencido" : ""}`} />
                                ))}
                                {pendentes.length > 3 && <small>+{pendentes.length - 3}</small>}
                                {pendentes.length === 0 && concluidas.length > 0 && <i className="marcador-concluido" />}
                            </span>
                        </button>
                    );
                })}
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
                        <CampoNovaTarefa
                            key={diaAtivo}
                            aoCriar={props.criar}
                            referenciaTitulo={props.refNovaTarefa}
                            dataInicial={diaAtivo}
                        />
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
                            : <p className="estado-vazio">Nenhuma tarefa neste dia.</p>}
                    </>
                )}
            </section>
        </section>
    );
}
