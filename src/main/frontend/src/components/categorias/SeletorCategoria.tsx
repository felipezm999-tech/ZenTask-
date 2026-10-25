import { useCategorias } from "../../hooks/useCategorias";
export function SeletorCategoria({ valor, aoAlterar, desabilitado = false }: { valor: number | null; aoAlterar: (id: number | null) => void; desabilitado?: boolean }) {
    const { categorias } = useCategorias();
    return <label className="seletor-categoria">Categoria
        <select aria-label="Categoria da tarefa" disabled={desabilitado} value={valor ?? ""} onChange={e => aoAlterar(e.target.value ? Number(e.target.value) : null)}>
            <option value="">Sem categoria</option>
            {categorias.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
        </select>
        <span className="ponto-categoria" aria-hidden="true" style={{ backgroundColor: categorias.find(c => c.id === valor)?.cor ?? "#808080" }} />
    </label>;
}
