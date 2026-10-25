package gerenciador_tarefas.api.service;

import gerenciador_tarefas.api.dto.CategoriaRequest;
import gerenciador_tarefas.api.dto.CategoriaResponse;
import gerenciador_tarefas.api.exception.ApiException;
import gerenciador_tarefas.api.model.Categoria;
import gerenciador_tarefas.api.repository.CategoriaRepository;
import gerenciador_tarefas.api.repository.TarefaRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class CategoriaService {
    private final CategoriaRepository categorias;
    private final TarefaRepository tarefas;

    public CategoriaService(CategoriaRepository categorias, TarefaRepository tarefas) {
        this.categorias = categorias;
        this.tarefas = tarefas;
    }

    @Transactional(readOnly = true)
    public Categoria buscar(Long id) {
        return categorias.findById(id).orElseThrow(() ->
                new ApiException(HttpStatus.NOT_FOUND, "Categoria não encontrada."));
    }

    @Transactional(readOnly = true)
    public List<CategoriaResponse> listar() {
        return categorias.listarComContagem();
    }

    public CategoriaResponse criar(CategoriaRequest dados) {
        return salvar(new Categoria(), dados);
    }

    public CategoriaResponse atualizar(Long id, CategoriaRequest dados) {
        Categoria categoria = buscar(id);
        if (nomeReservado(categoria.getNome())) {
            throw new ApiException(HttpStatus.CONFLICT, "“Sem categoria” é uma opção fixa e não pode ser editada.");
        }
        return salvar(categoria, dados);
    }

    private CategoriaResponse salvar(Categoria categoria, CategoriaRequest dados) {
        if (dados == null) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Informe os dados da categoria.");
        }
        String nome = dados.nome();
        if (nome == null || nome.isBlank()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "O nome da categoria é obrigatório.");
        }
        if (!nome.equals(nome.strip())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "O nome não pode ter espaços no início ou no fim.");
        }
        if (nome.length() > 30) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "O nome da categoria deve ter até 30 caracteres.");
        }
        if (nomeReservado(nome)) {
            throw new ApiException(HttpStatus.CONFLICT, "“Sem categoria” é uma opção fixa e não pode ser cadastrada.");
        }
        if (dados.cor() == null || !dados.cor().matches("#[0-9a-fA-F]{6}")) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "A cor deve ser hexadecimal no formato #RRGGBB.");
        }
        if (dados.icone() != null && dados.icone().length() > 16) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "O ícone deve ter até 16 caracteres.");
        }
        Long idAtual = categoria.getId() == null ? -1L : categoria.getId();
        if (categorias.existsByNomeIgnoreCaseAndIdNot(nome, idAtual)) {
            throw new ApiException(HttpStatus.CONFLICT, "Já existe uma categoria com esse nome.");
        }
        categoria.setNome(nome);
        categoria.setCor(dados.cor());
        categoria.setIcone("");
        return resposta(categorias.saveAndFlush(categoria));
    }

    public void excluir(Long id) {
        Categoria categoria = buscar(id);
        if (nomeReservado(categoria.getNome())) {
            throw new ApiException(HttpStatus.CONFLICT, "“Sem categoria” é uma opção fixa e não pode ser excluída.");
        }
        tarefas.desvincularCategoria(id);
        categorias.deleteById(id);
    }

    private CategoriaResponse resposta(Categoria categoria) {
        return new CategoriaResponse(categoria.getId(), categoria.getNome(), categoria.getCor(),
                categoria.getIcone(), tarefas.countByCategoriaId(categoria.getId()));
    }

    private boolean nomeReservado(String nome) {
        return nome != null && nome.equalsIgnoreCase("Sem categoria");
    }
}
