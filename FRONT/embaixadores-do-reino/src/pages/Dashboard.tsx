import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Crown, LogOut, BookOpen, Music, Heart, ChevronRight, Shield, Copy, Check, Coins, PartyPopper, Share2, Bell, Lock, Award, Clock, History, Megaphone, Eye, EyeOff, FileText, Download, Plus, Minus, Trophy, Target, Users, UserCog, Play, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getModulosFormacao, getModuloEnvio, getUsuarioAtual, getProgressoModulo, salvarContribuicao, verificarEmbaixador, todoModulosConcluidos, moduloAnteriorConcluido, isAdminRole, STATUS_LABELS, STATUS_CORES, diasParaLiberar, aulaLiberada, fetchModulos, atualizarUsuario, tornarEmbaixador, type Usuario, type ContribuicaoRegistro } from "@/lib/dados";
import { limparSessao } from "@/lib/api";
import { paises } from "@/lib/localidades";
import { getCampanhas, fetchCampanhas, participarCampanha, sairCampanha, getNotificacoes, fetchNotificacoes, marcarNotificacaoLida, contarNaoLidas, criarNotificacaoParaUsuario, registrarParticipacao, getTotalRegistrosUsuario, getTotalRegistrosCampanha, getRankingCampanha, diasRestantesCampanha, TIPO_CAMPANHA_LABELS, UNIDADE_PADRAO, type Campanha, type Notificacao } from "@/lib/campanhas";
import { toast } from "sonner";
import { QRCodeSVG } from "qrcode.react";

const contarCampanhasParticipadas = (userId: string): number => {
  // Usa o cache de campanhas importado no topo do arquivo
  const todas = getCampanhas();
  return todas.filter((c: any) => c.participantes?.includes(userId)).length;
};

const iconeMap: Record<string, any> = {
  crown: Crown,
  music: Music,
  heart: Heart,
  award: Award,
};

// Check and create auto notifications for unlocked content
// Agora usa a API para criar notificações (em background)
function verificarNotificacoesAutomaticas(usuario: Usuario) {
  const modulosForm = getModulosFormacao();
  // Busca notificações do cache local
  const existentes = getNotificacoes(usuario.id).filter(n => n.tipo === "video");
  
  modulosForm.forEach((modulo) => {
    const aulasFeitas = usuario.progresso?.[modulo.id] || [];
    
    modulo.aulas.forEach((aula, idx) => {
      const liberada = aulaLiberada(modulo, idx, aulasFeitas, usuario.dataCadastro);
      const jaFeita = aulasFeitas.includes(aula.id);
      const jaNotificou = existentes.some(n => n.mensagem.includes(aula.id));
      
      if (liberada && !jaFeita && !jaNotificou && idx > 0) {
        criarNotificacaoParaUsuario(
          usuario.id,
          `🎓 Nova aula liberada!`,
          `A aula "${aula.titulo}" do módulo "${modulo.titulo}" já está disponível. Continue sua jornada! 🚀 [aula:${aula.id}]`,
          "video"
        );
      }
    });

    const moduloIdx = modulosForm.findIndex(m => m.id === modulo.id);
    if (moduloIdx > 0) {
      const anterior = modulosForm[moduloIdx - 1];
      const feitasAnterior = usuario.progresso?.[anterior.id] || [];
      const anteriorConcluido = feitasAnterior.length === anterior.aulas.length;
      const jaNotificouModulo = existentes.some(n => n.mensagem.includes(`[modulo:${modulo.id}]`));
      
      if (anteriorConcluido && !jaNotificouModulo) {
        criarNotificacaoParaUsuario(
          usuario.id,
          `🏅 Novo módulo liberado!`,
          `O módulo "${modulo.titulo}" foi desbloqueado! Sua formação continua. Que o Rei te abençoe nessa nova etapa! 👑 [modulo:${modulo.id}]`,
          "video"
        );
      }
    }
  });
}

