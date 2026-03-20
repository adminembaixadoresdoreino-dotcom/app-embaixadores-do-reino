package br.com.emanuel.embaixadores_backend.dto;

import lombok.*;
import java.util.List;
import java.util.Map;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class UsuarioDTO {
    private String id;
    private Long numeroInscricao;
    private String nome;
    private String email;
    private String cpf;
    private String dataNascimento;
    private String role;
    private String status;
    private String dataCadastro;
    private String ultimoAcesso;
    private String codigoIndicacao;
    private String codigoIndicacaoUsado;
    private boolean embaixadorConfirmado;
    private boolean contribuiuPix;
    private Double valorContribuicao;
    private String dataContribuicao;
    private boolean jaLogouAntes;
    private EnderecoDTO endereco;
    private Map<String, List<String>> progresso;
    private List<IndicacaoDTO> indicacoes;
    private List<ContribuicaoItemDTO> historicoContribuicoes;

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class EnderecoDTO {
        private String rua;
        private String numero;
        private String bairro;
        private String cep;
        private String cidade;
        private String estado;
        private String pais;
    }

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class IndicacaoDTO {
        private String nomeIndicado;
        private String emailIndicado;
        private String dataIndicacao;
    }

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class ContribuicaoItemDTO {
        private double valor;
        private String data;
        private String forma;
    }
}
