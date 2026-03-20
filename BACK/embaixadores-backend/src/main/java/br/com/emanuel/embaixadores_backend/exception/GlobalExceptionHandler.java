package br.com.emanuel.embaixadores_backend.exception;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

/**
 * GlobalExceptionHandler — Tratamento global de exceções da API.
 *
 * @RestControllerAdvice: intercepta exceções de TODOS os controllers.
 * Em vez de retornar um stack trace feio, retorna um JSON amigável com a mensagem de erro.
 *
 * Exemplo de resposta para NegocioException:
 * {
 *   "timestamp": "2024-01-15T10:30:00",
 *   "status": 400,
 *   "erro": "Este email já está cadastrado"
 * }
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

    /**
     * Trata exceções de negócio (regras violadas).
     * Retorna HTTP 400 (Bad Request) com a mensagem de erro.
     */
    @ExceptionHandler(NegocioException.class)
    public ResponseEntity<Map<String, Object>> handleNegocio(NegocioException ex) {
        Map<String, Object> body = new HashMap<>();
        body.put("timestamp", LocalDateTime.now());
        body.put("status", HttpStatus.BAD_REQUEST.value());
        body.put("erro", ex.getMessage());
        return ResponseEntity.badRequest().body(body);
    }

    /**
     * Trata erros de validação (@Valid falhou).
     * Retorna HTTP 400 com a lista de campos inválidos e suas mensagens.
     *
     * Exemplo:
     * {
     *   "timestamp": "...",
     *   "status": 400,
     *   "erros": {
     *     "nome": "O nome é obrigatório",
     *     "email": "Email inválido"
     *   }
     * }
     */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> handleValidation(MethodArgumentNotValidException ex) {
        Map<String, String> erros = new HashMap<>();
        for (FieldError fe : ex.getBindingResult().getFieldErrors()) {
            erros.put(fe.getField(), fe.getDefaultMessage());
        }
        Map<String, Object> body = new HashMap<>();
        body.put("timestamp", LocalDateTime.now());
        body.put("status", HttpStatus.BAD_REQUEST.value());
        body.put("erros", erros);
        return ResponseEntity.badRequest().body(body);
    }

    /**
     * Trata qualquer exceção não prevista (erros do sistema).
     * Retorna HTTP 500 (Internal Server Error).
     */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, Object>> handleGeneral(Exception ex) {
        Map<String, Object> body = new HashMap<>();
        body.put("timestamp", LocalDateTime.now());
        body.put("status", HttpStatus.INTERNAL_SERVER_ERROR.value());
        body.put("erro", "Erro interno do servidor");
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(body);
    }
}
