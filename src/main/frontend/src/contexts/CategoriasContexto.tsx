import { createContext, useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import type { Categoria } from "../types/categoria";
import { listarCategorias } from "../api/categorias";

type EstadoCategorias = {
    categorias: Categoria[];
    erroCategorias: string;
    recarregarCategorias: () => Promise<void>;
};

export const ContextoCategorias = createContext<EstadoCategorias | null>(null);

export function CategoriasProvider({ children }: { children: ReactNode }) {
    const [categorias, setCategorias] = useState<Categoria[]>([]);
    const [erroCategorias, setErro] = useState("");
    const requisicaoAtual = useRef(0);

    const recarregarCategorias = useCallback(async () => {
        const requisicao = ++requisicaoAtual.current;
        try {
            const resposta = await listarCategorias();
            if (requisicao !== requisicaoAtual.current) return;
            setCategorias(resposta);
            setErro("");
        } catch (erro) {
            if (requisicao !== requisicaoAtual.current) return;
            setErro(erro instanceof Error ? erro.message : "Não foi possível carregar as categorias.");
        }
    }, []);

    useEffect(() => {
        void recarregarCategorias();
        return () => { requisicaoAtual.current++; };
    }, [recarregarCategorias]);

    return (
        <ContextoCategorias.Provider value={{ categorias, erroCategorias, recarregarCategorias }}>
            {children}
        </ContextoCategorias.Provider>
    );
}
