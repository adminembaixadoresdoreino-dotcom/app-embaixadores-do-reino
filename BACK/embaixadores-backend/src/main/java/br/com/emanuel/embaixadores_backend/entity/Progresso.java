package br.com.emanuel.embaixadores_backend.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "progressos", uniqueConstraints = @UniqueConstraint(columnNames = {"usuario_id", "modulo_id", "aula_id"}))
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Progresso {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "usuario_id", nullable = false)
    private UUID usuarioId;

    @Column(name = "modulo_id", nullable = false)
    private String moduloId;

    @Column(name = "aula_id", nullable = false)
    private String aulaId;

    private LocalDateTime dataRegistro;

    @PrePersist
    public void prePersist() {
        if (dataRegistro == null) dataRegistro = LocalDateTime.now();
    }
}
