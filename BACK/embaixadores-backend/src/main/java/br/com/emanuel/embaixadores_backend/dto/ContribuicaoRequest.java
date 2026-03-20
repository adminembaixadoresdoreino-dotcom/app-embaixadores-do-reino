package br.com.emanuel.embaixadores_backend.dto;

import br.com.emanuel.embaixadores_backend.enums.TipoContribuicao;
import jakarta.validation.constraints.*;
import java.math.BigDecimal;

/**
 * ContribuicaoRequest — DTO para registrar uma nova contribuição financeira.
 */
public class ContribuicaoRequest {

    @NotNull(message = "O valor é obrigatório")
    @Positive(message = "O valor deve ser positivo")
    private BigDecimal valor;

    @NotNull(message = "O tipo de contribuição é obrigatório")
    private TipoContribuicao tipo;

    @Min(value = 1, message = "Mínimo de 1 parcela")
    @Max(value = 12, message = "Máximo de 12 parcelas")
    private Integer parcelas = 1;

    private String descricao;

    public BigDecimal getValor() { return valor; }
    public void setValor(BigDecimal valor) { this.valor = valor; }
    public TipoContribuicao getTipo() { return tipo; }
    public void setTipo(TipoContribuicao tipo) { this.tipo = tipo; }
    public Integer getParcelas() { return parcelas; }
    public void setParcelas(Integer parcelas) { this.parcelas = parcelas; }
    public String getDescricao() { return descricao; }
    public void setDescricao(String descricao) { this.descricao = descricao; }
}
