export function dataLocalDeIso(valor: string): Date {
    const [ano, mes, dia] = valor.split("-").map(Number);
    return criarDataLocal(ano, mes - 1, dia);
}

export function criarDataLocal(ano: number, mes: number, dia: number): Date {
    const data = new Date(0);
    data.setFullYear(ano, mes, dia);
    data.setHours(0, 0, 0, 0);
    return data;
}

export function isoDeDataLocal(data: Date): string {
    return [
        String(data.getFullYear()).padStart(4, "0"),
        String(data.getMonth() + 1).padStart(2, "0"),
        String(data.getDate()).padStart(2, "0")
    ].join("-");
}

export function hojeLocal(): Date {
    const agora = new Date();
    return criarDataLocal(agora.getFullYear(), agora.getMonth(), agora.getDate());
}

export function adicionarDias(data: Date, quantidade: number): Date {
    const resultado = criarDataLocal(data.getFullYear(), data.getMonth(), data.getDate());
    resultado.setDate(resultado.getDate() + quantidade);
    return resultado;
}

export function diasDoMes(mes: Date): Date[] {
    const primeiro = criarDataLocal(mes.getFullYear(), mes.getMonth(), 1);
    const inicio = new Date(primeiro);
    inicio.setDate(1 - primeiro.getDay());

    return Array.from({ length: 42 }, (_, indice) => {
        const dia = new Date(inicio);
        dia.setDate(inicio.getDate() + indice);
        return dia;
    });
}

export function mesmaData(primeira: Date, segunda: Date): boolean {
    return primeira.getFullYear() === segunda.getFullYear()
        && primeira.getMonth() === segunda.getMonth()
        && primeira.getDate() === segunda.getDate();
}

export function rotuloDataEntrega(valor: string | null, concluida: boolean) {
    if (!valor) return null;
    const hoje = hojeLocal();
    const data = dataLocalDeIso(valor);
    const amanha = adicionarDias(hoje, 1);
    const vencida = !concluida && valor < isoDeDataLocal(hoje);

    if (mesmaData(data, hoje)) return { texto: "hoje", vencida };
    if (mesmaData(data, amanha)) return { texto: "amanhã", vencida };
    const texto = data.toLocaleDateString("pt-BR", { day: "numeric", month: "short" });
    return { texto: texto.replace(" de ", " "), vencida };
}
