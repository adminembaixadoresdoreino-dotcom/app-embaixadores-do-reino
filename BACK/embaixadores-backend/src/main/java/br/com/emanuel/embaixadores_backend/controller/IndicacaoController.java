package br.com.emanuel.embaixadores_backend.controller;

import br.com.emanuel.embaixadores_backend.entity.Indicacao;
import br.com.emanuel.embaixadores_backend.entity.Usuario;
import br.com.emanuel.embaixadores_backend.repository.IndicacaoRepository;
import br.com.emanuel.embaixadores_backend.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/indicacoes")
@RequiredArgsConstructor
public class IndicacaoController {

    private final UsuarioRepository usuarioRepo;
    private final IndicacaoRepository indicacaoRepo;

    @PostMapping
    public ResponseEntity<Void> registrar(@RequestBody Map<String, String> body) {
        String codigo = body.get("codigoIndicacao");
        String nome = body.get("nomeIndicado");
        String email = body.get("emailIndicado");

        Usuario indicador = usuarioRepo.findByCodigoIndicacao(codigo)
                .orElseThrow(() -> new RuntimeException("Código de indicação inválido"));

        Indicacao ind = Indicacao.builder()
                .indicadorId(indicador.getId())
                .nomeIndicado(nome)
                .emailIndicado(email)
                .build();
        indicacaoRepo.save(ind);

        return ResponseEntity.noContent().build();
    }
}
