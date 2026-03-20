package br.com.emanuel.embaixadores_backend.controller;

import br.com.emanuel.embaixadores_backend.entity.Contribuicao;
import br.com.emanuel.embaixadores_backend.service.ContribuicaoService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/contribuicoes")
@RequiredArgsConstructor
public class ContribuicaoController {

    private final ContribuicaoService contribuicaoService;

    @PostMapping
    public ResponseEntity<Map<String, Object>> salvar(@RequestBody Map<String, Object> body) {
        UUID usuarioId = UUID.fromString((String) body.get("usuarioId"));
        double valor = ((Number) body.get("valor")).doubleValue();
        String forma = (String) body.getOrDefault("forma", "PIX");

        Contribuicao c = contribuicaoService.salvar(usuarioId, valor, forma);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("id", c.getId().toString());
        result.put("usuarioId", c.getUsuarioId().toString());
        result.put("valor", c.getValor());
        result.put("forma", c.getForma());
        result.put("data", c.getData() != null ? c.getData().toString() : null);
        return ResponseEntity.ok(result);
    }

    @GetMapping("/{usuarioId}")
    public ResponseEntity<List<Map<String, Object>>> listar(@PathVariable UUID usuarioId) {
        List<Map<String, Object>> result = new ArrayList<>();
        for (Contribuicao c : contribuicaoService.listarPorUsuario(usuarioId)) {
            Map<String, Object> map = new LinkedHashMap<>();
            map.put("id", c.getId().toString());
            map.put("usuarioId", c.getUsuarioId().toString());
            map.put("valor", c.getValor());
            map.put("forma", c.getForma());
            map.put("data", c.getData() != null ? c.getData().toString() : null);
            result.add(map);
        }
        return ResponseEntity.ok(result);
    }
}
