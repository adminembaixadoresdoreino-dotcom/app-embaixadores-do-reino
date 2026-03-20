/**
 * dados.ts — Tipos, constantes e funções de lógica de negócio
 * 
 * REFATORADO: Agora usa a camada de API (api.ts) para se comunicar
 * com o backend Spring Boot. O localStorage é usado apenas como
 * cache da sessão do usuário logado.
 * 
 * Contém:
 * - Tipos/Interfaces (Usuario, Modulo, Aula, etc.)
 * - Dados mockados dos módulos (usados como fallback se o backend não responder)
 * - Funções de acesso aos dados (agora com versões async para API)
 * - Lógica de status, permissões e liberação temporal (pura, sem I/O)
 */

import {
  apiListarModulos,
  apiSalvarProgresso,
  apiGetProgresso,
  apiSalvarContribuicao as apiSalvarContribuicaoHttp,
  apiGetUsuario,
  apiAtualizarUsuario,
  apiAlterarRole,
  apiTornarEmbaixador,
  apiListarUsuarios,
  getSessao,
  atualizarSessao,
  type UsuarioDTO,
  type ModuloDTO,
} from "./api";

// =============================================
// TIPOS E INTERFACES
// =============================================

/** Status possíveis de um usuário na jornada de formação */
export type StatusUsuario = "interessado" | "candidato" | "em_formacao" | "formacao_concluida" | "embaixador";

/** Roles (papéis) de permissão do usuário no sistema */
export type RoleUsuario = "embaixador" | "admin" | "moderador" | "auxiliar" | "editor";

/** Rótulos legíveis para cada status */
export const STATUS_LABELS: Record<StatusUsuario, string> = {
  interessado: "Interessado",
  candidato: "Candidato",
  em_formacao: "Em Formação",
  formacao_concluida: "Formação Concluída",
  embaixador: "Embaixador do Reino",
};

/** Classes CSS (Tailwind) para as badges de status */
export const STATUS_CORES: Record<StatusUsuario, string> = {
  interessado: "bg-muted-foreground/30 text-muted-foreground",
  candidato: "bg-blue-100 text-blue-700",
  em_formacao: "bg-amber-100 text-amber-700",
  formacao_concluida: "bg-emerald-100 text-emerald-700",
  embaixador: "bg-gold/20 text-gold-dark",
};

/** Representa uma indicação feita pelo embaixador */
export interface Indicacao {
  nomeIndicado: string;
  emailIndicado: string;
  dataIndicacao: string;
}

/** Endereço do usuário */
export interface Endereco {
  rua: string;
  numero: string;
  bairro: string;
  cep: string;
  cidade: string;
  estado: string;
  pais: string;
}

/** Registro de uma contribuição financeira */
export interface ContribuicaoRegistro {
  valor: number;
  data: string;
  forma: string;
}

/** Interface principal do Usuário */
export interface Usuario {
  id: string;
  numeroInscricao?: number;
  nome: string;
  email: string;
  senha?: string;
  cpf: string;
  dataNascimento: string;
  endereco: Endereco;
  role: RoleUsuario;
  status: StatusUsuario;
  dataCadastro: string;
  ultimoAcesso: string;
  progresso: Record<string, string[]>;
  codigoIndicacao: string;
  codigoIndicacaoUsado?: string;
  indicacoes: Indicacao[];
  contribuiuPix: boolean;
  valorContribuicao?: number;
  dataContribuicao?: string;
  historicoContribuicoes?: ContribuicaoRegistro[];
  embaixadorConfirmado: boolean;
  lembrarMe?: boolean;
  lembrarMeExpira?: string;
  jaLogouAntes?: boolean;
}

/** Uma aula dentro de um módulo */
export interface Aula {
  id: string;
  titulo: string;
  descricao: string;
  duracao: string;
  videoUrl?: string;
  semana: number;
  tipo: "video" | "live";
}

/** Um módulo de formação */
export interface Modulo {
  id: string;
  titulo: string;
  descricao: string;
  icone: string;
  mes: number;
  aulas: Aula[];
  mensagemFinal: string;
  especial?: boolean;
}

