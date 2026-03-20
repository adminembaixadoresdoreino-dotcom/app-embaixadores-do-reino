/**
 * campanhas.ts — Sistema de campanhas e notificações
 * 
 * REFATORADO: Agora usa a camada de API (api.ts) para se comunicar
 * com o backend Spring Boot. Todas as operações de CRUD vão para o banco.
 * 
 * Funções síncronas foram mantidas para compatibilidade, mas internamente
 * chamam as funções async da API e tratam erros silenciosamente.
 */

import {
  apiListarCampanhas,
  apiCriarCampanha,
  apiAtualizarCampanha,
  apiExcluirCampanha as apiExcluirCampanhaHttp,
  apiParticiparCampanha,
  apiSairCampanha as apiSairCampanhaHttp,
  apiRegistrarParticipacao as apiRegistrarParticipacaoHttp,
  apiGetRegistrosCampanha,
  apiGetRankingCampanha,
  apiGetNotificacoes,
  apiMarcarNotificacaoLida,
  apiNotificarTodos,
  apiNotificarUsuario,
  apiContarNaoLidas,
  type CampanhaDTO,
  type NotificacaoDTO,
  type RegistroParticipacaoDTO,
} from "./api";

// =============================================
// INTERFACES (mantidas para compatibilidade)
// =============================================

export interface RegistroParticipacao {
  id: string;
  campanhaId: string;
  usuarioId: string;
  data: string;
  quantidade: number;
  descricao?: string;
}

export interface Campanha {
  id: string;
  titulo: string;
  descricao: string;
  tipo: "oracao" | "jejum" | "missionaria" | "social" | "novos_embaixadores";
  dataInicio: string;
  dataFim: string;
  ativa: boolean;
  participantes: string[];
  criadoPor: string;
  dataCriacao: string;
  objetivo?: string;
  instrucoes?: string;
  numeroCampanha?: string;
  unidadeRegistro?: string;
}

export interface Notificacao {
  id: string;
  titulo: string;
  mensagem: string;
  tipo: "campanha" | "video" | "evento" | "mensagem";
  data: string;
  lida: boolean;
  usuarioId: string;
  campanhaId?: string;
}

// =============================================
// CACHE LOCAL (para chamadas síncronas)
// =============================================

let _campanhasCache: Campanha[] = [];
let _notificacoesCache: Map<string, Notificacao[]> = new Map();

// =============================================
// FUNÇÕES DE CAMPANHA — ASYNC (BACKEND)
// =============================================

/** Busca campanhas do backend e atualiza o cache */
export async function fetchCampanhas(): Promise<Campanha[]> {
  try {
    const dtos = await apiListarCampanhas();
    _campanhasCache = dtos.map(converterCampanhaDTO);
    return _campanhasCache;
  } catch (err) {
    console.error("Erro ao buscar campanhas:", err);
    return _campanhasCache;
  }
}

/** Cria uma nova campanha — via API */
export async function criarCampanhaAsync(campanha: Partial<CampanhaDTO>): Promise<Campanha> {
  const dto = await apiCriarCampanha(campanha);
  const nova = converterCampanhaDTO(dto);
  _campanhasCache.push(nova);
  return nova;
}

/** Atualiza uma campanha — via API */
export async function atualizarCampanhaAsync(id: string, dados: Partial<CampanhaDTO>): Promise<Campanha> {
  const dto = await apiAtualizarCampanha(id, dados);
  const atualizada = converterCampanhaDTO(dto);
  const idx = _campanhasCache.findIndex(c => c.id === id);
  if (idx !== -1) _campanhasCache[idx] = atualizada;
  return atualizada;
}

/** Exclui uma campanha — via API */
export async function excluirCampanhaAsync(id: string): Promise<void> {
  await apiExcluirCampanhaHttp(id);
  _campanhasCache = _campanhasCache.filter(c => c.id !== id);
}

/** Participa de uma campanha — via API */
export async function participarCampanhaAsync(campanhaId: string, usuarioId: string): Promise<void> {
  await apiParticiparCampanha(campanhaId, usuarioId);
  const c = _campanhasCache.find(x => x.id === campanhaId);
  if (c && !c.participantes.includes(usuarioId)) {
    c.participantes.push(usuarioId);
  }
}

/** Sai de uma campanha — via API */
export async function sairCampanhaAsync(campanhaId: string, usuarioId: string): Promise<void> {
  await apiSairCampanhaHttp(campanhaId, usuarioId);
  const c = _campanhasCache.find(x => x.id === campanhaId);
  if (c) {
    c.participantes = c.participantes.filter(id => id !== usuarioId);
  }
}

