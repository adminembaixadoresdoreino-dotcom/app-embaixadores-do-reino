package br.com.emanuel.embaixadores_backend.repository;

import br.com.emanuel.embaixadores_backend.entity.Campanha;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.UUID;

public interface CampanhaRepository extends JpaRepository<Campanha, UUID> {
}
