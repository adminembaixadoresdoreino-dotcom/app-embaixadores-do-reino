import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Crown, ArrowLeft, Users, Clock, BookOpen, ChevronUp, ChevronDown, ChevronsUpDown, DollarSign, Share2, CheckCircle2, XCircle, FileText, Megaphone, UserCog, Plus, Trash2, Bell, Send, Eye, Edit3, Award, GripVertical, Save, RotateCcw, Video, Link as LinkIcon, Search, Cake, Hash, Stamp, Trophy, Target, BarChart3 } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getModulos, getModulosFormacao, salvarModulos, resetarModulos, type Modulo, type Aula, type Usuario, type RoleUsuario, getSemaforoAcesso, STATUS_LABELS, STATUS_CORES, podeVerFinanceiro, podeGerenciarCampanhas, podeVerUsuarios, podeEditarPermissoes, podeEditarModulos, calcularStatus, getMensagemInatividade, fetchUsuarios, getUsuarioAtual, alterarRole, tornarEmbaixador } from "@/lib/dados";
import { getSessao } from "@/lib/api";
import { getCampanhas, fetchCampanhas, salvarCampanha, excluirCampanha, criarNotificacaoParaTodos, TIPO_CAMPANHA_LABELS, UNIDADE_PADRAO, getRankingCampanha, getTotalRegistrosCampanha, diasRestantesCampanha, type Campanha, criarNotificacaoParaUsuario } from "@/lib/campanhas";
import { motion } from "framer-motion";
import { toast } from "sonner";
import * as XLSX from "xlsx";

type SortDir = "asc" | "desc" | null;
type SortCol = "nome" | "email" | "dataCadastro" | "ultimoAcesso" | "progresso" | "status" | "contribuiu" | "indicacoes" | null;

// Generate sequential campaign number
function proximoNumeroCampanha(campanhas: Campanha[]): string {
  const nums = campanhas.map(c => {
    const match = (c as any).numeroCampanha?.match(/(\d+)/);
    return match ? parseInt(match[1]) : 0;
  });
  const max = nums.length > 0 ? Math.max(...nums) : 0;
  return `C-${String(max + 1).padStart(4, "0")}`;
}

