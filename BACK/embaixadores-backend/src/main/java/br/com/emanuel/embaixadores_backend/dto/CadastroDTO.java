package br.com.emanuel.embaixadores_backend.dto;

import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class CadastroDTO {
    private String nome;
    private String email;
    private String senha;
    private String cpf;
    private String dataNascimento;
    private String rua;
    private String numero;
    private String bairro;
    private String cep;
    private String cidade;
    private String estado;
    private String pais;
    private String codigoIndicacao;
}