// =============================================
// DADOS MOCKADOS DOS MÓDULOS (FALLBACK)
// Usados se o backend não retornar módulos
// =============================================

export const modulosMock: Modulo[] = [
  {
    id: "mod-1",
    titulo: "Visão do Reino",
    descricao: "Identidade do Reino — As Duas Bandeiras: entenda o Reino de Deus, o anti-reino e a grande decisão de pertencer ao Emanuel.",
    icone: "crown",
    mes: 1,
    mensagemFinal: "🎉 Parabéns! Você concluiu o primeiro mês de formação — Visão do Reino. A base está lançada!",
    aulas: [
      { id: "aula-1-1", titulo: "O Reino de Deus — Amor de Deus", descricao: "Descubra a essência do Reino e o amor que o sustenta.", duracao: "20 min", semana: 1, tipo: "video" },
      { id: "aula-1-2", titulo: "O Anti-reino: o Reino das Trevas", descricao: "Compreenda o pecado e as trevas que se opõem ao Reino.", duracao: "18 min", semana: 1, tipo: "video" },
      { id: "aula-1-3", titulo: "O Rei se fez Emanuel — Jesus Salvador", descricao: "Jesus, o Rei que se fez um de nós para nos salvar.", duracao: "22 min", semana: 2, tipo: "video" },
      { id: "aula-1-4", titulo: "O mundo: lugar da luta entre os Reinos", descricao: "Fé, conversão e a batalha espiritual no cotidiano.", duracao: "19 min", semana: 2, tipo: "video" },
      { id: "aula-1-5", titulo: "A grande decisão: pertencer ao Reino", descricao: "O senhorio de Jesus e a decisão que muda tudo.", duracao: "15 min", semana: 3, tipo: "video" },
      { id: "aula-1-6", titulo: "O Reino e a Igreja — Batismo no Espírito", descricao: "A relação entre o Reino, a Igreja e o Batismo no Espírito.", duracao: "25 min", semana: 3, tipo: "video" },
      { id: "aula-1-7", titulo: "Ato Profético: Renovação das Promessas do Batismo", descricao: "Cerimônia ao vivo — Renovação das Promessas do Batismo.", duracao: "Live", semana: 4, tipo: "live" },
    ],
  },
  {
    id: "mod-2",
    titulo: "Organização do Reino",
    descricao: "Vida em Comunidade — O Rei legisla, luta e alimenta. Valores, cultura, louvor, adoração e a economia do Reino.",
    icone: "music",
    mes: 2,
    mensagemFinal: "🙌 Você completou o segundo mês! Agora entende a organização do Reino e a cultura do louvor e adoração!",
    aulas: [
      { id: "aula-2-1", titulo: "O Rei legisla — Valores do Reino", descricao: "Os Mandamentos e o amor que se torna obediência filial.", duracao: "22 min", semana: 1, tipo: "video" },
      { id: "aula-2-2", titulo: "O Rei luta — protege e traz segurança", descricao: "A proteção divina e a segurança no Reino.", duracao: "18 min", semana: 1, tipo: "video" },
      { id: "aula-2-3", titulo: "Cultura do Reino: Louvor e Adoração", descricao: "O louvor e adoração como cultura do Céu na terra.", duracao: "25 min", semana: 2, tipo: "video" },
      { id: "aula-2-4", titulo: "Antivalores e Anticultura do Reino", descricao: "Reconheça o que se opõe à cultura do Reino.", duracao: "20 min", semana: 2, tipo: "video" },
      { id: "aula-2-5", titulo: "O Rei alimenta — Vida espiritual", descricao: "A vida espiritual como alimento que o Rei provê.", duracao: "19 min", semana: 3, tipo: "video" },
      { id: "aula-2-6", titulo: "A Economia do Reino", descricao: "Como o Reino se sustenta e se expande através dos fiéis.", duracao: "17 min", semana: 3, tipo: "video" },
      { id: "aula-2-7", titulo: "Ato Profético: Consagração ao Rei", descricao: "Cerimônia ao vivo — Consagração e compromisso com o Rei.", duracao: "Live", semana: 4, tipo: "live" },
    ],
  },
  {
    id: "mod-3",
    titulo: "Embaixadores do Reino",
    descricao: "Servos e filhos — não escravos. Manter e expandir o Reino. A missão do Embaixador.",
    icone: "heart",
    mes: 3,
    mensagemFinal: "❤️ Formação concluída! Você está pronto(a) para ser enviado(a) como Embaixador(a) do Reino!",
    aulas: [
      { id: "aula-3-1", titulo: "Servos e filhos, não escravos", descricao: "A identidade de servo-filho no Reino.", duracao: "20 min", semana: 1, tipo: "video" },
      { id: "aula-3-2", titulo: "Manter o Reino — Economia do Reino", descricao: "Como cada embaixador sustenta a missão.", duracao: "22 min", semana: 1, tipo: "video" },
      { id: "aula-3-3", titulo: "Expandir o Reino — A missão", descricao: "A responsabilidade de propagar os valores do Reino.", duracao: "18 min", semana: 2, tipo: "video" },
      { id: "aula-3-4", titulo: "Embaixadores: propagadores dos valores", descricao: "O que significa ser propagador na prática.", duracao: "20 min", semana: 2, tipo: "video" },
      { id: "aula-3-5", titulo: "Identidade e missão do Embaixador", descricao: "Sua identidade e chamado como Embaixador do Reino.", duracao: "25 min", semana: 3, tipo: "video" },
      { id: "aula-3-6", titulo: "Ato Profético: Cerimônia de Envio", descricao: "Cerimônia ao vivo — Envio oficial dos Embaixadores do Reino.", duracao: "Live", semana: 4, tipo: "live" },
    ],
  },
  {
    id: "mod-envio",
    titulo: "Cerimônia de Envio",
    descricao: "Você completou todos os requisitos! Participe da Cerimônia de Envio oficial dos Embaixadores do Reino.",
    icone: "award",
    mes: 4,
    especial: true,
    mensagemFinal: "👑 Você foi oficialmente enviado como Embaixador(a) do Reino! Que Deus abençoe sua missão!",
    aulas: [
      { id: "aula-envio-1", titulo: "Preparação para o Envio", descricao: "Reflexão final e preparação espiritual para o envio.", duracao: "15 min", semana: 1, tipo: "video" },
      { id: "aula-envio-2", titulo: "Cerimônia de Envio dos Embaixadores", descricao: "Cerimônia ao vivo — Envio oficial e recebimento do certificado digital.", duracao: "Live", semana: 1, tipo: "live" },
    ],
  },
];

