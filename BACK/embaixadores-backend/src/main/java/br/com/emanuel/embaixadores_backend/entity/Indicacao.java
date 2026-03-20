package br.com.emanuel.embaixadores_backend.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "indicacoes")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Indicacao {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "indicador_id", nullable = false)
    private UUID indicadorId;

    private String nomeIndicado;
    private String emailIndicado;
    private LocalDateTime dataIndicacao;

    @PrePersist
    public void prePersist() {
        if (dataIndicacao == null) dataIndicacao = LocalDateTime.now();
    }
}
