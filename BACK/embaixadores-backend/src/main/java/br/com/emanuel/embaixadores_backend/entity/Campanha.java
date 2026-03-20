package br.com.emanuel.embaixadores_backend.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "campanhas")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Campanha {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private String titulo;

    @Column(columnDefinition = "TEXT")
    private String descricao;

    private String tipo; // oracao, jejum, missionaria, social, novos_embaixadores
    private LocalDate dataInicio;
    private LocalDate dataFim;
    private boolean ativa;

    @Column(columnDefinition = "TEXT")
    private String objetivo;

    @Column(columnDefinition = "TEXT")
    private String instrucoes;

    private String unidadeRegistro;
    private String numeroCampanha;
    private String criadoPor;
    private LocalDateTime dataCriacao;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "campanha_participantes", joinColumns = @JoinColumn(name = "campanha_id"))
    @Column(name = "usuario_id")
    @Builder.Default
    private List<String> participantes = new ArrayList<>();

    @PrePersist
    public void prePersist() {
        if (dataCriacao == null) dataCriacao = LocalDateTime.now();
    }
}
