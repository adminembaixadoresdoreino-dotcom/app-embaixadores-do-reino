package br.com.emanuel.embaixadores_backend.controller;

import br.com.emanuel.embaixadores_backend.dto.UsuarioDTO;
import br.com.emanuel.embaixadores_backend.service.UsuarioService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/usuarios")
@RequiredArgsConstructor
public class UsuarioController {

    private final UsuarioService usuarioService;

    @GetMapping
    public ResponseEntity<List<UsuarioDTO>> listar() {
        return ResponseEntity.ok(usuarioService.listarTodos());
    }

    @GetMapping("/{id}")
    public ResponseEntity<UsuarioDTO> buscar(@PathVariable UUID id) {
        return ResponseEntity.ok(usuarioService.buscarPorId(id));
    }

    @PutMapping("/{id}")
    public ResponseEntity<UsuarioDTO> atualizar(@PathVariable UUID id, @RequestBody Map<String, Object> dados) {
        return ResponseEntity.ok(usuarioService.atualizar(id, dados));
    }

    @PutMapping("/{id}/role")
    public ResponseEntity<UsuarioDTO> alterarRole(@PathVariable UUID id, @RequestBody Map<String, String> body) {
        return ResponseEntity.ok(usuarioService.alterarRole(id, body.get("role")));
    }

    @PutMapping("/{id}/embaixador")
    public ResponseEntity<UsuarioDTO> alterarEmbaixador(@PathVariable UUID id, @RequestBody Map<String, Boolean> body) {
        return ResponseEntity.ok(usuarioService.alterarEmbaixador(id, Boolean.TRUE.equals(body.get("embaixadorConfirmado"))));
    }

    @GetMapping("/estatisticas")
    public ResponseEntity<Map<String, Object>> estatisticas() {
        return ResponseEntity.ok(usuarioService.estatisticas());
    }
}
