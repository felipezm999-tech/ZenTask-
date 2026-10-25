import { useContext } from "react";
import { ContextoCategorias } from "../contexts/CategoriasContexto";

export { CategoriasProvider } from "../contexts/CategoriasContexto";

export function useCategorias() {
    const valor = useContext(ContextoCategorias);
    if (!valor) throw new Error("Contexto de categorias indisponível.");
    return valor;
}
