import { useState } from "react";
import type { FormEvent, KeyboardEvent, RefObject } from "react";
import { mensagemErroDoCampo } from "../api/tarefas";
import type { DadosTarefa, Prioridade } from "../types/tarefa";
import { dataLocalDeIso, isoDeDataLocal } from "../utils/datas";

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
    const [erro, setErro] = useState("");
    const [errosCampos, setErrosCampos] = useState<Record<string, string>>({});
    const [salvando, setSalvando] = useState(false);
    const campoTitulo = referenciaTitulo;

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
            evento.currentTarget.blur();
        }
    }

    return (
        <form className="nova-tarefa" onSubmit={enviar}>
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
                onKeyDown={tratarTecla}
                placeholder="Nova tarefa"
                maxLength={120}
                aria-invalid={Boolean(erro || errosCampos.titulo)}
                aria-describedby={erro || errosCampos.titulo ? "erro-nova-tarefa" : undefined}
            />
            <label className="rotulo-oculto" htmlFor="nova-tarefa-prioridade">Prioridade da nova tarefa</label>
            <select
                id="nova-tarefa-prioridade"
                className="seletor-prioridade"
                value={prioridade}
                onChange={(evento) => {
                    if (ehPrioridade(evento.target.value)) setPrioridade(evento.target.value);
                    setErrosCampos((atuais) => ({ ...atuais, prioridade: "" }));
                }}
                aria-label="Prioridade da nova tarefa"
                aria-invalid={Boolean(errosCampos.prioridade)}
                aria-describedby={errosCampos.prioridade ? "erro-prioridade-nova-tarefa" : undefined}
            >
                <option value="BAIXA">Baixa</option>
                <option value="MEDIA">Média</option>
                <option value="ALTA">Alta</option>
            </select>
            <label className="rotulo-oculto" htmlFor="nova-tarefa-data">Data de entrega</label>
            <input
                id="nova-tarefa-data"
                className="campo-data-nova"
                type="date"
                value={dataEntrega}
                onChange={(evento) => {
                    setDataEntrega(evento.target.value);
                    setErrosCampos((atuais) => ({ ...atuais, dataEntrega: "" }));
                }}
                aria-label="Data de entrega opcional"
                aria-invalid={Boolean(errosCampos.dataEntrega)}
                aria-describedby={errosCampos.dataEntrega ? "erro-data-nova-tarefa" : undefined}
            />
            <button
                className="botao-adicionar"
                type="submit"
                disabled={salvando}
                aria-label="Criar tarefa"
            >
                Adicionar
            </button>
            <label className="rotulo-oculto" htmlFor="nova-tarefa-descricao">Descrição da tarefa</label>
            <textarea
                id="nova-tarefa-descricao"
                className="campo-descricao-nova"
                value={descricao}
                onChange={(evento) => {
                    setDescricao(evento.target.value);
                    setErrosCampos((atuais) => ({ ...atuais, descricao: "" }));
                }}
                placeholder="Descrição"
                rows={3}
                maxLength={500}
                aria-invalid={Boolean(errosCampos.descricao)}
                aria-describedby={errosCampos.descricao ? "erro-descricao-nova-tarefa" : undefined}
            />
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

function ehPrioridade(valor: string): valor is Prioridade {
    return valor === "BAIXA" || valor === "MEDIA" || valor === "ALTA";
}