// =============================================
// CACHE DE MÓDULOS (para não ficar chamando a API toda hora)
// =============================================

let _modulosCache: Modulo[] | null = null;

/**
 * Busca os módulos do backend. Se falhar, usa os dados mockados.
 * O resultado é cacheado na memória para evitar chamadas repetidas.
 */
export async function fetchModulos(): Promise<Modulo[]> {
  if (_modulosCache) return _modulosCache;
  try {
    const dados = await apiListarModulos();
    _modulosCache = dados.map(converterModuloDTO);
    return _modulosCache;
  } catch {
    console.warn("Backend indisponível, usando módulos mockados");
    return modulosMock;
  }
}

/** Invalida o cache de módulos (após edição pelo admin) */
export function invalidarCacheModulos(): void {
  _modulosCache = null;
}

/** 
 * Salva módulos editados — via API
 * No backend, cada módulo é atualizado individualmente.
 * Aqui atualizamos o cache local e enviamos para o backend em background.
 */
export function salvarModulos(modulos: Modulo[]): void {
  _modulosCache = modulos;
  // Envia cada módulo atualizado para o backend
  modulos.forEach((m) => {
    import("./api").then(({ apiAtualizarModulo }) => {
      apiAtualizarModulo(m.id, m as any).catch((err) =>
        console.error("Erro ao salvar módulo no backend:", err)
      );
    });
  });
}

