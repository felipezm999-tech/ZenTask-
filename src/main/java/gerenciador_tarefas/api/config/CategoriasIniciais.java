package gerenciador_tarefas.api.config;

import gerenciador_tarefas.api.dto.CategoriaRequest;
import gerenciador_tarefas.api.repository.CategoriaRepository;
import gerenciador_tarefas.api.service.CategoriaService;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Component
public class CategoriasIniciais implements CommandLineRunner {
    private final CategoriaRepository repository;
    private final CategoriaService service;
    private static final List<String> NOMES_ANTIGOS =
            List.of("Trabalho", "Faculdade", "Pessoal", "Saúde", "Finanças");
    private static final List<String> NOMES_ATUAIS =
            List.of("Trabalho", "Faculdade", "Pessoal", "Saúde", "Financeiro");
    private static final List<String> CORES_PADRAO =
            List.of("#2563EB", "#7C3AED", "#15803D", "#DC2626", "#CA8A04");

    public CategoriasIniciais(CategoriaRepository repository, CategoriaService service) {
        this.repository = repository;
        this.service = service;
    }

    @Override
    @Transactional
    public void run(String... args) {
        if (repository.count() == 0) {
            service.criar(new CategoriaRequest("Trabalho", "#2563EB", ""));
            service.criar(new CategoriaRequest("Faculdade", "#7C3AED", ""));
            service.criar(new CategoriaRequest("Pessoal", "#15803D", ""));
            service.criar(new CategoriaRequest("Saúde", "#DC2626", ""));
            service.criar(new CategoriaRequest("Financeiro", "#CA8A04", ""));
            return;
        }
        corrigirSeedLegado();
    }

    private void corrigirSeedLegado() {
        var existentes = repository.findAll();
        if (existentes.size() != NOMES_ANTIGOS.size()) return;
        existentes.sort(java.util.Comparator.comparing(gerenciador_tarefas.api.model.Categoria::getId));
        for (int indice = 0; indice < existentes.size(); indice++) {
            var categoria = existentes.get(indice);
            if (categoria.getId() != indice + 1L
                    || !(NOMES_ANTIGOS.get(indice).equals(categoria.getNome())
                    || NOMES_ATUAIS.get(indice).equals(categoria.getNome()))
                    || !CORES_PADRAO.get(indice).equalsIgnoreCase(categoria.getCor())) {
                return;
            }
        }

        for (int indice = 0; indice < existentes.size(); indice++) {
            var categoria = existentes.get(indice);
            if (NOMES_ANTIGOS.get(indice).equals(categoria.getNome())) {
                categoria.setNome(NOMES_ATUAIS.get(indice));
            }
        }
        repository.saveAllAndFlush(existentes);
    }
}
