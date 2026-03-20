package br.com.emanuel.embaixadores_backend.exception;

/**
 * NegocioException — Exceção personalizada para erros de regra de negócio.
 *
 * Lançada quando algo viola uma regra do sistema, como:
 * - Email já cadastrado
 * - Código de indicação inválido
 * - Senha incorreta
 *
 * Diferente de erros de sistema (500), estes são erros esperados (400).
 */
public class NegocioException extends RuntimeException {
    public NegocioException(String mensagem) {
        super(mensagem);
    }
}