/** 
 * Restaura os módulos ao padrão (mockados)
 * Invalida o cache para que o próximo fetch traga os dados do backend
 */
export function resetarModulos(): void {
  _modulosCache = null;
  // Os módulos padrão serão retornados pelo getModulos() via mock
  console.log("Módulos restaurados ao padrão. Recarregue para buscar do backend.");
}

/** Converte ModuloDTO do backend para o tipo Modulo do frontend */
function converterModuloDTO(dto: ModuloDTO): Modulo {
  return {
    id: dto.id,
    titulo: dto.titulo,
    descricao: dto.descricao,
    icone: dto.icone,
    mes: dto.mes,
    especial: dto.especial || false,
    mensagemFinal: dto.mensagemFinal || "",
    aulas: (dto.aulas || []).map((a) => ({
      id: a.id,
      titulo: a.titulo,
      descricao: a.descricao,
      duracao: a.duracao,
      videoUrl: a.videoUrl,
      semana: a.semana,
      tipo: (a.tipo as "video" | "live") || "video",
    })),
  };
}

// =============================================
// FUNÇÕES SÍNCRONAS DE MÓDULOS (compatibilidade)
// Usam o cache ou fallback para mocks
// =============================================

/** Retorna módulos do cache ou mocks (síncrono — para compatibilidade) */
export function getModulos(): Modulo[] {
  return _modulosCache || modulosMock;
}

/** Retorna apenas os módulos de formação (sem cerimônia) */
export function getModulosFormacao(): Modulo[] {
  return getModulos().filter((m) => !m.especial);
}

/** Retorna o módulo especial de Cerimônia de Envio */
export function getModuloEnvio(): Modulo | undefined {
  return getModulos().find((m) => m.especial);
}

// Atalhos estáticos (compatibilidade)
export const modulosFormacao = modulosMock.filter((m) => !m.especial);
export const moduloEnvio = modulosMock.find((m) => m.especial)!;

// =============================================
// FUNÇÕES DE USUÁRIO
// =============================================

/** Gera um código de indicação aleatório no formato "EMB-XXXX" */
function gerarCodigoIndicacao(): string {
  const num = Math.floor(1000 + Math.random() * 9000);
  return `EMB-${num}`;
}

/**
 * seedAdmin — NÃO É MAIS NECESSÁRIO
 * O backend Java cria o admin automaticamente via DataLoader ou migration.
 * Mantido como função vazia para não quebrar o main.tsx
 */
export function seedAdmin() {
  // O backend Java já cria o admin padrão automaticamente
  // Nenhuma ação necessária no frontend
  console.log("Admin seed é gerenciado pelo backend Java");
}

/**
 * Retorna o usuário logado do cache de sessão
 * Os dados vêm do backend via login/cadastro e são cacheados localmente
 */
export function getUsuarioAtual(): Usuario | null {
  const sessao = getSessao();
  if (!sessao) return null;
  return converterUsuarioDTO(sessao);
}

/**
 * Busca o usuário atualizado do backend e atualiza o cache local
 * Útil para garantir que os dados estão sincronizados
 */
export async function refreshUsuarioAtual(): Promise<Usuario | null> {
  const sessao = getSessao();
  if (!sessao) return null;
  try {
    const atualizado = await apiGetUsuario(sessao.id);
    atualizarSessao(atualizado);
    return converterUsuarioDTO(atualizado);
  } catch {
    return converterUsuarioDTO(sessao);
  }
}

