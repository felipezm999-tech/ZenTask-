import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import "./styles/base.css";
import "./styles/app.css";

const elementoRaiz = document.getElementById("root");
if (!elementoRaiz) {
    throw new Error("Não foi possível encontrar o elemento raiz da aplicação.");
}

createRoot(elementoRaiz).render(
    <StrictMode>
        <App />
    </StrictMode>
);
