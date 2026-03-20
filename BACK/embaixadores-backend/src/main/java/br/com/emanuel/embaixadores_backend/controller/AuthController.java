package br.com.emanuel.embaixadores_backend.controller;

import br.com.emanuel.embaixadores_backend.dto.CadastroDTO;
import br.com.emanuel.embaixadores_backend.dto.LoginDTO;
import br.com.emanuel.embaixadores_backend.dto.UsuarioDTO;
import br.com.emanuel.embaixadores_backend.service.UsuarioService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {

    private final UsuarioService usuarioService;

    @PostMapping("/cadastro")
    public ResponseEntity<UsuarioDTO> cadastro(@RequestBody CadastroDTO dto) {
        return ResponseEntity.ok(usuarioService.cadastrar(dto));
    }

    @PostMapping("/login")
    public ResponseEntity<UsuarioDTO> login(@RequestBody LoginDTO dto) {
        return ResponseEntity.ok(usuarioService.login(dto));
    }
}
