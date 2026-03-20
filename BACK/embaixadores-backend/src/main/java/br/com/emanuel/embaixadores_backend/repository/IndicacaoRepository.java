package br.com.emanuel.embaixadores_backend.repository;

import br.com.emanuel.embaixadores_backend.entity.Indicacao;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.UUID;

public interface IndicacaoRepository extends JpaRepository<Indicacao, UUID> {
    List<Indicacao> findByIndicadorId(UUID indicadorId);
}
