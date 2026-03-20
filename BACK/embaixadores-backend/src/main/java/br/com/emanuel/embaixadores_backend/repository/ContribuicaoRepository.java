package br.com.emanuel.embaixadores_backend.repository;

import br.com.emanuel.embaixadores_backend.entity.Contribuicao;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.UUID;

public interface ContribuicaoRepository extends JpaRepository<Contribuicao, UUID> {
    List<Contribuicao> findByUsuarioIdOrderByDataDesc(UUID usuarioId);
}
