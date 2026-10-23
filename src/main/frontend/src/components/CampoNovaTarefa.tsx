import { useRef, useState } from "react";
import type { FormEvent, KeyboardEvent, RefObject } from "react";
import { mensagemErroDoCampo } from "../api/tarefas";
import type { DadosTarefa, Prioridade } from "../types/tarefa";
import { adicionarDias, dataLocalDeIso, hojeLocal, isoDeDataLocal } from "../utils/datas";

type CampoNovaTarefaProps = {
    aoCriar: (dados: DadosTarefa) => Promise<unknown>;
    referenciaTitulo: RefObject<HTMLInputElement | null>;
    dataInicial?: string | null;
};

export function CampoNovaTarefa({ aoCriar, referenciaTitulo, dataInicial = null }: CampoNovaTarefaProps) {
    const [titulo, setTitulo] = useState("");
    const [descricao, setDescricao] = useState("");
    const [prioridade, setPrioridade] = useState<Prioridade>("MEDIA");
    const [dataEntrega, setDataEntrega] = useState(dataInicial ? isoDeDataLocal(dataLocalDeIso(dataInicial)) : "");
    const [detalhesAbertos, setDetalhesAbertos] = useState(false);
    const [erro, setErro] = useState("");
    const [errosCampos, setErrosCampos] = useState<Record<string, string>>({});
    const [salvando, setSalvando] = useState(false);
    const campoTitulo = referenciaTitulo;
    const campoDescricao = useRef<HTMLTextAreaElement>(null);

    async function enviar(evento: FormEvent<HTMLFormElement>) {
        evento.preventDefault();
        const tituloLimpo = titulo.trim();
        if (!tituloLimpo || salvando) {
            if (!tituloLimpo) {
                setErro("Informe um título para a tarefa.");
                setErrosCampos({});
                campoTitulo.current?.focus();
            }
            return;
        }

        setSalvando(true);
        setErro("");
        setErrosCampos({});
        try {
            await aoCriar({
                titulo: tituloLimpo,
                descricao: descricao.trim(),
                prioridade,
                concluido: false,
                dataEntrega: dataEntrega || null
            });
            setTitulo("");
            setDescricao("");
            setPrioridade("MEDIA");
            setDataEntrega(dataInicial ? isoDeDataLocal(dataLocalDeIso(dataInicial)) : "");
            campoTitulo.current?.focus();
            setDetalhesAbertos(false);
        } catch (falha) {
            const erros = {
                titulo: mensagemErroDoCampo(falha, "titulo") ?? "",
                descricao: mensagemErroDoCampo(falha, "descricao") ?? "",
                prioridade: mensagemErroDoCampo(falha, "prioridade") ?? "",
                dataEntrega: mensagemErroDoCampo(falha, "dataEntrega") ?? ""
            };
            setErrosCampos(erros);
            if (!Object.values(erros).some(Boolean)) setErro(mensagemDeValidacao(falha));
        } finally {
            setSalvando(false);
        }
    }

    function tratarTecla(evento: KeyboardEvent<HTMLInputElement>) {
        if (evento.key === "Escape") {
            setTitulo("");
            setErro("");
            setErrosCampos({});
            setDetalhesAbertos(false);
            evento.currentTarget.blur();
        }
    }

    const hoje = hojeLocal();
    const atalhosData = [
        { rotulo: "Hoje", data: isoDeDataLocal(hoje) },
        { rotulo: "Amanhã", data: isoDeDataLocal(adicionarDias(hoje, 1)) },
        { rotulo: "Próxima semana", data: isoDeDataLocal(adicionarDias(hoje, 7)) }
    ];
    const rotuloDataSelecionada = dataEntrega
        ? dataLocalDeIso(dataEntrega).toLocaleDateString("pt-BR", { day: "numeric", month: "short" }).replace(" de ", " ").replace(".", "")
        : null;

    return (
        <form className={`nova-tarefa liquid-glass${detalhesAbertos ? " detalhes-abertos" : ""}`} onSubmit={enviar}>
            <label className="rotulo-oculto" htmlFor="nova-tarefa-titulo">Nova tarefa</label>
            <input
                ref={campoTitulo}
                id="nova-tarefa-titulo"
                className="campo-nova-tarefa"
                value={titulo}
                onChange={(evento) => {
                    setTitulo(evento.target.value);
                    setErro("");
                    setErrosCampos((atuais) => ({ ...atuais, titulo: "" }));
                }}
                onFocus={() => setDetalhesAbertos(true)}
                onKeyDown={tratarTecla}
                placeholder="Nova tarefa"
                maxLength={120}
                aria-invalid={Boolean(erro || errosCampos.titulo)}
                aria-describedby={erro || errosCampos.titulo ? "erro-nova-tarefa" : undefined}
            />
            {!detalhesAbertos && (
                <button
                    className="botao-descricao-nova"
                    type="button"
                    onClick={() => {
                        setDetalhesAbertos(true);
                        window.requestAnimationFrame(() => campoDescricao.current?.focus());
                    }}
                >
                    + Descrição
                </button>
            )}
            <button
                className="botao-adicionar liquid-glass"
                type="submit"
                disabled={salvando}
                aria-label="Criar tarefa"
            >
                Adicionar
            </button>
            <div className="detalhes-campo-nova" inert={!detalhesAbertos}>
                <div className="conteudo-detalhes-nova">
                    <label className="rotulo-oculto" htmlFor="nova-tarefa-descricao">Descrição da tarefa</label>
                    <textarea
                        ref={campoDescricao}
                        id="nova-tarefa-descricao"
                        className="campo-descricao-nova"
                        value={descricao}
                        onChange={(evento) => {
                            setDescricao(evento.target.value);
                            setErrosCampos((atuais) => ({ ...atuais, descricao: "" }));
                        }}
                        placeholder="Descrição (opcional)"
                        rows={3}
                        maxLength={500}
                        aria-invalid={Boolean(errosCampos.descricao)}
                        aria-describedby={errosCampos.descricao ? "erro-descricao-nova-tarefa" : undefined}
                    />
                    <div className="opcoes-nova-tarefa">
                        <div className="chips-data" role="group" aria-label="Data de entrega">
                            {atalhosData.map((atalho) => (
                                <button
                                    className={`chip-data${dataEntrega === atalho.data ? " selecionado" : ""}`}
                                    key={atalho.rotulo}
                                    type="button"
                                    aria-pressed={dataEntrega === atalho.data}
                                    onClick={() => {
                                        setDataEntrega(atalho.data);
                                        setErrosCampos((atuais) => ({ ...atuais, dataEntrega: "" }));
                                    }}
                                >
                                    {atalho.rotulo}
                                </button>
                            ))}
                            <label className={`chip-data chip-calendario${dataEntrega && !atalhosData.some((atalho) => atalho.data === dataEntrega) ? " selecionado" : ""}`}>
                                <span aria-hidden="true">▦</span>
                                <span>{rotuloDataSelecionada ?? "Data"}</span>
                                <input
                                    type="date"
                                    value={dataEntrega}
                                    onChange={(evento) => {
                                        setDataEntrega(evento.target.value);
                                        setErrosCampos((atuais) => ({ ...atuais, dataEntrega: "" }));
                                    }}
                                    aria-label="Escolher data de entrega"
                                    aria-invalid={Boolean(errosCampos.dataEntrega)}
                                    aria-describedby={errosCampos.dataEntrega ? "erro-data-nova-tarefa" : undefined}
                                />
                            </label>
                        </div>
                        <div className="chips-prioridade" role="group" aria-label="Prioridade da nova tarefa">
                            {(["BAIXA", "MEDIA", "ALTA"] as const).map((valor) => (
                                <button
                                    className={`chip-prioridade prioridade-${valor.toLocaleLowerCase("pt-BR")}${prioridade === valor ? " selecionado" : ""}`}
                                    key={valor}
                                    type="button"
                                    aria-pressed={prioridade === valor}
                                    onClick={() => {
                                        setPrioridade(valor);
                                        setErrosCampos((atuais) => ({ ...atuais, prioridade: "" }));
                                    }}
                                >
                                    {rotuloPrioridade(valor)}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
            {(erro || errosCampos.titulo) && (
                <p className="erro-campo" id="erro-nova-tarefa" role="alert">{errosCampos.titulo || erro}</p>
            )}
            {errosCampos.descricao && <p className="erro-campo" id="erro-descricao-nova-tarefa" role="alert">{errosCampos.descricao}</p>}
            {errosCampos.prioridade && (
                <p className="erro-campo" id="erro-prioridade-nova-tarefa" role="alert">{errosCampos.prioridade}</p>
            )}
            {errosCampos.dataEntrega && (
                <p className="erro-campo" id="erro-data-nova-tarefa" role="alert">{errosCampos.dataEntrega}</p>
            )}
        </form>
    );
}

function mensagemDeValidacao(falha: unknown): string {
    return falha instanceof Error ? falha.message : "Não foi possível criar a tarefa.";
}

function rotuloPrioridade(prioridade: Prioridade): string {
    return prioridade === "MEDIA" ? "Média" : prioridade === "BAIXA" ? "Baixa" : "Alta";
}
