package br.com.emanuel.embaixadores_backend.dto;

import br.com.emanuel.embaixadores_backend.enums.Role;
import br.com.emanuel.embaixadores_backend.enums.StatusUsuario;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * UsuarioResponse — DTO para retornar dados do usuário nas APIs.
 *
 * NUNCA retornamos a entidade diretamente porque:
 * 1. A senha seria exposta no JSON!
 * 2. Relacionamentos podem causar loops infinitos na serialização
 * 3. Queremos controlar exatamente quais campos são retornados
 */
public class UsuarioResponse {
    private UUID id;
    private Long numeroInscricao;
    private String nome;
    private String email;
    private String cpf;
    private LocalDate dataNascimento;
    private Role role;
    private StatusUsuario status;
    private String codigoIndicacao;
    private boolean contribuiuPix;
    private boolean embaixadorConfirmado;
    private LocalDateTime dataCadastro;
    private LocalDateTime ultimoAcesso;
    private long totalIndicacoes;  // Quantidade de indicações (calculado)
    private EnderecoResponse endereco;
    private Boolean jaLogouAntes;

    // ===== Getters e Setters =====
    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public Long getNumeroInscricao() { return numeroInscricao; }
    public void setNumeroInscricao(Long numeroInscricao) { this.numeroInscricao = numeroInscricao; }
    public String getNome() { return nome; }
    public void setNome(String nome) { this.nome = nome; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getCpf() { return cpf; }
    public void setCpf(String cpf) { this.cpf = cpf; }
    public LocalDate getDataNascimento() { return dataNascimento; }
    public void setDataNascimento(LocalDate dataNascimento) { this.dataNascimento = dataNascimento; }
    public Role getRole() { return role; }
    public void setRole(Role role) { this.role = role; }
    public StatusUsuario getStatus() { return status; }
    public void setStatus(StatusUsuario status) { this.status = status; }
    public String getCodigoIndicacao() { return codigoIndicacao; }
    public void setCodigoIndicacao(String codigoIndicacao) { this.codigoIndicacao = codigoIndicacao; }
    public boolean isContribuiuPix() { return contribuiuPix; }
    public void setContribuiuPix(boolean contribuiuPix) { this.contribuiuPix = contribuiuPix; }
    public boolean isEmbaixadorConfirmado() { return embaixadorConfirmado; }
    public void setEmbaixadorConfirmado(boolean embaixadorConfirmado) { this.embaixadorConfirmado = embaixadorConfirmado; }
    public LocalDateTime getDataCadastro() { return dataCadastro; }
    public void setDataCadastro(LocalDateTime dataCadastro) { this.dataCadastro = dataCadastro; }
    public LocalDateTime getUltimoAcesso() { return ultimoAcesso; }
    public void setUltimoAcesso(LocalDateTime ultimoAcesso) { this.ultimoAcesso = ultimoAcesso; }
    public long getTotalIndicacoes() { return totalIndicacoes; }
    public void setTotalIndicacoes(long totalIndicacoes) { this.totalIndicacoes = totalIndicacoes; }
    public EnderecoResponse getEndereco() { return endereco; }
    public void setEndereco(EnderecoResponse endereco) { this.endereco = endereco; }
}