/** Converte UsuarioDTO do backend para o tipo Usuario do frontend */
export function converterUsuarioDTO(dto: UsuarioDTO): Usuario {
  return {
    id: dto.id,
    numeroInscricao: dto.numeroInscricao,
    nome: dto.nome,
    email: dto.email,
    cpf: dto.cpf || "",
    dataNascimento: dto.dataNascimento || "",
    endereco: dto.endereco || { rua: "", numero: "", bairro: "", cep: "", cidade: "", estado: "", pais: "" },
    role: ((dto.role || "embaixador").toLowerCase() as RoleUsuario),
    status: ((dto.status || "candidato").toLowerCase() as StatusUsuario),
    dataCadastro: dto.dataCadastro || new Date().toISOString(),
    ultimoAcesso: dto.ultimoAcesso || new Date().toISOString(),
    progresso: dto.progresso || {},
    codigoIndicacao: dto.codigoIndicacao || "",
    codigoIndicacaoUsado: dto.codigoIndicacaoUsado,
    indicacoes: dto.indicacoes || [],
    contribuiuPix: dto.contribuiuPix || false,
    valorContribuicao: dto.valorContribuicao,
    dataContribuicao: dto.dataContribuicao,
    historicoContribuicoes: dto.historicoContribuicoes,
    embaixadorConfirmado: dto.embaixadorConfirmado || false,
  };
}

// =============================================
// FUNÇÕES ASYNC DE USUÁRIO (BACKEND)
// =============================================

/** Lista todos os usuários (admin) — via API */
export async function fetchUsuarios(): Promise<Usuario[]> {
  const dtos = await apiListarUsuarios();
  return dtos.map(converterUsuarioDTO);
}

/** Atualiza dados de um usuário — via API */
export async function atualizarUsuario(id: string, dados: Partial<UsuarioDTO>): Promise<Usuario> {
  const atualizado = await apiAtualizarUsuario(id, dados);
  // Se é o usuário logado, atualiza o cache
  const sessao = getSessao();
  if (sessao && sessao.id === id) {
    atualizarSessao(atualizado);
  }
  return converterUsuarioDTO(atualizado);
}

/** Altera a role de um usuário — via API */
export async function alterarRole(id: string, role: string): Promise<Usuario> {
  const atualizado = await apiAlterarRole(id, role);
  const sessao = getSessao();
  if (sessao && sessao.id === id) {
    atualizarSessao(atualizado);
  }
  return converterUsuarioDTO(atualizado);
}

/** Torna/remove embaixador — via API */
export async function tornarEmbaixador(id: string, confirmado: boolean): Promise<Usuario> {
  const atualizado = await apiTornarEmbaixador(id, confirmado);
  const sessao = getSessao();
  if (sessao && sessao.id === id) {
    atualizarSessao(atualizado);
  }
  return converterUsuarioDTO(atualizado);
}

// =============================================
// FUNÇÕES DE PROGRESSO (AULAS/MÓDULOS)
// =============================================

/**
 * Marca uma aula como concluída — via API
 * Também atualiza o cache local do usuário
 */
export async function salvarProgressoAsync(moduloId: string, aulaId: string): Promise<void> {
  const usuario = getUsuarioAtual();
  if (!usuario) return;
  
  await apiSalvarProgresso(usuario.id, moduloId, aulaId);
  
  // Atualiza o cache local
  const sessao = getSessao();
  if (sessao) {
    if (!sessao.progresso[moduloId]) sessao.progresso[moduloId] = [];
    if (!sessao.progresso[moduloId].includes(aulaId)) {
      sessao.progresso[moduloId].push(aulaId);
    }
    sessao.status = calcularStatus(converterUsuarioDTO(sessao)) as string;
    atualizarSessao(sessao);
  }
}

/**
 * Versão síncrona (compatibilidade) — atualiza cache local e envia para API em background
 */
export function salvarProgresso(moduloId: string, aulaId: string): void {
  salvarProgressoAsync(moduloId, aulaId).catch((err) => {
    console.error("Erro ao salvar progresso no backend:", err);
  });
}

/** Retorna a lista de IDs de aulas concluídas de um módulo (do cache) */
export function getProgressoModulo(moduloId: string): string[] {
  const usuario = getUsuarioAtual();
  return usuario?.progresso?.[moduloId] || [];
}

/** Busca o progresso atualizado do backend */
export async function fetchProgresso(usuarioId: string): Promise<Record<string, string[]>> {
  return apiGetProgresso(usuarioId);
}

