package br.com.emanuel.embaixadores_backend.controller;

import br.com.emanuel.embaixadores_backend.entity.Campanha;
import br.com.emanuel.embaixadores_backend.entity.Participacao;
import br.com.emanuel.embaixadores_backend.service.CampanhaService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/campanhas")
@RequiredArgsConstructor
public class CampanhaController {

    private final CampanhaService campanhaService;

    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> listar() {
        List<Map<String, Object>> result = new ArrayList<>();
        for (Campanha c : campanhaService.listarTodas()) {
            result.add(campanhaToMap(c));
        }
        return ResponseEntity.ok(result);
    }

    @PostMapping
    public ResponseEntity<Map<String, Object>> criar(@RequestBody Map<String, Object> dados) {
        return ResponseEntity.ok(campanhaToMap(campanhaService.criar(dados)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Map<String, Object>> atualizar(@PathVariable UUID id, @RequestBody Map<String, Object> dados) {
        return ResponseEntity.ok(campanhaToMap(campanhaService.atualizar(id, dados)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> excluir(@PathVariable UUID id) {
        campanhaService.excluir(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/participar/{usuarioId}")
    public ResponseEntity<Void> participar(@PathVariable UUID id, @PathVariable String usuarioId) {
        campanhaService.participar(id, usuarioId);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/{id}/participar/{usuarioId}")
    public ResponseEntity<Void> sair(@PathVariable UUID id, @PathVariable String usuarioId) {
        campanhaService.sair(id, usuarioId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/registros")
    public ResponseEntity<Map<String, Object>> registrar(@PathVariable UUID id, @RequestBody Map<String, Object> body) {
        String usuarioId = (String) body.get("usuarioId");
        int quantidade = ((Number) body.getOrDefault("quantidade", 1)).intValue();
        String descricao = (String) body.get("descricao");

        Participacao p = campanhaService.registrarParticipacao(id, usuarioId, quantidade, descricao);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("id", p.getId().toString());
        result.put("campanhaId", p.getCampanhaId().toString());
        result.put("usuarioId", p.getUsuarioId());
        result.put("quantidade", p.getQuantidade());
        result.put("descricao", p.getDescricao());
        result.put("data", p.getDataRegistro() != null ? p.getDataRegistro().toString() : null);
        return ResponseEntity.ok(result);
    }

    @GetMapping("/{id}/registros")
    public ResponseEntity<List<Map<String, Object>>> getRegistros(@PathVariable UUID id) {
        List<Map<String, Object>> result = new ArrayList<>();
        for (Participacao p : campanhaService.getRegistros(id)) {
            Map<String, Object> map = new LinkedHashMap<>();
            map.put("id", p.getId().toString());
            map.put("campanhaId", p.getCampanhaId().toString());
            map.put("usuarioId", p.getUsuarioId());
            map.put("quantidade", p.getQuantidade());
            map.put("descricao", p.getDescricao());
            map.put("data", p.getDataRegistro() != null ? p.getDataRegistro().toString() : null);
            result.add(map);
        }
        return ResponseEntity.ok(result);
    }

    @GetMapping("/{id}/ranking")
    public ResponseEntity<List<Map<String, Object>>> ranking(@PathVariable UUID id) {
        return ResponseEntity.ok(campanhaService.getRanking(id));
    }

    private Map<String, Object> campanhaToMap(Campanha c) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("id", c.getId().toString());
        map.put("titulo", c.getTitulo());
        map.put("descricao", c.getDescricao());
        map.put("tipo", c.getTipo());
        map.put("dataInicio", c.getDataInicio() != null ? c.getDataInicio().toString() : null);
        map.put("dataFim", c.getDataFim() != null ? c.getDataFim().toString() : null);
        map.put("ativa", c.isAtiva());
        map.put("participantes", c.getParticipantes());
        map.put("criadoPor", c.getCriadoPor());
        map.put("dataCriacao", c.getDataCriacao() != null ? c.getDataCriacao().toString() : null);
        map.put("numeroCampanha", c.getNumeroCampanha());
        map.put("objetivo", c.getObjetivo());
        map.put("instrucoes", c.getInstrucoes());
        map.put("unidadeRegistro", c.getUnidadeRegistro());
        return map;
    }
}
