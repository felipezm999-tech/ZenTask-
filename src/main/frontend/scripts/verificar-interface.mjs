import assert from 'node:assert/strict';
import { readFile, mkdir, rm } from 'node:fs/promises';
import { build } from 'esbuild';
import { fileURLToPath } from 'node:url';
import postcss from 'postcss';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

const categorias = [
    { id: 1, nome: 'Trabalho', cor: '#2563EB', icone: '💼', quantidadeTarefas: 1 },
    { id: 2, nome: 'Faculdade', cor: '#7C3AED', icone: '🎓', quantidadeTarefas: 0 }
];
const tarefas = [
    { id: 1, titulo: 'Preparar apresentação', descricao: 'Revisar slides', prioridade: 'ALTA', concluido: false, dataEntrega: '2026-10-25', categoriaId: 1 },
    { id: 2, titulo: 'Comprar pão', descricao: null, prioridade: 'MEDIA', concluido: true, dataEntrega: null, categoriaId: null }
];
const arquivo = new URL('../node_modules/.tmp/verificar-interface.mjs', import.meta.url);
await mkdir(new URL('../node_modules/.tmp/', import.meta.url), { recursive: true });
try {
    await build({
        stdin: { contents: `
            export { BarraLateral } from './src/components/layout/BarraLateral';
            export { ListaTarefas } from './src/components/tarefas/ListaTarefas';
            export { ItemTarefa } from './src/components/tarefas/ItemTarefa';
            export { CalendarioTarefas } from './src/components/calendario/CalendarioTarefas';
            export { filtrarTarefas, filtrarPorCategoria, contarTarefas } from './src/utils/filtrosTarefas';
        `, resolveDir: process.cwd(), loader: 'tsx' },
        define: { 'import.meta.env.VITE_API_URL': '""' },
        bundle: true, platform: 'node', format: 'esm', jsx: 'automatic',
        external: ['react', 'react/jsx-runtime'], outfile: fileURLToPath(arquivo),
        plugins: [{ name: 'categorias-de-teste', setup(builder) {
            builder.onLoad({ filter: /useCategorias\.tsx$/ }, () => ({
                contents: `export function useCategorias() { return { categorias: ${JSON.stringify(categorias)} }; }`, loader: 'js'
            }));
        } }]
    });
    const ui = await import(arquivo.href);
    const renderizar = (componente, props) => renderToStaticMarkup(createElement(componente, props));
    const base = { tarefas, carregando: false, erro: null, recarregar() {}, criar() {}, aoSelecionarTodas() {}, atualizar() {}, concluir() {}, excluir() {}, refNovaTarefa: { current: null } };
    const todas = renderizar(ui.ListaTarefas, { ...base, filtro: 'todas' });
    assert.match(todas, /nova-tarefa-titulo/);
    assert.match(todas, /Categoria da tarefa/);
    assert.match(todas, /Sem categoria/);
    for (const filtro of ['pendentes', 'concluidas', 'hoje', 'proximos-dias', 'atrasadas']) {
        assert.doesNotMatch(renderizar(ui.ListaTarefas, { ...base, filtro }), /nova-tarefa-titulo/);
    }
    const categoria = renderizar(ui.ListaTarefas, { ...base, filtro: 'todas', permitirCriacao: false });
    assert.doesNotMatch(categoria, /nova-tarefa-titulo/);
    assert.match(categoria, /Comprar pão/); // completed tasks remain available in category views
    assert.match(renderizar(ui.ListaTarefas, { ...base, tarefas: [], filtro: 'todas', permitirCriacao: false, mensagemCategoria: 'Nenhuma tarefa em Faculdade ainda.' }), /Nenhuma tarefa em Faculdade ainda/);
    const barra = renderizar(ui.BarraLateral, { categorias, categoriaAtiva: 1, listaCategoria: true, semCategoria: 1, filtroAtivo: 'todas', quantidades: { todas: 2 }, aoSelecionarFiltro() {}, aoSelecionarCategoria() {}, aoGerenciarCategoria() {}, menuAberto: false, aoFecharMenu() {} });
    assert.equal((barra.match(/aria-current="page"/g) ?? []).length, 1);
    assert.match(barra, /CATEGORIAS/);
    assert.match(barra, /Editar categoria Trabalho/);
    const card = renderizar(ui.ItemTarefa, { tarefa: tarefas[0], aoConcluir() {}, aoAtualizar() {}, aoExcluir() {}, editando: false, aoAbrirEdicao() {}, aoFecharEdicao() {} });
    assert.match(card, /selo-categoria/);
    assert.match(card, /Trabalho/);
    assert.match(card, /#2563EB/);
    const edicao = renderizar(ui.ItemTarefa, { tarefa: tarefas[0], editando: true });
    assert.match(edicao, /Categoria da tarefa/);
    const calendario = renderizar(ui.CalendarioTarefas, { ...base, tarefas: [{ ...tarefas[0], dataEntrega: new Date().toLocaleDateString('en-CA') }] });
    assert.doesNotMatch(calendario, /nova-tarefa-titulo/);
    assert.match(calendario, /#2563EB/);
    assert.equal((calendario.match(/role="row"/g) ?? []).length, 7);
    assert.equal((calendario.match(/role="gridcell"/g) ?? []).length, 42);
    assert.deepEqual(ui.filtrarTarefas(tarefas, 'pendentes').map(t => t.id), [1]);
    assert.equal(ui.contarTarefas(tarefas).todas, 2);
    assert.deepEqual(ui.filtrarTarefas(ui.filtrarPorCategoria(tarefas, 1), 'pendentes').map(t => t.id), [1]);
    assert.deepEqual(ui.filtrarTarefas(ui.filtrarPorCategoria(tarefas, 'sem'), 'concluidas').map(t => t.id), [2]);
    assert.equal(ui.filtrarTarefas(ui.filtrarPorCategoria(tarefas, 2), 'pendentes').length, 0);
    assert.equal(ui.filtrarPorCategoria(tarefas, 'todas').length, 2);
    console.log('Renderização: formulário restrito a Todas, categorias, edição, selos, calendário e estados vazios OK.');
} finally { await rm(arquivo, { force: true }); }

// Check the actual theme tokens against solid surfaces, active tabs and priority chips.
const css = postcss.parse(await readFile(new URL('../src/styles/tokens.css', import.meta.url), 'utf8'));
const temas = [];
css.walkRules(rule => {
    const vars = {};
    rule.walkDecls(d => { vars[d.prop] = d.value; });
    temas.push(vars);
});
function rgb(hex) {
    return hex.match(/[a-f0-9]{2}/gi).map(c => parseInt(c, 16) / 255).map(c => c <= .04045 ? c / 12.92 : ((c + .055) / 1.055) ** 2.4);
}
function luminancia(hex) { const [r, g, b] = rgb(hex); return .2126*r + .7152*g + .0722*b; }
function contraste(a, b) { const x = luminancia(a), y = luminancia(b); return (Math.max(x,y)+.05)/(Math.min(x,y)+.05); }
let minimo = Infinity;
for (const tema of temas) {
    const pares = [];
    for (const texto of ['--cor-texto-principal','--texto-secundario','--texto-terciario','--cor-acento','--cor-prazo-vencido']) {
        for (const fundo of ['--cor-fundo-principal','--superficie','--superficie-elevada']) pares.push([texto, fundo]);
    }
    pares.push(['--cor-acento', '--cor-fundo-dia-selecionado'], ['--cor-texto-dia-hoje', '--cor-fundo-dia-hoje']);
    for (const p of ['baixa','media','alta']) pares.push([`--cor-prioridade-${p}-texto`, `--cor-prioridade-${p}-fundo`]);
    for (const [a,b] of pares) {
        const valor = contraste(tema[a], tema[b]);
        assert.ok(valor >= 4.5, `${a} / ${b}: ${valor.toFixed(2)}:1`);
        minimo = Math.min(minimo, valor);
    }
}
console.log(`Contraste dos textos nos dois temas: mínimo ${minimo.toFixed(2)}:1.`);
for (const nome of ['app.css', 'base.css', 'interface.css', 'calendario.css', 'ajustes.css', 'categorias.css']) postcss.parse(await readFile(new URL(`../src/styles/${nome}`, import.meta.url), 'utf8'));
console.log('Sintaxe CSS OK. A validação visual em navegador deve cobrir 360–1920px.');
