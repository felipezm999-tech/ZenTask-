import type { CSSProperties } from "react";
import type { FiltroTarefas } from "../types/filtros";

type BarraLateralProps = {
    filtroAtivo: FiltroTarefas;
    quantidades: Partial<Record<FiltroTarefas, number>>;
    aoSelecionarFiltro: (filtro: FiltroTarefas) => void;
    menuAberto: boolean;
    aoFecharMenu: () => void;
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
    quantidades,
    aoSelecionarFiltro,
    menuAberto,
    aoFecharMenu
}: BarraLateralProps) {
    const indiceFiltroAtivo = filtros.findIndex((filtro) => filtro.id === filtroAtivo);

    return (
        <aside className={`barra-lateral liquid-glass${menuAberto ? " menu-aberto" : ""}`} aria-label="Navegação principal">
            <a className="marca" href="/" aria-label="ZenTask, início">ZenTask</a>
            <div className="cabecalho-barra-lateral">
                <p className="rotulo-navegacao">LISTAS</p>
                <button className="botao-fechar-menu" type="button" onClick={aoFecharMenu} aria-label="Fechar menu">×</button>
            </div>
            <nav className="navegacao-filtros" aria-label="Filtros de tarefas">
                <span
                    className="indicador-filtro liquid-glass"
                    aria-hidden="true"
                    style={{ "--indice-filtro": indiceFiltroAtivo } as CSSProperties}
                />
                {filtros.map((filtro) => (
                    <button
                        className={`filtro-link${filtroAtivo === filtro.id ? " ativo" : ""}`}
                        key={filtro.id}
                        type="button"
                        aria-current={filtroAtivo === filtro.id ? "page" : undefined}
                        onClick={() => {
                            aoSelecionarFiltro(filtro.id);
                            aoFecharMenu();
                        }}
                    >
                        <span className="filtro-identidade">
                            <span className="icone-filtro"><IconeFiltro filtro={filtro.id} /></span>
                            <span>{filtro.titulo}</span>
                        </span>
                        {filtro.contagem !== false && (
                            <span className={`filtro-contagem${filtro.id === "atrasadas" && (quantidades.atrasadas ?? 0) > 0 ? " contagem-atrasada" : ""}`}>
                                {quantidades[filtro.id] ?? 0}
                            </span>
                        )}
                    </button>
                ))}
            </nav>
        </aside>
    );
}

function IconeFiltro({ filtro }: { filtro: FiltroTarefas }) {
    return (
        <svg aria-hidden="true" viewBox="0 0 20 20" fill="none">
            {filtro === "todas" && <><rect x="3" y="3" width="5" height="5" rx="1" /><rect x="12" y="3" width="5" height="5" rx="1" /><rect x="3" y="12" width="5" height="5" rx="1" /><rect x="12" y="12" width="5" height="5" rx="1" /></>}
            {filtro === "pendentes" && <><circle cx="10" cy="10" r="7" /><path d="M10 6v4l2.5 1.5" /></>}
            {filtro === "concluidas" && <><circle cx="10" cy="10" r="7" /><path d="m6.5 10 2.2 2.2 4.8-5" /></>}
            {filtro === "hoje" && <><rect x="3" y="4.5" width="14" height="12" rx="2" /><path d="M6.5 2.5v4m7-4v4M3 8h14" /></>}
            {filtro === "proximos-dias" && <><rect x="3" y="4.5" width="14" height="12" rx="2" /><path d="M6.5 2.5v4m7-4v4M3 8h14m3 4 2 2-2 2" /></>}
            {filtro === "atrasadas" && <><circle cx="10" cy="10" r="7" /><path d="M10 6v4m0 3.5v.1" /></>}
            {filtro === "calendario" && <><rect x="3" y="4.5" width="14" height="12" rx="2" /><path d="M6.5 2.5v4m7-4v4M3 8h14M7 11h2m2 0h2m-6 3h2" /></>}
        </svg>
    );
}
