package br.com.emanuel.embaixadores_backend.service;

import br.com.emanuel.embaixadores_backend.entity.Contribuicao;
import br.com.emanuel.embaixadores_backend.entity.Usuario;
import br.com.emanuel.embaixadores_backend.repository.ContribuicaoRepository;
import br.com.emanuel.embaixadores_backend.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
public class ContribuicaoService {

    private final ContribuicaoRepository contribRepo;
    private final UsuarioRepository usuarioRepo;

    @Transactional
    public Contribuicao salvar(UUID usuarioId, double valor, String forma) {
        Contribuicao c = Contribuicao.builder()
                .usuarioId(usuarioId)
                .valor(valor)
                .forma(forma)
                .build();
        c = contribRepo.save(c);

        // Atualiza flags no usuário
        Usuario u = usuarioRepo.findById(usuarioId).orElse(null);
        if (u != null) {
            u.setContribuiuPix(true);
            u.setValorContribuicao((u.getValorContribuicao() != null ? u.getValorContribuicao() : 0) + valor);
            u.setDataContribuicao(LocalDateTime.now());
            usuarioRepo.save(u);
        }

        return c;
    }

    public List<Contribuicao> listarPorUsuario(UUID usuarioId) {
        return contribRepo.findByUsuarioIdOrderByDataDesc(usuarioId);
    }
}
