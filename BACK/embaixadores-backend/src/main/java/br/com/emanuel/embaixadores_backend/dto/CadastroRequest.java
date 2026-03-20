package br.com.emanuel.embaixadores_backend.dto;

import jakarta.validation.constraints.*;
import java.time.LocalDate;

/**
 * CadastroRequest — DTO para receber os dados de cadastro do frontend.
 *
 * DTO (Data Transfer Object) é um objeto que serve apenas para transportar dados.
 * Ele NÃO é salvo no banco — os dados são transferidos para a entidade Usuario antes de salvar.
 *
 * Isso é uma boa prática porque:
 * 1. Separa o que o frontend envia do que é salvo no banco
 * 2. Permite validar os dados antes de processar
 * 3. Evita expor campos internos da entidade (como ID, dataCadastro)
 */
public class CadastroRequest {

    @NotBlank(message = "O nome é obrigatório")
    private String nome;

    @NotBlank(message = "O email é obrigatório")
    @Email(message = "Email inválido")
    private String email;

    @NotBlank(message = "A senha é obrigatória")
    @Size(min = 6, message = "A senha deve ter pelo menos 6 caracteres")
    private String senha;

    @NotBlank(message = "O CPF é obrigatório")
    private String cpf;

    @NotNull(message = "A data de nascimento é obrigatória")
    private LocalDate dataNascimento;

    // Campos de endereço
    @NotBlank(message = "A rua é obrigatória")
    private String rua;
    @NotBlank(message = "O número é obrigatório")
    private String numero;
    @NotBlank(message = "O bairro é obrigatório")
    private String bairro;
    @NotBlank(message = "O CEP é obrigatório")
    private String cep;
    @NotBlank(message = "O país é obrigatório")
    private String pais;
    @NotBlank(message = "O estado é obrigatório")
    private String estado;
    @NotBlank(message = "A cidade é obrigatória")
    private String cidade;

    /** Código de indicação usado no cadastro (opcional) — ex: "EMB-1234" */
    private String codigoIndicacao;

    // ===== Getters e Setters =====
    public String getNome() { return nome; }
    public void setNome(String nome) { this.nome = nome; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getSenha() { return senha; }
    public void setSenha(String senha) { this.senha = senha; }
    public String getCpf() { return cpf; }
    public void setCpf(String cpf) { this.cpf = cpf; }
    public LocalDate getDataNascimento() { return dataNascimento; }
    public void setDataNascimento(LocalDate dataNascimento) { this.dataNascimento = dataNascimento; }
    public String getRua() { return rua; }
    public void setRua(String rua) { this.rua = rua; }
    public String getNumero() { return numero; }
    public void setNumero(String numero) { this.numero = numero; }
    public String getBairro() { return bairro; }
    public void setBairro(String bairro) { this.bairro = bairro; }
    public String getCep() { return cep; }
    public void setCep(String cep) { this.cep = cep; }
    public String getPais() { return pais; }
    public void setPais(String pais) { this.pais = pais; }
    public String getEstado() { return estado; }
    public void setEstado(String estado) { this.estado = estado; }
    public String getCidade() { return cidade; }
    public void setCidade(String cidade) { this.cidade = cidade; }
    public String getCodigoIndicacao() { return codigoIndicacao; }
    public void setCodigoIndicacao(String codigoIndicacao) { this.codigoIndicacao = codigoIndicacao; }
}
