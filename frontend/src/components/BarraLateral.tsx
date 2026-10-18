import type { FiltroTarefas } from "../types/filtros";

type BarraLateralProps = {
    filtroAtivo: FiltroTarefas;
    quantidadeTodas: number;
    quantidadePendentes: number;
    quantidadeConcluidas: number;
    quantidadesDatas: Pick<Record<FiltroTarefas, number>, "hoje" | "proximos-dias" | "atrasadas">;
    aoSelecionarFiltro: (filtro: FiltroTarefas) => void;
};

const filtros: { id: FiltroTarefas; titulo: string; contagem?: boolean }[] = [
    { id: "todas", titulo: "Todas" },
    { id: "pendentes", titulo: "Pendentes" },
    { id: "concluidas", titulo: "Concluídas" },
    { id: "hoje", titulo: "Hoje" },
    { id: "proximos-dias", titulo: "Próximos dias" },
    { id: "atrasadas", titulo: "Atrasadas" },
    { id: "calendario", titulo: "Calendário", contagem: false }
];

export function BarraLateral({
    filtroAtivo,
    quantidadeTodas,
    quantidadePendentes,
    quantidadeConcluidas,
    quantidadesDatas,
    aoSelecionarFiltro
}: BarraLateralProps) {
    const quantidades: Record<FiltroTarefas, number> = {
        todas: quantidadeTodas,
        pendentes: quantidadePendentes,
        concluidas: quantidadeConcluidas,
        ...quantidadesDatas,
        calendario: 0
    };

    return (
        <aside className="barra-lateral">
            <a className="marca" href="/" aria-label="ZenTask, início">ZenTask</a>
            <p className="rotulo-navegacao">LISTAS</p>
            <nav className="navegacao-filtros" aria-label="Filtros de tarefas">
                {filtros.map((filtro) => (
                    <button
                        className={`filtro-link${filtroAtivo === filtro.id ? " ativo" : ""}`}
                        key={filtro.id}
                        type="button"
                        aria-current={filtroAtivo === filtro.id ? "page" : undefined}
                        onClick={() => aoSelecionarFiltro(filtro.id)}
                    >
                        <span>{filtro.titulo}</span>
                        {filtro.contagem !== false && <span className="filtro-contagem">{quantidades[filtro.id]}</span>}
                    </button>
                ))}
            </nav>
        </aside>
    );
}
