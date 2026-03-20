package br.com.emanuel.embaixadores_backend.repository;

import br.com.emanuel.embaixadores_backend.entity.Modulo;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.UUID;

public interface ModuloRepository extends JpaRepository<Modulo, UUID> {
}
