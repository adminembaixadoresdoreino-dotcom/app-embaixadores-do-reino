package br.com.emanuel.embaixadores_backend.repository;

import br.com.emanuel.embaixadores_backend.entity.Progresso;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.UUID;

public interface ProgressoRepository extends JpaRepository<Progresso, UUID> {
    List<Progresso> findByUsuarioId(UUID usuarioId);
    boolean existsByUsuarioIdAndModuloIdAndAulaId(UUID usuarioId, String moduloId, String aulaId);
}