const Admin = () => {
  const navigate = useNavigate();
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [adminAtual, setAdminAtual] = useState<Usuario | null>(null);
  const [sortCol, setSortCol] = useState<SortCol>(null);
  const [sortDir, setSortDir] = useState<SortDir>(null);
  const [buscaUsuario, setBuscaUsuario] = useState("");
  const [buscaCampanha, setBuscaCampanha] = useState("");
  const [buscaPassaporte, setBuscaPassaporte] = useState("");
  const [aniversarianteDetalhe, setAniversarianteDetalhe] = useState<Usuario | null>(null);

  const [progressoUsuario, setProgressoUsuario] = useState<Usuario | null>(null);
  const [indicacoesUsuario, setIndicacoesUsuario] = useState<Usuario | null>(null);
  const [mostrarModulos, setMostrarModulos] = useState(false);
  const [editarRoleUsuario, setEditarRoleUsuario] = useState<Usuario | null>(null);
  const [novaRole, setNovaRole] = useState<RoleUsuario>("embaixador");

  // Relatórios
  const [mostrarRelatorio, setMostrarRelatorio] = useState(false);
  const [tipoRelatorio, setTipoRelatorio] = useState<string>("completo");

  // Campanhas
  const [campanhas, setCampanhas] = useState<Campanha[]>([]);
  const [mostrarNovaCampanha, setMostrarNovaCampanha] = useState(false);
  const [editandoCampanha, setEditandoCampanha] = useState<Campanha | null>(null);
  const [formCampanha, setFormCampanha] = useState({ titulo: "", descricao: "", tipo: "oracao" as Campanha["tipo"], dataInicio: "", dataFim: "", ativa: true, objetivo: "", instrucoes: "", unidadeRegistro: "" });
  const [participantesCampanha, setParticipantesCampanha] = useState<Campanha | null>(null);
  const [relatorioCampanha, setRelatorioCampanha] = useState<Campanha | null>(null);

  // Notificações manuais
  const [notifUsuario, setNotifUsuario] = useState<Usuario | null>(null);
  const [notifMensagem, setNotifMensagem] = useState("");
  const [notifTitulo, setNotifTitulo] = useState("");

  // Módulos editáveis
  const [modulosEditaveis, setModulosEditaveis] = useState<Modulo[]>([]);
  const [editandoModulo, setEditandoModulo] = useState<Modulo | null>(null);
  const [editandoAula, setEditandoAula] = useState<{ modulo: Modulo; aula: Aula; isNew?: boolean } | null>(null);
  const [formAula, setFormAula] = useState({ titulo: "", descricao: "", duracao: "", videoUrl: "", semana: 1, tipo: "video" as Aula["tipo"] });

  useEffect(() => {
    const u = getUsuarioAtual();
    if (!u) { navigate("/login"); return; }
    setAdminAtual(u);
    if (!["admin", "moderador", "auxiliar", "editor"].includes(u.role)) { navigate("/dashboard"); return; }
    
    // Busca dados do backend
    fetchUsuarios().then(setUsuarios).catch(() => {});
    fetchCampanhas().then(setCampanhas).catch(() => {});
    setModulosEditaveis(getModulos());
  }, [navigate]);

  const role = adminAtual?.role || "auxiliar";

  const calcularProgressoTotal = (usuario: Usuario) => {
    const mf = getModulosFormacao();
    const totalAulas = mf.reduce((acc, m) => acc + m.aulas.length, 0);
    const aulasFeitas = mf.reduce((acc, m) => acc + (usuario.progresso?.[m.id] || []).length, 0);
    return totalAulas > 0 ? Math.round((aulasFeitas / totalAulas) * 100) : 0;
  };

  const formatarData = (iso: string) => {
    try {
      return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
    } catch { return "—"; }
  };

  const diasInatividadeUsuario = (u: Usuario) => {
    const agora = new Date();
    const ultimo = new Date(u.ultimoAcesso);
    return Math.floor((agora.getTime() - ultimo.getTime()) / (1000 * 60 * 60 * 24));
  };

  const handleSort = (col: SortCol) => {
    if (sortCol === col) {
      if (sortDir === "asc") setSortDir("desc");
      else if (sortDir === "desc") { setSortCol(null); setSortDir(null); }
      else setSortDir("asc");
    } else { setSortCol(col); setSortDir("asc"); }
  };

  const SortIcon = ({ col }: { col: SortCol }) => {
    if (sortCol !== col) return <ChevronsUpDown className="h-3 w-3 ml-1 opacity-40" />;
    if (sortDir === "asc") return <ChevronUp className="h-3 w-3 ml-1 text-gold-dark" />;
    return <ChevronDown className="h-3 w-3 ml-1 text-gold-dark" />;
  };

  // Filter + sort users
  const usuariosFiltrados = useMemo(() => {
    let lista = usuarios;
    if (buscaUsuario.trim()) {
      const termo = buscaUsuario.toLowerCase();
      lista = lista.filter(u => u.nome.toLowerCase().includes(termo) || u.email.toLowerCase().includes(termo));
    }
    if (!sortCol || !sortDir) return lista;
    return [...lista].sort((a, b) => {
      let va: any, vb: any;
      switch (sortCol) {
        case "nome": va = a.nome.toLowerCase(); vb = b.nome.toLowerCase(); break;
        case "email": va = a.email.toLowerCase(); vb = b.email.toLowerCase(); break;
        case "dataCadastro": va = a.dataCadastro; vb = b.dataCadastro; break;
        case "ultimoAcesso": va = a.ultimoAcesso; vb = b.ultimoAcesso; break;
        case "progresso": va = calcularProgressoTotal(a); vb = calcularProgressoTotal(b); break;
        case "status": va = a.status || ""; vb = b.status || ""; break;
        case "contribuiu": va = a.contribuiuPix ? 1 : 0; vb = b.contribuiuPix ? 1 : 0; break;
        case "indicacoes": va = a.indicacoes?.length || 0; vb = b.indicacoes?.length || 0; break;
        default: return 0;
      }
      if (va < vb) return sortDir === "asc" ? -1 : 1;
      if (va > vb) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
  }, [usuarios, sortCol, sortDir, buscaUsuario]);

  // Filter campaigns
  const campanhasFiltradas = useMemo(() => {
    if (!buscaCampanha.trim()) return campanhas;
    const termo = buscaCampanha.toLowerCase();
    return campanhas.filter(c => c.titulo.toLowerCase().includes(termo) || (c as any).numeroCampanha?.toLowerCase().includes(termo));
  }, [campanhas, buscaCampanha]);

  // Birthday helpers
  const getAniversariantes = (mesOffset: number) => {
    const hoje = new Date();
    const mesAlvo = (hoje.getMonth() + mesOffset) % 12;
    return usuarios.filter(u => {
      if (!u.dataNascimento) return false;
      const nascDate = new Date(u.dataNascimento + "T00:00:00");
      return nascDate.getMonth() === mesAlvo;
    }).sort((a, b) => {
      const dA = new Date(a.dataNascimento + "T00:00:00").getDate();
      const dB = new Date(b.dataNascimento + "T00:00:00").getDate();
      return dA - dB;
    });
  };

  const nomeMes = (offset: number) => {
    const d = new Date();
    d.setMonth(d.getMonth() + offset);
    return d.toLocaleString("pt-BR", { month: "long" });
  };

  const modFormacao = getModulosFormacao();
  const moduloStats = modFormacao.map((m) => {
    const qtdConcluiram = usuarios.filter((u) => (u.progresso?.[m.id] || []).length === m.aulas.length).length;
    const qtdEmAndamento = usuarios.filter((u) => { const f = u.progresso?.[m.id] || []; return f.length > 0 && f.length < m.aulas.length; }).length;
    return { ...m, qtdConcluiram, qtdEmAndamento };
  });

  // Stats
  const totalParticipantes = usuarios.length;
  const totalEmbaixadores = usuarios.filter((u) => u.embaixadorConfirmado).length;
  const totalContribuicoes = usuarios.filter((u) => u.contribuiuPix).length;
  const valorTotal = usuarios.reduce((acc, u) => acc + (u.valorContribuicao || 0), 0);

  const handleSalvarRole = async () => {
    if (!editarRoleUsuario) return;
    try {
      const atualizado = await alterarRole(editarRoleUsuario.id, novaRole);
      setUsuarios(prev => prev.map(u => u.id === atualizado.id ? atualizado : u));
      toast.success("Permissão atualizada!");
    } catch (err) {
      toast.error("Erro ao alterar permissão");
    }
    setEditarRoleUsuario(null);
  };

  const handleSalvarCampanha = () => {
    if (!formCampanha.titulo || !formCampanha.dataInicio || !formCampanha.dataFim) {
      toast.error("Preencha todos os campos"); return;
    }
    if (editandoCampanha) {
      const atualizada: Campanha = {
        ...editandoCampanha,
        titulo: formCampanha.titulo,
        descricao: formCampanha.descricao,
        tipo: formCampanha.tipo,
        dataInicio: formCampanha.dataInicio,
        dataFim: formCampanha.dataFim,
        ativa: formCampanha.ativa,
        objetivo: formCampanha.objetivo,
        instrucoes: formCampanha.instrucoes,
        unidadeRegistro: formCampanha.unidadeRegistro || undefined,
      };
      salvarCampanha(atualizada);
      setCampanhas(getCampanhas());
      setEditandoCampanha(null);
      setMostrarNovaCampanha(false);
      toast.success("Campanha atualizada!");
    } else {
      const nova: any = {
        id: crypto.randomUUID(),
        titulo: formCampanha.titulo,
        descricao: formCampanha.descricao,
        tipo: formCampanha.tipo,
        dataInicio: formCampanha.dataInicio,
        dataFim: formCampanha.dataFim,
        ativa: true,
        participantes: [],
        criadoPor: adminAtual?.id || "",
        dataCriacao: new Date().toISOString(),
        numeroCampanha: proximoNumeroCampanha(campanhas),
        objetivo: formCampanha.objetivo,
        instrucoes: formCampanha.instrucoes,
        unidadeRegistro: formCampanha.unidadeRegistro || undefined,
      };
      salvarCampanha(nova);
      criarNotificacaoParaTodos(`Nova campanha: ${nova.titulo}`, nova.descricao, "campanha", nova.id);
      setCampanhas(getCampanhas());
      toast.success("Campanha criada e notificações enviadas!");
    }
    setMostrarNovaCampanha(false);
    setFormCampanha({ titulo: "", descricao: "", tipo: "oracao", dataInicio: "", dataFim: "", ativa: true, objetivo: "", instrucoes: "", unidadeRegistro: "" });
    setEditandoCampanha(null);
  };

  const handleEditarCampanha = (c: Campanha) => {
    setEditandoCampanha(c);
    setFormCampanha({
      titulo: c.titulo,
      descricao: c.descricao,
      tipo: c.tipo,
      dataInicio: c.dataInicio,
      dataFim: c.dataFim,
      ativa: c.ativa,
      objetivo: c.objetivo || "",
      instrucoes: c.instrucoes || "",
      unidadeRegistro: c.unidadeRegistro || "",
    });
    setMostrarNovaCampanha(true);
  };

  const handleExcluirCampanha = (id: string) => {
    excluirCampanha(id);
    setCampanhas(getCampanhas());
    toast.success("Campanha excluída");
  };

  const handleEnviarNotificacao = () => {
    if (!notifUsuario || !notifTitulo || !notifMensagem) {
      toast.error("Preencha título e mensagem"); return;
    }
    criarNotificacaoParaUsuario(notifUsuario.id, notifTitulo, notifMensagem, "mensagem");
    toast.success(`Notificação enviada para ${notifUsuario.nome}!`);
    setNotifUsuario(null);
    setNotifTitulo("");
    setNotifMensagem("");
  };

  const handleEnviarNotifInatividade = (u: Usuario) => {
    const dias = diasInatividadeUsuario(u);
    const msg = getMensagemInatividade(dias);
    if (!msg) { toast.error("Usuário está ativo, sem mensagem de inatividade"); return; }
    criarNotificacaoParaUsuario(u.id, `Sentimos sua falta! 💛`, msg, "mensagem");
    toast.success(`Notificação de inatividade enviada para ${u.nome}!`);
  };

  // XLSX Reports
  const gerarRelatorioXlsx = (tipo: string) => {
    let dados: any[] = [];
    const dataAtual = new Date().toLocaleDateString("pt-BR");

    switch (tipo) {
      case "participantes":
        dados = usuarios.map((u) => {
          const e = u.endereco || {} as any;
          const campanhasCount = campanhas.filter((c) => c.participantes.includes(u.id)).length;
          return {
            "Nº Inscrição": (u as any).numeroInscricao || "—",
            Nome: u.nome, Email: u.email, CPF: u.cpf || "", "Data Nascimento": u.dataNascimento || "",
            Status: STATUS_LABELS[u.status || calcularStatus(u)], Cadastro: formatarData(u.dataCadastro),
            "Último Acesso": formatarData(u.ultimoAcesso), "Progresso %": calcularProgressoTotal(u),
            Indicações: u.indicacoes?.length || 0, Contribuiu: u.contribuiuPix ? "Sim" : "Não",
            "Valor Doado": u.valorContribuicao?.toFixed(2) || "0.00", "Campanhas Participou": campanhasCount,
            Rua: e.rua || "", Número: e.numero || "", Bairro: e.bairro || "", CEP: e.cep || "",
            Cidade: e.cidade || "", Estado: e.estado || "", País: e.pais || "",
          };
        });
        break;
      case "embaixadores":
        dados = usuarios.filter((u) => u.embaixadorConfirmado).map((u) => {
          const e = u.endereco || {} as any;
          return {
            "Nº Inscrição": (u as any).numeroInscricao || "—",
            "Nº Passaporte": (u as any).numeroPassaporte || "—",
            Nome: u.nome, Email: u.email, Indicações: u.indicacoes?.length || 0,
            Contribuição: u.valorContribuicao?.toFixed(2) || "0.00",
            Cidade: e.cidade || "", Estado: e.estado || "", País: e.pais || "",
          };
        });
        break;
      case "campanhas":
        dados = campanhas.map((c) => ({
          "Nº Campanha": (c as any).numeroCampanha || "—",
          Campanha: c.titulo, Tipo: TIPO_CAMPANHA_LABELS[c.tipo],
          Status: c.ativa ? "Ativa" : "Encerrada",
          "Data Início": new Date(c.dataInicio).toLocaleDateString("pt-BR"),
          "Data Fim": new Date(c.dataFim).toLocaleDateString("pt-BR"),
          Participantes: c.participantes.length,
        }));
        break;
      case "contribuicoes":
        dados = usuarios.filter((u) => u.contribuiuPix).map((u) => {
          const e = u.endereco || {} as any;
          return {
            Nome: u.nome, Email: u.email, Valor: u.valorContribuicao?.toFixed(2) || "0.00",
            Data: u.dataContribuicao ? formatarData(u.dataContribuicao) : "—",
            Cidade: e.cidade || "", Estado: e.estado || "",
          };
        });
        break;
      default: // completo
        dados = usuarios.map((u) => {
          const e = u.endereco || {} as any;
          return {
            "Nº Inscrição": (u as any).numeroInscricao || "—",
            Nome: u.nome, Email: u.email, CPF: u.cpf || "",
            Status: STATUS_LABELS[u.status || calcularStatus(u)],
            Cadastro: formatarData(u.dataCadastro), "Progresso %": calcularProgressoTotal(u),
            Indicações: u.indicacoes?.length || 0, Contribuiu: u.contribuiuPix ? "Sim" : "Não",
            Valor: u.valorContribuicao?.toFixed(2) || "0.00",
            Cidade: e.cidade || "", Estado: e.estado || "", País: e.pais || "",
          };
        });
        break;
    }

    const ws = XLSX.utils.json_to_sheet(dados);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, tipo);
    XLSX.writeFile(wb, `relatorio-${tipo}-${new Date().toISOString().slice(0, 10)}.xlsx`);
    toast.success("Planilha Excel gerada!");
    setMostrarRelatorio(false);
  };

  const thClass = "text-left px-4 py-3 font-display text-xs text-foreground cursor-pointer select-none hover:bg-secondary/30 transition-colors whitespace-nowrap";

  if (!adminAtual) return null;

  return (
    <div className="min-h-screen bg-background">
      <header className="gradient-navy border-b border-gold/20">
        <div className="container mx-auto px-6 py-4 flex items-center gap-4">
          <button onClick={() => navigate("/dashboard")} className="text-cream/60 hover:text-cream transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-3">
            <Crown className="h-5 w-5 text-gold" />
            <span className="font-display text-sm text-cream tracking-wider">Painel Administrativo</span>
          </div>
          <Badge className="font-body text-[10px] ml-auto bg-gold/20 text-gold border-gold/30">{role.toUpperCase()}</Badge>
        </div>
      </header>

      <div className="container mx-auto px-6 py-10">
        <Tabs defaultValue="usuarios" className="space-y-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
              <h1 className="font-display text-2xl md:text-3xl text-foreground mb-1">Painel do Administrador</h1>
              <p className="font-body text-muted-foreground">Gerencie embaixadores, campanhas, módulos e relatórios.</p>
            </motion.div>
            <Button variant="outline" size="sm" onClick={() => setMostrarRelatorio(true)}>
              <FileText className="h-4 w-4 mr-1" /> Gerar Relatório
            </Button>
          </div>

          <TabsList className="font-body">
            <TabsTrigger value="usuarios"><Users className="h-4 w-4 mr-1" /> Usuários</TabsTrigger>
            {podeGerenciarCampanhas(role) && (
              <TabsTrigger value="campanhas"><Megaphone className="h-4 w-4 mr-1" /> Campanhas</TabsTrigger>
            )}
            {podeEditarModulos(role) && (
              <TabsTrigger value="modulos"><BookOpen className="h-4 w-4 mr-1" /> Módulos</TabsTrigger>
            )}
            <TabsTrigger value="aniversariantes"><Cake className="h-4 w-4 mr-1" /> Aniversariantes</TabsTrigger>
            <TabsTrigger value="passaportes"><Stamp className="h-4 w-4 mr-1" /> Passaportes</TabsTrigger>
          </TabsList>

          {/* === TAB USUÁRIOS === */}
          <TabsContent value="usuarios" className="space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { icon: Users, label: "Participantes", valor: totalParticipantes },
                { icon: Crown, label: "Embaixadores", valor: totalEmbaixadores },
                { icon: BookOpen, label: "Módulos", valor: modFormacao.length, onClick: () => setMostrarModulos(true) },
                ...(podeVerFinanceiro(role) ? [{ icon: DollarSign, label: "Arrecadado", valor: `R$ ${valorTotal.toFixed(2)}` }] : [{ icon: Clock, label: "Total de Aulas", valor: modFormacao.reduce((acc, m) => acc + m.aulas.length, 0) }]),
              ].map((stat, i) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: i * 0.1 }}
                  className={`bg-card rounded-xl p-5 shadow-card border border-border ${(stat as any).onClick ? "cursor-pointer hover:border-gold/30 hover:shadow-elevated transition-all" : ""}`}
                  onClick={(stat as any).onClick}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <stat.icon className="h-5 w-5 text-gold-dark" />
                    <span className="font-body text-sm text-muted-foreground">{stat.label}</span>
                  </div>
                  <span className="font-display text-2xl text-foreground">{stat.valor}</span>
                  {(stat as any).onClick && <p className="font-body text-xs text-muted-foreground mt-1">Clique para detalhes</p>}
                </motion.div>
              ))}
            </div>

            {/* Search */}
            <div className="relative max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Pesquisar por nome ou email..."
                value={buscaUsuario}
                onChange={(e) => setBuscaUsuario(e.target.value)}
                className="pl-9 bg-background border-border"
              />
            </div>

            {/* Tabela */}
            <div className="bg-card rounded-xl shadow-card border border-border overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border bg-secondary/50">
                      <th className="text-left px-4 py-3 font-display text-xs text-foreground whitespace-nowrap">Nº</th>
                      <th className={thClass} onClick={() => handleSort("nome")}><span className="flex items-center">Nome <SortIcon col="nome" /></span></th>
                      <th className={thClass} onClick={() => handleSort("status")}><span className="flex items-center">Status <SortIcon col="status" /></span></th>
                      <th className="text-left px-4 py-3 font-display text-xs text-foreground whitespace-nowrap">Cidade</th>
                      <th className="text-left px-4 py-3 font-display text-xs text-foreground whitespace-nowrap">Estado</th>
                      <th className={thClass} onClick={() => handleSort("ultimoAcesso")}><span className="flex items-center">Acesso <SortIcon col="ultimoAcesso" /></span></th>
                      <th className={thClass} onClick={() => handleSort("progresso")}><span className="flex items-center">Progresso <SortIcon col="progresso" /></span></th>
                      <th className={thClass} onClick={() => handleSort("contribuiu")}><span className="flex items-center">Contribuição <SortIcon col="contribuiu" /></span></th>
                      <th className={thClass} onClick={() => handleSort("indicacoes")}><span className="flex items-center">Indicações <SortIcon col="indicacoes" /></span></th>
                      <th className="text-left px-4 py-3 font-display text-xs text-foreground whitespace-nowrap">Campanhas</th>
                      <th className="text-left px-4 py-3 font-display text-xs text-foreground whitespace-nowrap">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {usuariosFiltrados.length === 0 ? (
                      <tr><td colSpan={11} className="px-6 py-10 text-center font-body text-muted-foreground">Nenhum participante encontrado.</td></tr>
                    ) : (
                      usuariosFiltrados.map((u) => {
                        const progresso = calcularProgressoTotal(u);
                        const numIndicacoes = u.indicacoes?.length || 0;
                        const semaforo = getSemaforoAcesso(u.ultimoAcesso);
                        const status = u.status || calcularStatus(u);
                        const diasInativo = diasInatividadeUsuario(u);
                        return (
                          <tr key={u.id} className="border-b border-border last:border-0 hover:bg-secondary/30 transition-colors">
                            <td className="px-4 py-3">
                              <span className="font-body text-xs text-muted-foreground">{(u as any).numeroInscricao || "—"}</span>
                            </td>
                            <td className="px-4 py-3">
                              <div>
                                <span className="font-body text-sm text-foreground">{u.nome}</span>
                                <p className="font-body text-xs text-muted-foreground">{u.email}</p>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <Badge className={`${STATUS_CORES[status]} font-body text-[10px]`}>{STATUS_LABELS[status]}</Badge>
                            </td>
                            <td className="px-4 py-3">
                              <span className="font-body text-xs text-muted-foreground">{u.endereco?.cidade || "—"}</span>
                            </td>
                            <td className="px-4 py-3">
                              <span className="font-body text-xs text-muted-foreground">{u.endereco?.estado || "—"}</span>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <span className={`w-2.5 h-2.5 rounded-full ${semaforo.classe}`} title={semaforo.label} />
                                <span className="font-body text-xs text-muted-foreground">{formatarData(u.ultimoAcesso)}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-3 min-w-[140px] cursor-pointer" onClick={() => setProgressoUsuario(u)} title="Clique para ver detalhes">
                                <Progress value={progresso} className="h-2 flex-1" />
                                <span className="font-body text-xs text-muted-foreground w-8">{progresso}%</span>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-center">
                              {u.contribuiuPix ? (
                                <div className="flex flex-col items-center">
                                  <CheckCircle2 className="h-4 w-4 text-gold-dark" />
                                  {podeVerFinanceiro(role) && u.valorContribuicao && (
                                    <span className="font-body text-[10px] text-muted-foreground">R$ {u.valorContribuicao.toFixed(2)}</span>
                                  )}
                                </div>
                              ) : (
                                <XCircle className="h-4 w-4 text-muted-foreground/40 inline" />
                              )}
                            </td>
                            <td className="px-4 py-3">
                              {numIndicacoes > 0 ? (
                                <button className="font-display text-sm text-gold-dark hover:underline" onClick={() => setIndicacoesUsuario(u)}>
                                  {numIndicacoes}
                                </button>
                              ) : (
                                <span className="font-body text-sm text-muted-foreground">0</span>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              <span className="font-body text-sm text-muted-foreground">
                                {campanhas.filter((c) => c.participantes.includes(u.id)).length}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-1">
                                {podeEditarPermissoes(role) && (
                                  <button className="text-muted-foreground/60 hover:text-gold-dark transition-colors p-1" title="Editar permissão" onClick={() => { setEditarRoleUsuario(u); setNovaRole(u.role); }}>
                                    <UserCog className="h-3.5 w-3.5" />
                                  </button>
                                )}
                                <button className="text-muted-foreground/60 hover:text-gold-dark transition-colors p-1" title="Enviar notificação" onClick={() => { setNotifUsuario(u); setNotifTitulo(""); setNotifMensagem(""); }}>
                                  <Bell className="h-3.5 w-3.5" />
                                </button>
                                {diasInativo >= 15 && (
                                  <button className="text-amber-500/70 hover:text-amber-600 transition-colors p-1" title={`Enviar alerta de inatividade (${diasInativo} dias)`} onClick={() => handleEnviarNotifInatividade(u)}>
                                    <Send className="h-3.5 w-3.5" />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </TabsContent>

          {/* === TAB CAMPANHAS === */}
          {podeGerenciarCampanhas(role) && (
            <TabsContent value="campanhas" className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-xl text-foreground">Gestão de Campanhas</h2>
                <Button size="sm" className="gradient-royal text-foreground shadow-gold hover:opacity-90" onClick={() => {
                  setEditandoCampanha(null);
                  setFormCampanha({ titulo: "", descricao: "", tipo: "oracao", dataInicio: "", dataFim: "", ativa: true, objetivo: "", instrucoes: "", unidadeRegistro: "" });
                  setMostrarNovaCampanha(true);
                }}>
                  <Plus className="h-4 w-4 mr-1" /> Nova Campanha
                </Button>
              </div>

              <div className="grid grid-cols-3 gap-4">
                {[
                  { icon: Megaphone, label: "Campanhas", valor: campanhas.length },
                  { icon: CheckCircle2, label: "Ativas", valor: campanhas.filter((c) => c.ativa).length },
                  { icon: Clock, label: "Encerradas", valor: campanhas.filter((c) => !c.ativa).length },
                ].map((stat, i) => (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: i * 0.1 }}
                    className="bg-card rounded-xl p-5 shadow-card border border-border"
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <stat.icon className="h-5 w-5 text-gold-dark" />
                      <span className="font-body text-sm text-muted-foreground">{stat.label}</span>
                    </div>
                    <span className="font-display text-2xl text-foreground">{stat.valor}</span>
                  </motion.div>
                ))}
              </div>

              {/* Search campaigns */}
              <div className="relative max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Pesquisar por nome da campanha..."
                  value={buscaCampanha}
                  onChange={(e) => setBuscaCampanha(e.target.value)}
                  className="pl-9 bg-background border-border"
                />
              </div>

              {campanhasFiltradas.length === 0 ? (
                <div className="bg-card rounded-xl p-10 shadow-card border border-border text-center">
                  <Megaphone className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="font-body text-muted-foreground">Nenhuma campanha encontrada.</p>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 gap-4">
                  {campanhasFiltradas.map((c) => (
                    <div key={c.id} className="bg-card rounded-xl p-5 shadow-card border border-border">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="font-body text-xs">{TIPO_CAMPANHA_LABELS[c.tipo]}</Badge>
                          {(c as any).numeroCampanha && (
                            <span className="font-body text-[10px] text-muted-foreground flex items-center gap-0.5">
                              <Hash className="h-3 w-3" />{(c as any).numeroCampanha}
                            </span>
                          )}
                        </div>
                        <div className="flex gap-1">
                          <Badge className={c.ativa ? "bg-emerald-100 text-emerald-700" : "bg-muted text-muted-foreground"} variant="secondary">
                            {c.ativa ? "Ativa" : "Encerrada"}
                          </Badge>
                          <button onClick={() => handleEditarCampanha(c)} className="text-muted-foreground/40 hover:text-gold-dark transition-colors p-1" title="Editar">
                            <Edit3 className="h-3.5 w-3.5" />
                          </button>
                          <button onClick={() => handleExcluirCampanha(c.id)} className="text-muted-foreground/40 hover:text-red-500 transition-colors p-1" title="Excluir">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                      <h3 className="font-display text-base text-foreground mb-1">{c.titulo}</h3>
                      <p className="font-body text-sm text-muted-foreground mb-2 line-clamp-2">{c.descricao}</p>
                      {c.objetivo && <p className="font-body text-xs text-gold-dark mb-1 flex items-center gap-1"><Target className="h-3 w-3" /> {c.objetivo}</p>}
                      <p className="font-body text-xs text-muted-foreground">
                        {new Date(c.dataInicio).toLocaleDateString("pt-BR")} — {new Date(c.dataFim).toLocaleDateString("pt-BR")}
                        <span className="ml-2">• {getTotalRegistrosCampanha(c.id)} {c.unidadeRegistro || UNIDADE_PADRAO[c.tipo]}</span>
                      </p>
                      <div className="flex items-center gap-3 mt-2">
                        <button className="font-body text-xs text-gold-dark hover:underline" onClick={() => setParticipantesCampanha(c)}>
                          <Users className="h-3 w-3 inline mr-0.5" />{c.participantes.length} participantes
                        </button>
                        <button className="font-body text-xs text-gold-dark hover:underline flex items-center gap-0.5" onClick={() => setRelatorioCampanha(c)}>
                          <BarChart3 className="h-3 w-3" /> Relatório
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          )}

          {/* === TAB MÓDULOS === */}
          {podeEditarModulos(role) && (
            <TabsContent value="modulos" className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-xl text-foreground">Gestão de Módulos & Conteúdo</h2>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => { resetarModulos(); setModulosEditaveis(getModulos()); toast.success("Módulos restaurados ao padrão!"); }}>
                    <RotateCcw className="h-4 w-4 mr-1" /> Restaurar Padrão
                  </Button>
                </div>
              </div>

              <div className="space-y-4">
                {modulosEditaveis.map((m, mIdx) => {
                  const stats = moduloStats.find((ms) => ms.id === m.id);
                  return (
                    <div key={m.id} className="bg-card rounded-xl p-5 shadow-card border border-border">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-display text-base text-foreground">{m.titulo}</h3>
                            <Badge variant="outline" className="text-[10px]">
                              {m.especial ? "Especial" : `Mês ${m.mes}`}
                            </Badge>
                            {m.especial && <Badge className="bg-gold/20 text-gold-dark text-[10px]"><Award className="h-3 w-3 mr-0.5" /> Cerimônia</Badge>}
                          </div>
                          <p className="font-body text-sm text-muted-foreground">{m.descricao}</p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {stats && (
                            <div className="text-right mr-2">
                              <span className="font-display text-lg text-gold-dark">{stats.qtdConcluiram}</span>
                              <p className="font-body text-[10px] text-muted-foreground">concluíram</p>
                            </div>
                          )}
                          <Button variant="outline" size="sm" onClick={() => setEditandoModulo({ ...m })}>
                            <Edit3 className="h-3.5 w-3.5 mr-1" /> Editar
                          </Button>
                          {mIdx > 0 && (
                            <button className="text-muted-foreground/50 hover:text-foreground p-1" title="Mover para cima" onClick={() => {
                              const novaLista = [...modulosEditaveis];
                              [novaLista[mIdx - 1], novaLista[mIdx]] = [novaLista[mIdx], novaLista[mIdx - 1]];
                              novaLista.filter(x => !x.especial).forEach((x, i) => { x.mes = i + 1; });
                              setModulosEditaveis(novaLista);
                              salvarModulos(novaLista);
                              toast.success("Módulo reordenado!");
                            }}>
                              <ChevronUp className="h-4 w-4" />
                            </button>
                          )}
                          {mIdx < modulosEditaveis.length - 1 && (
                            <button className="text-muted-foreground/50 hover:text-foreground p-1" title="Mover para baixo" onClick={() => {
                              const novaLista = [...modulosEditaveis];
                              [novaLista[mIdx], novaLista[mIdx + 1]] = [novaLista[mIdx + 1], novaLista[mIdx]];
                              novaLista.filter(x => !x.especial).forEach((x, i) => { x.mes = i + 1; });
                              setModulosEditaveis(novaLista);
                              salvarModulos(novaLista);
                              toast.success("Módulo reordenado!");
                            }}>
                              <ChevronDown className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="space-y-2">
                        {m.aulas.map((aula, aulaIdx) => (
                          <div key={aula.id} className="flex items-center gap-3 py-2 px-3 bg-secondary/30 rounded-lg group">
                            <span className="font-body text-xs text-muted-foreground w-6">{aulaIdx + 1}.</span>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-body text-sm text-foreground truncate">{aula.titulo}</span>
                                {aula.tipo === "live" && <Badge variant="outline" className="text-[8px] border-red-300 text-red-600 flex-shrink-0">LIVE</Badge>}
                              </div>
                              <p className="font-body text-xs text-muted-foreground truncate">{aula.descricao}</p>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <span className="font-body text-[10px] text-muted-foreground">Sem. {aula.semana}</span>
                              <span className="font-body text-[10px] text-muted-foreground">{aula.duracao}</span>
                              {aula.videoUrl && (
                                <a href={aula.videoUrl} target="_blank" rel="noopener noreferrer" className="text-gold-dark hover:text-gold transition-colors">
                                  <Eye className="h-3.5 w-3.5" />
                                </a>
                              )}
                              <button className="text-muted-foreground/40 hover:text-gold-dark transition-colors opacity-0 group-hover:opacity-100" onClick={() => {
                                setEditandoAula({ modulo: m, aula: { ...aula } });
                                setFormAula({ titulo: aula.titulo, descricao: aula.descricao, duracao: aula.duracao, videoUrl: aula.videoUrl || "", semana: aula.semana, tipo: aula.tipo });
                              }}>
                                <Edit3 className="h-3 w-3" />
                              </button>
                              <button className="text-muted-foreground/40 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100" onClick={() => {
                                const novaLista = modulosEditaveis.map(mod => mod.id === m.id ? { ...mod, aulas: mod.aulas.filter(a => a.id !== aula.id) } : mod);
                                setModulosEditaveis(novaLista);
                                salvarModulos(novaLista);
                                toast.success("Aula removida!");
                              }}>
                                <Trash2 className="h-3 w-3" />
                              </button>
                              {aulaIdx > 0 && (
                                <button className="text-muted-foreground/40 hover:text-foreground transition-colors opacity-0 group-hover:opacity-100" onClick={() => {
                                  const novaLista = modulosEditaveis.map(mod => {
                                    if (mod.id !== m.id) return mod;
                                    const aulas = [...mod.aulas];
                                    [aulas[aulaIdx - 1], aulas[aulaIdx]] = [aulas[aulaIdx], aulas[aulaIdx - 1]];
                                    return { ...mod, aulas };
                                  });
                                  setModulosEditaveis(novaLista);
                                  salvarModulos(novaLista);
                                }}>
                                  <ChevronUp className="h-3 w-3" />
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>

                      <Button variant="outline" size="sm" className="mt-3" onClick={() => {
                        const novaAula: Aula = { id: `aula-${crypto.randomUUID().slice(0, 8)}`, titulo: "", descricao: "", duracao: "20 min", semana: 1, tipo: "video" };
                        setEditandoAula({ modulo: m, aula: novaAula, isNew: true });
                        setFormAula({ titulo: "", descricao: "", duracao: "20 min", videoUrl: "", semana: 1, tipo: "video" });
                      }}>
                        <Plus className="h-3.5 w-3.5 mr-1" /> Adicionar Aula
                      </Button>
                    </div>
                  );
                })}
              </div>
            </TabsContent>
          )}

          {/* === TAB ANIVERSARIANTES === */}
          <TabsContent value="aniversariantes" className="space-y-6">
            <h2 className="font-display text-xl text-foreground flex items-center gap-2">
              <Cake className="h-5 w-5 text-gold-dark" /> Aniversariantes
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              {[0, 1].map((offset) => {
                const aniversariantes = getAniversariantes(offset);
                return (
                  <div key={offset} className="bg-card rounded-xl p-5 shadow-card border border-border">
                    <h3 className="font-display text-base text-foreground mb-1 capitalize flex items-center gap-2">
                      <Cake className="h-4 w-4 text-gold-dark" />
                      {nomeMes(offset)}
                      <Badge variant="outline" className="text-[10px] ml-auto">{aniversariantes.length} aniversariante{aniversariantes.length !== 1 ? "s" : ""}</Badge>
                    </h3>
                    {aniversariantes.length === 0 ? (
                      <p className="font-body text-sm text-muted-foreground mt-3 text-center py-4">Nenhum aniversariante neste mês.</p>
                    ) : (
                      <div className="space-y-2 mt-3">
                        {aniversariantes.map((u) => {
                          const nascDate = new Date(u.dataNascimento + "T00:00:00");
                          const dia = nascDate.getDate();
                          const hoje = new Date();
                          const isHoje = nascDate.getDate() === hoje.getDate() && nascDate.getMonth() === hoje.getMonth();
                          return (
                            <div
                              key={u.id}
                              className={`flex items-center gap-3 py-2 px-3 rounded-lg cursor-pointer hover:ring-1 hover:ring-gold/30 transition-all ${isHoje ? "bg-gold/10 border border-gold/30" : "bg-secondary/30"}`}
                              onClick={() => setAniversarianteDetalhe(u)}
                            >
                              <div className="w-8 h-8 rounded-full bg-gold/10 flex items-center justify-center flex-shrink-0">
                                <span className="font-display text-xs text-gold-dark">{String(dia).padStart(2, "0")}</span>
                              </div>
                              <div className="flex-1 min-w-0">
                                <span className="font-body text-sm text-foreground">{u.nome}</span>
                                {isHoje && <span className="ml-2 text-xs">🎂 Hoje!</span>}
                                <p className="font-body text-xs text-muted-foreground">{u.email}</p>
                              </div>
                              <div className="text-right flex-shrink-0">
                                <span className="font-body text-xs text-muted-foreground">
                                  {nascDate.toLocaleDateString("pt-BR")}
                                </span>
                                <p className="font-display text-xs text-gold-dark">
                                  {(() => {
                                    const hoje2 = new Date();
                                    let idade = hoje2.getFullYear() - nascDate.getFullYear();
                                    const mesAniv = nascDate.getMonth();
                                    const diaAniv = nascDate.getDate();
                                    // Se ainda não fez aniversário este ano no mês alvo
                                    if (mesAniv > hoje2.getMonth() || (mesAniv === hoje2.getMonth() && diaAniv > hoje2.getDate())) {
                                      idade--;
                                    }
                                    // Se o mês alvo é futuro (próximo mês), mostrar a idade que vai fazer
                                    if (mesAniv !== hoje2.getMonth()) {
                                      idade++;
                                    }
                                    return `${idade} anos`;
                                  })()}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </TabsContent>

          {/* === TAB PASSAPORTES === */}
          <TabsContent value="passaportes" className="space-y-6">
            <h2 className="font-display text-xl text-foreground flex items-center gap-2">
              <Stamp className="h-5 w-5 text-gold-dark" /> Passaportes & Certificados
            </h2>

            {/* Preview Models */}
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-card rounded-xl p-5 shadow-card border border-border">
                <h3 className="font-display text-sm text-foreground mb-3 flex items-center gap-2">
                  <FileText className="h-4 w-4 text-gold-dark" /> Modelo do Passaporte
                </h3>
                <div className="border-2 border-gold/40 rounded-xl overflow-hidden scale-90 origin-top">
                  <div className="gradient-navy p-3 text-center">
                    <Crown className="h-6 w-6 text-gold mx-auto mb-1" />
                    <h4 className="font-display text-sm text-cream tracking-wider">EMBAIXADORES DO REINO</h4>
                    <p className="font-body text-[10px] text-cream/60">Comunidade de Louvor e Adoração Emanuel</p>
                  </div>
                  <div className="bg-card p-4 space-y-2 text-center">
                    <p className="font-body text-[10px] text-muted-foreground uppercase">Nome Completo</p>
                    <p className="font-display text-sm text-foreground">Nome do Embaixador</p>
                    <div className="grid grid-cols-2 gap-2 text-center">
                      <div>
                        <p className="font-body text-[8px] text-muted-foreground uppercase">Nº Passaporte</p>
                        <p className="font-display text-xs text-gold-dark">PASS-0001</p>
                      </div>
                      <div>
                        <p className="font-body text-[8px] text-muted-foreground uppercase">ID</p>
                        <p className="font-display text-xs text-foreground">#0001</p>
                      </div>
                    </div>
                    <p className="font-body text-[10px] text-muted-foreground">+ Data · Cidade · QR Code</p>
                  </div>
                </div>
              </div>

              <div className="bg-card rounded-xl p-5 shadow-card border border-border">
                <h3 className="font-display text-sm text-foreground mb-3 flex items-center gap-2">
                  <Award className="h-4 w-4 text-gold-dark" /> Modelo do Certificado
                </h3>
                <div className="border-2 border-gold/40 rounded-xl overflow-hidden scale-90 origin-top">
                  <div className="gradient-navy p-3 text-center">
                    <Crown className="h-6 w-6 text-gold mx-auto mb-1" />
                    <h4 className="font-display text-sm text-cream tracking-widest">CERTIFICADO</h4>
                    <p className="font-body text-[10px] text-cream/60">EMBAIXADORES DO REINO</p>
                  </div>
                  <div className="bg-card p-4 space-y-2 text-center">
                    <p className="font-body text-[10px] text-muted-foreground">Certificamos que</p>
                    <p className="font-display text-sm text-foreground border-b border-gold/30 pb-1 mx-4">Nome do Embaixador</p>
                    <p className="font-body text-[9px] text-muted-foreground px-2">concluiu com êxito a Formação de Embaixadores do Reino...</p>
                    <p className="font-body text-[10px] text-muted-foreground">+ ID · Data · Cidade · QR Code</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Ambassador list with passport search */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-display text-base text-foreground">Embaixadores Confirmados</h3>
                <Badge variant="outline" className="font-body text-xs">{usuarios.filter(u => u.embaixadorConfirmado).length} embaixadores</Badge>
              </div>
              <div className="relative max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Pesquisar por nº do passaporte, nome..."
                  value={buscaPassaporte}
                  onChange={(e) => setBuscaPassaporte(e.target.value)}
                  className="pl-9 bg-background border-border"
                />
              </div>

              <div className="bg-card rounded-xl shadow-card border border-border overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border bg-secondary/50">
                        <th className="text-left px-4 py-3 font-display text-xs text-foreground whitespace-nowrap">Nº Passaporte</th>
                        <th className="text-left px-4 py-3 font-display text-xs text-foreground whitespace-nowrap">ID</th>
                        <th className="text-left px-4 py-3 font-display text-xs text-foreground whitespace-nowrap">Nome</th>
                        <th className="text-left px-4 py-3 font-display text-xs text-foreground whitespace-nowrap">Email</th>
                        <th className="text-left px-4 py-3 font-display text-xs text-foreground whitespace-nowrap">Cidade</th>
                        <th className="text-left px-4 py-3 font-display text-xs text-foreground whitespace-nowrap">Data Conclusão</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(() => {
                        let embaixadores = usuarios.filter(u => u.embaixadorConfirmado);
                        if (buscaPassaporte.trim()) {
                          const termo = buscaPassaporte.toLowerCase();
                          embaixadores = embaixadores.filter(u => {
                            const numPass = `PASS-${String((u as any).numeroInscricao || 0).padStart(4, "0")}`.toLowerCase();
                            const numId = `#${String((u as any).numeroInscricao || 0).padStart(4, "0")}`.toLowerCase();
                            return u.nome.toLowerCase().includes(termo) || numPass.includes(termo) || numId.includes(termo) || u.email.toLowerCase().includes(termo);
                          });
                        }
                        if (embaixadores.length === 0) {
                          return <tr><td colSpan={6} className="px-6 py-10 text-center font-body text-muted-foreground">Nenhum embaixador encontrado.</td></tr>;
                        }
                        return embaixadores.map(u => (
                          <tr key={u.id} className="border-b border-border last:border-0 hover:bg-secondary/30 transition-colors">
                            <td className="px-4 py-3">
                              <span className="font-display text-sm text-gold-dark">PASS-{String((u as any).numeroInscricao || 0).padStart(4, "0")}</span>
                            </td>
                            <td className="px-4 py-3">
                              <span className="font-body text-sm text-foreground">#{String((u as any).numeroInscricao || 0).padStart(4, "0")}</span>
                            </td>
                            <td className="px-4 py-3">
                              <span className="font-body text-sm text-foreground">{u.nome}</span>
                            </td>
                            <td className="px-4 py-3">
                              <span className="font-body text-xs text-muted-foreground">{u.email}</span>
                            </td>
                            <td className="px-4 py-3">
                              <span className="font-body text-xs text-muted-foreground">{u.endereco?.cidade || "—"}</span>
                            </td>
                            <td className="px-4 py-3">
                              <span className="font-body text-xs text-muted-foreground">
                                {u.dataContribuicao ? new Date(u.dataContribuicao).toLocaleDateString("pt-BR") : "—"}
                              </span>
                            </td>
                          </tr>
                        ));
                      })()}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Dialog: Progresso Detalhado */}
      <Dialog open={!!progressoUsuario} onOpenChange={() => setProgressoUsuario(null)}>
        <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">Progresso de {progressoUsuario?.nome}</DialogTitle>
            <DialogDescription className="font-body">Detalhamento por módulo e aula</DialogDescription>
          </DialogHeader>
          {progressoUsuario && (
            <div className="space-y-5 pt-2">
              {modFormacao.map((m) => {
                const feitas = progressoUsuario.progresso?.[m.id] || [];
                const pct = m.aulas.length > 0 ? Math.round((feitas.length / m.aulas.length) * 100) : 0;
                return (
                  <div key={m.id} className="border border-border rounded-lg p-4">
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="font-display text-sm text-foreground">{m.titulo}</h4>
                      <span className="font-body text-xs text-muted-foreground">{pct}%</span>
                    </div>
                    <Progress value={pct} className="h-2 mb-3" />
                    <div className="space-y-1">
                      {m.aulas.map((a) => {
                        const feita = feitas.includes(a.id);
                        return (
                          <div key={a.id} className="flex items-center gap-2">
                            {feita ? <CheckCircle2 className="h-3.5 w-3.5 text-gold-dark flex-shrink-0" /> : <XCircle className="h-3.5 w-3.5 text-muted-foreground/30 flex-shrink-0" />}
                            <span className={`font-body text-xs ${feita ? "text-foreground" : "text-muted-foreground"}`}>{a.titulo}</span>
                            {a.tipo === "live" && <Badge variant="outline" className="text-[8px] border-red-300 text-red-600 ml-auto">LIVE</Badge>}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog: Indicações */}
      <Dialog open={!!indicacoesUsuario} onOpenChange={() => setIndicacoesUsuario(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display text-xl flex items-center gap-2">
              <Share2 className="h-5 w-5 text-gold-dark" /> Indicações de {indicacoesUsuario?.nome}
            </DialogTitle>
            <DialogDescription className="font-body">Código: {indicacoesUsuario?.codigoIndicacao}</DialogDescription>
          </DialogHeader>
          {indicacoesUsuario && (
            <div className="space-y-3 pt-2">
              {(indicacoesUsuario.indicacoes || []).map((ind, i) => (
                <div key={i} className="border border-border rounded-lg p-3 flex items-center justify-between">
                  <div>
                    <p className="font-body text-sm text-foreground">{ind.nomeIndicado}</p>
                    <p className="font-body text-xs text-muted-foreground">{ind.emailIndicado}</p>
                  </div>
                  <span className="font-body text-xs text-muted-foreground">{formatarData(ind.dataIndicacao)}</span>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog: Módulos Overview */}
      <Dialog open={mostrarModulos} onOpenChange={setMostrarModulos}>
        <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">Visão Geral dos Módulos</DialogTitle>
            <DialogDescription className="font-body">Status de conclusão por módulo</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            {moduloStats.map((m) => (
              <div key={m.id} className="border border-border rounded-lg p-4">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-display text-sm text-foreground">{m.titulo}</h4>
                  <Badge variant="outline" className="text-[10px]">Mês {m.mes}</Badge>
                </div>
                <p className="font-body text-xs text-muted-foreground mb-3">{m.aulas.length} aulas</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-secondary/50 rounded-lg p-3 text-center">
                    <span className="font-display text-lg text-gold-dark">{m.qtdConcluiram}</span>
                    <p className="font-body text-xs text-muted-foreground">Concluíram</p>
                  </div>
                  <div className="bg-secondary/50 rounded-lg p-3 text-center">
                    <span className="font-display text-lg text-foreground">{m.qtdEmAndamento}</span>
                    <p className="font-body text-xs text-muted-foreground">Em andamento</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog: Editar Permissão */}
      <Dialog open={!!editarRoleUsuario} onOpenChange={() => setEditarRoleUsuario(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">Alterar Permissão</DialogTitle>
            <DialogDescription className="font-body">{editarRoleUsuario?.nome} — {editarRoleUsuario?.email}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <Select value={novaRole} onValueChange={(v) => setNovaRole(v as RoleUsuario)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="embaixador">Embaixador (sem acesso admin)</SelectItem>
                <SelectItem value="auxiliar">Auxiliar (visualiza dados básicos)</SelectItem>
                <SelectItem value="editor">Editor (edita módulos/conteúdo)</SelectItem>
                <SelectItem value="moderador">Moderador (gerencia campanhas/conteúdo)</SelectItem>
                <SelectItem value="admin">Admin (acesso total + financeiro)</SelectItem>
              </SelectContent>
            </Select>
            <div className="bg-secondary/50 rounded-lg p-3">
              <p className="font-body text-xs text-muted-foreground">
                {novaRole === "admin" && "Acesso total: vê valores financeiros, edita permissões, gerencia campanhas. Torna-se Embaixador automaticamente."}
                {novaRole === "moderador" && "Gerencia campanhas e conteúdo. Vê usuários e progresso, mas NÃO vê valores financeiros. Torna-se Embaixador automaticamente."}
                {novaRole === "editor" && "Pode visualizar e editar módulos/conteúdo. Sem acesso a financeiro ou campanhas. Torna-se Embaixador automaticamente."}
                {novaRole === "auxiliar" && "Visualiza dados de usuários e progresso. Sem acesso a campanhas ou financeiro."}
                {novaRole === "embaixador" && "Usuário comum. Sem acesso ao painel administrativo."}
              </p>
            </div>
            {/* Botão para tornar embaixador manualmente */}
            {editarRoleUsuario && !editarRoleUsuario.embaixadorConfirmado && novaRole === "embaixador" && (
              <Button variant="outline" className="w-full border-gold/30 text-gold-dark hover:bg-gold/10" onClick={() => {
                const lista = JSON.parse(localStorage.getItem("embaixadores_usuarios") || "[]");
                const idx = lista.findIndex((u: any) => u.id === editarRoleUsuario.id);
                if (idx !== -1) {
                  lista[idx].embaixadorConfirmado = true;
                  lista[idx].status = "embaixador";
                  lista[idx].contribuiuPix = true;
                  if (!lista[idx].indicacoes || lista[idx].indicacoes.length < 3) {
                    lista[idx].indicacoes = lista[idx].indicacoes || [];
                    while (lista[idx].indicacoes.length < 3) {
                      lista[idx].indicacoes.push({ nomeIndicado: "Auto", emailIndicado: "auto@sistema.com", dataIndicacao: new Date().toISOString() });
                    }
                  }
                  localStorage.setItem("embaixadores_usuarios", JSON.stringify(lista));
                  const atual = JSON.parse(localStorage.getItem("embaixadores_usuarioAtual") || "{}");
                  if (atual.id === lista[idx].id) {
                    localStorage.setItem("embaixadores_usuarioAtual", JSON.stringify(lista[idx]));
                  }
                  setUsuarios(lista);
                  toast.success(`${editarRoleUsuario.nome} agora é Embaixador(a)! 👑`);
                  setEditarRoleUsuario(null);
                }
              }}>
                <Award className="h-4 w-4 mr-2" /> Tornar Embaixador (pular formação)
              </Button>
            )}
            {/* Botão para remover embaixador */}
            {editarRoleUsuario && editarRoleUsuario.embaixadorConfirmado && (
              <Button variant="outline" className="w-full border-destructive/30 text-destructive hover:bg-destructive/10" onClick={() => {
                const lista = JSON.parse(localStorage.getItem("embaixadores_usuarios") || "[]");
                const idx = lista.findIndex((u: any) => u.id === editarRoleUsuario.id);
                if (idx !== -1) {
                  lista[idx].embaixadorConfirmado = false;
                  lista[idx].status = calcularStatus(lista[idx]);
                  localStorage.setItem("embaixadores_usuarios", JSON.stringify(lista));
                  const atual = JSON.parse(localStorage.getItem("embaixadores_usuarioAtual") || "{}");
                  if (atual.id === lista[idx].id) {
                    localStorage.setItem("embaixadores_usuarioAtual", JSON.stringify(lista[idx]));
                  }
                  setUsuarios(lista);
                  toast.success(`${editarRoleUsuario.nome} não é mais Embaixador(a).`);
                  setEditarRoleUsuario(null);
                }
              }}>
                <XCircle className="h-4 w-4 mr-2" /> Remover status de Embaixador
              </Button>
            )}
            <Button onClick={handleSalvarRole} className="w-full gradient-royal text-foreground shadow-gold hover:opacity-90">
              Salvar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog: Nova / Editar Campanha */}
      <Dialog open={mostrarNovaCampanha} onOpenChange={(open) => { setMostrarNovaCampanha(open); if (!open) setEditandoCampanha(null); }}>
        <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display text-xl flex items-center gap-2">
              <Megaphone className="h-5 w-5 text-gold-dark" /> {editandoCampanha ? "Editar Campanha" : "Nova Campanha"}
            </DialogTitle>
            <DialogDescription className="font-body">
              {editandoCampanha ? "Altere as informações da campanha." : "Crie uma campanha e notifique todos os participantes."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-1">
              <Label className="font-body text-foreground">Título *</Label>
              <Input value={formCampanha.titulo} onChange={(e) => setFormCampanha({ ...formCampanha, titulo: e.target.value })} placeholder="Nome da campanha" className="bg-background border-border" />
            </div>
            <div className="space-y-1">
              <Label className="font-body text-foreground">Descrição</Label>
              <Textarea value={formCampanha.descricao} onChange={(e) => setFormCampanha({ ...formCampanha, descricao: e.target.value })} placeholder="Descrição da campanha" className="bg-background border-border" />
            </div>
            <div className="space-y-1">
              <Label className="font-body text-foreground">Tipo</Label>
              <Select value={formCampanha.tipo} onValueChange={(v) => setFormCampanha({ ...formCampanha, tipo: v as Campanha["tipo"] })}>
                <SelectTrigger className="bg-background border-border"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="oracao">Oração</SelectItem>
                  <SelectItem value="jejum">Jejum</SelectItem>
                  <SelectItem value="missionaria">Missionária</SelectItem>
                  <SelectItem value="social">Social</SelectItem>
                  <SelectItem value="novos_embaixadores">Novos Embaixadores</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="font-body text-foreground">Objetivo espiritual / missionário</Label>
              <Input value={formCampanha.objetivo} onChange={(e) => setFormCampanha({ ...formCampanha, objetivo: e.target.value })} placeholder="Ex: Rezar 1000 terços pela paz" className="bg-background border-border" />
            </div>
            <div className="space-y-1">
              <Label className="font-body text-foreground">Instruções de participação</Label>
              <Textarea value={formCampanha.instrucoes} onChange={(e) => setFormCampanha({ ...formCampanha, instrucoes: e.target.value })} placeholder="Como o participante deve registrar..." className="bg-background border-border" rows={3} />
            </div>
            <div className="space-y-1">
              <Label className="font-body text-foreground">Unidade de registro</Label>
              <Input value={formCampanha.unidadeRegistro} onChange={(e) => setFormCampanha({ ...formCampanha, unidadeRegistro: e.target.value })} placeholder={`Padrão: ${UNIDADE_PADRAO[formCampanha.tipo] || "registros"}`} className="bg-background border-border" />
              <p className="font-body text-[10px] text-muted-foreground">Deixe vazio para usar o padrão do tipo.</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="font-body text-foreground">Início</Label>
                <Input type="date" value={formCampanha.dataInicio} onChange={(e) => setFormCampanha({ ...formCampanha, dataInicio: e.target.value })} className="bg-background border-border" />
              </div>
              <div className="space-y-1">
                <Label className="font-body text-foreground">Fim</Label>
                <Input type="date" value={formCampanha.dataFim} onChange={(e) => setFormCampanha({ ...formCampanha, dataFim: e.target.value })} className="bg-background border-border" />
              </div>
            </div>
            {editandoCampanha && (
              <div className="space-y-1">
                <Label className="font-body text-foreground">Status</Label>
                <Select value={formCampanha.ativa ? "ativa" : "encerrada"} onValueChange={(v) => setFormCampanha({ ...formCampanha, ativa: v === "ativa" })}>
                  <SelectTrigger className="bg-background border-border"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ativa">Ativa</SelectItem>
                    <SelectItem value="encerrada">Encerrada</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            <Button onClick={handleSalvarCampanha} className="w-full gradient-royal text-foreground font-display shadow-gold hover:opacity-90">
              {editandoCampanha ? "Salvar Alterações" : "Criar Campanha"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog: Relatório da Campanha */}
      <Dialog open={!!relatorioCampanha} onOpenChange={() => setRelatorioCampanha(null)}>
        <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display text-xl flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-gold-dark" /> Relatório: {relatorioCampanha?.titulo}
            </DialogTitle>
            <DialogDescription className="font-body">Resultados e ranking da campanha.</DialogDescription>
          </DialogHeader>
          {relatorioCampanha && (() => {
            const unidade = relatorioCampanha.unidadeRegistro || UNIDADE_PADRAO[relatorioCampanha.tipo] || "registros";
            const isNovosEmb = relatorioCampanha.tipo === "novos_embaixadores";
            const ranking = getRankingCampanha(relatorioCampanha.id);
            const totalGeral = isNovosEmb
              ? relatorioCampanha.participantes.reduce((acc: number, pid: string) => {
                  const u = usuarios.find((x) => x.id === pid);
                  return acc + (u?.indicacoes?.length || 0);
                }, 0)
              : getTotalRegistrosCampanha(relatorioCampanha.id);
            const numParticipantes = relatorioCampanha.participantes.length;
            const media = numParticipantes > 0 ? (totalGeral / numParticipantes).toFixed(1) : "0";
            const diasRest = diasRestantesCampanha(relatorioCampanha);
            const vencedor = ranking.length > 0 ? usuarios.find((x) => x.id === ranking[0].usuarioId) : null;

            return (
              <div className="space-y-4 pt-2">
                {/* Vencedor */}
                {vencedor && ranking[0].total > 0 && (
                  <div className="bg-gold/10 border border-gold/30 rounded-xl p-4 text-center">
                    <Trophy className="h-6 w-6 text-gold-dark mx-auto mb-1" />
                    <p className="font-display text-sm text-foreground">Vencedor</p>
                    <p className="font-display text-lg text-gold-dark">{vencedor.nome}</p>
                    <p className="font-body text-xs text-muted-foreground">{ranking[0].total} {unidade}</p>
                  </div>
                )}

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                  <div className="bg-secondary/40 rounded-lg p-3">
                    <p className="font-display text-lg text-gold-dark">{totalGeral}</p>
                    <p className="font-body text-[10px] text-muted-foreground">Total {unidade}</p>
                  </div>
                  <div className="bg-secondary/40 rounded-lg p-3">
                    <p className="font-display text-lg text-foreground">{numParticipantes}</p>
                    <p className="font-body text-[10px] text-muted-foreground">Participantes</p>
                  </div>
                  <div className="bg-secondary/40 rounded-lg p-3">
                    <p className="font-display text-lg text-foreground">{media}</p>
                    <p className="font-body text-[10px] text-muted-foreground">Média</p>
                  </div>
                  <div className="bg-secondary/40 rounded-lg p-3">
                    <p className="font-display text-lg text-foreground">{diasRest > 0 ? `${diasRest}d` : "Fim"}</p>
                    <p className="font-body text-[10px] text-muted-foreground">Restantes</p>
                  </div>
                </div>

                <div>
                  <p className="font-display text-sm text-foreground mb-2 flex items-center gap-1"><Trophy className="h-4 w-4 text-gold-dark" /> Ranking de participação</p>
                  {ranking.length === 0 ? (
                    <p className="font-body text-sm text-muted-foreground text-center py-4">Nenhum registro ainda.</p>
                  ) : (
                    <div className="space-y-1 max-h-60 overflow-y-auto">
                      {ranking.map((r, i) => {
                        const u = usuarios.find((x) => x.id === r.usuarioId);
                        return (
                          <div key={r.usuarioId} className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm ${i < 3 ? "bg-gold/10 border border-gold/20" : "bg-secondary/30"}`}>
                            <span className="font-body flex items-center gap-2">
                              <span className="font-display text-xs w-6">{i + 1}º</span>
                              {i === 0 && <Trophy className="h-3.5 w-3.5 text-gold-dark" />}
                              {u?.nome || "Embaixador"}
                            </span>
                            <span className="font-display text-sm text-gold-dark">{r.total} {unidade}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* Dialog: Participantes da Campanha */}
      <Dialog open={!!participantesCampanha} onOpenChange={() => setParticipantesCampanha(null)}>
        <DialogContent className="sm:max-w-md max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">Participantes: {participantesCampanha?.titulo}</DialogTitle>
            <DialogDescription className="font-body">{participantesCampanha?.participantes.length || 0} participantes</DialogDescription>
          </DialogHeader>
          {participantesCampanha && (
            <div className="space-y-2 pt-2">
              {participantesCampanha.participantes.length === 0 ? (
                <p className="font-body text-sm text-muted-foreground text-center py-4">Nenhum participante ainda.</p>
              ) : (
                participantesCampanha.participantes.map((pid) => {
                  const u = usuarios.find((x) => x.id === pid);
                  return (
                    <div key={pid} className="border border-border rounded-lg p-3 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gold/10 flex items-center justify-center">
                        <span className="font-display text-xs text-gold-dark">{u?.nome?.charAt(0) || "?"}</span>
                      </div>
                      <div>
                        <p className="font-body text-sm text-foreground">{u?.nome || "Usuário removido"}</p>
                        <p className="font-body text-xs text-muted-foreground">{u?.email || ""}</p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog: Enviar Notificação Manual */}
      <Dialog open={!!notifUsuario} onOpenChange={() => setNotifUsuario(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display text-xl flex items-center gap-2">
              <Bell className="h-5 w-5 text-gold-dark" /> Notificar {notifUsuario?.nome}
            </DialogTitle>
            <DialogDescription className="font-body">Envie uma mensagem personalizada para este usuário.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-1">
              <Label className="font-body text-foreground">Título *</Label>
              <Input value={notifTitulo} onChange={(e) => setNotifTitulo(e.target.value)} placeholder="Assunto da notificação" className="bg-background border-border" />
            </div>
            <div className="space-y-1">
              <Label className="font-body text-foreground">Mensagem *</Label>
              <Textarea value={notifMensagem} onChange={(e) => setNotifMensagem(e.target.value)} placeholder="Escreva a mensagem..." className="bg-background border-border" rows={4} />
            </div>
            <Button onClick={handleEnviarNotificacao} className="w-full gradient-royal text-foreground font-display shadow-gold hover:opacity-90">
              <Send className="h-4 w-4 mr-1" /> Enviar Notificação
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog: Selecionar Relatório */}
      <Dialog open={mostrarRelatorio} onOpenChange={setMostrarRelatorio}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-display text-xl flex items-center gap-2">
              <FileText className="h-5 w-5 text-gold-dark" /> Gerar Relatório (.xlsx)
            </DialogTitle>
            <DialogDescription className="font-body">Selecione o tipo de relatório para gerar em Excel.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 pt-2">
            {[
              { value: "completo", label: "📋 Relatório Completo", desc: "Todos os dados consolidados" },
              { value: "participantes", label: "👥 Participantes", desc: "Lista completa de participantes" },
              { value: "embaixadores", label: "👑 Embaixadores", desc: "Embaixadores confirmados" },
              { value: "campanhas", label: "📣 Campanhas", desc: "Detalhes de todas as campanhas" },
              ...(podeVerFinanceiro(role) ? [{ value: "contribuicoes", label: "💰 Contribuições", desc: "Doações e valores arrecadados" }] : []),
            ].map((r) => (
              <button
                key={r.value}
                className={`w-full text-left p-3 rounded-lg border transition-all ${tipoRelatorio === r.value ? "border-gold/40 bg-gold/5" : "border-border hover:border-gold/20 hover:bg-secondary/30"}`}
                onClick={() => setTipoRelatorio(r.value)}
              >
                <p className="font-body text-sm text-foreground">{r.label}</p>
                <p className="font-body text-xs text-muted-foreground">{r.desc}</p>
              </button>
            ))}
            <Button onClick={() => gerarRelatorioXlsx(tipoRelatorio)} className="w-full gradient-royal text-foreground font-display shadow-gold hover:opacity-90 mt-2">
              <FileText className="h-4 w-4 mr-1" /> Baixar Excel (.xlsx)
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog: Editar Módulo */}
      <Dialog open={!!editandoModulo} onOpenChange={() => setEditandoModulo(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display text-xl flex items-center gap-2">
              <Edit3 className="h-5 w-5 text-gold-dark" /> Editar Módulo
            </DialogTitle>
            <DialogDescription className="font-body">Altere as informações do módulo.</DialogDescription>
          </DialogHeader>
          {editandoModulo && (
            <div className="space-y-4 pt-2">
              <div className="space-y-1">
                <Label className="font-body text-foreground">Título *</Label>
                <Input value={editandoModulo.titulo} onChange={(e) => setEditandoModulo({ ...editandoModulo, titulo: e.target.value })} className="bg-background border-border" />
              </div>
              <div className="space-y-1">
                <Label className="font-body text-foreground">Descrição</Label>
                <Textarea value={editandoModulo.descricao} onChange={(e) => setEditandoModulo({ ...editandoModulo, descricao: e.target.value })} className="bg-background border-border" rows={3} />
              </div>
              <div className="space-y-1">
                <Label className="font-body text-foreground">Ícone</Label>
                <Select value={editandoModulo.icone} onValueChange={(v) => setEditandoModulo({ ...editandoModulo, icone: v })}>
                  <SelectTrigger className="bg-background border-border"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="crown">👑 Coroa</SelectItem>
                    <SelectItem value="music">🎵 Música</SelectItem>
                    <SelectItem value="heart">❤️ Coração</SelectItem>
                    <SelectItem value="award">🏅 Medalha</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="font-body text-foreground">Mensagem Final (ao concluir)</Label>
                <Textarea value={editandoModulo.mensagemFinal} onChange={(e) => setEditandoModulo({ ...editandoModulo, mensagemFinal: e.target.value })} className="bg-background border-border" rows={2} />
              </div>
              <Button onClick={() => {
                const novaLista = modulosEditaveis.map(m => m.id === editandoModulo.id ? editandoModulo : m);
                setModulosEditaveis(novaLista);
                salvarModulos(novaLista);
                setEditandoModulo(null);
                toast.success("Módulo atualizado!");
              }} className="w-full gradient-royal text-foreground font-display shadow-gold hover:opacity-90">
                <Save className="h-4 w-4 mr-1" /> Salvar Módulo
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog: Editar / Adicionar Aula */}
      <Dialog open={!!editandoAula} onOpenChange={() => setEditandoAula(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display text-xl flex items-center gap-2">
              <Video className="h-5 w-5 text-gold-dark" /> {editandoAula?.isNew ? "Nova Aula" : "Editar Aula"}
            </DialogTitle>
            <DialogDescription className="font-body">
              {editandoAula?.isNew ? "Adicione uma nova aula ao módulo." : "Edite as informações da aula."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-1">
              <Label className="font-body text-foreground">Título *</Label>
              <Input value={formAula.titulo} onChange={(e) => setFormAula({ ...formAula, titulo: e.target.value })} placeholder="Nome da aula" className="bg-background border-border" />
            </div>
            <div className="space-y-1">
              <Label className="font-body text-foreground">Descrição</Label>
              <Textarea value={formAula.descricao} onChange={(e) => setFormAula({ ...formAula, descricao: e.target.value })} placeholder="Descrição da aula" className="bg-background border-border" rows={2} />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label className="font-body text-foreground text-xs">Duração</Label>
                <Input value={formAula.duracao} onChange={(e) => setFormAula({ ...formAula, duracao: e.target.value })} placeholder="20 min" className="bg-background border-border" />
              </div>
              <div className="space-y-1">
                <Label className="font-body text-foreground text-xs">Semana</Label>
                <Select value={String(formAula.semana)} onValueChange={(v) => setFormAula({ ...formAula, semana: parseInt(v) })}>
                  <SelectTrigger className="bg-background border-border"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4].map((s) => <SelectItem key={s} value={String(s)}>Sem. {s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="font-body text-foreground text-xs">Tipo</Label>
                <Select value={formAula.tipo} onValueChange={(v) => setFormAula({ ...formAula, tipo: v as Aula["tipo"] })}>
                  <SelectTrigger className="bg-background border-border"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="video">Vídeo</SelectItem>
                    <SelectItem value="live">Live</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1">
              <Label className="font-body text-foreground flex items-center gap-1">
                <LinkIcon className="h-3.5 w-3.5" /> Link do Vídeo / YouTube
              </Label>
              <Input value={formAula.videoUrl} onChange={(e) => setFormAula({ ...formAula, videoUrl: e.target.value })} placeholder="https://youtube.com/watch?v=..." className="bg-background border-border" />
            </div>
            <Button onClick={() => {
              if (!formAula.titulo) { toast.error("Informe o título da aula"); return; }
              if (!editandoAula) return;
              const aulaAtualizada: Aula = {
                id: editandoAula.aula.id,
                titulo: formAula.titulo,
                descricao: formAula.descricao,
                duracao: formAula.duracao,
                videoUrl: formAula.videoUrl || undefined,
                semana: formAula.semana,
                tipo: formAula.tipo,
              };
              const novaLista = modulosEditaveis.map(mod => {
                if (mod.id !== editandoAula.modulo.id) return mod;
                if (editandoAula.isNew) {
                  return { ...mod, aulas: [...mod.aulas, aulaAtualizada] };
                }
                return { ...mod, aulas: mod.aulas.map(a => a.id === aulaAtualizada.id ? aulaAtualizada : a) };
              });
              setModulosEditaveis(novaLista);
              salvarModulos(novaLista);
              setEditandoAula(null);
              toast.success(editandoAula.isNew ? "Aula adicionada!" : "Aula atualizada!");
            }} className="w-full gradient-royal text-foreground font-display shadow-gold hover:opacity-90">
              <Save className="h-4 w-4 mr-1" /> {editandoAula?.isNew ? "Adicionar Aula" : "Salvar Aula"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog: Detalhes do Aniversariante */}
      <Dialog open={!!aniversarianteDetalhe} onOpenChange={() => setAniversarianteDetalhe(null)}>
        <DialogContent className="sm:max-w-md max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display text-xl flex items-center gap-2">
              <Cake className="h-5 w-5 text-gold-dark" /> {aniversarianteDetalhe?.nome}
            </DialogTitle>
            <DialogDescription className="font-body">Informações completas do usuário</DialogDescription>
          </DialogHeader>
          {aniversarianteDetalhe && (() => {
            const u = aniversarianteDetalhe;
            const e = u.endereco || {} as any;
            const prog = calcularProgressoTotal(u);
            const campanhasCount = campanhas.filter((c) => c.participantes.includes(u.id)).length;
            const nascDate = u.dataNascimento ? new Date(u.dataNascimento + "T00:00:00") : null;
            return (
              <div className="space-y-4 pt-2">
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-secondary/30 rounded-lg p-3">
                    <p className="font-body text-[10px] text-muted-foreground uppercase">Nº Inscrição</p>
                    <p className="font-display text-sm text-foreground">#{String((u as any).numeroInscricao || "—").padStart(4, "0")}</p>
                  </div>
                  <div className="bg-secondary/30 rounded-lg p-3">
                    <p className="font-body text-[10px] text-muted-foreground uppercase">Status</p>
                    <Badge className={`${STATUS_CORES[u.status || "candidato"]} font-body text-[10px]`}>{STATUS_LABELS[u.status || "candidato"]}</Badge>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="font-body text-xs text-muted-foreground">Email</span>
                    <span className="font-body text-xs text-foreground">{u.email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-body text-xs text-muted-foreground">CPF</span>
                    <span className="font-body text-xs text-foreground">{u.cpf || "—"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-body text-xs text-muted-foreground">Data de Nascimento</span>
                    <span className="font-body text-xs text-foreground">{nascDate ? nascDate.toLocaleDateString("pt-BR") : "—"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-body text-xs text-muted-foreground">Cadastro</span>
                    <span className="font-body text-xs text-foreground">{formatarData(u.dataCadastro)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-body text-xs text-muted-foreground">Último Acesso</span>
                    <span className="font-body text-xs text-foreground">{formatarData(u.ultimoAcesso)}</span>
                  </div>
                </div>
                <div className="border-t border-border pt-3 space-y-2">
                  <p className="font-display text-xs text-foreground">Endereço</p>
                  <p className="font-body text-xs text-muted-foreground">
                    {e.rua ? `${e.rua}, ${e.numero} — ${e.bairro}` : "Não informado"}
                  </p>
                  {e.cidade && <p className="font-body text-xs text-muted-foreground">{e.cidade} — {e.estado}, CEP: {e.cep || "—"}</p>}
                </div>
                <div className="border-t border-border pt-3 grid grid-cols-3 gap-3 text-center">
                  <div className="bg-secondary/30 rounded-lg p-2">
                    <p className="font-display text-lg text-foreground">{prog}%</p>
                    <p className="font-body text-[10px] text-muted-foreground">Progresso</p>
                  </div>
                  <div className="bg-secondary/30 rounded-lg p-2">
                    <p className="font-display text-lg text-foreground">{u.indicacoes?.length || 0}</p>
                    <p className="font-body text-[10px] text-muted-foreground">Indicações</p>
                  </div>
                  <div className="bg-secondary/30 rounded-lg p-2">
                    <p className="font-display text-lg text-foreground">{campanhasCount}</p>
                    <p className="font-body text-[10px] text-muted-foreground">Campanhas</p>
                  </div>
                </div>
                {u.contribuiuPix && (
                  <div className="border-t border-border pt-3">
                    <p className="font-body text-xs text-muted-foreground">Contribuição total: <span className="text-gold-dark font-display">R$ {(u.valorContribuicao || 0).toFixed(2)}</span></p>
                  </div>
                )}
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Admin;
