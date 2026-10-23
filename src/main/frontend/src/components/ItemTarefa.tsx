import { useRef, useState } from "react";
import type { FormEvent, KeyboardEvent } from "react";
import { mensagemErroDoCampo } from "../api/tarefas";
import type { DadosTarefa, Prioridade, Tarefa } from "../types/tarefa";
import { hojeLocal, isoDeDataLocal, rotuloDataEntrega } from "../utils/datas";

type ItemTarefaProps = {
    tarefa: Tarefa;
    aoConcluir: (id: number, concluido: boolean) => Promise<void>;
    aoAtualizar: (id: number, dados: DadosTarefa) => Promise<void>;
    aoExcluir: (id: number) => Promise<void>;
    editando: boolean;
    aoAbrirEdicao: (id: number) => void;
    aoFecharEdicao: () => void;
};

export function ItemTarefa({ tarefa, aoConcluir, aoAtualizar, aoExcluir, editando, aoAbrirEdicao, aoFecharEdicao }: ItemTarefaProps) {
    const [confirmandoExclusao, setConfirmandoExclusao] = useState(false);
    const [descricaoAberta, setDescricaoAberta] = useState(false);
    const [erro, setErro] = useState("");
    const [errosCampos, setErrosCampos] = useState<Record<string, string>>({});
    const [salvando, setSalvando] = useState(false);
    const formulario = useRef<HTMLFormElement>(null);
    const rascunho = useRef<DadosTarefa>(dadosDaTarefa(tarefa));

    function abrirEdicao() {
        rascunho.current = dadosDaTarefa(tarefa);
        setErro("");
        setErrosCampos({});
        aoAbrirEdicao(tarefa.id);
    }

    async function salvar() {
        if (salvando) return;
        const dados = {
            ...rascunho.current,
            titulo: rascunho.current.titulo.trim()
        };
        if (!dados.titulo) {
            setErro("O título não pode ficar vazio.");
            formulario.current?.querySelector<HTMLInputElement>("[name='titulo']")?.focus();
            return;
        }

        setSalvando(true);
        try {
            await aoAtualizar(tarefa.id, dados);
            aoFecharEdicao();
            setErro("");
            setErrosCampos({});
        } catch (falha) {
            setErrosCampos({
                titulo: mensagemErroDoCampo(falha, "titulo") ?? "",
                descricao: mensagemErroDoCampo(falha, "descricao") ?? "",
                prioridade: mensagemErroDoCampo(falha, "prioridade") ?? "",
                dataEntrega: mensagemErroDoCampo(falha, "dataEntrega") ?? ""
            });
            setErro(mensagemDaFalha(falha));
        } finally {
            setSalvando(false);
        }
    }

    function cancelar() {
        rascunho.current = dadosDaTarefa(tarefa);
        aoFecharEdicao();
        setErro("");
    }

    function tratarTecla(evento: KeyboardEvent<HTMLFormElement>) {
        if (evento.key === "Escape") {
            evento.preventDefault();
            cancelar();
        }
        if (evento.key === "Enter" && (!(evento.target instanceof HTMLElement) || evento.target.tagName !== "TEXTAREA")) {
            evento.preventDefault();
            void salvar();
        }
    }

    function enviarEdicao(evento: FormEvent<HTMLFormElement>) {
        evento.preventDefault();
        void salvar();
    }

    async function tratarConclusao(concluido: boolean) {
        setSalvando(true);
        try {
            await aoConcluir(tarefa.id, concluido);
        } catch {
            // O hook reverte o estado e exibe o aviso da API.
        } finally {
            setSalvando(false);
        }
    }

    async function confirmarExclusao() {
        setSalvando(true);
        try {
            await aoExcluir(tarefa.id);
        } catch (falha) {
            setErro(mensagemDaFalha(falha));
            setConfirmandoExclusao(false);
        } finally {
            setSalvando(false);
        }
    }

    if (editando) {
        return (
            <form
                className="item-tarefa item-editando liquid-glass"
                ref={formulario}
                onKeyDown={tratarTecla}
                onSubmit={enviarEdicao}
            >
                <label className="rotulo-oculto" htmlFor={`titulo-${tarefa.id}`}>Título da tarefa</label>
                <input
                    id={`titulo-${tarefa.id}`}
                    name="titulo"
                    className="campo-edicao titulo-edicao"
                    defaultValue={tarefa.titulo}
                    maxLength={120}
                    autoFocus
                    onChange={(evento) => { rascunho.current.titulo = evento.target.value; }}
                    aria-invalid={Boolean(errosCampos.titulo)}
                    aria-describedby={errosCampos.titulo ? `erro-titulo-${tarefa.id}` : undefined}
                />
                {errosCampos.titulo && <span className="erro-edicao" id={`erro-titulo-${tarefa.id}`} role="alert">{errosCampos.titulo}</span>}
                <label className="rotulo-oculto" htmlFor={`descricao-${tarefa.id}`}>Descrição</label>
                <input
                    id={`descricao-${tarefa.id}`}
                    name="descricao"
                    className="campo-edicao descricao-edicao"
                    defaultValue={tarefa.descricao ?? ""}
                    maxLength={500}
                    placeholder="Descrição"
                    onChange={(evento) => { rascunho.current.descricao = evento.target.value; }}
                    aria-invalid={Boolean(errosCampos.descricao)}
                    aria-describedby={errosCampos.descricao ? `erro-descricao-${tarefa.id}` : undefined}
                />
                {errosCampos.descricao && <span className="erro-edicao" id={`erro-descricao-${tarefa.id}`} role="alert">{errosCampos.descricao}</span>}
                <label className="rotulo-oculto" htmlFor={`prioridade-${tarefa.id}`}>Prioridade</label>
                <select
                    id={`prioridade-${tarefa.id}`}
                    className="seletor-prioridade"
                    defaultValue={prioridadeValida(tarefa.prioridade)}
                    onChange={(evento) => {
                        if (ehPrioridade(evento.target.value)) rascunho.current.prioridade = evento.target.value;
                    }}
                    aria-invalid={Boolean(errosCampos.prioridade)}
                    aria-describedby={errosCampos.prioridade ? `erro-prioridade-${tarefa.id}` : undefined}
                >
                    <option value="BAIXA">Baixa</option>
                    <option value="MEDIA">Média</option>
                    <option value="ALTA">Alta</option>
                </select>
                <label className="rotulo-oculto" htmlFor={`data-entrega-${tarefa.id}`}>Data de entrega</label>
                <input
                    id={`data-entrega-${tarefa.id}`}
                    className="campo-edicao campo-data-edicao"
                    type="date"
                    defaultValue={rascunho.current.dataEntrega ?? ""}
                    onChange={(evento) => { rascunho.current.dataEntrega = evento.target.value || null; }}
                    aria-invalid={Boolean(errosCampos.dataEntrega)}
                    aria-describedby={errosCampos.dataEntrega ? `erro-data-${tarefa.id}` : undefined}
                />
                {errosCampos.dataEntrega && <span className="erro-edicao" id={`erro-data-${tarefa.id}`} role="alert">{errosCampos.dataEntrega}</span>}
                {errosCampos.prioridade && <span className="erro-edicao" id={`erro-prioridade-${tarefa.id}`} role="alert">{errosCampos.prioridade}</span>}
                {erro && <span className="erro-edicao" id={`erro-tarefa-${tarefa.id}`} role="alert">{erro}</span>}
                <button className="botao-texto" type="submit" disabled={salvando}>Salvar</button>
                <button className="botao-texto" type="button" onClick={cancelar}>Cancelar</button>
            </form>
        );
    }

    const temDescricao = Boolean(tarefa.descricao?.trim());
    const dataHoje = isoDeDataLocal(hojeLocal());
    const tarefaDeHoje = !tarefa.concluido && tarefa.dataEntrega === dataHoje;
    const tarefaAtrasada = !tarefa.concluido && Boolean(tarefa.dataEntrega && tarefa.dataEntrega < dataHoje);

    return (
        <article className={`item-tarefa liquid-glass${tarefa.concluido ? " tarefa-concluida" : ""}${tarefaDeHoje ? " tarefa-hoje" : ""}${tarefaAtrasada ? " tarefa-atrasada" : ""}`}>
            <input
                className="checkbox-tarefa"
                type="checkbox"
                checked={tarefa.concluido}
                disabled={salvando}
                onChange={(evento) => void tratarConclusao(evento.target.checked)}
                aria-label={tarefa.concluido ? `Reabrir ${tarefa.titulo}` : `Concluir ${tarefa.titulo}`}
            />
            <div className="conteudo-tarefa">
                <button className="titulo-tarefa" type="button" onClick={abrirEdicao}>
                    <span>{tarefa.titulo || "Tarefa sem título"}</span>
                </button>
                {temDescricao && (
                    <button
                        className={`botao-descricao${descricaoAberta ? " aberta" : ""}`}
                        type="button"
                        aria-expanded={descricaoAberta}
                        aria-controls={`descricao-${tarefa.id}`}
                        onClick={() => setDescricaoAberta((aberta) => !aberta)}
                    >
                        <span>Descrição</span>
                        <span className="seta-descricao" aria-hidden="true" />
                    </button>
                )}
                {descricaoAberta && temDescricao && (
                    <p id={`descricao-${tarefa.id}`} className="descricao-tarefa" role="note">{tarefa.descricao}</p>
                )}
            </div>
            {(() => {
                const data = rotuloDataEntrega(tarefa.dataEntrega, tarefa.concluido);
                return data && <time className={`data-entrega${data.vencida ? " vencida" : ""}`} dateTime={tarefa.dataEntrega ?? undefined}>{data.texto}</time>;
            })()}
            <span className={`etiqueta-prioridade prioridade-${prioridadeValida(tarefa.prioridade).toLocaleLowerCase("pt-BR")}`}>
                {rotuloPrioridade(tarefa.prioridade)}
            </span>
            <div className="acoes-tarefa">
                {confirmandoExclusao ? (
                    <span className="confirmacao-exclusao">
                        <span>Excluir?</span>
                        <button className="botao-texto acao-perigosa" type="button" onClick={() => void confirmarExclusao()} disabled={salvando}>Sim</button>
                        <button className="botao-texto" type="button" onClick={() => setConfirmandoExclusao(false)}>Não</button>
                    </span>
                ) : (
                    <>
                        <button
                            className="botao-acao-tarefa"
                            type="button"
                            onClick={abrirEdicao}
                            aria-label={`Editar ${tarefa.titulo}`}
                            title="Editar tarefa"
                        >
                            <IconeEditar />
                        </button>
                        <button
                            className="botao-acao-tarefa botao-excluir"
                            type="button"
                            onClick={() => setConfirmandoExclusao(true)}
                            aria-label={`Excluir ${tarefa.titulo}`}
                            title="Excluir tarefa"
                        >
                            <IconeLixeira />
                        </button>
                    </>
                )}
            </div>
            {erro && <span className="erro-item" role="alert">{erro}</span>}
        </article>
    );
}