/** Registra participação — via API */
export async function registrarParticipacaoAsync(campanhaId: string, usuarioId: string, quantidade: number, descricao?: string): Promise<void> {
  await apiRegistrarParticipacaoHttp({
    campanhaId,
    usuarioId,
    quantidade,
    descricao,
  });
}

/** Busca ranking de uma campanha — via API */
export async function fetchRankingCampanha(campanhaId: string): Promise<Array<{ usuarioId: string; total: number }>> {
  try {
    return await apiGetRankingCampanha(campanhaId);
  } catch {
    return [];
  }
}

/** Busca registros de uma campanha — via API */
export async function fetchRegistrosCampanha(campanhaId: string): Promise<RegistroParticipacaoDTO[]> {
  try {
    return await apiGetRegistrosCampanha(campanhaId);
  } catch {
    return [];
  }
}

// =============================================
// FUNÇÕES SÍNCRONAS (COMPATIBILIDADE)
// Usam o cache local, chamam API em background
// =============================================

/** Retorna campanhas do cache */
export function getCampanhas(): Campanha[] {
  return _campanhasCache;
}

/** Salva campanha (síncrono — chama API em background) */
export function salvarCampanha(campanha: Campanha): void {
  const idx = _campanhasCache.findIndex(c => c.id === campanha.id);
  if (idx !== -1) {
    _campanhasCache[idx] = campanha;
    apiAtualizarCampanha(campanha.id, campanha as any).catch(err => 
      console.error("Erro ao atualizar campanha:", err)
    );
  } else {
    _campanhasCache.push(campanha);
    apiCriarCampanha(campanha as any).catch(err => 
      console.error("Erro ao criar campanha:", err)
    );
  }
}

/** Exclui campanha (síncrono — chama API em background) */
export function excluirCampanha(id: string): void {
  _campanhasCache = _campanhasCache.filter(c => c.id !== id);
  apiExcluirCampanhaHttp(id).catch(err =>
    console.error("Erro ao excluir campanha:", err)
  );
}

/** Participa de campanha (síncrono) */
export function participarCampanha(campanhaId: string, usuarioId: string): void {
  const c = _campanhasCache.find(x => x.id === campanhaId);
  if (c && !c.participantes.includes(usuarioId)) {
    c.participantes.push(usuarioId);
  }
  apiParticiparCampanha(campanhaId, usuarioId).catch(err =>
    console.error("Erro ao participar:", err)
  );
}

/** Sai de campanha (síncrono) */
export function sairCampanha(campanhaId: string, usuarioId: string): void {
  const c = _campanhasCache.find(x => x.id === campanhaId);
  if (c) {
    c.participantes = c.participantes.filter(id => id !== usuarioId);
  }
  apiSairCampanhaHttp(campanhaId, usuarioId).catch(err =>
    console.error("Erro ao sair:", err)
  );
}

/** Registra participação (síncrono) */
export function registrarParticipacao(campanhaId: string, usuarioId: string, quantidade: number, descricao?: string): void {
  apiRegistrarParticipacaoHttp({ campanhaId, usuarioId, quantidade, descricao }).catch(err =>
    console.error("Erro ao registrar participação:", err)
  );
}

/** Soma total de registros de um usuário em uma campanha (placeholder — precisa de API) */
export function getTotalRegistrosUsuario(_campanhaId: string, _usuarioId: string): number {
  // Esta função precisa buscar do backend — retorna 0 por enquanto
  // Use fetchRegistrosCampanha para dados reais
  return 0;
}

/** Soma total de todos os registros de uma campanha (placeholder) */
export function getTotalRegistrosCampanha(_campanhaId: string): number {
  return 0;
}

/** Ranking de campanha (síncrono — usa cache, busque com fetchRankingCampanha) */
export function getRankingCampanha(_campanhaId: string): Array<{ usuarioId: string; total: number }> {
  return [];
}

export function getTotalRegistrosCampanhaReal(_campanhaId: string): number {
  return 0;
}

export function getRegistros(_campanhaId: string): RegistroParticipacao[] {
  return [];
}

export function getRegistrosUsuario(_campanhaId: string, _usuarioId: string): RegistroParticipacao[] {
  return [];
}

/** Calcula quantos dias faltam para uma campanha encerrar */
export function diasRestantesCampanha(campanha: Campanha): number {
  const fim = new Date(campanha.dataFim);
  const agora = new Date();
  return Math.max(0, Math.ceil((fim.getTime() - agora.getTime()) / (1000 * 60 * 60 * 24)));
}

// =============================================
// NOTIFICAÇÕES — ASYNC (BACKEND)
// =============================================

