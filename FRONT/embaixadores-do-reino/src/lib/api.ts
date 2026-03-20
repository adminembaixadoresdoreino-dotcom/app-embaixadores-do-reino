/**
 * api.ts — Camada de comunicação com o Backend Spring Boot
 * 
 * Este arquivo centraliza TODAS as chamadas HTTP para o backend Java.
 * O backend roda em http://localhost:8080 (Spring Boot + PostgreSQL).
 * 
 * ESTRUTURA:
 * - BASE_URL: URL base do backend (configurável)
 * - Funções de autenticação (login, cadastro)
 * - Funções de usuário (listar, atualizar, alterar role)
 * - Funções de módulos e aulas (CRUD)
 * - Funções de progresso (salvar/consultar aulas concluídas)
 * - Funções de contribuições financeiras
 * - Funções de campanhas (CRUD + participação)
 * - Funções de indicações
 * - Funções de notificações
 * 
 * SESSÃO:
 * - Após login/cadastro, o usuário é salvo no localStorage como cache local
 * - O ID do usuário é enviado nas requisições que precisam de autenticação
 * - Não usamos JWT neste momento (pode ser adicionado depois)
 */

// =============================================
// CONFIGURAÇÃO
// =============================================

/** 
 * URL base do backend Spring Boot
 * Em produção (Lovable preview): usa caminho relativo (proxy do Vite redireciona)
 * Localmente: o Vite proxy redireciona /api → http://localhost:8081
 * 
 * INSTRUÇÕES PARA RODAR LOCALMENTE:
 * 1. No application.yaml do Spring Boot: server.port = 8081 (ou ajuste aqui)
 * 2. Frontend: npm run dev (roda na porta 5173)
 * 3. O proxy do Vite em vite.config.ts redireciona /api → localhost:8081
 */
const BASE_URL = "/api";

/**
 * Função auxiliar para fazer requisições HTTP
 * Trata erros e converte resposta para JSON automaticamente
 */
