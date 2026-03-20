package br.com.emanuel.embaixadores_backend.service;

import br.com.emanuel.embaixadores_backend.entity.Progresso;
import br.com.emanuel.embaixadores_backend.repository.ProgressoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Service
@RequiredArgsConstructor
public class ProgressoService {

    private final ProgressoRepository progressoRepo;

    @Transactional
    public void salvar(UUID usuarioId, String moduloId, String aulaId) {
        if (!progressoRepo.existsByUsuarioIdAndModuloIdAndAulaId(usuarioId, moduloId, aulaId)) {
            Progresso p = Progresso.builder()
                    .usuarioId(usuarioId)
                    .moduloId(moduloId)
                    .aulaId(aulaId)
                    .build();
            progressoRepo.save(p);
        }
    }

    public Map<String, List<String>> getProgresso(UUID usuarioId) {
        List<Progresso> lista = progressoRepo.findByUsuarioId(usuarioId);
        Map<String, List<String>> map = new HashMap<>();
        for (Progresso p : lista) {
            map.computeIfAbsent(p.getModuloId(), k -> new ArrayList<>()).add(p.getAulaId());
        }
        return map;
    }
}
