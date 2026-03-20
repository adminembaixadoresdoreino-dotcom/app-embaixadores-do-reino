package br.com.emanuel.embaixadores_backend.repository;

import br.com.emanuel.embaixadores_backend.entity.Aula;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.UUID;

public interface AulaRepository extends JpaRepository<Aula, UUID> {
}
