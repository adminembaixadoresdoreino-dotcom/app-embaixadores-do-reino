package br.com.emanuel.embaixadores_backend.service;

import br.com.emanuel.embaixadores_backend.entity.Campanha;
import br.com.emanuel.embaixadores_backend.entity.Participacao;
import br.com.emanuel.embaixadores_backend.repository.CampanhaRepository;
import br.com.emanuel.embaixadores_backend.repository.ParticipacaoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CampanhaService {

    private final CampanhaRepository campanhaRepo;
    private final ParticipacaoRepository participacaoRepo;

    public List<Campanha> listarTodas() {
        return campanhaRepo.findAll();
    }

    @Transactional
    public Campanha criar(Map<String, Object> dados) {
        Campanha c = new Campanha();
        preencherCampanha(c, dados);
        c.setAtiva(true);
        return campanhaRepo.save(c);
    }

    @Transactional
    public Campanha atualizar(UUID id, Map<String, Object> dados) {
        Campanha c = campanhaRepo.findById(id).orElseThrow(() -> new RuntimeException("Campanha não encontrada"));
        preencherCampanha(c, dados);
        return campanhaRepo.save(c);
    }

    @Transactional
    public void excluir(UUID id) {
        campanhaRepo.deleteById(id);
    }

    @Transactional
    public void participar(UUID campanhaId, String usuarioId) {
        Campanha c = campanhaRepo.findById(campanhaId).orElseThrow(() -> new RuntimeException("Campanha não encontrada"));
        if (!c.getParticipantes().contains(usuarioId)) {
            c.getParticipantes().add(usuarioId);
            campanhaRepo.save(c);
        }
    }

    @Transactional
    public void sair(UUID campanhaId, String usuarioId) {
        Campanha c = campanhaRepo.findById(campanhaId).orElseThrow(() -> new RuntimeException("Campanha não encontrada"));
        c.getParticipantes().remove(usuarioId);
        campanhaRepo.save(c);
    }

    @Transactional
    public Participacao registrarParticipacao(UUID campanhaId, String usuarioId, int quantidade, String descricao) {
        Participacao p = Participacao.builder()
                .campanhaId(campanhaId)
                .usuarioId(usuarioId)
                .quantidade(quantidade)
                .descricao(descricao)
                .build();
        return participacaoRepo.save(p);
    }

    public List<Participacao> getRegistros(UUID campanhaId) {
        return participacaoRepo.findByCampanhaId(campanhaId);
    }

    public List<Map<String, Object>> getRanking(UUID campanhaId) {
        List<Object[]> rows = participacaoRepo.rankingPorCampanha(campanhaId);
        return rows.stream().map(r -> {
            Map<String, Object> m = new HashMap<>();
            m.put("usuarioId", r[0]);
            m.put("total", ((Number) r[1]).longValue());
            return m;
        }).collect(Collectors.toList());
    }

    private void preencherCampanha(Campanha c, Map<String, Object> dados) {
        if (dados.containsKey("titulo")) c.setTitulo((String) dados.get("titulo"));
        if (dados.containsKey("descricao")) c.setDescricao((String) dados.get("descricao"));
        if (dados.containsKey("tipo")) c.setTipo((String) dados.get("tipo"));
        if (dados.containsKey("dataInicio")) c.setDataInicio(java.time.LocalDate.parse((String) dados.get("dataInicio")));
        if (dados.containsKey("dataFim")) c.setDataFim(java.time.LocalDate.parse((String) dados.get("dataFim")));
        if (dados.containsKey("ativa")) c.setAtiva(Boolean.TRUE.equals(dados.get("ativa")));
        if (dados.containsKey("objetivo")) c.setObjetivo((String) dados.get("objetivo"));
        if (dados.containsKey("instrucoes")) c.setInstrucoes((String) dados.get("instrucoes"));
        if (dados.containsKey("unidadeRegistro")) c.setUnidadeRegistro((String) dados.get("unidadeRegistro"));
        if (dados.containsKey("numeroCampanha")) c.setNumeroCampanha((String) dados.get("numeroCampanha"));
        if (dados.containsKey("criadoPor")) c.setCriadoPor((String) dados.get("criadoPor"));
    }
}
