package br.com.emanuel.embaixadores_backend.controller;

import br.com.emanuel.embaixadores_backend.service.ProgressoService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/progresso")
@RequiredArgsConstructor
public class ProgressoController {

    private final ProgressoService progressoService;

    @PostMapping("/{moduloId}/{aulaId}")
    public ResponseEntity<Void> salvar(@PathVariable String moduloId, @PathVariable String aulaId, @RequestBody Map<String, String> body) {
        UUID usuarioId = UUID.fromString(body.get("usuarioId"));
        progressoService.salvar(usuarioId, moduloId, aulaId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{usuarioId}")
    public ResponseEntity<Map<String, List<String>>> getProgresso(@PathVariable UUID usuarioId) {
        return ResponseEntity.ok(progressoService.getProgresso(usuarioId));
    }
}
