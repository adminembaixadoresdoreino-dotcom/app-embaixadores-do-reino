package br.com.emanuel.embaixadores_backend.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "contribuicoes")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Contribuicao {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "usuario_id", nullable = false)
    private UUID usuarioId;

    private double valor;
    private String forma;
    private LocalDateTime data;

    @PrePersist
    public void prePersist() {
        if (data == null) data = LocalDateTime.now();
    }
}
