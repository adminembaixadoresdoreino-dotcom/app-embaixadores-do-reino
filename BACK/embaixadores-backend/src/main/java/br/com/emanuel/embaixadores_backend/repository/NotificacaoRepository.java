package br.com.emanuel.embaixadores_backend.repository;

import br.com.emanuel.embaixadores_backend.entity.Notificacao;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.UUID;

public interface NotificacaoRepository extends JpaRepository<Notificacao, UUID> {
    List<Notificacao> findByUsuarioIdOrderByDataDesc(UUID usuarioId);
    long countByUsuarioIdAndLida(UUID usuarioId, boolean lida);
}
