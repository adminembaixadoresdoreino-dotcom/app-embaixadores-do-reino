package br.com.emanuel.embaixadores_backend.dto;

import br.com.emanuel.embaixadores_backend.enums.Role;
import br.com.emanuel.embaixadores_backend.enums.StatusUsuario;
import java.util.UUID;

/**
 * LoginResponse — DTO retornado após login bem-sucedido.
 *
 * Contém os dados do usuário + token JWT para autenticação nas próximas requisições.
 * O frontend armazena o token e envia no header "Authorization: Bearer <token>".
 */
public class LoginResponse {
    private UUID id;
    private String nome;
    private String email;
    private Role role;
    private StatusUsuario status;
    private String codigoIndicacao;
    private boolean embaixadorConfirmado;
    private String token;  // Token JWT para autenticação

    // ===== Getters e Setters =====
    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public String getNome() { return nome; }
    public void setNome(String nome) { this.nome = nome; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public Role getRole() { return role; }
    public void setRole(Role role) { this.role = role; }
    public StatusUsuario getStatus() { return status; }
    public void setStatus(StatusUsuario status) { this.status = status; }
    public String getCodigoIndicacao() { return codigoIndicacao; }
    public void setCodigoIndicacao(String codigoIndicacao) { this.codigoIndicacao = codigoIndicacao; }
    public boolean isEmbaixadorConfirmado() { return embaixadorConfirmado; }
    public void setEmbaixadorConfirmado(boolean embaixadorConfirmado) { this.embaixadorConfirmado = embaixadorConfirmado; }
    public String getToken() { return token; }
    public void setToken(String token) { this.token = token; }
}