/** Busca notificações de um usuário — via API */
export async function fetchNotificacoes(usuarioId: string): Promise<Notificacao[]> {
  try {
    const dtos = await apiGetNotificacoes(usuarioId);
    const notifs = dtos.map(converterNotificacaoDTO);
    _notificacoesCache.set(usuarioId, notifs);
    return notifs;
  } catch {
    return _notificacoesCache.get(usuarioId) || [];
  }
}

/** Conta notificações não lidas — via API */
export async function fetchContarNaoLidas(usuarioId: string): Promise<number> {
  try {
    return await apiContarNaoLidas(usuarioId);
  } catch {
    return 0;
  }
}

/** Marca como lida — via API */
export async function marcarNotificacaoLidaAsync(notificacaoId: string): Promise<void> {
  await apiMarcarNotificacaoLida(notificacaoId);
}

/** Notifica todos — via API */
export async function criarNotificacaoParaTodosAsync(titulo: string, mensagem: string, tipo: string, campanhaId?: string): Promise<void> {
  await apiNotificarTodos(titulo, mensagem, tipo, campanhaId);
}

/** Notifica um usuário — via API */
export async function criarNotificacaoParaUsuarioAsync(usuarioId: string, titulo: string, mensagem: string, tipo: string): Promise<void> {
  await apiNotificarUsuario(usuarioId, titulo, mensagem, tipo);
}

// =============================================
// FUNÇÕES SÍNCRONAS DE NOTIFICAÇÃO (COMPATIBILIDADE)
// =============================================

/** Retorna notificações do cache */
export function getNotificacoes(usuarioId: string): Notificacao[] {
  return (_notificacoesCache.get(usuarioId) || []).sort(
    (a, b) => new Date(b.data).getTime() - new Date(a.data).getTime()
  );
}

/** Marca como lida (síncrono — chama API em background) */
export function marcarNotificacaoLida(notificacaoId: string): void {
  // Atualiza cache local
  _notificacoesCache.forEach((notifs) => {
    const n = notifs.find(x => x.id === notificacaoId);
    if (n) n.lida = true;
  });
  apiMarcarNotificacaoLida(notificacaoId).catch(err =>
    console.error("Erro ao marcar como lida:", err)
  );
}

/** Notifica todos (síncrono) */
export function criarNotificacaoParaTodos(titulo: string, mensagem: string, tipo: Notificacao["tipo"], campanhaId?: string): void {
  apiNotificarTodos(titulo, mensagem, tipo, campanhaId).catch(err =>
    console.error("Erro ao notificar todos:", err)
  );
}

/** Notifica um usuário (síncrono) */
export function criarNotificacaoParaUsuario(usuarioId: string, titulo: string, mensagem: string, tipo: Notificacao["tipo"]): void {
  apiNotificarUsuario(usuarioId, titulo, mensagem, tipo).catch(err =>
    console.error("Erro ao notificar usuário:", err)
  );
}

/** Conta não lidas do cache */
export function contarNaoLidas(usuarioId: string): number {
  return getNotificacoes(usuarioId).filter(n => !n.lida).length;
}

// =============================================
// CONVERSORES DTO → TIPO LOCAL
// =============================================

function converterCampanhaDTO(dto: CampanhaDTO): Campanha {
  return {
    id: dto.id,
    titulo: dto.titulo,
    descricao: dto.descricao,
    tipo: (dto.tipo as Campanha["tipo"]) || "oracao",
    dataInicio: dto.dataInicio,
    dataFim: dto.dataFim,
    ativa: dto.ativa ?? true,
    participantes: dto.participantes || [],
    criadoPor: dto.criadoPor || "",
    dataCriacao: dto.dataCriacao || new Date().toISOString(),
    numeroCampanha: dto.numeroCampanha,
    objetivo: dto.objetivo,
    instrucoes: dto.instrucoes,
    unidadeRegistro: dto.unidadeRegistro,
  };
}

function converterNotificacaoDTO(dto: NotificacaoDTO): Notificacao {
  return {
    id: dto.id,
    titulo: dto.titulo,
    mensagem: dto.mensagem,
    tipo: (dto.tipo as Notificacao["tipo"]) || "mensagem",
    data: dto.data,
    lida: dto.lida ?? false,
    usuarioId: dto.usuarioId,
    campanhaId: dto.campanhaId,
  };
}

// =============================================
// CONSTANTES AUXILIARES
// =============================================

export const TIPO_CAMPANHA_LABELS: Record<Campanha["tipo"], string> = {
  oracao: "Oração",
  jejum: "Jejum",
  missionaria: "Missionária",
  social: "Social",
  novos_embaixadores: "Novos Embaixadores",
};

export const UNIDADE_PADRAO: Record<Campanha["tipo"], string> = {
  oracao: "terços",
  jejum: "dias de jejum",
  missionaria: "ações",
  social: "ações",
  novos_embaixadores: "convites",
};
