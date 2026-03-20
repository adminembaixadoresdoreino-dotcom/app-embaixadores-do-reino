package br.com.emanuel.embaixadores_backend.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

/**
 * LoginRequest — DTO para receber email e senha no login.
 *
 * O frontend envia esses dois campos no corpo da requisição POST /api/auth/login.
 * O backend valida e retorna um token JWT se os dados estiverem corretos.
 */
public class LoginRequest {

    @NotBlank(message = "O email é obrigatório")
    @Email(message = "Email inválido")
    private String email;

    @NotBlank(message = "A senha é obrigatória")
    private String senha;

    /** Se marcou "lembrar-me" (sessão de 48h em vez de sessão curta) */
    private boolean lembrarMe;

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getSenha() { return senha; }
    public void setSenha(String senha) { this.senha = senha; }
    public boolean isLembrarMe() { return lembrarMe; }
    public void setLembrarMe(boolean lembrarMe) { this.lembrarMe = lembrarMe; }
}
