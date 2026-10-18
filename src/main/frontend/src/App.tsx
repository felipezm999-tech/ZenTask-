import { useEffect, useMemo, useRef, useState } from "react";
import { BarraLateral } from "./components/BarraLateral";
import { ListaTarefas } from "./components/ListaTarefas";
import { CalendarioTarefas } from "./components/CalendarioTarefas";
import { useTarefas } from "./hooks/useTarefas";
import type { FiltroTarefas } from "./types/filtros";
import { hojeLocal, isoDeDataLocal } from "./utils/datas";

const TITULOS: Record<FiltroTarefas, string> = {
    todas: "Todas",
    pendentes: "Pendentes",
    concluidas: "Concluídas",
    hoje: "Hoje",
    "proximos-dias": "Próximos dias",
    atrasadas: "Atrasadas",
    calendario: "Calendário"
};

export function App() {
    const [filtro, setFiltro] = useState<FiltroTarefas>("todas");
    const campoNovaTarefa = useRef<HTMLInputElement>(null);
    const {
        tarefas,
        carregando,
        erro,
        aviso,
        limparAviso,
        recarregar,
        criar,
        atualizar,
        concluir,
        excluir
    } = useTarefas();

    const quantidades = useMemo(() => {
        const pendentes = tarefas.filter((tarefa) => !tarefa.concluido).length;
        const hoje = isoDeDataLocal(hojeLocal());
        return {
            todas: tarefas.length,
            pendentes,
            concluidas: tarefas.length - pendentes,
            hoje: tarefas.filter((tarefa) => !tarefa.concluido && tarefa.dataEntrega === hoje).length,
            "proximos-dias": tarefas.filter((tarefa) => !tarefa.concluido && Boolean(tarefa.dataEntrega) && tarefa.dataEntrega! > hoje).length,
            atrasadas: tarefas.filter((tarefa) => !tarefa.concluido && Boolean(tarefa.dataEntrega) && tarefa.dataEntrega! < hoje).length
        };
    }, [tarefas]);

    useEffect(() => {
        function tratarAtalho(evento: KeyboardEvent) {
            const alvo = evento.target;
            const digitando = alvo instanceof HTMLElement
                && (alvo.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(alvo.tagName));
            if (evento.key.toLocaleLowerCase("pt-BR") !== "n" || digitando || evento.metaKey || evento.ctrlKey || evento.altKey) {
                return;
            }
            evento.preventDefault();
            setFiltro("pendentes");
            window.setTimeout(() => campoNovaTarefa.current?.focus(), 0);
        }

        window.addEventListener("keydown", tratarAtalho);
        return () => window.removeEventListener("keydown", tratarAtalho);
    }, []);

    return (
        <div className="aplicacao">
            <BarraLateral
                filtroAtivo={filtro}
                quantidadeTodas={quantidades.todas}
                quantidadePendentes={quantidades.pendentes}
                quantidadeConcluidas={quantidades.concluidas}
                quantidadesDatas={quantidades}
                aoSelecionarFiltro={setFiltro}
            />
            <main className="conteudo-principal">
                <header className="cabecalho-pagina">
                    <h1>{TITULOS[filtro]}</h1>
                    <time className="data-atual">
                        {new Date().toLocaleDateString("pt-BR", {
                            weekday: "short",
                            day: "numeric",
                            month: "short"
                        })}
                    </time>
                </header>

                {aviso && (
                    <div className="aviso-operacao" role="status">
                        <span>{aviso}</span>
                        <button type="button" onClick={limparAviso} aria-label="Dispensar aviso">Dispensar</button>
                    </div>
                )}

                <div className="coluna-lista">
                    {filtro === "calendario" ? (
                        <CalendarioTarefas
                            tarefas={tarefas}
                            carregando={carregando}
                            erro={erro}
                            recarregar={() => { void recarregar(); }}
                            criar={criar}
                            atualizar={atualizar}
                            concluir={concluir}
                            excluir={excluir}
                            refNovaTarefa={campoNovaTarefa}
                        />
                    ) : (
                        <ListaTarefas
                            tarefas={tarefas}
                            filtro={filtro}
                            carregando={carregando}
                            erro={erro}
                            recarregar={() => { void recarregar(); }}
                            criar={criar}
                            atualizar={atualizar}
                            concluir={concluir}
                            excluir={excluir}
                            refNovaTarefa={campoNovaTarefa}
                        />
                    )}
                </div>
            </main>
        </div>
    );
}
