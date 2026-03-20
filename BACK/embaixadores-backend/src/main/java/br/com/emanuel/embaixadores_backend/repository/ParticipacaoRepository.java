package br.com.emanuel.embaixadores_backend.repository;

import br.com.emanuel.embaixadores_backend.entity.Participacao;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
import java.util.UUID;

public interface ParticipacaoRepository extends JpaRepository<Participacao, UUID> {
    List<Participacao> findByCampanhaId(UUID campanhaId);
    List<Participacao> findByCampanhaIdAndUsuarioId(UUID campanhaId, String usuarioId);

    @Query("SELECT p.usuarioId, SUM(p.quantidade) FROM Participacao p WHERE p.campanhaId = :campanhaId GROUP BY p.usuarioId ORDER BY SUM(p.quantidade) DESC")
    List<Object[]> rankingPorCampanha(@Param("campanhaId") UUID campanhaId);
}
