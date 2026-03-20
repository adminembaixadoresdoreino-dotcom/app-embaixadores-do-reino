package br.com.emanuel.embaixadores_backend.enums;

/**
 * TipoContribuicao — Formas de pagamento aceitas na "Economia do Reino".
 *
 * O sistema aceita contribuições financeiras por 4 métodos:
 * - PIX: transferência instantânea (requisito obrigatório para virar embaixador)
 * - BOLETO: boleto bancário
 * - CARTAO_DEBITO: pagamento por cartão de débito
 * - CARTAO_CREDITO: pagamento por cartão de crédito (parcelável em até 12x)
 */
public enum TipoContribuicao {
    PIX,              // Transferência PIX (obrigatório para ser embaixador)
    BOLETO,           // Boleto bancário
    CARTAO_DEBITO,    // Cartão de débito
    CARTAO_CREDITO    // Cartão de crédito (aceita parcelamento até 12x)
}
