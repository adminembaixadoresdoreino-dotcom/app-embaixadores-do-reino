package br.com.emanuel.embaixadores_backend.enums;

/**
 * StatusUsuario — Ciclo de vida do embaixador na plataforma.
 *
 * O usuário progride por estas etapas conforme avança na formação:
 * 1. INTERESSADO  → Acabou de se cadastrar, ainda não acessou nenhum módulo
 * 2. CANDIDATO    → Já acessou pelo menos um módulo de formação
 * 3. EM_FORMACAO  → Está cursando os módulos ativamente
 * 4. CONCLUIDO    → Concluiu todos os módulos obrigatórios
 * 5. EMBAIXADOR   → Cumpriu todos os requisitos: formação + 3 indicações + contribuição PIX
 */
public enum StatusUsuario {
    INTERESSADO,    // Cadastro realizado, nenhuma ação ainda
    CANDIDATO,      // Iniciou a jornada (acessou pelo menos 1 módulo)
    EM_FORMACAO,    // Cursando os módulos de formação
    CONCLUIDO,      // Todos os módulos obrigatórios concluídos
    EMBAIXADOR      // Status final — embaixador confirmado com todos os requisitos
}
