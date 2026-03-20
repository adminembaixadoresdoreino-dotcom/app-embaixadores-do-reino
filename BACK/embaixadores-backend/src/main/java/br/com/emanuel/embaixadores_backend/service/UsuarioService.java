package br.com.emanuel.embaixadores_backend.service;

import br.com.emanuel.embaixadores_backend.dto.*;
import br.com.emanuel.embaixadores_backend.entity.*;
import br.com.emanuel.embaixadores_backend.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UsuarioService {

    private final UsuarioRepository usuarioRepo;
    private final ProgressoRepository progressoRepo;
    private final ContribuicaoRepository contribuicaoRepo;
    private final IndicacaoRepository indicacaoRepo;
    private final BCryptPasswordEncoder passwordEncoder;

    @Transactional
    public UsuarioDTO cadastrar(CadastroDTO dto) {
        if (usuarioRepo.existsByEmail(dto.getEmail())) {
            throw new RuntimeException("Este email já está cadastrado");
        }
        if (dto.getCpf() != null && !dto.getCpf().isBlank() && usuarioRepo.existsByCpf(dto.getCpf())) {
            throw new RuntimeException("Este CPF já está cadastrado");
        }

        Long proxNum = usuarioRepo.findMaxNumeroInscricao() + 1;
        String codigoIndicacao = gerarCodigoIndicacao();

        Usuario u = Usuario.builder()
                .numeroInscricao(proxNum)
                .nome(dto.getNome())
                .email(dto.getEmail())
                .senha(passwordEncoder.encode(dto.getSenha()))
                .cpf(dto.getCpf())
                .dataNascimento(dto.getDataNascimento() != null && !dto.getDataNascimento().isBlank()
                        ? LocalDate.parse(dto.getDataNascimento()) : null)
                .endereco(Endereco.builder()
                        .rua(dto.getRua()).numero(dto.getNumero()).bairro(dto.getBairro())
                        .cep(dto.getCep()).cidade(dto.getCidade()).estado(dto.getEstado()).pais(dto.getPais())
                        .build())
                .role("embaixador")
                .status("candidato")
                .codigoIndicacao(codigoIndicacao)
                .codigoIndicacaoUsado(dto.getCodigoIndicacao())
                .embaixadorConfirmado(false)
                .contribuiuPix(false)
                .jaLogouAntes(false)
                .build();

        u = usuarioRepo.save(u);

        // Registrar indicação se código foi usado
        if (dto.getCodigoIndicacao() != null && !dto.getCodigoIndicacao().isBlank()) {
            usuarioRepo.findByCodigoIndicacao(dto.getCodigoIndicacao()).ifPresent(indicador -> {
                Indicacao ind = Indicacao.builder()
                        .indicadorId(indicador.getId())
                        .nomeIndicado(dto.getNome())
                        .emailIndicado(dto.getEmail())
                        .build();
                indicacaoRepo.save(ind);
            });
        }

        return toDTO(u);
    }

    @Transactional
    public UsuarioDTO login(LoginDTO dto) {
        Usuario u = usuarioRepo.findByEmail(dto.getEmail())
                .orElseThrow(() -> new RuntimeException("Email ou senha incorretos"));

        if (!passwordEncoder.matches(dto.getSenha(), u.getSenha())) {
            throw new RuntimeException("Email ou senha incorretos");
        }

        u.setUltimoAcesso(LocalDateTime.now());
        u = usuarioRepo.save(u);
        return toDTO(u);
    }

    public List<UsuarioDTO> listarTodos() {
        return usuarioRepo.findAll().stream().map(this::toDTO).collect(Collectors.toList());
    }

    public UsuarioDTO buscarPorId(UUID id) {
        return toDTO(usuarioRepo.findById(id).orElseThrow(() -> new RuntimeException("Usuário não encontrado")));
    }

    @Transactional
    public UsuarioDTO atualizar(UUID id, Map<String, Object> dados) {
        Usuario u = usuarioRepo.findById(id).orElseThrow(() -> new RuntimeException("Usuário não encontrado"));

        if (dados.containsKey("nome")) u.setNome((String) dados.get("nome"));
        if (dados.containsKey("email")) u.setEmail((String) dados.get("email"));
        if (dados.containsKey("cpf")) u.setCpf((String) dados.get("cpf"));
        if (dados.containsKey("dataNascimento")) {
            String dn = (String) dados.get("dataNascimento");
            u.setDataNascimento(dn != null && !dn.isBlank() ? LocalDate.parse(dn) : null);
        }
        if (dados.containsKey("jaLogouAntes")) u.setJaLogouAntes(Boolean.TRUE.equals(dados.get("jaLogouAntes")));
        if (dados.containsKey("status")) u.setStatus((String) dados.get("status"));

        // Endereco
        if (dados.containsKey("endereco")) {
            @SuppressWarnings("unchecked")
            Map<String, String> end = (Map<String, String>) dados.get("endereco");
            Endereco e = u.getEndereco() != null ? u.getEndereco() : new Endereco();
            if (end.containsKey("rua")) e.setRua(end.get("rua"));
            if (end.containsKey("numero")) e.setNumero(end.get("numero"));
            if (end.containsKey("bairro")) e.setBairro(end.get("bairro"));
            if (end.containsKey("cep")) e.setCep(end.get("cep"));
            if (end.containsKey("cidade")) e.setCidade(end.get("cidade"));
            if (end.containsKey("estado")) e.setEstado(end.get("estado"));
            if (end.containsKey("pais")) e.setPais(end.get("pais"));
            u.setEndereco(e);
        }

        u = usuarioRepo.save(u);
        return toDTO(u);
    }

    @Transactional
    public UsuarioDTO alterarRole(UUID id, String role) {
        Usuario u = usuarioRepo.findById(id).orElseThrow(() -> new RuntimeException("Usuário não encontrado"));
        u.setRole(role.toLowerCase());
        // Editor ou superior → embaixador confirmado automaticamente
        if (List.of("admin", "moderador", "editor").contains(role.toLowerCase())) {
            u.setEmbaixadorConfirmado(true);
        }
        u = usuarioRepo.save(u);
        return toDTO(u);
    }

    @Transactional
    public UsuarioDTO alterarEmbaixador(UUID id, boolean confirmado) {
        Usuario u = usuarioRepo.findById(id).orElseThrow(() -> new RuntimeException("Usuário não encontrado"));
        u.setEmbaixadorConfirmado(confirmado);
        u.setStatus(confirmado ? "embaixador" : "em_formacao");
        u = usuarioRepo.save(u);
        return toDTO(u);
    }

    public Map<String, Object> estatisticas() {
        Map<String, Object> stats = new HashMap<>();
        stats.put("totalParticipantes", usuarioRepo.count());
        stats.put("totalEmbaixadores", usuarioRepo.countByEmbaixadorConfirmado(true));
        stats.put("totalContribuicoes", usuarioRepo.countByContribuiuPix(true));
        stats.put("valorTotal", usuarioRepo.somarValorContribuicoes());
        return stats;
    }

    // ===== Helpers =====

    public UsuarioDTO toDTO(Usuario u) {
        List<Progresso> progressos = progressoRepo.findByUsuarioId(u.getId());
        Map<String, List<String>> progMap = new HashMap<>();
        for (Progresso p : progressos) {
            progMap.computeIfAbsent(p.getModuloId(), k -> new ArrayList<>()).add(p.getAulaId());
        }

        List<Indicacao> indicacoes = indicacaoRepo.findByIndicadorId(u.getId());
        List<UsuarioDTO.IndicacaoDTO> indDTOs = indicacoes.stream().map(i -> UsuarioDTO.IndicacaoDTO.builder()
                .nomeIndicado(i.getNomeIndicado())
                .emailIndicado(i.getEmailIndicado())
                .dataIndicacao(i.getDataIndicacao() != null ? i.getDataIndicacao().toString() : "")
                .build()).collect(Collectors.toList());

        List<Contribuicao> contribs = contribuicaoRepo.findByUsuarioIdOrderByDataDesc(u.getId());
        List<UsuarioDTO.ContribuicaoItemDTO> contribDTOs = contribs.stream().map(c -> UsuarioDTO.ContribuicaoItemDTO.builder()
                .valor(c.getValor())
                .data(c.getData() != null ? c.getData().toString() : "")
                .forma(c.getForma())
                .build()).collect(Collectors.toList());

        Endereco end = u.getEndereco();
        UsuarioDTO.EnderecoDTO endDTO = end != null ? UsuarioDTO.EnderecoDTO.builder()
                .rua(end.getRua()).numero(end.getNumero()).bairro(end.getBairro())
                .cep(end.getCep()).cidade(end.getCidade()).estado(end.getEstado()).pais(end.getPais())
                .build() : new UsuarioDTO.EnderecoDTO();

        return UsuarioDTO.builder()
                .id(u.getId().toString())
                .numeroInscricao(u.getNumeroInscricao())
                .nome(u.getNome())
                .email(u.getEmail())
                .cpf(u.getCpf())
                .dataNascimento(u.getDataNascimento() != null ? u.getDataNascimento().toString() : "")
                .role(u.getRole())
                .status(u.getStatus())
                .dataCadastro(u.getDataCadastro() != null ? u.getDataCadastro().toString() : "")
                .ultimoAcesso(u.getUltimoAcesso() != null ? u.getUltimoAcesso().toString() : "")
                .codigoIndicacao(u.getCodigoIndicacao())
                .codigoIndicacaoUsado(u.getCodigoIndicacaoUsado())
                .embaixadorConfirmado(u.isEmbaixadorConfirmado())
                .contribuiuPix(u.isContribuiuPix())
                .valorContribuicao(u.getValorContribuicao())
                .dataContribuicao(u.getDataContribuicao() != null ? u.getDataContribuicao().toString() : null)
                .jaLogouAntes(u.isJaLogouAntes())
                .endereco(endDTO)
                .progresso(progMap)
                .indicacoes(indDTOs)
                .historicoContribuicoes(contribDTOs)
                .build();
    }

    private String gerarCodigoIndicacao() {
        String codigo;
        do {
            int num = 1000 + new Random().nextInt(9000);
            codigo = "EMB-" + num;
        } while (usuarioRepo.findByCodigoIndicacao(codigo).isPresent());
        return codigo;
    }
}
