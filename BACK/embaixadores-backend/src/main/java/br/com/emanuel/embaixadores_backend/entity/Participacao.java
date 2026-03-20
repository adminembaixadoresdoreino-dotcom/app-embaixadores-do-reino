package br.com.emanuel.embaixadores_backend.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "participacoes")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Participacao {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "campanha_id", nullable = false)
    private UUID campanhaId;

    @Column(name = "usuario_id", nullable = false)
    private String usuarioId;

    private int quantidade;

    @Column(columnDefinition = "TEXT")
    private String descricao;

    private LocalDateTime dataRegistro;

    @PrePersist
    public void prePersist() {
        if (dataRegistro == null) dataRegistro = LocalDateTime.now();
    }
}
