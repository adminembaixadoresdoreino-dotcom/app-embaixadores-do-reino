package br.com.emanuel.embaixadores_backend.dto;

import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class LoginDTO {
    private String email;
    private String senha;
}