/** Verifica se TODOS os módulos de formação foram concluídos */
export function todoModulosConcluidos(usuario: Usuario): boolean {
  return getModulosFormacao().every((m) => {
    const feitas = usuario.progresso?.[m.id] || [];
    return feitas.length === m.aulas.length;
  });
}

/**
 * Verifica se o usuário atende TODOS os requisitos para ser Embaixador:
 * 1. Todos os módulos concluídos
 * 2. Pelo menos 3 indicações
 * 3. Contribuição financeira feita
 */
export function verificarEmbaixador(usuario: Usuario): boolean {
  return todoModulosConcluidos(usuario) && usuario.indicacoes.length >= 3 && usuario.contribuiuPix;
}

/**
 * Calcula automaticamente o status do usuário baseado no seu progresso
 */
export function calcularStatus(usuario: Usuario): StatusUsuario {
  if (verificarEmbaixador(usuario)) return "embaixador";
  if (todoModulosConcluidos(usuario)) return "formacao_concluida";
  
  const totalFeitas = Object.values(usuario.progresso || {}).reduce((acc, arr) => acc + arr.length, 0);
  if (totalFeitas > 0) return "em_formacao";
  
  if (usuario.nome && usuario.email && usuario.cpf) return "candidato";
  
  return "interessado";
}

// =============================================
// SEMÁFORO DE ATIVIDADE (ADMIN)
// =============================================

export function getSemaforoAcesso(ultimoAcesso: string): { cor: string; label: string; classe: string } {
  const agora = new Date();
  const ultimo = new Date(ultimoAcesso);
  const diffMs = agora.getTime() - ultimo.getTime();
  const diffDias = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDias <= 30) return { cor: "green", label: "Ativo", classe: "bg-emerald-500" };
  if (diffDias <= 60) return { cor: "yellow", label: "Inativo (1 mês)", classe: "bg-amber-500" };
  if (diffDias <= 90) return { cor: "orange", label: "Inativo (2 meses)", classe: "bg-orange-500" };
  return { cor: "red", label: "Inativo (3+ meses)", classe: "bg-red-500" };
}

export function getMensagemInatividade(dias: number): string {
  if (dias >= 90) return "Sentimos muito sua falta! Já se passaram mais de 3 meses desde seu último acesso. O Reino precisa de você! Volte e continue sua jornada — seus irmãos estão esperando. 🙏👑";
  if (dias >= 60) return "Faz 2 meses que não te vemos por aqui! Sua caminhada como Embaixador(a) é importante. Que tal retomar de onde parou? O amor do Rei não muda — Ele espera por você! ❤️";
  if (dias >= 30) return "Olá! Percebemos que você está afastado(a) há um mês. Sabemos que a vida é corrida, mas sua formação como Embaixador(a) está esperando. Volte quando puder, há conteúdo novo te aguardando! 🌟";
  if (dias >= 15) return "Ei, sentimos sua falta! Já faz mais de 15 dias que você não acessa a plataforma. Continue sua jornada no Reino — cada passo conta! 💪";
  return "";
}

// =============================================
// CONTRIBUIÇÕES FINANCEIRAS
// =============================================

/**
 * Registra uma contribuição financeira — via API
 */
export async function salvarContribuicaoAsync(valor: number, forma: string = "PIX"): Promise<Usuario | null> {
  const usuario = getUsuarioAtual();
  if (!usuario) return null;

  await apiSalvarContribuicaoHttp({
    usuarioId: usuario.id,
    valor,
    forma,
  });

  // Atualiza cache local
  const sessao = getSessao();
  if (sessao) {
    sessao.contribuiuPix = true;
    sessao.valorContribuicao = (sessao.valorContribuicao || 0) + valor;
    sessao.dataContribuicao = new Date().toISOString();
    if (!sessao.historicoContribuicoes) sessao.historicoContribuicoes = [];
    sessao.historicoContribuicoes.push({ valor, data: new Date().toISOString(), forma });
    sessao.status = calcularStatus(converterUsuarioDTO(sessao)) as string;
    atualizarSessao(sessao);
  }

  return getUsuarioAtual();
}

/**
 * Versão síncrona (compatibilidade) — chama API em background
 */
