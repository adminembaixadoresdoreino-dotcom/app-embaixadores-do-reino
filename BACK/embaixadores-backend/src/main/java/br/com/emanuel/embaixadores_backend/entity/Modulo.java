package br.com.emanuel.embaixadores_backend.entity;

import jakarta.persistence.*;
import lombok.*;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "modulos")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Modulo {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private String titulo;

    @Column(columnDefinition = "TEXT")
    private String descricao;

    private String icone;
    private int mes;
    private boolean especial;

    @Column(columnDefinition = "TEXT")
    private String mensagemFinal;

    @OneToMany(mappedBy = "modulo", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    @OrderBy("semana ASC")
    @Builder.Default
    private List<Aula> aulas = new ArrayList<>();
}
