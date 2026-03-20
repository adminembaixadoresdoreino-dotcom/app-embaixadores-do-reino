package br.com.emanuel.embaixadores_backend.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "notificacoes")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Notificacao {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    private String titulo;

    @Column(columnDefinition = "TEXT")
    private String mensagem;

    private String tipo; // campanha, video, evento, mensagem

    private LocalDateTime data;
    private boolean lida;

    @Column(name = "usuario_id", nullable = false)
    private UUID usuarioId;

    private String campanhaId;

    @PrePersist
    public void prePersist() {
        if (data == null) data = LocalDateTime.now();
    }
}
