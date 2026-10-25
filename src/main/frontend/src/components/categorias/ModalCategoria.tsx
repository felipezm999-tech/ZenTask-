import { useEffect, useRef, useState, type FormEvent } from "react";
import type { Categoria } from "../../types/categoria";
import { salvarCategoria, excluirCategoria } from "../../api/categorias";
import { useCategorias } from "../../hooks/useCategorias";
const CORES = ["#2563EB", "#7C3AED", "#15803D", "#DC2626", "#CA8A04", "#DB2777", "#0891B2", "#EA580C", "#475569", "#4F46E5"];
export function ModalCategoria({ categoria, excluir, aoFechar, aoSalvar }: {
    categoria: Categoria | null; excluir: boolean; aoFechar: () => void; aoSalvar: (excluida?: number) => Promise<void>;
}) {
    const dialog = useRef<HTMLDialogElement>(null);
    const [nome, setNome] = useState(categoria?.nome ?? "");
    const [cor, setCor] = useState(categoria?.cor ?? CORES[0]);
    const [erro, setErro] = useState("");
    const [salvando, setSalvando] = useState(false);
    const { categorias, recarregarCategorias } = useCategorias();
    useEffect(() => {
        const anterior = document.activeElement as HTMLElement | null;
        dialog.current?.showModal();
        return () => { anterior?.focus(); };
    }, []);
    async function enviar(e: FormEvent) {
        e.preventDefault();
        if (salvando) return;
        setSalvando(true); setErro("");
        try {
            if (excluir && categoria) await excluirCategoria(categoria.id);
            else {
                if (!nome.trim()) throw new Error("Informe o nome da categoria.");
                if (nome !== nome.trim()) throw new Error("O nome não pode ter espaços no início ou no fim.");
                if (nome.length > 30) throw new Error("O nome deve ter até 30 caracteres.");
                if (nome.toLowerCase() === "sem categoria") throw new Error("“Sem categoria” é uma opção fixa.");
                if (categorias.some(c => c.id !== categoria?.id && c.nome.toLowerCase() === nome.toLowerCase())) {
                    throw new Error("Já existe uma categoria com esse nome.");
                }
                await salvarCategoria({ nome, cor, icone: "" }, categoria?.id);
            }
            await recarregarCategorias();
            await aoSalvar(excluir ? categoria?.id : undefined);
            aoFechar();
        } catch (e) { setErro(e instanceof Error ? e.message : "Não foi possível salvar."); }
        finally { setSalvando(false); }
    }
    return <dialog ref={dialog} className="modal-categoria" aria-labelledby="titulo-modal-categoria" onCancel={e => { e.preventDefault(); if (!salvando) aoFechar(); }}>
        <form onSubmit={e => void enviar(e)}>
            <h2 id="titulo-modal-categoria">{excluir ? "Excluir categoria" : categoria ? "Editar categoria" : "Nova categoria"}</h2>
            {excluir ? <p>Excluir “{categoria?.nome}”? {categoria?.quantidadeTarefas ?? 0} tarefa(s) ficarão sem categoria. Nenhuma tarefa será apagada.</p> : <>
                <label>Nome<input autoFocus required maxLength={30} value={nome} onChange={e => setNome(e.target.value)} /></label>
                <fieldset className="paleta-categoria"><legend>Cor</legend>{CORES.map(c => <button key={c} type="button" className="cor-paleta" style={{ backgroundColor: c }} aria-label={`Cor ${c}`} aria-pressed={cor === c} onClick={() => setCor(c)}>{cor === c ? "✓" : ""}</button>)}</fieldset>
            </>}
            {erro && <p className="erro-categoria" role="alert">{erro}</p>}
            <div className="acoes-modal"><button type="button" className="botao-texto" disabled={salvando} onClick={aoFechar}>Cancelar</button><button className="botao-texto" type="submit" disabled={salvando}>{salvando ? "Salvando…" : excluir ? "Excluir categoria" : "Salvar categoria"}</button></div>
        </form>
    </dialog>;
}
