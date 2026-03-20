package br.com.emanuel.embaixadores_backend.enums;

/**
 * Role — Define os papéis/cargos disponíveis no sistema.
 *
 * Hierarquia de permissões (do menor para o maior):
 * - EMBAIXADOR: papel padrão de todo usuário cadastrado. Acessa o dashboard e módulos.
 * - AUXILIAR: pode visualizar dados básicos no painel admin, mas não pode editar nada.
 * - EDITOR: pode criar e editar módulos e aulas no painel admin.
 * - MODERADOR: pode gerenciar campanhas, conteúdo e visualizar relatórios.
 * - ADMIN: acesso total — inclui dados financeiros, gerenciamento de usuários e permissões.
 */
public enum Role {
    EMBAIXADOR,  // Papel padrão — todo novo cadastro recebe este papel
    AUXILIAR,    // Somente visualização no painel admin
    EDITOR,      // Pode editar módulos e aulas
    MODERADOR,   // Gestão de campanhas e conteúdo
    ADMIN        // Acesso total ao sistema (inclusive financeiro)
}
