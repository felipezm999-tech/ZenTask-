import assert from 'node:assert/strict';
import { test } from 'node:test';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { build } from 'esbuild';

const pasta = await mkdtemp(join(tmpdir(), 'zentask-api-'));
const fetchOriginal = globalThis.fetch;
try {
    const arquivo = join(pasta, 'api.mjs');
    await build({
        stdin: {
            contents: `
                export * from './src/api/cliente';
                export * from './src/api/categorias';
                export * from './src/api/tarefas';
                export * from './src/utils/datas';
                export { ErroApi } from './src/types/respostasApi';
            `,
            resolveDir: process.cwd(), loader: 'ts'
        },
        define: { 'import.meta.env.VITE_API_URL': '"https://api.example.test///"' },
        bundle: true, platform: 'node', format: 'esm', outfile: arquivo
    });
    const api = await import(pathToFileURL(arquivo).href);
    const categoria = { id: 1, nome: 'Estudos', cor: '#2563EB', icone: '📚', quantidadeTarefas: 0 };
    const responder = (corpo, status = 200) => {
        globalThis.fetch = async () => new Response(JSON.stringify(corpo), {
            status, headers: { 'Content-Type': 'application/json' }
        });
    };
    await test('normaliza URL e envia os campos da categoria sem perder o ícone', async () => {
        globalThis.fetch = async (url, opcoes) => {
            assert.equal(url, 'https://api.example.test/categorias/1');
            assert.equal(opcoes.method, 'PUT');
            assert.equal(JSON.parse(opcoes.body).icone, '📚');
            return new Response(JSON.stringify(categoria));
        };
        assert.deepEqual(await api.salvarCategoria({ nome: 'Estudos', cor: '#2563EB', icone: '📚' }, 1), categoria);
    });
    await test('valida as categorias antes de repassar ao React', async () => {
        responder([categoria]);
        assert.deepEqual(await api.listarCategorias(), [categoria]);
        for (const invalido of [null, {}, '<html>', [{ ...categoria, cor: 'red' }],
            [{ ...categoria, quantidadeTarefas: -1 }], [{ ...categoria, id: '1' }]]) {
            responder(invalido);
            await assert.rejects(api.listarCategorias(), /formato inesperado/);
        }
        responder({ ...categoria, icone: null });
        await assert.rejects(api.salvarCategoria(categoria), /formato inesperado/);
    });
    await test('preserva mensagem, status e campos de erro da API', async () => {
        responder({ message: 'Já existe uma categoria.', errors: { nome: 'Nome repetido' } }, 409);
        await assert.rejects(api.listarCategorias(), erro => {
            assert.ok(erro instanceof api.ErroApi);
            assert.equal(erro.status, 409);
            assert.equal(erro.message, 'Já existe uma categoria.');
            assert.equal(api.mensagemErroDoCampo(erro, 'nome'), 'Nome repetido');
            return true;
        });
    });
    await test('aceita exclusão sem corpo e comunica falha de conexão', async () => {
        globalThis.fetch = async () => new Response(null, { status: 204 });
        assert.equal(await api.excluirCategoria(1), undefined);
        assert.equal(await api.excluirTarefa(1), undefined);
        globalThis.fetch = async () => { throw new TypeError('offline'); };
        await assert.rejects(api.listarCategorias(), /Não foi possível conectar à API/);
    });
    await test('rejeita HTML de um proxy como lista de tarefas', async () => {
        globalThis.fetch = async () => new Response('<!doctype html><html></html>');
        await assert.rejects(api.listarTarefas(), /formato inesperado/);
    });
    await test('datas locais preservam ano, virada de mês e dia bissexto', () => {
        for (const valor of ['0001-01-01', '0099-12-31', '2028-02-29', '2026-10-25']) {
            assert.equal(api.isoDeDataLocal(api.dataLocalDeIso(valor)), valor);
        }
        assert.equal(api.isoDeDataLocal(api.adicionarDias(api.dataLocalDeIso('2028-02-28'), 1)), '2028-02-29');
        assert.equal(api.isoDeDataLocal(api.adicionarDias(api.dataLocalDeIso('2026-12-31'), 1)), '2027-01-01');
        const dias = api.diasDoMes(api.dataLocalDeIso('2026-11-01'));
        assert.equal(dias.length, 42);
        assert.equal(dias[0].getDay(), 0);
        assert.equal(dias[41].getDay(), 6);
    });
} finally {
    globalThis.fetch = fetchOriginal;
    await rm(pasta, { recursive: true, force: true });
}
