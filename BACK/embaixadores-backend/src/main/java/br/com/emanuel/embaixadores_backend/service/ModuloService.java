package br.com.emanuel.embaixadores_backend.service;

import br.com.emanuel.embaixadores_backend.entity.Aula;
import br.com.emanuel.embaixadores_backend.entity.Modulo;
import br.com.emanuel.embaixadores_backend.repository.AulaRepository;
import br.com.emanuel.embaixadores_backend.repository.ModuloRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Service
@RequiredArgsConstructor
public class ModuloService {

    private final ModuloRepository moduloRepo;
    private final AulaRepository aulaRepo;

    public List<Modulo> listarTodos() {
        return moduloRepo.findAll();
    }

    public Modulo buscarPorId(UUID id) {
        return moduloRepo.findById(id).orElseThrow(() -> new RuntimeException("Módulo não encontrado"));
    }

    @Transactional
    public Modulo criar(Map<String, Object> dados) {
        Modulo m = new Modulo();
        preencherModulo(m, dados);
        return moduloRepo.save(m);
    }

    @Transactional
    public Modulo atualizar(UUID id, Map<String, Object> dados) {
        Modulo m = buscarPorId(id);
        preencherModulo(m, dados);
        return moduloRepo.save(m);
    }

    @Transactional
    public void excluir(UUID id) {
        moduloRepo.deleteById(id);
    }

    @Transactional
    public Aula adicionarAula(UUID moduloId, Map<String, Object> dados) {
        Modulo m = buscarPorId(moduloId);
        Aula a = new Aula();
        preencherAula(a, dados);
        a.setModulo(m);
        return aulaRepo.save(a);
    }

    @Transactional
    public Aula atualizarAula(UUID moduloId, UUID aulaId, Map<String, Object> dados) {
        Aula a = aulaRepo.findById(aulaId).orElseThrow(() -> new RuntimeException("Aula não encontrada"));
        preencherAula(a, dados);
        return aulaRepo.save(a);
    }

    @Transactional
    public void excluirAula(UUID moduloId, UUID aulaId) {
        aulaRepo.deleteById(aulaId);
    }

    private void preencherModulo(Modulo m, Map<String, Object> dados) {
        if (dados.containsKey("titulo")) m.setTitulo((String) dados.get("titulo"));
        if (dados.containsKey("descricao")) m.setDescricao((String) dados.get("descricao"));
        if (dados.containsKey("icone")) m.setIcone((String) dados.get("icone"));
        if (dados.containsKey("mes")) m.setMes(((Number) dados.get("mes")).intValue());
        if (dados.containsKey("especial")) m.setEspecial(Boolean.TRUE.equals(dados.get("especial")));
        if (dados.containsKey("mensagemFinal")) m.setMensagemFinal((String) dados.get("mensagemFinal"));
    }

    private void preencherAula(Aula a, Map<String, Object> dados) {
        if (dados.containsKey("titulo")) a.setTitulo((String) dados.get("titulo"));
        if (dados.containsKey("descricao")) a.setDescricao((String) dados.get("descricao"));
        if (dados.containsKey("duracao")) a.setDuracao((String) dados.get("duracao"));
        if (dados.containsKey("videoUrl")) a.setVideoUrl((String) dados.get("videoUrl"));
        if (dados.containsKey("semana")) a.setSemana(((Number) dados.get("semana")).intValue());
        if (dados.containsKey("tipo")) a.setTipo((String) dados.get("tipo"));
    }
}