async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${BASE_URL}${endpoint}`;
  
  const config: RequestInit = {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  };

  try {
    const response = await fetch(url, config);

    // Se a resposta não tem conteúdo (204 No Content), retorna vazio
    if (response.status === 204) {
      return {} as T;
    }

    // Tenta parsear o JSON da resposta
    const data = await response.json().catch(() => null);

    // Se o status não é OK (2xx), lança erro com a mensagem do backend
    if (!response.ok) {
      const mensagem = data?.message || data?.erro || `Erro ${response.status}`;
      throw new Error(mensagem);
    }

    return data as T;
  } catch (error) {
    // Se é um erro de rede (backend offline), mostra mensagem amigável
    if (error instanceof TypeError && error.message === "Failed to fetch") {
      throw new Error("Não foi possível conectar ao servidor. Verifique se o backend está rodando na porta 8080.");
    }
    throw error;
  }
}

// =============================================
// TIPOS (espelham os DTOs do backend Java)
// =============================================

/** DTO de cadastro — enviado para POST /api/auth/cadastro */
export interface CadastroDTO {
  nome: string;
  email: string;
  senha: string;
  cpf: string;
  dataNascimento: string;
  rua: string;
  numero: string;
  bairro: string;
  cep: string;
  cidade: string;
  estado: string;
  pais: string;
  codigoIndicacao?: string;
}

/** DTO de login — enviado para POST /api/auth/login */
export interface LoginDTO {
  email: string;
  senha: string;
}

/** Resposta do login/cadastro — dados do usuário autenticado */
export interface UsuarioDTO {
  id: string;
  numeroInscricao: number;
  nome: string;
  email: string;
  cpf: string;
  dataNascimento: string;
  role: string;
  status: string;
  dataCadastro: string;
  ultimoAcesso: string;
  codigoIndicacao: string;
  codigoIndicacaoUsado?: string;
  embaixadorConfirmado: boolean;
  contribuiuPix: boolean;
  valorContribuicao?: number;
  dataContribuicao?: string;
  endereco: {
    rua: string;
    numero: string;
    bairro: string;
    cep: string;
    cidade: string;
    estado: string;
    pais: string;
  };
  progresso: Record<string, string[]>;
  indicacoes: Array<{
    nomeIndicado: string;
    emailIndicado: string;
    dataIndicacao: string;
  }>;
  historicoContribuicoes?: Array<{
    valor: number;
    data: string;
    forma: string;
  }>;
}

/** DTO de módulo retornado pelo backend */
export interface ModuloDTO {
  id: string;
  titulo: string;
  descricao: string;
  icone: string;
  mes: number;
  especial: boolean;
  mensagemFinal: string;
  aulas: AulaDTO[];
}

/** DTO de aula retornado pelo backend */
export interface AulaDTO {
  id: string;
  titulo: string;
  descricao: string;
  duracao: string;
  videoUrl?: string;
  semana: number;
  tipo: string;
}

/** DTO de campanha */
export interface CampanhaDTO {
  id: string;
  titulo: string;
  descricao: string;
  tipo: string;
  dataInicio: string;
  dataFim: string;
  ativa: boolean;
  participantes: string[];
  criadoPor: string;
  dataCriacao: string;
  numeroCampanha?: string;
  objetivo?: string;
  instrucoes?: string;
  unidadeRegistro?: string;
}

/** DTO de contribuição */
export interface ContribuicaoDTO {
  id?: string;
  usuarioId: string;
  valor: number;
  forma: string;
  data?: string;
}

/** DTO de notificação */
export interface NotificacaoDTO {
  id: string;
  titulo: string;
  mensagem: string;
  tipo: string;
  data: string;
  lida: boolean;
  usuarioId: string;
  campanhaId?: string;
}

/** DTO de registro de participação em campanha */
export interface RegistroParticipacaoDTO {
  id?: string;
  campanhaId: string;
  usuarioId: string;
  data?: string;
  quantidade: number;
  descricao?: string;
}

// =============================================
// AUTENTICAÇÃO
// =============================================

/**
 * Cadastra um novo usuário no sistema
 * POST /api/auth/cadastro
 */
export async function apiCadastro(dados: CadastroDTO): Promise<UsuarioDTO> {
  return request<UsuarioDTO>("/auth/cadastro", {
    method: "POST",
    body: JSON.stringify(dados),
  });
}

/**
 * Faz login com email e senha
 * POST /api/auth/login
 */
export async function apiLogin(dados: LoginDTO): Promise<UsuarioDTO> {
  return request<UsuarioDTO>("/auth/login", {
    method: "POST",
    body: JSON.stringify(dados),
  });
}

// =============================================
// USUÁRIOS
// =============================================

/**
 * Lista todos os usuários (admin)
 * GET /api/usuarios
 */
export async function apiListarUsuarios(): Promise<UsuarioDTO[]> {
  return request<UsuarioDTO[]>("/usuarios");
}

/**
 * Busca um usuário pelo ID
 * GET /api/usuarios/:id
 */
export async function apiGetUsuario(id: string): Promise<UsuarioDTO> {
  return request<UsuarioDTO>(`/usuarios/${id}`);
}

/**
 * Atualiza os dados de um usuário
 * PUT /api/usuarios/:id
 */
export async function apiAtualizarUsuario(id: string, dados: Partial<UsuarioDTO>): Promise<UsuarioDTO> {
  return request<UsuarioDTO>(`/usuarios/${id}`, {
    method: "PUT",
    body: JSON.stringify(dados),
  });
}

/**
 * Altera a role (permissão) de um usuário
 * PUT /api/usuarios/:id/role
 */
export async function apiAlterarRole(id: string, role: string): Promise<UsuarioDTO> {
  return request<UsuarioDTO>(`/usuarios/${id}/role`, {
    method: "PUT",
    body: JSON.stringify({ role }),
  });
}

/**
 * Torna um usuário embaixador confirmado (admin)
 * PUT /api/usuarios/:id/embaixador
 */
export async function apiTornarEmbaixador(id: string, confirmado: boolean): Promise<UsuarioDTO> {
  return request<UsuarioDTO>(`/usuarios/${id}/embaixador`, {
    method: "PUT",
    body: JSON.stringify({ embaixadorConfirmado: confirmado }),
  });
}

/**
 * Busca estatísticas gerais (admin)
 * GET /api/usuarios/estatisticas
 */
export async function apiEstatisticas(): Promise<{
  totalParticipantes: number;
  totalEmbaixadores: number;
  totalContribuicoes: number;
  valorTotal: number;
}> {
  return request("/usuarios/estatisticas");
}

// =============================================
// MÓDULOS E AULAS
// =============================================

/**
 * Lista todos os módulos com suas aulas
 * GET /api/modulos
 */
export async function apiListarModulos(): Promise<ModuloDTO[]> {
  return request<ModuloDTO[]>("/modulos");
}

/**
 * Busca um módulo pelo ID
 * GET /api/modulos/:id
 */
export async function apiGetModulo(id: string): Promise<ModuloDTO> {
  return request<ModuloDTO>(`/modulos/${id}`);
}

/**
 * Cria um novo módulo (admin/editor)
 * POST /api/modulos
 */
export async function apiCriarModulo(modulo: Partial<ModuloDTO>): Promise<ModuloDTO> {
  return request<ModuloDTO>("/modulos", {
    method: "POST",
    body: JSON.stringify(modulo),
  });
}

/**
 * Atualiza um módulo existente (admin/editor)
 * PUT /api/modulos/:id
 */
export async function apiAtualizarModulo(id: string, modulo: Partial<ModuloDTO>): Promise<ModuloDTO> {
  return request<ModuloDTO>(`/modulos/${id}`, {
    method: "PUT",
    body: JSON.stringify(modulo),
  });
}

/**
 * Exclui um módulo (admin)
 * DELETE /api/modulos/:id
 */
export async function apiExcluirModulo(id: string): Promise<void> {
  return request<void>(`/modulos/${id}`, { method: "DELETE" });
}

/**
 * Adiciona uma aula a um módulo
 * POST /api/modulos/:moduloId/aulas
 */
export async function apiAdicionarAula(moduloId: string, aula: Partial<AulaDTO>): Promise<AulaDTO> {
  return request<AulaDTO>(`/modulos/${moduloId}/aulas`, {
    method: "POST",
    body: JSON.stringify(aula),
  });
}

/**
 * Atualiza uma aula
 * PUT /api/modulos/:moduloId/aulas/:aulaId
 */
export async function apiAtualizarAula(moduloId: string, aulaId: string, aula: Partial<AulaDTO>): Promise<AulaDTO> {
  return request<AulaDTO>(`/modulos/${moduloId}/aulas/${aulaId}`, {
    method: "PUT",
    body: JSON.stringify(aula),
  });
}

/**
 * Exclui uma aula
 * DELETE /api/modulos/:moduloId/aulas/:aulaId
 */
export async function apiExcluirAula(moduloId: string, aulaId: string): Promise<void> {
  return request<void>(`/modulos/${moduloId}/aulas/${aulaId}`, { method: "DELETE" });
}

// =============================================
// PROGRESSO (AULAS CONCLUÍDAS)
// =============================================

/**
 * Marca uma aula como concluída
 * POST /api/progresso/:moduloId/:aulaId
 */
export async function apiSalvarProgresso(usuarioId: string, moduloId: string, aulaId: string): Promise<void> {
  return request<void>(`/progresso/${moduloId}/${aulaId}`, {
    method: "POST",
    body: JSON.stringify({ usuarioId }),
  });
}

/**
 * Busca o progresso completo de um usuário
 * GET /api/progresso/:usuarioId
 */
export async function apiGetProgresso(usuarioId: string): Promise<Record<string, string[]>> {
  return request<Record<string, string[]>>(`/progresso/${usuarioId}`);
}

// =============================================
// CONTRIBUIÇÕES FINANCEIRAS
// =============================================

/**
 * Registra uma nova contribuição
 * POST /api/contribuicoes
 */
export async function apiSalvarContribuicao(contribuicao: ContribuicaoDTO): Promise<ContribuicaoDTO> {
  return request<ContribuicaoDTO>("/contribuicoes", {
    method: "POST",
    body: JSON.stringify(contribuicao),
  });
}

/**
 * Busca o histórico de contribuições de um usuário
 * GET /api/contribuicoes/:usuarioId
 */
export async function apiGetContribuicoes(usuarioId: string): Promise<ContribuicaoDTO[]> {
  return request<ContribuicaoDTO[]>(`/contribuicoes/${usuarioId}`);
}

// =============================================
// INDICAÇÕES
// =============================================

/**
 * Registra uma indicação (quando alguém usa o código de indicação ao se cadastrar)
 * Isso já é feito automaticamente pelo endpoint de cadastro no backend
 * Mas caso precise registrar manualmente:
 * POST /api/indicacoes
 */
export async function apiRegistrarIndicacao(codigoIndicacao: string, nomeIndicado: string, emailIndicado: string): Promise<void> {
  return request<void>("/indicacoes", {
    method: "POST",
    body: JSON.stringify({ codigoIndicacao, nomeIndicado, emailIndicado }),
  });
}

// =============================================
// CAMPANHAS
// =============================================

/**
 * Lista todas as campanhas
 * GET /api/campanhas
 */
export async function apiListarCampanhas(): Promise<CampanhaDTO[]> {
  return request<CampanhaDTO[]>("/campanhas");
}

/**
 * Cria uma nova campanha
 * POST /api/campanhas
 */
export async function apiCriarCampanha(campanha: Partial<CampanhaDTO>): Promise<CampanhaDTO> {
  return request<CampanhaDTO>("/campanhas", {
    method: "POST",
    body: JSON.stringify(campanha),
  });
}

/**
 * Atualiza uma campanha existente
 * PUT /api/campanhas/:id
 */
export async function apiAtualizarCampanha(id: string, campanha: Partial<CampanhaDTO>): Promise<CampanhaDTO> {
  return request<CampanhaDTO>(`/campanhas/${id}`, {
    method: "PUT",
    body: JSON.stringify(campanha),
  });
}

/**
 * Exclui uma campanha
 * DELETE /api/campanhas/:id
 */
export async function apiExcluirCampanha(id: string): Promise<void> {
  return request<void>(`/campanhas/${id}`, { method: "DELETE" });
}

/**
 * Adiciona um participante a uma campanha
 * POST /api/campanhas/:campanhaId/participar/:usuarioId
 */
export async function apiParticiparCampanha(campanhaId: string, usuarioId: string): Promise<void> {
  return request<void>(`/campanhas/${campanhaId}/participar/${usuarioId}`, {
    method: "POST",
  });
}

/**
 * Remove um participante de uma campanha
 * DELETE /api/campanhas/:campanhaId/participar/:usuarioId
 */
export async function apiSairCampanha(campanhaId: string, usuarioId: string): Promise<void> {
  return request<void>(`/campanhas/${campanhaId}/participar/${usuarioId}`, {
    method: "DELETE",
  });
}

/**
 * Registra participação em uma campanha (ex: 3 terços rezados)
 * POST /api/campanhas/:campanhaId/registros
 */
export async function apiRegistrarParticipacao(registro: RegistroParticipacaoDTO): Promise<RegistroParticipacaoDTO> {
  return request<RegistroParticipacaoDTO>(`/campanhas/${registro.campanhaId}/registros`, {
    method: "POST",
    body: JSON.stringify(registro),
  });
}

/**
 * Busca registros de participação de uma campanha
 * GET /api/campanhas/:campanhaId/registros
 */
export async function apiGetRegistrosCampanha(campanhaId: string): Promise<RegistroParticipacaoDTO[]> {
  return request<RegistroParticipacaoDTO[]>(`/campanhas/${campanhaId}/registros`);
}

/**
 * Busca o ranking de uma campanha
 * GET /api/campanhas/:campanhaId/ranking
 */
export async function apiGetRankingCampanha(campanhaId: string): Promise<Array<{ usuarioId: string; total: number }>> {
  return request(`/campanhas/${campanhaId}/ranking`);
}

// =============================================
// NOTIFICAÇÕES
// =============================================

/**
 * Lista notificações de um usuário
 * GET /api/notificacoes/:usuarioId
 */
export async function apiGetNotificacoes(usuarioId: string): Promise<NotificacaoDTO[]> {
  return request<NotificacaoDTO[]>(`/notificacoes/${usuarioId}`);
}

/**
 * Marca uma notificação como lida
 * PUT /api/notificacoes/:notificacaoId/lida
 */
export async function apiMarcarNotificacaoLida(notificacaoId: string): Promise<void> {
  return request<void>(`/notificacoes/${notificacaoId}/lida`, {
    method: "PUT",
  });
}

/**
 * Envia notificação para todos os usuários
 * POST /api/notificacoes/todos
 */
export async function apiNotificarTodos(titulo: string, mensagem: string, tipo: string, campanhaId?: string): Promise<void> {
  return request<void>("/notificacoes/todos", {
    method: "POST",
    body: JSON.stringify({ titulo, mensagem, tipo, campanhaId }),
  });
}

/**
 * Envia notificação para um usuário específico
 * POST /api/notificacoes/:usuarioId
 */
export async function apiNotificarUsuario(usuarioId: string, titulo: string, mensagem: string, tipo: string): Promise<void> {
  return request<void>(`/notificacoes/${usuarioId}`, {
    method: "POST",
    body: JSON.stringify({ titulo, mensagem, tipo }),
  });
}

/**
 * Conta notificações não lidas
 * GET /api/notificacoes/:usuarioId/nao-lidas
 */
export async function apiContarNaoLidas(usuarioId: string): Promise<number> {
  return request<number>(`/notificacoes/${usuarioId}/nao-lidas`);
}

// =============================================
// SESSÃO LOCAL (cache do usuário logado)
// =============================================

/** Chave do localStorage para guardar o usuário logado (apenas como cache) */
const SESSAO_KEY = "embaixadores_sessao";

/**
 * Salva o usuário logado no cache local (localStorage)
 * Isso é usado para manter a sessão entre recarregamentos de página
 * Os dados "reais" estão no banco de dados PostgreSQL via backend
 */
export function salvarSessao(usuario: UsuarioDTO, lembrarMe: boolean = false): void {
  const sessao = {
    usuario,
    lembrarMe,
    expiraEm: lembrarMe
      ? new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString() // 48 horas
      : null,
  };
  localStorage.setItem(SESSAO_KEY, JSON.stringify(sessao));
}

/**
 * Recupera o usuário logado do cache local
 * Retorna null se não tem sessão ou se a sessão expirou
 */
export function getSessao(): UsuarioDTO | null {
  const data = localStorage.getItem(SESSAO_KEY);
  if (!data) return null;

  try {
    const sessao = JSON.parse(data);
    
    // Verifica se a sessão expirou (se estava com "lembrar-me")
    if (sessao.expiraEm && new Date(sessao.expiraEm) < new Date()) {
      localStorage.removeItem(SESSAO_KEY);
      return null;
    }
    
    return sessao.usuario;
  } catch {
    localStorage.removeItem(SESSAO_KEY);
    return null;
  }
}

/**
 * Atualiza os dados do usuário no cache local (sem alterar sessão)
 * Usado quando o backend retorna dados atualizados
 */
export function atualizarSessao(usuario: UsuarioDTO): void {
  const data = localStorage.getItem(SESSAO_KEY);
  if (!data) return;
  
  try {
    const sessao = JSON.parse(data);
    sessao.usuario = usuario;
    localStorage.setItem(SESSAO_KEY, JSON.stringify(sessao));
  } catch {
    // Se der erro, ignora
  }
}

/**
 * Remove a sessão local (logout)
 */
export function limparSessao(): void {
  localStorage.removeItem(SESSAO_KEY);
}
