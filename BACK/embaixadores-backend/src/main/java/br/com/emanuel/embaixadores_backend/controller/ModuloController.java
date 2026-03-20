package br.com.emanuel.embaixadores_backend.controller;

import br.com.emanuel.embaixadores_backend.entity.Aula;
import br.com.emanuel.embaixadores_backend.entity.Modulo;
import br.com.emanuel.embaixadores_backend.service.ModuloService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/modulos")
@RequiredArgsConstructor
public class ModuloController {

    private final ModuloService moduloService;

    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> listar() {
        List<Modulo> modulos = moduloService.listarTodos();
        List<Map<String, Object>> result = new ArrayList<>();
        for (Modulo m : modulos) {
            result.add(moduloToMap(m));
        }
        return ResponseEntity.ok(result);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Map<String, Object>> buscar(@PathVariable UUID id) {
        return ResponseEntity.ok(moduloToMap(moduloService.buscarPorId(id)));
    }

    @PostMapping
    public ResponseEntity<Map<String, Object>> criar(@RequestBody Map<String, Object> dados) {
        return ResponseEntity.ok(moduloToMap(moduloService.criar(dados)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Map<String, Object>> atualizar(@PathVariable UUID id, @RequestBody Map<String, Object> dados) {
        return ResponseEntity.ok(moduloToMap(moduloService.atualizar(id, dados)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> excluir(@PathVariable UUID id) {
        moduloService.excluir(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{moduloId}/aulas")
    public ResponseEntity<Map<String, Object>> adicionarAula(@PathVariable UUID moduloId, @RequestBody Map<String, Object> dados) {
        return ResponseEntity.ok(aulaToMap(moduloService.adicionarAula(moduloId, dados)));
    }

    @PutMapping("/{moduloId}/aulas/{aulaId}")
    public ResponseEntity<Map<String, Object>> atualizarAula(@PathVariable UUID moduloId, @PathVariable UUID aulaId, @RequestBody Map<String, Object> dados) {
        return ResponseEntity.ok(aulaToMap(moduloService.atualizarAula(moduloId, aulaId, dados)));
    }

    @DeleteMapping("/{moduloId}/aulas/{aulaId}")
    public ResponseEntity<Void> excluirAula(@PathVariable UUID moduloId, @PathVariable UUID aulaId) {
        moduloService.excluirAula(moduloId, aulaId);
        return ResponseEntity.noContent().build();
    }

    private Map<String, Object> moduloToMap(Modulo m) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("id", m.getId().toString());
        map.put("titulo", m.getTitulo());
        map.put("descricao", m.getDescricao());
        map.put("icone", m.getIcone());
        map.put("mes", m.getMes());
        map.put("especial", m.isEspecial());
        map.put("mensagemFinal", m.getMensagemFinal());
        List<Map<String, Object>> aulas = new ArrayList<>();
        if (m.getAulas() != null) {
            for (Aula a : m.getAulas()) {
                aulas.add(aulaToMap(a));
            }
        }
        map.put("aulas", aulas);
        return map;
    }

    private Map<String, Object> aulaToMap(Aula a) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("id", a.getId().toString());
        map.put("titulo", a.getTitulo());
        map.put("descricao", a.getDescricao());
        map.put("duracao", a.getDuracao());
        map.put("videoUrl", a.getVideoUrl());
        map.put("semana", a.getSemana());
        map.put("tipo", a.getTipo());
        return map;
    }
}
