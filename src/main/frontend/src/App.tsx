import { useEffect, useMemo, useRef, useState } from "react";
import { BarraLateral } from "./components/BarraLateral";
import { ListaTarefas } from "./components/ListaTarefas";
import { CalendarioTarefas } from "./components/CalendarioTarefas";
import { useTarefas } from "./hooks/useTarefas";
import type { FiltroTarefas } from "./types/filtros";
import type { DadosTarefa, Tarefa } from "./types/tarefa";
import { contarTarefas } from "./utils/filtrosTarefas";

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
    const [menuAberto, setMenuAberto] = useState(false);
    const [tema, setTema] = useState<"light" | "dark">(
        document.documentElement.dataset.theme === "dark" ? "dark" : "light"
    );
    const campoNovaTarefa = useRef<HTMLInputElement>(null);
    const {
        tarefas,
        carregando,
        erro,
        aviso,
        limparAviso,
        recarregar,
        criar: criarTarefa,
        atualizar,
        concluir,
        excluir
    } = useTarefas();

    function criar(dados: DadosTarefa): Promise<Tarefa> {
        if (filtro !== "todas") {
            return Promise.reject(new Error("Novas tarefas só podem ser criadas na aba Todas."));
        }
        return criarTarefa(dados);
    }

    const quantidades = useMemo(() => contarTarefas(tarefas), [tarefas]);

    function alternarTema() {
        const novoTema = tema === "dark" ? "light" : "dark";
        const elementoRaiz = document.documentElement;
        elementoRaiz.classList.add("tema-com-transicao");
        elementoRaiz.dataset.theme = novoTema;
        setTema(novoTema);

        const metaTema = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
        if (metaTema) metaTema.content = novoTema === "dark" ? "#20232B" : "#F5F7FB";

        try {
            window.localStorage.setItem("zentask-tema", novoTema);
        } catch (falha) {
            console.warn("Não foi possível salvar a preferência de tema.", falha);
        }

        window.setTimeout(() => elementoRaiz.classList.remove("tema-com-transicao"), 300);
    }

    useEffect(() => {
        function tratarAtalho(evento: KeyboardEvent) {
            const alvo = evento.target;
            const digitando = alvo instanceof HTMLElement
                && (alvo.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(alvo.tagName));
            if (evento.key.toLocaleLowerCase("pt-BR") !== "n" || digitando || evento.metaKey || evento.ctrlKey || evento.altKey) {
                return;
            }
            evento.preventDefault();
            setFiltro("todas");
            window.setTimeout(() => campoNovaTarefa.current?.focus(), 0);
        }

        window.addEventListener("keydown", tratarAtalho);
        return () => window.removeEventListener("keydown", tratarAtalho);
    }, []);

    useEffect(() => {
        function fecharMenuComEscape(evento: KeyboardEvent) {
            if (evento.key === "Escape") setMenuAberto(false);
        }
        window.addEventListener("keydown", fecharMenuComEscape);
        return () => window.removeEventListener("keydown", fecharMenuComEscape);
    }, []);

    return (
        <div className="aplicacao">
            {menuAberto && (
                <button
                    className="fundo-menu-movel"
                    type="button"
                    aria-label="Fechar menu de navegação"
                    onClick={() => setMenuAberto(false)}
                />
            )}
            <BarraLateral
                filtroAtivo={filtro}
                quantidades={quantidades}
                aoSelecionarFiltro={setFiltro}
                menuAberto={menuAberto}
                aoFecharMenu={() => setMenuAberto(false)}
            />
            <main className="conteudo-principal">
                <header className="cabecalho-pagina">
                    <button
                        className="botao-menu-movel liquid-glass"
                        type="button"
                        aria-label="Abrir menu de navegação"
                        aria-expanded={menuAberto}
                        onClick={() => setMenuAberto(true)}
                    >
                        <span /><span /><span />
                    </button>
                    <div className="titulo-cabecalho">
                        <h1>{TITULOS[filtro]}</h1>
                        <p className="resumo-tarefas">
                            {quantidades.concluidas > 0
                                ? `${quantidades.concluidas} de ${quantidades.todas} concluídas`
                                : `${quantidades.todas} ${quantidades.todas === 1 ? "tarefa" : "tarefas"}`}
                        </p>
                    </div>
                    <time className="data-atual">
                        {new Date().toLocaleDateString("pt-BR", {
                            weekday: "short",
                            day: "numeric",
                            month: "short"
                        })}
                    </time>
                    <button
                        className="botao-tema liquid-glass"
                        type="button"
                        onClick={alternarTema}
                        aria-pressed={tema === "dark"}
                        aria-label={`Alternar para tema ${tema === "dark" ? "claro" : "escuro"}`}
                        title={`Alternar para tema ${tema === "dark" ? "claro" : "escuro"}`}
                    >
                        {tema === "dark" ? <IconeSol /> : <IconeLua />}
                    </button>
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
                            aoSelecionarTodas={() => setFiltro("todas")}
                            atualizar={atualizar}
                            concluir={concluir}
                            excluir={excluir}
                        />
                    ) : (
                        <ListaTarefas
                            tarefas={tarefas}
                            filtro={filtro}
                            carregando={carregando}
                            erro={erro}
                            recarregar={() => { void recarregar(); }}
                            criar={criar}
                            aoSelecionarTodas={() => setFiltro("todas")}
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

function IconeSol() {
    return (
        <svg aria-hidden="true" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2v2m0 16v2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M2 12h2m16 0h2M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42" />
        </svg>
    );
}

function IconeLua() {
    return (
        <svg aria-hidden="true" viewBox="0 0 24 24" fill="none">
            <path d="M20.2 15.3A8.5 8.5 0 0 1 8.7 3.8 8.5 8.5 0 1 0 20.2 15.3Z" />
        </svg>
    );
}
