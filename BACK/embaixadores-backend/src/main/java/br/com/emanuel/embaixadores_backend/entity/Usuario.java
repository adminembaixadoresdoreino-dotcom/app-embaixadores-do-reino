package br.com.emanuel.embaixadores_backend.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "usuarios")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Usuario {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, unique = true)
    private Long numeroInscricao;

    @Column(nullable = false)
    private String nome;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false)
    private String senha;

    @Column(unique = true)
    private String cpf;

    private LocalDate dataNascimento;

    @Embedded
    private Endereco endereco;

    @Column(nullable = false)
    private String role; // embaixador, admin, moderador, auxiliar, editor

    @Column(nullable = false)
    private String status; // interessado, candidato, em_formacao, formacao_concluida, embaixador

    private LocalDateTime dataCadastro;
    private LocalDateTime ultimoAcesso;

    @Column(unique = true)
    private String codigoIndicacao;

    private String codigoIndicacaoUsado;

    private boolean embaixadorConfirmado;
    private boolean contribuiuPix;
    private Double valorContribuicao;
    private LocalDateTime dataContribuicao;

    private boolean jaLogouAntes;

    @PrePersist
    public void prePersist() {
        if (dataCadastro == null) dataCadastro = LocalDateTime.now();
        if (ultimoAcesso == null) ultimoAcesso = LocalDateTime.now();
        if (role == null) role = "embaixador";
        if (status == null) status = "candidato";
    }
}