const Dashboard = () => {
  const navigate = useNavigate();
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [codigoCopiado, setCodigoCopiado] = useState(false);
  const [mostrarPix, setMostrarPix] = useState(false);
  const [valorPix, setValorPix] = useState("");
  const [formaPagamento, setFormaPagamento] = useState("PIX");
  const [parcelas, setParcelas] = useState("1");
  const [mostrarEmbaixador, setMostrarEmbaixador] = useState(false);
  const [campanhas, setCampanhas] = useState<Campanha[]>([]);
  const [naoLidas, setNaoLidas] = useState(0);
  const [notificacoesAbertas, setNotificacoesAbertas] = useState(false);
  const [mostrarContribuiu, setMostrarContribuiu] = useState(false);
  const [mostrarHistorico, setMostrarHistorico] = useState(false);
  const [notifCampanhaDetalhe, setNotifCampanhaDetalhe] = useState<Campanha | null>(null);
  const [mostrarValor, setMostrarValor] = useState(false);
  const [mostrarPassaporte, setMostrarPassaporte] = useState(false);
  const [mostrarCertificado, setMostrarCertificado] = useState(false);
  const [mostrarBoasVindas, setMostrarBoasVindas] = useState(false);
  const [campanhaAberta, setCampanhaAberta] = useState<Campanha | null>(null);
  const [qtdRegistro, setQtdRegistro] = useState(1);
  const [mostrarCadastro, setMostrarCadastro] = useState(false);
  const [editNome, setEditNome] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editCep, setEditCep] = useState("");
  const [editRua, setEditRua] = useState("");
  const [editNumero, setEditNumero] = useState("");
  const [editBairro, setEditBairro] = useState("");
  const [editPais, setEditPais] = useState("");
  const [editEstado, setEditEstado] = useState("");
  const [editCidade, setEditCidade] = useState("");
  const [editDataNascimento, setEditDataNascimento] = useState("");

  useEffect(() => {
    const u = getUsuarioAtual();
    if (!u) { navigate("/login"); return; }
    setUsuario(u);
    
    // Busca campanhas e notificações do backend
    fetchCampanhas().then((todas) => {
      setCampanhas(todas.filter((c) => c.ativa));
    });
    fetchNotificacoes(u.id).then(() => {
      setNaoLidas(contarNaoLidas(u.id));
    });
    // Busca módulos do backend (preenche o cache)
    fetchModulos();

    // Auto notifications for unlocked content
    verificarNotificacoesAutomaticas(u);

    // Check first login (welcome screen)
    const primeiroLogin = !(u as any).jaLogouAntes;
    if (primeiroLogin) {
      setMostrarBoasVindas(true);
      // Marca no backend que já logou antes
      atualizarUsuario(u.id, { jaLogouAntes: true } as any).catch(() => {});
    }

    if (verificarEmbaixador(u) && !u.embaixadorConfirmado) {
      // Torna embaixador via API
      tornarEmbaixador(u.id, true).then((atualizado) => {
        setUsuario(atualizado);
        setMostrarEmbaixador(true);
      }).catch(() => {});
    }
  }, [navigate]);

  const handleLogout = () => {
    limparSessao();
    navigate("/");
  };

  const copiarCodigo = () => {
    if (usuario) {
      navigator.clipboard.writeText(usuario.codigoIndicacao);
      setCodigoCopiado(true);
      toast.success("Código copiado!");
      setTimeout(() => setCodigoCopiado(false), 2000);
    }
  };

  const handleContribuicao = async () => {
    const valor = parseFloat(valorPix);
    if (!valor || valor <= 0) { toast.error("Informe um valor válido"); return; }
    const formaFinal = formaPagamento === "Cartão de Crédito" && parseInt(parcelas) > 1 ? `Cartão de Crédito (${parcelas}x)` : formaPagamento;
    salvarContribuicao(valor, formaFinal);
    const atualizado = getUsuarioAtual();
    if (atualizado) {
      setUsuario(atualizado);
      setMostrarPix(false);
      setValorPix("");
      setMostrarContribuiu(true);
      setTimeout(() => setMostrarContribuiu(false), 3000);
      toast.success("Contribuição registrada! Obrigado(a)! 🙏");
      if (verificarEmbaixador(atualizado) && !atualizado.embaixadorConfirmado) {
        tornarEmbaixador(atualizado.id, true).then((u) => {
          setUsuario(u);
          setMostrarEmbaixador(true);
        }).catch(() => {});
      }
    }
  };

  const handleParticiparCampanha = (campanhaId: string) => {
    if (!usuario) return;
    participarCampanha(campanhaId, usuario.id);
    setCampanhas(getCampanhas().filter((c) => c.ativa));
    toast.success("Você está participando da campanha! 🙏");
  };

  const handleSairCampanha = (campanhaId: string) => {
    if (!usuario) return;
    sairCampanha(campanhaId, usuario.id);
    setCampanhas(getCampanhas().filter((c) => c.ativa));
    toast("Você saiu da campanha.");
  };

  const handleNotificacaoClick = (n: Notificacao) => {
    marcarNotificacaoLida(n.id);
    setNaoLidas(contarNaoLidas(usuario!.id));
    
    if (n.tipo === "campanha" && n.campanhaId) {
      const todasCampanhas = getCampanhas();
      const campanha = todasCampanhas.find(c => c.id === n.campanhaId);
      if (campanha) {
        setNotificacoesAbertas(false);
        setNotifCampanhaDetalhe(campanha);
        return;
      }
    }

    if (n.tipo === "video") {
      setNotificacoesAbertas(false);
      // Extrair moduloId da mensagem [modulo:xxx] ou [aula:xxx]
      const moduloMatch = n.mensagem.match(/\[modulo:([\w-]+)\]/);
      if (moduloMatch) {
        navigate(`/modulo/${moduloMatch[1]}`);
        return;
      }
      const aulaMatch = n.mensagem.match(/\[aula:([\w-]+)\]/);
      if (aulaMatch) {
        // Encontrar o módulo que contém essa aula
        const todosModulos = getModulosFormacao();
        const moduloDaAula = todosModulos.find(m => m.aulas.some(a => a.id === aulaMatch[1]));
        if (moduloDaAula) {
          navigate(`/modulo/${moduloDaAula.id}`);
          return;
        }
      }
      // Fallback: ir para dashboard (já está nele)
    }
  };

  const notificacoes = usuario ? getNotificacoes(usuario.id).slice(0, 10) : [];

  if (!usuario) return null;

  const modulosFormacao = getModulosFormacao();
  const moduloEnvio = getModuloEnvio();
  const totalAulasGeral = modulosFormacao.reduce((acc, m) => acc + m.aulas.length, 0);
  const aulasConcluidasGeral = modulosFormacao.reduce((acc, m) => (acc + (getProgressoModulo(m.id)?.length || 0)), 0);
  const progressoGeral = totalAulasGeral > 0 ? Math.round((aulasConcluidasGeral / totalAulasGeral) * 100) : 0;
  const todosModulosDone = todoModulosConcluidos(usuario);
  const mostrarCerimonia = verificarEmbaixador(usuario);

  const modulosExibidos = mostrarCerimonia && moduloEnvio ? [...modulosFormacao, moduloEnvio] : modulosFormacao;

  const historicoContribuicoes: ContribuicaoRegistro[] = (usuario as any).historicoContribuicoes || [];
  const totalContribuido = historicoContribuicoes.reduce((acc, c) => acc + c.valor, 0);

  return (
    <div className="min-h-screen bg-background">
      {/* Barra de teste admin: alternar visão embaixador */}
      {isAdminRole(usuario.role) && (
        <div className="bg-destructive text-destructive-foreground text-center py-1 text-xs flex items-center justify-center gap-2">
          <span>🔧 Admin:</span>
          {!usuario.embaixadorConfirmado ? (
            <button className="underline font-bold" onClick={() => {
              tornarEmbaixador(usuario.id, true).then((u) => {
                setUsuario(u);
                window.location.reload();
              }).catch(() => {
                // Fallback local se API falhar
                const sessao = localStorage.getItem("embaixadores_sessao");
                if (sessao) {
                  const parsed = JSON.parse(sessao);
                  parsed.usuario = { ...parsed.usuario, embaixadorConfirmado: true, status: "embaixador" };
                  localStorage.setItem("embaixadores_sessao", JSON.stringify(parsed));
                }
                window.location.reload();
              });
            }}>Ver como Embaixador</button>
          ) : (
            <button className="underline font-bold" onClick={() => {
              tornarEmbaixador(usuario.id, false).then((u) => {
                setUsuario(u);
                window.location.reload();
              }).catch(() => {
                // Fallback local se API falhar
                const sessao = localStorage.getItem("embaixadores_sessao");
                if (sessao) {
                  const parsed = JSON.parse(sessao);
                  parsed.usuario = { ...parsed.usuario, embaixadorConfirmado: false, status: "em_formacao" };
                  localStorage.setItem("embaixadores_sessao", JSON.stringify(parsed));
                }
                window.location.reload();
              });
            }}>Voltar ao modo Formação</button>
          )}
        </div>
      )}
      {/* Header */}
      <header className="gradient-navy border-b border-gold/20">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Crown className="h-6 w-6 text-gold" />
            <span className="font-display text-base text-cream tracking-wider">Embaixadores do Reino</span>
          </div>
          <div className="flex items-center gap-3">
            <Popover open={notificacoesAbertas} onOpenChange={setNotificacoesAbertas}>
              <PopoverTrigger asChild>
                <button className="relative text-cream/60 hover:text-cream transition-colors p-2">
                  <Bell className="h-5 w-5" />
                  {naoLidas > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-red-500 text-[10px] text-white flex items-center justify-center font-bold">
                      {naoLidas > 9 ? "9+" : naoLidas}
                    </span>
                  )}
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-0 max-h-80 overflow-y-auto" align="end">
                <div className="p-3 border-b border-border">
                  <h4 className="font-display text-sm text-foreground">Notificações</h4>
                </div>
                {notificacoes.length === 0 ? (
                  <p className="p-4 font-body text-sm text-muted-foreground text-center">Nenhuma notificação</p>
                ) : (
                  notificacoes.map((n) => (
                    <div
                      key={n.id}
                      className={`p-3 border-b border-border last:border-0 cursor-pointer hover:bg-secondary/30 transition-colors ${!n.lida ? "bg-gold/5" : ""}`}
                      onClick={() => handleNotificacaoClick(n)}
                    >
                      <div className="flex items-center gap-1.5">
                        {n.tipo === "campanha" && <Megaphone className="h-3 w-3 text-gold-dark flex-shrink-0" />}
                        {n.tipo === "video" && <BookOpen className="h-3 w-3 text-gold-dark flex-shrink-0" />}
                        <p className="font-body text-sm text-foreground">{n.titulo}</p>
                      </div>
                      <p className="font-body text-xs text-muted-foreground mt-0.5">{n.mensagem.replace(/\[.*?\]/g, "")}</p>
                      <p className="font-body text-[10px] text-muted-foreground/60 mt-1">
                        {new Date(n.data).toLocaleDateString("pt-BR")}
                      </p>
                    </div>
                  ))
                )}
              </PopoverContent>
            </Popover>

            {isAdminRole(usuario.role) && (
              <Button variant="ghost" size="sm" className="text-gold/80 hover:text-gold hover:bg-navy-light" onClick={() => navigate("/admin")}>
                <Shield className="h-4 w-4 mr-1" />Admin
              </Button>
            )}
            <Button variant="ghost" size="sm" className="text-cream/60 hover:text-cream hover:bg-navy-light" onClick={() => {
              setEditNome(usuario.nome);
              setEditEmail(usuario.email);
              setEditCep(usuario.endereco?.cep || "");
              setEditRua(usuario.endereco?.rua || "");
              setEditNumero(usuario.endereco?.numero || "");
              setEditBairro(usuario.endereco?.bairro || "");
              setEditPais(usuario.endereco?.pais || "");
              setEditEstado(usuario.endereco?.estado || "");
              setEditCidade(usuario.endereco?.cidade || "");
              setEditDataNascimento(usuario.dataNascimento || "");
              setMostrarCadastro(true);
            }}>
              <UserCog className="h-4 w-4 mr-1" />Meu Cadastro
            </Button>
            <Button variant="ghost" size="sm" className="text-cream/60 hover:text-cream hover:bg-navy-light" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-1" />Sair
            </Button>
          </div>
        </div>
      </header>

      {/* Welcome */}
      <section className="py-8">
        <div className="container mx-auto px-6">
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="font-display text-3xl md:text-4xl text-foreground">
                Olá, <span className="text-gold-dark">{usuario.nome.split(" ")[0]}</span> 👑
              </h1>
              <Badge className={`${STATUS_CORES[usuario.status || "candidato"]} font-body text-xs`}>
                {STATUS_LABELS[usuario.status || "candidato"]}
              </Badge>
            </div>
            <div className="flex flex-wrap items-center gap-4 mb-2">
              <span className="font-body text-sm text-muted-foreground">
                ID de Usuário: <span className="font-display text-foreground">#{String((usuario as any).numeroInscricao || "—").padStart(4, "0")}</span>
              </span>
              {usuario.embaixadorConfirmado && (
                <>
                  <button
                    onClick={() => setMostrarPassaporte(true)}
                    className="font-body text-sm text-muted-foreground hover:text-gold-dark transition-colors flex items-center gap-1"
                  >
                    Nº do Passaporte: <span className="font-display text-gold-dark">PASS-{String((usuario as any).numeroInscricao || 0).padStart(4, "0")}</span>
                    <FileText className="h-3.5 w-3.5 ml-1" />
                  </button>
                  <button
                    onClick={() => setMostrarCertificado(true)}
                    className="font-body text-sm text-muted-foreground hover:text-gold-dark transition-colors flex items-center gap-1"
                  >
                    <Award className="h-3.5 w-3.5" /> Certificado Digital
                  </button>
                </>
              )}
            </div>
            <p className="font-body text-muted-foreground text-lg mb-6">
              {usuario.embaixadorConfirmado
                ? "Você é oficialmente um(a) Embaixador(a) do Reino! 👑"
                : "Continue sua jornada como Embaixador(a) do Reino."}
            </p>

            {/* Status cards */}
            <div className={`grid grid-cols-1 sm:grid-cols-2 ${usuario.embaixadorConfirmado ? "lg:grid-cols-3" : "lg:grid-cols-4"} gap-4 mb-6`}>
              {!usuario.embaixadorConfirmado && (
                <div className="bg-card rounded-xl p-5 shadow-card border border-border">
                  <div className="flex items-center gap-2 mb-2">
                    <BookOpen className="h-4 w-4 text-gold-dark" />
                    <span className="font-body text-sm text-muted-foreground">Progresso Geral</span>
                  </div>
                  <Progress value={progressoGeral} className="h-2 mb-2" />
                  <span className="font-display text-lg text-foreground">{progressoGeral}%</span>
                </div>
              )}

              <div className="bg-card rounded-xl p-5 shadow-card border border-border">
                <div className="flex items-center gap-2 mb-2">
                  <Share2 className="h-4 w-4 text-gold-dark" />
                  <span className="font-body text-sm text-muted-foreground">Seu Código</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-display text-sm text-foreground">{usuario.codigoIndicacao}</span>
                  <button onClick={copiarCodigo} className="text-muted-foreground hover:text-gold-dark transition-colors">
                    {codigoCopiado ? <Check className="h-4 w-4 text-gold-dark" /> : <Copy className="h-4 w-4" />}
                  </button>
                </div>
                <span className="font-body text-xs text-muted-foreground">{usuario.indicacoes?.length || 0} indicações</span>
              </div>

              <div className="bg-card rounded-xl p-5 shadow-card border border-border">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Coins className="h-4 w-4 text-gold-dark" />
                    <span className="font-body text-sm text-muted-foreground">Economia do Reino</span>
                  </div>
                </div>
                <AnimatePresence>
                  {mostrarContribuiu && (
                    <motion.div
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                      className="mb-1"
                    >
                      <Badge className="bg-emerald-100 text-emerald-700 font-body text-xs">✓ Contribuiu!</Badge>
                    </motion.div>
                  )}
                </AnimatePresence>
                {totalContribuido > 0 && (
                  <div className="flex items-center gap-2">
                    {mostrarValor ? (
                      <p className="font-display text-lg text-gold-dark">R$ {totalContribuido.toFixed(2)}</p>
                    ) : (
                      <p className="font-display text-lg text-muted-foreground/40">R$ •••••</p>
                    )}
                    <button onClick={() => setMostrarValor(!mostrarValor)} className="text-muted-foreground hover:text-gold-dark transition-colors">
                      {mostrarValor ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                )}
                <div className="flex items-center gap-2 mt-1">
                  <button
                    onClick={() => setMostrarPix(true)}
                    className="font-body text-xs text-foreground hover:text-gold-dark transition-colors underline-offset-2 hover:underline"
                  >
                    {totalContribuido > 0 ? "Nova contribuição" : "Contribuir via PIX"}
                  </button>
                  {historicoContribuicoes.length > 0 && (
                    <>
                      <span className="text-muted-foreground/30">|</span>
                      <button
                        onClick={() => setMostrarHistorico(true)}
                        className="font-body text-xs text-muted-foreground hover:text-gold-dark transition-colors flex items-center gap-1"
                      >
                        <History className="h-3 w-3" /> Ver histórico
                      </button>
                    </>
                  )}
                </div>
              </div>

              {!usuario.embaixadorConfirmado && (
                <div className="bg-card rounded-xl p-5 shadow-card border border-border">
                  <div className="flex items-center gap-2 mb-2">
                    <Crown className="h-4 w-4 text-gold-dark" />
                    <span className="font-body text-sm text-muted-foreground">Requisitos</span>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${todosModulosDone ? "bg-gold-dark" : "bg-muted-foreground/30"}`} />
                      <span className="font-body text-xs text-muted-foreground">Módulos completos</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${(usuario.indicacoes?.length || 0) >= 3 ? "bg-gold-dark" : "bg-muted-foreground/30"}`} />
                      <span className="font-body text-xs text-muted-foreground">3+ indicações ({usuario.indicacoes?.length || 0}/3)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${usuario.contribuiuPix ? "bg-gold-dark" : "bg-muted-foreground/30"}`} />
                      <span className="font-body text-xs text-muted-foreground">Contribuição PIX</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Campanhas Ativas - apenas para embaixadores */}
      {usuario.embaixadorConfirmado && campanhas.length > 0 && (
        <section className="pb-8">
          <div className="container mx-auto px-6">
            <h2 className="font-display text-xl text-foreground mb-4">
              Campanhas Ativas
              <span className="font-body text-sm text-muted-foreground ml-2">
                (Você participou de {contarCampanhasParticipadas(usuario.id)} campanha{contarCampanhasParticipadas(usuario.id) !== 1 ? "s" : ""} desde o cadastro)
              </span>
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {campanhas.map((c) => {
                const participa = c.participantes.includes(usuario.id);
                const diasRest = diasRestantesCampanha(c);
                const unidade = c.unidadeRegistro || UNIDADE_PADRAO[c.tipo] || "registros";
                const isNovosEmb = c.tipo === "novos_embaixadores";
                const meuTotal = isNovosEmb ? (usuario.indicacoes?.length || 0) : getTotalRegistrosUsuario(c.id, usuario.id);
                const totalGeral = isNovosEmb ? 0 : getTotalRegistrosCampanha(c.id);
                return (
                  <div key={c.id} className="bg-card rounded-xl p-5 shadow-card border border-border">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline" className="font-body text-xs">{TIPO_CAMPANHA_LABELS[c.tipo]}</Badge>
                      <Badge variant="secondary" className="font-body text-[10px]">
                        <Clock className="h-3 w-3 mr-0.5" />{diasRest > 0 ? `${diasRest} dia${diasRest !== 1 ? "s" : ""} restante${diasRest !== 1 ? "s" : ""}` : "Encerrada"}
                      </Badge>
                    </div>
                    <h3 className="font-display text-base text-foreground mb-1">{c.titulo}</h3>
                    <p className="font-body text-sm text-muted-foreground mb-2 line-clamp-2">{c.descricao}</p>
                    {c.objetivo && (
                      <p className="font-body text-xs text-gold-dark mb-2 flex items-center gap-1">
                        <Target className="h-3 w-3" /> {c.objetivo}
                      </p>
                    )}
                    <p className="font-body text-xs text-muted-foreground mb-3">
                      {new Date(c.dataInicio).toLocaleDateString("pt-BR")} — {new Date(c.dataFim).toLocaleDateString("pt-BR")}
                      <span className="ml-2">• <Users className="h-3 w-3 inline" /> {c.participantes.length}</span>
                      {totalGeral > 0 && <span className="ml-2">• {totalGeral} {unidade}</span>}
                    </p>

                    {participa ? (
                      <div className="space-y-3">
                        <div className="bg-secondary/40 rounded-lg p-3">
                          <p className="font-body text-xs text-muted-foreground mb-1">Seu progresso</p>
                          <p className="font-display text-lg text-gold-dark">{meuTotal} <span className="font-body text-xs text-muted-foreground">{unidade}</span></p>
                          {isNovosEmb && (
                            <p className="font-body text-[10px] text-muted-foreground mt-1">
                              Compartilhe seu código <span className="font-display text-foreground">{usuario.codigoIndicacao}</span> para somar
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {!isNovosEmb && (
                            <Button size="sm" className="gradient-royal text-foreground shadow-gold hover:opacity-90 flex-1" onClick={() => { setCampanhaAberta(c); setQtdRegistro(1); }}>
                              <Plus className="h-3 w-3 mr-1" /> Registrar participação
                            </Button>
                          )}
                          {isNovosEmb && (
                            <Button size="sm" className="gradient-royal text-foreground shadow-gold hover:opacity-90 flex-1" onClick={copiarCodigo}>
                              <Copy className="h-3 w-3 mr-1" /> Copiar código de indicação
                            </Button>
                          )}
                          <Button size="sm" variant="outline" className="text-muted-foreground text-xs" onClick={() => handleSairCampanha(c.id)}>
                            Sair
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <Button size="sm" className="gradient-royal text-foreground shadow-gold hover:opacity-90" onClick={() => handleParticiparCampanha(c.id)}>
                        Participar
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Modal: Registrar Participação na Campanha */}
      <Dialog open={!!campanhaAberta} onOpenChange={() => setCampanhaAberta(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display text-xl flex items-center gap-2">
              <Megaphone className="h-5 w-5 text-gold-dark" /> {campanhaAberta?.titulo}
            </DialogTitle>
            <DialogDescription className="font-body">
              Registre sua participação nesta campanha.
            </DialogDescription>
          </DialogHeader>
          {campanhaAberta && (() => {
            const isNovosEmb = campanhaAberta.tipo === "novos_embaixadores";
            const unidade = campanhaAberta.unidadeRegistro || UNIDADE_PADRAO[campanhaAberta.tipo] || "registros";
            const meuTotal = isNovosEmb ? (usuario.indicacoes?.length || 0) : getTotalRegistrosUsuario(campanhaAberta.id, usuario.id);
            const ranking = getRankingCampanha(campanhaAberta.id);
            const minhaPos = ranking.findIndex(r => r.usuarioId === usuario.id) + 1;
            const totalGeral = isNovosEmb ? 0 : getTotalRegistrosCampanha(campanhaAberta.id);

            return (
              <div className="space-y-4 pt-2">
                {campanhaAberta.objetivo && (
                  <div className="bg-gold/10 rounded-lg p-3">
                    <p className="font-body text-xs text-muted-foreground mb-0.5">Objetivo</p>
                    <p className="font-body text-sm text-foreground">{campanhaAberta.objetivo}</p>
                  </div>
                )}
                {campanhaAberta.instrucoes && (
                  <div className="bg-secondary/40 rounded-lg p-3">
                    <p className="font-body text-xs text-muted-foreground mb-0.5">Instruções</p>
                    <p className="font-body text-sm text-foreground">{campanhaAberta.instrucoes}</p>
                  </div>
                )}

                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="bg-secondary/40 rounded-lg p-3">
                    <p className="font-display text-lg text-gold-dark">{meuTotal}</p>
                    <p className="font-body text-[10px] text-muted-foreground">{unidade} (você)</p>
                  </div>
                  <div className="bg-secondary/40 rounded-lg p-3">
                    <p className="font-display text-lg text-foreground">{totalGeral}</p>
                    <p className="font-body text-[10px] text-muted-foreground">{unidade} (total)</p>
                  </div>
                  <div className="bg-secondary/40 rounded-lg p-3">
                    <p className="font-display text-lg text-foreground">{minhaPos > 0 ? `${minhaPos}º de ${ranking.length}` : "—"}</p>
                    <p className="font-body text-[10px] text-muted-foreground">Sua posição</p>
                  </div>
                </div>

                {isNovosEmb ? (
                  <div className="space-y-2">
                    <div className="bg-gold/10 rounded-lg p-4 text-center">
                      <Share2 className="h-5 w-5 text-gold-dark mx-auto mb-2" />
                      <p className="font-body text-sm text-foreground mb-1">Compartilhe seu código de indicação</p>
                      <p className="font-display text-xl text-gold-dark mb-2">{usuario.codigoIndicacao}</p>
                      <p className="font-body text-xs text-muted-foreground">Cada pessoa que se cadastrar com seu código conta automaticamente!</p>
                    </div>
                    <Button className="w-full gradient-royal text-foreground font-display shadow-gold hover:opacity-90" onClick={() => { copiarCodigo(); setCampanhaAberta(null); }}>
                      <Copy className="h-4 w-4 mr-2" /> Copiar código
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Label className="font-body text-foreground">Quantidade de {unidade}</Label>
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="outline" onClick={() => setQtdRegistro(Math.max(1, qtdRegistro - 1))}><Minus className="h-4 w-4" /></Button>
                      <Input type="number" min={1} value={qtdRegistro} onChange={(e) => setQtdRegistro(Math.max(1, parseInt(e.target.value) || 1))} className="text-center bg-background border-border w-20" />
                      <Button size="sm" variant="outline" onClick={() => setQtdRegistro(qtdRegistro + 1)}><Plus className="h-4 w-4" /></Button>
                    </div>
                    <Button className="w-full gradient-royal text-foreground font-display shadow-gold hover:opacity-90" onClick={() => {
                      registrarParticipacao(campanhaAberta.id, usuario.id, qtdRegistro);
                      setCampanhas(getCampanhas().filter((c) => c.ativa));
                      toast.success(`${qtdRegistro} ${unidade} registrado(s)! 🙏`);
                      setCampanhaAberta(null);
                    }}>
                      Registrar {qtdRegistro} {unidade}
                    </Button>
                  </div>
                )}
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* Vídeo Diário - apenas para embaixadores */}
      {usuario.embaixadorConfirmado && (
        <section className="pb-8">
          <div className="container mx-auto px-6">
            <h2 className="font-display text-xl text-foreground mb-4 flex items-center gap-2">
              <Video className="h-5 w-5 text-gold-dark" /> Vídeo do Dia
            </h2>
            <div className="bg-card rounded-xl p-6 shadow-card border border-border">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-lg gradient-royal flex items-center justify-center">
                  <Play className="h-6 w-6 text-foreground" />
                </div>
                <div>
                  <h3 className="font-display text-base text-foreground">Reflexão diária</h3>
                  <p className="font-body text-sm text-muted-foreground">Conteúdo exclusivo para Embaixadores do Reino</p>
                </div>
              </div>
              <div className="bg-secondary/30 rounded-lg p-8 text-center">
                <Play className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
                <p className="font-body text-sm text-muted-foreground">Nenhum vídeo disponível hoje.</p>
                <p className="font-body text-xs text-muted-foreground/60 mt-1">Fique atento — novos vídeos são liberados regularmente!</p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Módulos - apenas para quem NÃO é embaixador */}
      {!usuario.embaixadorConfirmado && (
        <section className="pb-20">
          <div className="container mx-auto px-6">
            <h2 className="font-display text-xl text-foreground mb-2">Formação — 3 Meses</h2>
            <p className="font-body text-sm text-muted-foreground mb-8">Complete os 3 módulos em sequência. O conteúdo é liberado semanalmente.</p>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {modulosExibidos.map((modulo, i) => {
                const aulasFeitas = getProgressoModulo(modulo.id);
                const totalAulas = modulo.aulas.length;
                const percentual = totalAulas > 0 ? Math.round((aulasFeitas.length / totalAulas) * 100) : 0;
                const Icone = iconeMap[modulo.icone] || BookOpen;
                const concluido = percentual === 100;
                const liberado = moduloAnteriorConcluido(modulo, usuario);

                const diasProxima = !modulo.especial && liberado ? diasParaLiberar(modulo, 0, usuario.dataCadastro) : 0;

                return (
                  <motion.div
                    key={modulo.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: i * 0.1 }}
                    onClick={() => liberado && navigate(`/modulo/${modulo.id}`)}
                    className={`group bg-card rounded-xl p-6 shadow-card border transition-all ${
                      modulo.especial
                        ? "border-gold/40 hover:shadow-elevated hover:border-gold/60 cursor-pointer bg-gold/5"
                        : liberado
                        ? "border-border hover:shadow-elevated hover:border-gold/30 cursor-pointer"
                        : "border-border opacity-60 cursor-not-allowed"
                    }`}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                        modulo.especial ? "gradient-royal" : concluido ? "gradient-royal" : "bg-secondary"
                      }`}>
                        {liberado ? <Icone className={`h-6 w-6 ${concluido || modulo.especial ? "text-foreground" : "text-gold-dark"}`} /> : <Lock className="h-6 w-6 text-muted-foreground/50" />}
                      </div>
                      <div className="flex items-center gap-2">
                        {modulo.especial ? (
                          <Badge className="bg-gold/20 text-gold-dark font-body text-[10px]">Cerimônia</Badge>
                        ) : (
                          <Badge variant="outline" className="font-body text-[10px]">Mês {modulo.mes}</Badge>
                        )}
                        {liberado && <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-gold-dark transition-colors" />}
                      </div>
                    </div>
                    <h3 className="font-display text-lg text-foreground mb-2">{modulo.titulo}</h3>
                    <p className="font-body text-sm text-muted-foreground mb-4 line-clamp-2">{modulo.descricao}</p>
                    {liberado ? (
                      <div className="space-y-2">
                        <div className="flex justify-between text-xs font-body">
                          <span className="text-muted-foreground">{aulasFeitas.length} de {totalAulas} aulas</span>
                          <span className={concluido ? "text-gold-dark font-semibold" : "text-muted-foreground"}>{percentual}%</span>
                        </div>
                        <Progress value={percentual} className="h-2" />
                      </div>
                    ) : modulo.especial ? (
                      <p className="font-body text-xs text-muted-foreground">🔒 Complete todos os requisitos para liberar</p>
                    ) : (
                      <p className="font-body text-xs text-muted-foreground">🔒 Conclua o módulo anterior para liberar</p>
                    )}
                    {concluido && (
                      <div className="mt-3 text-xs font-body text-gold-dark font-semibold flex items-center gap-1">
                        <Crown className="h-3 w-3" /> Concluído!
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Dialog PIX */}
      <Dialog open={mostrarPix} onOpenChange={setMostrarPix}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display text-xl flex items-center gap-2">
              <Coins className="h-5 w-5 text-gold-dark" /> Economia do Reino
            </DialogTitle>
            <DialogDescription className="font-body">
              Sua contribuição ajuda a manter e expandir a missão dos Embaixadores do Reino.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label className="font-body text-foreground">Valor da contribuição (R$)</Label>
              <Input type="number" placeholder="0,00" value={valorPix} onChange={(e) => setValorPix(e.target.value)} className="bg-background border-border" min="1" step="0.01" />
            </div>
            <div className="space-y-2">
              <Label className="font-body text-foreground">Forma de pagamento</Label>
              <Select value={formaPagamento} onValueChange={setFormaPagamento}>
                <SelectTrigger className="bg-background border-border"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="PIX">PIX</SelectItem>
                  <SelectItem value="Boleto">Boleto Bancário</SelectItem>
                  <SelectItem value="Cartão de Crédito">Cartão de Crédito</SelectItem>
                  <SelectItem value="Cartão de Débito">Cartão de Débito</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {formaPagamento === "Cartão de Crédito" && (
              <div className="space-y-2">
                <Label className="font-body text-foreground">Parcelas</Label>
                <Select value={parcelas} onValueChange={setParcelas}>
                  <SelectTrigger className="bg-background border-border"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(n => (
                      <SelectItem key={n} value={String(n)}>
                        {n}x {valorPix ? `de R$ ${(parseFloat(valorPix) / n).toFixed(2)}` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="bg-secondary/50 rounded-lg p-4 text-center">
              <p className="font-body text-sm text-muted-foreground mb-2">
                {formaPagamento === "PIX" ? "Chave PIX" : "Informações de pagamento"}
              </p>
              <p className="font-display text-foreground text-lg">
                {formaPagamento === "PIX" ? "pix@emanuel.com" : "A configuração será feita com a plataforma de pagamentos"}
              </p>
              <p className="font-body text-xs text-muted-foreground mt-2">Após realizar o pagamento, confirme aqui o valor.</p>
            </div>
            <Button onClick={handleContribuicao} className="w-full gradient-royal text-foreground font-display shadow-gold hover:opacity-90">
              Confirmar Contribuição
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog Histórico de Contribuições */}
      <Dialog open={mostrarHistorico} onOpenChange={setMostrarHistorico}>
        <DialogContent className="sm:max-w-md max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display text-xl flex items-center gap-2">
              <History className="h-5 w-5 text-gold-dark" /> Histórico de Contribuições
            </DialogTitle>
            <DialogDescription className="font-body">
              Total contribuído: <span className="font-display text-gold-dark">R$ {totalContribuido.toFixed(2)}</span>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 pt-2">
            {historicoContribuicoes.length === 0 ? (
              <p className="font-body text-sm text-muted-foreground text-center py-4">Nenhuma contribuição registrada.</p>
            ) : (
              [...historicoContribuicoes].reverse().map((c, i) => (
                <div key={i} className="border border-border rounded-lg p-3 flex items-center justify-between">
                  <div>
                    <p className="font-display text-sm text-gold-dark">R$ {c.valor.toFixed(2)}</p>
                    <p className="font-body text-xs text-muted-foreground">{c.forma}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-body text-xs text-foreground">
                      {new Date(c.data).toLocaleDateString("pt-BR")}
                    </p>
                    <p className="font-body text-[10px] text-muted-foreground">
                      {new Date(c.data).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog Campanha via Notificação */}
      <Dialog open={!!notifCampanhaDetalhe} onOpenChange={() => setNotifCampanhaDetalhe(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display text-xl flex items-center gap-2">
              <Megaphone className="h-5 w-5 text-gold-dark" /> {notifCampanhaDetalhe?.titulo}
            </DialogTitle>
            <DialogDescription className="font-body">Detalhes da campanha</DialogDescription>
          </DialogHeader>
          {notifCampanhaDetalhe && (() => {
            const c = notifCampanhaDetalhe;
            const participa = usuario ? c.participantes.includes(usuario.id) : false;
            return (
              <div className="space-y-4 pt-2">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="font-body text-xs">{TIPO_CAMPANHA_LABELS[c.tipo]}</Badge>
                  <Badge className={c.ativa ? "bg-emerald-100 text-emerald-700" : "bg-muted text-muted-foreground"} variant="secondary">
                    {c.ativa ? "Ativa" : "Encerrada"}
                  </Badge>
                </div>
                <p className="font-body text-sm text-muted-foreground">{c.descricao}</p>
                <div className="bg-secondary/30 rounded-lg p-3 space-y-1">
                  <div className="flex justify-between">
                    <span className="font-body text-xs text-muted-foreground">Início</span>
                    <span className="font-body text-xs text-foreground">{new Date(c.dataInicio).toLocaleDateString("pt-BR")}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-body text-xs text-muted-foreground">Fim</span>
                    <span className="font-body text-xs text-foreground">{new Date(c.dataFim).toLocaleDateString("pt-BR")}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-body text-xs text-muted-foreground">Participantes</span>
                    <span className="font-body text-xs text-foreground">{c.participantes.length}</span>
                  </div>
                </div>
                {c.ativa && (
                  participa ? (
                    <Button variant="outline" className="w-full text-muted-foreground" onClick={() => { handleSairCampanha(c.id); setNotifCampanhaDetalhe({...c, participantes: c.participantes.filter(id => id !== usuario!.id)}); }}>
                      Sair da campanha
                    </Button>
                  ) : (
                    <Button className="w-full gradient-royal text-foreground shadow-gold hover:opacity-90" onClick={() => { handleParticiparCampanha(c.id); setNotifCampanhaDetalhe({...c, participantes: [...c.participantes, usuario!.id]}); }}>
                      Participar 🙏
                    </Button>
                  )
                )}
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* Dialog Embaixador Confirmado */}
      <AnimatePresence>
        {mostrarEmbaixador && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-foreground/50 backdrop-blur-sm" onClick={() => setMostrarEmbaixador(false)}>
            <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.8, opacity: 0 }} transition={{ type: "spring", duration: 0.5 }} className="bg-card rounded-2xl p-10 max-w-md w-full shadow-elevated border border-gold/30 text-center" onClick={(e) => e.stopPropagation()}>
              <div className="w-20 h-20 rounded-full gradient-royal flex items-center justify-center mx-auto mb-6 shadow-gold">
                <PartyPopper className="h-10 w-10 text-foreground" />
              </div>
              <h2 className="font-display text-2xl text-foreground mb-4">🏅 Você é um Embaixador do Reino!</h2>
              <p className="font-body text-muted-foreground leading-relaxed mb-4">
                Parabéns! Você completou todos os módulos, indicou pelo menos 3 pessoas e fez sua contribuição.
                Agora você é oficialmente um(a) Embaixador(a) do Reino! 👑
              </p>
              <p className="font-body text-sm text-gold-dark mb-8">
                A Cerimônia de Envio já está disponível nos seus módulos!
              </p>
              <Button className="gradient-royal text-foreground font-display tracking-wider shadow-gold hover:opacity-90" onClick={() => setMostrarEmbaixador(false)}>
                Amém! 🙏
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Dialog: Passaporte do Reino */}
      <Dialog open={mostrarPassaporte} onOpenChange={setMostrarPassaporte}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display text-xl flex items-center gap-2">
              <Award className="h-5 w-5 text-gold-dark" /> Passaporte do Reino
            </DialogTitle>
            <DialogDescription className="font-body">Identidade oficial do Embaixador</DialogDescription>
          </DialogHeader>
          <div id="passaporte-card" className="border-2 border-gold/40 rounded-xl overflow-hidden">
            <div className="gradient-navy p-4 text-center">
              <Crown className="h-8 w-8 text-gold mx-auto mb-2" />
              <h3 className="font-display text-lg text-cream tracking-wider">EMBAIXADORES DO REINO</h3>
              <p className="font-body text-xs text-cream/60">Comunidade de Louvor e Adoração Emanuel</p>
            </div>
            <div className="bg-card p-5 space-y-3">
              <div>
                <p className="font-body text-[10px] text-muted-foreground uppercase tracking-wider">Nome Completo</p>
                <p className="font-display text-base text-foreground">{usuario.nome}</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="font-body text-[10px] text-muted-foreground uppercase tracking-wider">Nº Passaporte</p>
                  <p className="font-display text-sm text-gold-dark">PASS-{String((usuario as any).numeroInscricao || 0).padStart(4, "0")}</p>
                </div>
                <div>
                  <p className="font-body text-[10px] text-muted-foreground uppercase tracking-wider">ID Embaixador</p>
                  <p className="font-display text-sm text-foreground">#{String((usuario as any).numeroInscricao || 0).padStart(4, "0")}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="font-body text-[10px] text-muted-foreground uppercase tracking-wider">Data do Envio</p>
                  <p className="font-body text-sm text-foreground">
                    {usuario.dataContribuicao ? new Date(usuario.dataContribuicao).toLocaleDateString("pt-BR") : new Date().toLocaleDateString("pt-BR")}
                  </p>
                </div>
                <div>
                  <p className="font-body text-[10px] text-muted-foreground uppercase tracking-wider">Cidade</p>
                  <p className="font-body text-sm text-foreground">{usuario.endereco?.cidade || "—"}</p>
                </div>
              </div>
              <div className="flex justify-center pt-2 pb-1">
                <div className="bg-white p-2 rounded-lg">
                  <QRCodeSVG
                    value={`EMBAIXADOR:${usuario.id}|PASS:PASS-${String((usuario as any).numeroInscricao || 0).padStart(4, "0")}|NOME:${usuario.nome}`}
                    size={120}
                    level="M"
                  />
                </div>
              </div>
              <p className="font-body text-[10px] text-center text-muted-foreground">QR Code de Identificação</p>
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <Button variant="outline" size="sm" className="flex-1" onClick={() => {
              const el = document.getElementById("passaporte-card");
              if (!el) return;
              import("html2canvas").then(({ default: html2canvas }) => {
                html2canvas(el, { scale: 2, backgroundColor: null }).then(canvas => {
                  const link = document.createElement("a");
                  link.download = `passaporte-${usuario.nome.replace(/\s+/g, "-")}.png`;
                  link.href = canvas.toDataURL("image/png");
                  link.click();
                  toast.success("Passaporte exportado como PNG!");
                });
              });
            }}>
              <Download className="h-4 w-4 mr-1" /> PNG
            </Button>
            <Button variant="outline" size="sm" className="flex-1" onClick={() => {
              const el = document.getElementById("passaporte-card");
              if (!el) return;
              import("html2canvas").then(({ default: html2canvas }) => {
                html2canvas(el, { scale: 2, backgroundColor: null }).then(canvas => {
                  import("jspdf").then(({ default: jsPDF }) => {
                    const pdf = new jsPDF({ orientation: "portrait", unit: "px", format: [canvas.width / 2, canvas.height / 2] });
                    pdf.addImage(canvas.toDataURL("image/png"), "PNG", 0, 0, canvas.width / 2, canvas.height / 2);
                    pdf.save(`passaporte-${usuario.nome.replace(/\s+/g, "-")}.pdf`);
                    toast.success("Passaporte exportado como PDF!");
                  });
                });
              });
            }}>
              <Download className="h-4 w-4 mr-1" /> PDF
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog: Certificado Digital */}
      <Dialog open={mostrarCertificado} onOpenChange={setMostrarCertificado}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-display text-xl flex items-center gap-2">
              <Award className="h-5 w-5 text-gold-dark" /> Certificado Digital
            </DialogTitle>
            <DialogDescription className="font-body">Certificado de Conclusão — Embaixador do Reino</DialogDescription>
          </DialogHeader>
          <div id="certificado-card" className="border-2 border-gold/40 rounded-xl overflow-hidden bg-card">
            <div className="gradient-navy p-6 text-center relative">
              <div className="absolute top-3 left-3 w-16 h-16 border-2 border-gold/30 rounded-full" />
              <div className="absolute top-3 right-3 w-16 h-16 border-2 border-gold/30 rounded-full" />
              <Crown className="h-10 w-10 text-gold mx-auto mb-3" />
              <h3 className="font-display text-xl text-cream tracking-widest">CERTIFICADO</h3>
              <p className="font-body text-xs text-cream/60 tracking-wider mt-1">EMBAIXADORES DO REINO</p>
              <p className="font-body text-[10px] text-cream/40 mt-0.5">Comunidade de Louvor e Adoração Emanuel</p>
            </div>
            <div className="p-6 space-y-4 text-center">
              <p className="font-body text-sm text-muted-foreground">Certificamos que</p>
              <p className="font-display text-2xl text-foreground border-b border-gold/30 pb-2 mx-8">{usuario.nome}</p>
              <p className="font-body text-sm text-muted-foreground leading-relaxed px-4">
                concluiu com êxito a Formação de Embaixadores do Reino, composta por 3 módulos,
                cumprindo todos os requisitos necessários, incluindo indicações e contribuição à Economia do Reino.
              </p>
              <div className="grid grid-cols-3 gap-3 pt-2">
                <div>
                  <p className="font-body text-[10px] text-muted-foreground uppercase">ID Embaixador</p>
                  <p className="font-display text-sm text-foreground">#{String((usuario as any).numeroInscricao || 0).padStart(4, "0")}</p>
                </div>
                <div>
                  <p className="font-body text-[10px] text-muted-foreground uppercase">Data de Conclusão</p>
                  <p className="font-body text-sm text-foreground">
                    {usuario.dataContribuicao ? new Date(usuario.dataContribuicao).toLocaleDateString("pt-BR") : new Date().toLocaleDateString("pt-BR")}
                  </p>
                </div>
                <div>
                  <p className="font-body text-[10px] text-muted-foreground uppercase">Cidade</p>
                  <p className="font-body text-sm text-foreground">{usuario.endereco?.cidade || "—"}</p>
                </div>
              </div>
              <div className="flex justify-center pt-3">
                <div className="bg-white p-2 rounded-lg">
                  <QRCodeSVG
                    value={`CERTIFICADO:${usuario.id}|EMBAIXADOR:#{String((usuario as any).numeroInscricao || 0).padStart(4, "0")}|NOME:${usuario.nome}`}
                    size={80}
                    level="M"
                  />
                </div>
              </div>
              <p className="font-body text-[10px] text-muted-foreground">Verificação digital via QR Code</p>
            </div>
          </div>
          <div className="flex gap-2 mt-2">
            <Button variant="outline" size="sm" className="flex-1" onClick={() => {
              const el = document.getElementById("certificado-card");
              if (!el) return;
              import("html2canvas").then(({ default: html2canvas }) => {
                html2canvas(el, { scale: 2, backgroundColor: null }).then(canvas => {
                  const link = document.createElement("a");
                  link.download = `certificado-${usuario.nome.replace(/\s+/g, "-")}.png`;
                  link.href = canvas.toDataURL("image/png");
                  link.click();
                  toast.success("Certificado exportado como PNG!");
                });
              });
            }}>
              <Download className="h-4 w-4 mr-1" /> PNG
            </Button>
            <Button variant="outline" size="sm" className="flex-1" onClick={() => {
              const el = document.getElementById("certificado-card");
              if (!el) return;
              import("html2canvas").then(({ default: html2canvas }) => {
                html2canvas(el, { scale: 2, backgroundColor: null }).then(canvas => {
                  import("jspdf").then(({ default: jsPDF }) => {
                    const pdf = new jsPDF({ orientation: "landscape", unit: "px", format: [canvas.width / 2, canvas.height / 2] });
                    pdf.addImage(canvas.toDataURL("image/png"), "PNG", 0, 0, canvas.width / 2, canvas.height / 2);
                    pdf.save(`certificado-${usuario.nome.replace(/\s+/g, "-")}.pdf`);
                    toast.success("Certificado exportado como PDF!");
                  });
                });
              });
            }}>
              <Download className="h-4 w-4 mr-1" /> PDF
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog: Meu Cadastro */}
      <Dialog open={mostrarCadastro} onOpenChange={setMostrarCadastro}>
        <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display text-xl flex items-center gap-2">
              <UserCog className="h-5 w-5 text-gold-dark" /> Meu Cadastro
            </DialogTitle>
            <DialogDescription className="font-body">Edite suas informações pessoais</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label className="font-body text-foreground">Nome Completo</Label>
              <Input value={editNome} onChange={(e) => setEditNome(e.target.value)} className="bg-background border-border" />
            </div>
            <div className="space-y-2">
              <Label className="font-body text-foreground">E-mail</Label>
              <Input value={editEmail} onChange={(e) => setEditEmail(e.target.value)} className="bg-background border-border" />
            </div>
            <div className="space-y-2">
              <Label className="font-body text-foreground">CPF</Label>
              <Input value={usuario.cpf} disabled className="bg-muted border-border cursor-not-allowed" />
              <p className="font-body text-[10px] text-muted-foreground">O CPF não pode ser alterado.</p>
            </div>
            <div className="space-y-2">
              <Label className="font-body text-foreground">Data de Nascimento</Label>
              <Input type="date" value={editDataNascimento} onChange={(e) => setEditDataNascimento(e.target.value)} className="bg-background border-border" />
            </div>
            <div className="space-y-2">
              <Label className="font-body text-foreground">CEP</Label>
              <Input value={editCep} onChange={(e) => {
                const v = e.target.value.replace(/\D/g, "").slice(0, 8);
                const formatted = v.length > 5 ? `${v.slice(0, 5)}-${v.slice(5)}` : v;
                setEditCep(formatted);
              }} placeholder="00000-000" className="bg-background border-border" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="font-body text-foreground">Rua</Label>
                <Input value={editRua} onChange={(e) => setEditRua(e.target.value)} className="bg-background border-border" />
              </div>
              <div className="space-y-2">
                <Label className="font-body text-foreground">Número</Label>
                <Input value={editNumero} onChange={(e) => setEditNumero(e.target.value)} className="bg-background border-border" />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="font-body text-foreground">Bairro</Label>
              <Input value={editBairro} onChange={(e) => setEditBairro(e.target.value)} className="bg-background border-border" />
            </div>
            <div className="space-y-2">
              <Label className="font-body text-foreground">País</Label>
              <Select value={editPais} onValueChange={(v) => { setEditPais(v); setEditEstado(""); setEditCidade(""); }}>
                <SelectTrigger className="bg-background border-border"><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {paises.map(p => <SelectItem key={p.codigo} value={p.nome}>{p.nome}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="font-body text-foreground">Estado</Label>
                <Select value={editEstado} onValueChange={(v) => { setEditEstado(v); setEditCidade(""); }}>
                  <SelectTrigger className="bg-background border-border"><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {(paises.find(p => p.nome === editPais)?.estados || []).map(e => <SelectItem key={e.sigla} value={e.nome}>{e.nome}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="font-body text-foreground">Cidade</Label>
                <Select value={editCidade} onValueChange={setEditCidade}>
                  <SelectTrigger className="bg-background border-border"><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {(paises.find(p => p.nome === editPais)?.estados.find(e => e.nome === editEstado)?.cidades || []).map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button className="w-full gradient-royal text-foreground font-display shadow-gold hover:opacity-90" onClick={() => {
              if (!editNome.trim() || !editEmail.trim()) { toast.error("Nome e e-mail são obrigatórios"); return; }
              const dados = { nome: editNome.trim(), email: editEmail.trim(), dataNascimento: editDataNascimento, endereco: { rua: editRua, numero: editNumero, bairro: editBairro, cep: editCep, cidade: editCidade, estado: editEstado, pais: editPais } };
              atualizarUsuario(usuario.id, dados as any).then((atualizado) => {
                setUsuario(atualizado);
                setMostrarCadastro(false);
                toast.success("Cadastro atualizado com sucesso! ✅");
              }).catch(() => toast.error("Erro ao atualizar cadastro"));
            }}>
              Salvar Alterações
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <AnimatePresence>
        {mostrarBoasVindas && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center p-6"
            style={{ background: "hsl(220 40% 13%)" }}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: -20 }}
              transition={{ type: "spring", duration: 0.7, delay: 0.2 }}
              className="max-w-lg w-full text-center"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", duration: 0.6, delay: 0.4 }}
              >
                <Crown className="h-16 w-16 text-gold mx-auto mb-8" />
              </motion.div>
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="font-display text-3xl md:text-4xl text-cream mb-4 leading-tight"
              >
                Seja bem-vindo(a) aos<br />
                <span className="text-gold">Embaixadores do Reino</span>
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
                className="font-body text-cream/70 text-lg mb-3 leading-relaxed"
              >
                "Ide por todo o mundo e pregai o Evangelho a toda criatura."
              </motion.p>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.0 }}
                className="font-body text-cream/50 text-sm mb-10"
              >
                Marcos 16:15
              </motion.p>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.2 }}
                className="font-body text-cream/60 text-base mb-8"
              >
                Sua jornada como Embaixador(a) começa agora. Prepare-se para conhecer, viver e propagar os valores do Reino! 🙏
              </motion.p>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.5 }}
              >
                <Button
                  onClick={() => setMostrarBoasVindas(false)}
                  className="gradient-royal text-foreground font-display text-base tracking-wider shadow-gold hover:opacity-90 px-10 py-6"
                >
                  Clique aqui para iniciar a sua jornada 👑
                </Button>
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Dashboard;