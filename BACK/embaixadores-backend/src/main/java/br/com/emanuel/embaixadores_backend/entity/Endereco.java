package br.com.emanuel.embaixadores_backend.entity;

import jakarta.persistence.Embeddable;
import lombok.*;

@Embeddable
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Endereco {
    private String rua;
    private String numero;
    private String bairro;
    private String cep;
    private String cidade;
    private String estado;
    private String pais;
}
