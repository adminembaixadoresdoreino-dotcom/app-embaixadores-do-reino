/**
 * ModuloDetalhe.tsx — Página de detalhes de um módulo de formação
 * 
 * Exibe todas as aulas de um módulo específico, agrupadas por semana.
 * O usuário pode marcar aulas como concluídas (botão "Assistir").
 * 
 * Lógica de liberação de aulas:
 * - Primeira aula de cada módulo: liberada se o tempo desde o cadastro permite
 * - Demais aulas: precisa concluir a anterior + respeitar o tempo semanal
 * - Aulas bloqueadas mostram: 🔒 (por sequência) ou ⏰ (por tempo, com contagem de dias)
 * 
 * Ao concluir todas as aulas:
 * - Mostra modal de "Módulo Concluído!" com mensagem personalizada
 * - Se todos os requisitos foram cumpridos, mostra modal de "Embaixador Confirmado!"
 */

import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Crown, ArrowLeft, CheckCircle2, Circle, Play, PartyPopper, Lock, Radio, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { getModulos, getProgressoModulo, salvarProgresso, getUsuarioAtual, todoModulosConcluidos, verificarEmbaixador, aulaLiberada, diasParaLiberar } from "@/lib/dados";

const ModuloDetalhe = () => {
  // Pega o ID do módulo da URL (ex: /modulo/mod-1 → moduloId = "mod-1")
  const { moduloId } = useParams<{ moduloId: string }>();
  const navigate = useNavigate();
  
  // Lista de IDs das aulas que o usuário já concluiu neste módulo
  const [aulasFeitas, setAulasFeitas] = useState<string[]>([]);
  const [mostrarMensagemFinal, setMostrarMensagemFinal] = useState(false);
  const [mostrarEmbaixadorMsg, setMostrarEmbaixadorMsg] = useState(false);

  // Busca o módulo pelo ID
  const modulo = getModulos().find((m) => m.id === moduloId);
  const usuario = getUsuarioAtual();

  // Ao montar: verifica se está logado e carrega o progresso
  useEffect(() => {
    if (!usuario) { navigate("/login"); return; }
    if (moduloId) setAulasFeitas(getProgressoModulo(moduloId));
  }, [moduloId, navigate]);

  // Se o módulo não existe, mostra mensagem de erro
  if (!modulo) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="font-body text-muted-foreground">Módulo não encontrado.</p>
      </div>
    );
  }

  const totalAulas = modulo.aulas.length;

  /**
   * Marca uma aula como concluída
   * - Salva no localStorage
   * - Verifica se completou o módulo (mostra modal de conclusão)
   * - Verifica se virou embaixador (mostra modal especial)
   */
  const marcarAulaComoConcluida = (aulaId: string) => {
    if (aulasFeitas.includes(aulaId)) return; // Já concluída
    
    salvarProgresso(modulo.id, aulaId);
    const novasFeitas = [...aulasFeitas, aulaId];
    setAulasFeitas(novasFeitas);

    // Se concluiu todas as aulas do módulo → mostra modal de conclusão
    if (novasFeitas.length === totalAulas) {
      setTimeout(() => setMostrarMensagemFinal(true), 500);
    }

    // Verifica se agora é embaixador confirmado
    const usuarioAtual = getUsuarioAtual();
    if (usuarioAtual && todoModulosConcluidos(usuarioAtual)) {
      if (verificarEmbaixador(usuarioAtual) && !usuarioAtual.embaixadorConfirmado) {
        // Torna embaixador via API (em background)
        import("@/lib/dados").then(({ tornarEmbaixador }) => {
          tornarEmbaixador(usuarioAtual.id, true).catch(() => {});
        });
        setTimeout(() => setMostrarEmbaixadorMsg(true), 2000);
      }
    }
  };

  // Calcula o percentual de progresso do módulo
  const percentualAtualizado = totalAulas > 0 ? Math.round((aulasFeitas.length / totalAulas) * 100) : 0;

  // Agrupa aulas por semana para exibição organizada
  const semanasPresentes = [...new Set(modulo.aulas.map((a) => a.semana))].sort();
  const aulasPorSemana = semanasPresentes.map((s) => ({ semana: s, aulas: modulo.aulas.filter((a) => a.semana === s) }));

  return (
    <div className="min-h-screen bg-background">
      {/* ==========================================
          HEADER — Barra superior com botão voltar
          ========================================== */}
      <header className="gradient-navy border-b border-gold/20">
        <div className="container mx-auto px-6 py-4 flex items-center gap-4">
          <button onClick={() => navigate("/dashboard")} className="text-cream/60 hover:text-cream transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-3">
            <Crown className="h-5 w-5 text-gold" />
            <span className="font-display text-sm text-cream tracking-wider">Embaixadores do Reino</span>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-10 max-w-3xl">
        {/* Título e descrição do módulo */}
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="font-display text-2xl md:text-3xl text-foreground">{modulo.titulo}</h1>
            <Badge variant="outline" className="font-body text-xs">
              {modulo.especial ? "Cerimônia" : `Mês ${modulo.mes}`}
            </Badge>
          </div>
          <p className="font-body text-muted-foreground mb-6">{modulo.descricao}</p>

          {/* Barra de progresso do módulo */}
          <div className="bg-card rounded-xl p-5 shadow-card border border-border mb-8">
            <div className="flex justify-between items-center mb-3">
              <span className="font-body text-sm text-muted-foreground">Progresso do módulo</span>
              <span className="font-display text-sm text-gold-dark">{percentualAtualizado}%</span>
            </div>
            <Progress value={percentualAtualizado} className="h-3" />
            <p className="font-body text-xs text-muted-foreground mt-2">{aulasFeitas.length} de {totalAulas} aulas concluídas</p>
          </div>
        </motion.div>

        {/* ==========================================
            LISTA DE AULAS — Agrupadas por semana
            ========================================== */}
        <div className="space-y-6">
          {aulasPorSemana.map(({ semana, aulas }) => {
            const isLive = aulas.some((a) => a.tipo === "live");
            return (
              <div key={semana}>
                {/* Título da semana */}
                <h3 className="font-display text-sm text-muted-foreground mb-3 flex items-center gap-2">
                  {isLive ? <Radio className="h-4 w-4 text-red-500" /> : null}
                  {isLive && aulas.length === 1 ? "Ato Profético (Live)" : `Semana ${semana}`}
                </h3>
                <div className="space-y-3">
                  {aulas.map((aula) => {
                    const globalIdx = modulo.aulas.findIndex((a) => a.id === aula.id);
                    const concluida = aulasFeitas.includes(aula.id);
                    const liberada = usuario ? aulaLiberada(modulo, globalIdx, aulasFeitas, usuario.dataCadastro) : false;
                    
                    // Calcula se o bloqueio é por tempo (dias faltando) ou por sequência (aula anterior não feita)
                    const diasRestantes = !liberada && !concluida && usuario
                      ? diasParaLiberar(modulo, globalIdx, usuario.dataCadastro)
                      : 0;
                    const bloqueadoPorTempo = diasRestantes > 0;
                    const bloqueadoPorSequencia = !liberada && !bloqueadoPorTempo;

                    return (
                      <motion.div
                        key={aula.id}
                        initial={{ opacity: 0, x: -15 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: globalIdx * 0.05 }}
                        className={`flex items-center gap-4 p-5 rounded-xl border transition-all ${
                          concluida
                            ? "bg-gold/5 border-gold/20"          // Concluída: fundo dourado
                            : liberada
                            ? "bg-card border-border hover:border-gold/20 hover:shadow-card"  // Liberada: card normal com hover
                            : "bg-muted/30 border-border/50 opacity-70"  // Bloqueada: opaca
                        }`}
                      >
                        {/* Ícone de status da aula */}
                        <div className="flex-shrink-0">
                          {concluida ? (
                            <CheckCircle2 className="h-6 w-6 text-gold-dark" />  // ✓ Concluída
                          ) : liberada ? (
                            <Circle className="h-6 w-6 text-muted-foreground/40" />  // ○ Disponível
                          ) : bloqueadoPorTempo ? (
                            <Clock className="h-5 w-5 text-amber-500/70" />  // ⏰ Aguardando tempo
                          ) : (
                            <Lock className="h-5 w-5 text-muted-foreground/30" />  // 🔒 Bloqueada
                          )}
                        </div>
                        {/* Informações da aula */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className={`font-display text-base ${concluida ? "text-gold-dark" : "text-foreground"}`}>
                              {aula.titulo}
                            </h3>
                            {aula.tipo === "live" && (
                              <Badge variant="outline" className="text-[10px] border-red-300 text-red-600">LIVE</Badge>
                            )}
                          </div>
                          <p className="font-body text-sm text-muted-foreground truncate">{aula.descricao}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="font-body text-xs text-muted-foreground/60">{aula.duracao}</span>
                            {/* Mensagem de bloqueio por tempo */}
                            {bloqueadoPorTempo && (
                              <span className="font-body text-xs text-amber-600 flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                Libera em {diasRestantes} dia{diasRestantes > 1 ? "s" : ""}
                              </span>
                            )}
                            {/* Mensagem de bloqueio por sequência */}
                            {bloqueadoPorSequencia && !concluida && (
                              <span className="font-body text-xs text-muted-foreground/60">
                                🔒 Conclua a aula anterior
                              </span>
                            )}
                          </div>
                        </div>
                        {/* Botão "Assistir" — só aparece se a aula está liberada e não concluída */}
                        {!concluida && liberada && (
                          <Button
                            size="sm"
                            className="gradient-royal text-foreground shadow-gold hover:opacity-90 flex-shrink-0"
                            onClick={() => marcarAulaComoConcluida(aula.id)}
                          >
                            <Play className="h-3 w-3 mr-1" />
                            {aula.tipo === "live" ? "Assistir Live" : "Assistir"}
                          </Button>
                        )}
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ==========================================
          MODAL: Módulo Concluído
          Aparece quando todas as aulas do módulo são finalizadas
          ========================================== */}
      <AnimatePresence>
        {mostrarMensagemFinal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-foreground/50 backdrop-blur-sm" onClick={() => setMostrarMensagemFinal(false)}>
            <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.8, opacity: 0 }} transition={{ type: "spring", duration: 0.5 }} className="bg-card rounded-2xl p-10 max-w-md w-full shadow-elevated border border-gold/30 text-center" onClick={(e) => e.stopPropagation()}>
              <div className="w-20 h-20 rounded-full gradient-royal flex items-center justify-center mx-auto mb-6 shadow-gold">
                <PartyPopper className="h-10 w-10 text-foreground" />
              </div>
              <h2 className="font-display text-2xl text-foreground mb-4">Módulo Concluído!</h2>
              <p className="font-body text-muted-foreground leading-relaxed mb-8">{modulo.mensagemFinal}</p>
              <Button className="gradient-royal text-foreground font-display tracking-wider shadow-gold hover:opacity-90" onClick={() => { setMostrarMensagemFinal(false); navigate("/dashboard"); }}>
                Voltar aos Módulos
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ==========================================
          MODAL: Embaixador Confirmado!
          Aparece quando o usuário cumpre todos os requisitos
          (módulos + indicações + contribuição)
          ========================================== */}
      <AnimatePresence>
        {mostrarEmbaixadorMsg && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-foreground/50 backdrop-blur-sm" onClick={() => setMostrarEmbaixadorMsg(false)}>
            <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.8, opacity: 0 }} transition={{ type: "spring", duration: 0.5 }} className="bg-card rounded-2xl p-10 max-w-md w-full shadow-elevated border border-gold/30 text-center" onClick={(e) => e.stopPropagation()}>
              <div className="w-20 h-20 rounded-full gradient-royal flex items-center justify-center mx-auto mb-6 shadow-gold">
                <Crown className="h-10 w-10 text-foreground" />
              </div>
              <h2 className="font-display text-2xl text-foreground mb-4">🏅 Embaixador(a) do Reino!</h2>
              <p className="font-body text-muted-foreground leading-relaxed mb-8">
                Você completou todos os módulos, indicou pelo menos 3 pessoas e fez sua contribuição.
                Agora você é oficialmente um(a) Embaixador(a) do Reino! A Cerimônia de Envio já está disponível! 👑
              </p>
              <Button className="gradient-royal text-foreground font-display tracking-wider shadow-gold hover:opacity-90" onClick={() => { setMostrarEmbaixadorMsg(false); navigate("/dashboard"); }}>
                Amém! 🙏
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ModuloDetalhe;