function IconeLixeira() {
    return (
        <svg aria-hidden="true" viewBox="0 0 16 16" fill="none">
            <path d="M2.5 4.5h11M6 4.5V3h4v1.5m2.5 0-.6 8H4.1l-.6-8m3 2v3.5m3-3.5V10" />
        </svg>
    );
}

function IconeEditar() {
    return (
        <svg aria-hidden="true" viewBox="0 0 16 16" fill="none">
            <path d="m10.8 2.7 2.5 2.5M3 13l2.5-.5 7.8-7.8a1.8 1.8 0 0 0-2.5-2.5L3 10l-.5 3Z" />
        </svg>
    );
}

function dadosDaTarefa(tarefa: Tarefa): DadosTarefa {
    return {
        titulo: tarefa.titulo,
        descricao: tarefa.descricao ?? "",
        prioridade: prioridadeValida(tarefa.prioridade),
        concluido: tarefa.concluido,
        dataEntrega: tarefa.dataEntrega
    };
}

function prioridadeValida(prioridade: string): Prioridade {
    return ehPrioridade(prioridade) ? prioridade : "MEDIA";
}

function rotuloPrioridade(prioridade: string): string {
    const rotulos: Record<string, string> = { ALTA: "Alta", MEDIA: "Média", BAIXA: "Baixa" };
    return rotulos[prioridadeValida(prioridade)] ?? "Média";
}

function mensagemDaFalha(falha: unknown): string {
    return falha instanceof Error ? falha.message : "Não foi possível salvar a tarefa.";
}

function ehPrioridade(valor: string): valor is Prioridade {
    return valor === "BAIXA" || valor === "MEDIA" || valor === "ALTA";
}
