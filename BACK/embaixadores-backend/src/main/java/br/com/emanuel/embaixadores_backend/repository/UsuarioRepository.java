package br.com.emanuel.embaixadores_backend.repository;

import br.com.emanuel.embaixadores_backend.entity.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.util.Optional;
import java.util.UUID;

public interface UsuarioRepository extends JpaRepository<Usuario, UUID> {
    Optional<Usuario> findByEmail(String email);
    Optional<Usuario> findByCpf(String cpf);
    Optional<Usuario> findByCodigoIndicacao(String codigoIndicacao);
    boolean existsByEmail(String email);
    boolean existsByCpf(String cpf);

    @Query("SELECT COALESCE(MAX(u.numeroInscricao), 0) FROM Usuario u")
    Long findMaxNumeroInscricao();

    long countByEmbaixadorConfirmado(boolean confirmado);
    long countByContribuiuPix(boolean contribuiu);

    @Query("SELECT COALESCE(SUM(u.valorContribuicao), 0) FROM Usuario u WHERE u.contribuiuPix = true")
    Double somarValorContribuicoes();
}