export function salvarContribuicao(valor: number, forma: string = "PIX"): void {
  salvarContribuicaoAsync(valor, forma).catch((err) => {
    console.error("Erro ao salvar contribuição no backend:", err);
  });
}

// =============================================
// INDICAÇÕES
// =============================================

/**
 * registrarIndicacao — Agora feita automaticamente pelo backend no cadastro.
 * Mantida para compatibilidade, mas não faz chamada redundante.
 */
export function registrarIndicacao(_codigoUsado: string, _nomeIndicado: string, _emailIndicado: string): boolean {
  // O backend registra a indicação automaticamente durante o cadastro
  // Quando o campo codigoIndicacao é enviado no CadastroDTO
  console.log("Indicação registrada pelo backend automaticamente");
  return true;
}

// =============================================
// CONTROLE TEMPORAL DE LIBERAÇÃO DE AULAS
// (Lógica pura, sem acesso a banco de dados)
// =============================================

export function diasDesdeCadastro(dataCadastro: string): number {
  const agora = new Date();
  const cadastro = new Date(dataCadastro);
  return Math.floor((agora.getTime() - cadastro.getTime()) / (1000 * 60 * 60 * 24));
}

export function getSemanaInicioModulo(modulo: Modulo): number {
  if (modulo.especial) return 12;
  return (modulo.mes - 1) * 4;
}

export function aulaLiberada(modulo: Modulo, aulaIndex: number, aulasFeitas: string[], dataCadastro?: string): boolean {
  if (aulaIndex === 0 && !dataCadastro) return true;
  
  const aula = modulo.aulas[aulaIndex];
  const semanaBase = getSemanaInicioModulo(modulo);
  const semanaAula = semanaBase + aula.semana - 1;
  
  if (dataCadastro) {
    const dias = diasDesdeCadastro(dataCadastro);
    const diasNecessarios = semanaAula * 7;
    if (dias < diasNecessarios) return false;
  }
  
  if (aulaIndex === 0) return true;
  const aulaAnterior = modulo.aulas[aulaIndex - 1];
  if (!aulasFeitas.includes(aulaAnterior.id)) return false;
  
  return true;
}

export function diasParaLiberar(modulo: Modulo, aulaIndex: number, dataCadastro: string): number {
  const aula = modulo.aulas[aulaIndex];
  const semanaBase = getSemanaInicioModulo(modulo);
  const semanaAula = semanaBase + aula.semana - 1;
  const diasNecessarios = semanaAula * 7;
  const dias = diasDesdeCadastro(dataCadastro);
  return Math.max(0, diasNecessarios - dias);
}

export function moduloAnteriorConcluido(moduloAtual: Modulo, usuario: Usuario): boolean {
  if (moduloAtual.especial) {
    return verificarEmbaixador(usuario);
  }
  const mods = getModulosFormacao();
  const idx = mods.findIndex((m) => m.id === moduloAtual.id);
  if (idx === 0) return true;
  
  const anterior = mods[idx - 1];
  const feitas = usuario.progresso?.[anterior.id] || [];
  return feitas.length === anterior.aulas.length;
}

// =============================================
// PERMISSÕES POR ROLE
// =============================================

export function podeVerFinanceiro(role: RoleUsuario): boolean {
  return role === "admin";
}

export function podeGerenciarCampanhas(role: RoleUsuario): boolean {
  return role === "admin" || role === "moderador";
}

export function podeVerUsuarios(role: RoleUsuario): boolean {
  return role === "admin" || role === "moderador" || role === "auxiliar";
}

export function podeEditarPermissoes(role: RoleUsuario): boolean {
  return role === "admin";
}

export function podeEditarModulos(role: RoleUsuario): boolean {
  return role === "admin" || role === "editor";
}

export function isAdminRole(role: RoleUsuario | string): boolean {
  const r = (role || "").toLowerCase();
  return r === "admin" || r === "moderador" || r === "auxiliar" || r === "editor";
}

// Exporta para uso no Login
export { gerarCodigoIndicacao };
