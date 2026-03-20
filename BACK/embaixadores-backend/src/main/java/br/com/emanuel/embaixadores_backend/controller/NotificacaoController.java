package br.com.emanuel.embaixadores_backend.controller;

import br.com.emanuel.embaixadores_backend.entity.Notificacao;
import br.com.emanuel.embaixadores_backend.service.NotificacaoService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/notificacoes")
@RequiredArgsConstructor
public class NotificacaoController {

    private final NotificacaoService notificacaoService;

    @GetMapping("/{usuarioId}")
    public ResponseEntity<List<Map<String, Object>>> listar(@PathVariable UUID usuarioId) {
        List<Map<String, Object>> result = new ArrayList<>();
        for (Notificacao n : notificacaoService.listarPorUsuario(usuarioId)) {
            result.add(notifToMap(n));
        }
        return ResponseEntity.ok(result);
    }

    @PutMapping("/{notificacaoId}/lida")
    public ResponseEntity<Void> marcarLida(@PathVariable UUID notificacaoId) {
        notificacaoService.marcarLida(notificacaoId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/todos")
    public ResponseEntity<Void> notificarTodos(@RequestBody Map<String, String> body) {
        notificacaoService.notificarTodos(
                body.get("titulo"),
                body.get("mensagem"),
                body.get("tipo"),
                body.get("campanhaId")
        );
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{usuarioId}")
    public ResponseEntity<Void> notificarUsuario(@PathVariable UUID usuarioId, @RequestBody Map<String, String> body) {
        notificacaoService.notificarUsuario(
                usuarioId,
                body.get("titulo"),
                body.get("mensagem"),
                body.get("tipo"),
                null
        );
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{usuarioId}/nao-lidas")
    public ResponseEntity<Long> contarNaoLidas(@PathVariable UUID usuarioId) {
        return ResponseEntity.ok(notificacaoService.contarNaoLidas(usuarioId));
    }

    private Map<String, Object> notifToMap(Notificacao n) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("id", n.getId().toString());
        map.put("titulo", n.getTitulo());
        map.put("mensagem", n.getMensagem());
        map.put("tipo", n.getTipo());
        map.put("data", n.getData() != null ? n.getData().toString() : null);
        map.put("lida", n.isLida());
        map.put("usuarioId", n.getUsuarioId().toString());
        map.put("campanhaId", n.getCampanhaId());
        return map;
    }
}
