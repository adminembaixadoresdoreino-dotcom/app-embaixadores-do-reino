package br.com.emanuel.embaixadores_backend.service;

import br.com.emanuel.embaixadores_backend.entity.Notificacao;
import br.com.emanuel.embaixadores_backend.repository.NotificacaoRepository;
import br.com.emanuel.embaixadores_backend.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Service
@RequiredArgsConstructor
public class NotificacaoService {

    private final NotificacaoRepository notifRepo;
    private final UsuarioRepository usuarioRepo;

    public List<Notificacao> listarPorUsuario(UUID usuarioId) {
        return notifRepo.findByUsuarioIdOrderByDataDesc(usuarioId);
    }

    @Transactional
    public void marcarLida(UUID notificacaoId) {
        Notificacao n = notifRepo.findById(notificacaoId).orElseThrow(() -> new RuntimeException("Notificação não encontrada"));
        n.setLida(true);
        notifRepo.save(n);
    }

    public long contarNaoLidas(UUID usuarioId) {
        return notifRepo.countByUsuarioIdAndLida(usuarioId, false);
    }

    @Transactional
    public void notificarUsuario(UUID usuarioId, String titulo, String mensagem, String tipo, String campanhaId) {
        Notificacao n = Notificacao.builder()
                .usuarioId(usuarioId)
                .titulo(titulo)
                .mensagem(mensagem)
                .tipo(tipo)
                .campanhaId(campanhaId)
                .lida(false)
                .build();
        notifRepo.save(n);
    }

    @Transactional
    public void notificarTodos(String titulo, String mensagem, String tipo, String campanhaId) {
        usuarioRepo.findAll().forEach(u -> {
            Notificacao n = Notificacao.builder()
                    .usuarioId(u.getId())
                    .titulo(titulo)
                    .mensagem(mensagem)
                    .tipo(tipo)
                    .campanhaId(campanhaId)
                    .lida(false)
                    .build();
            notifRepo.save(n);
        });
    }
}
