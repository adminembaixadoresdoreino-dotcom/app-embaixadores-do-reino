package br.com.emanuel.embaixadores_backend.entity;

import jakarta.persistence.*;
import lombok.*;
import java.util.UUID;

@Entity
@Table(name = "aulas")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Aula {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private String titulo;

    @Column(columnDefinition = "TEXT")
    private String descricao;

    private String duracao;
    private String videoUrl;
    private int semana;
    private String tipo; // video, live

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "modulo_id")
    private Modulo modulo;
}
