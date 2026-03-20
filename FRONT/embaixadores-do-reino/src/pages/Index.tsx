/**
 * Index.tsx — Página inicial pública (Landing Page)
 * 
 * Esta é a primeira página que o visitante vê ao acessar o site.
 * É composta por:
 * - Navbar fixa no topo com botões "Entrar" e "Cadastre-se"
 * - Seção Hero com título grande, descrição e botões de ação
 * - Seção "Sobre" explicando o que é um Embaixador do Reino (3 cards)
 * - Seção "Comunidade" com chamada para ação
 * - Footer com créditos
 * 
 * Usa animações do Framer Motion para entradas suaves.
 */

import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Crown, BookOpen, Users, ChevronDown } from "lucide-react";

const Index = () => {
  // Hook de navegação — permite redirecionar o usuário para outras páginas
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* ==========================================
          NAVBAR — Barra de navegação fixa no topo
          ========================================== */}
      <nav className="fixed top-0 left-0 right-0 z-50 gradient-navy border-b border-gold/20">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          {/* Logo e nome do projeto */}
          <div className="flex items-center gap-3">
            <Crown className="h-7 w-7 text-gold" />
            <span className="font-display text-lg text-cream tracking-wider">
              Embaixadores do Reino
            </span>
          </div>
          {/* Botões de ação */}
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              className="text-cream/80 hover:text-cream hover:bg-navy-light"
              onClick={() => navigate("/login")}
            >
              Entrar
            </Button>
            <Button
              className="gradient-royal text-foreground font-display tracking-wide shadow-gold hover:opacity-90"
              onClick={() => navigate("/login?modo=cadastro")}
            >
              Cadastre-se
            </Button>
          </div>
        </div>
      </nav>

      {/* ==========================================
          HERO — Seção principal com título e CTA
          ========================================== */}
      <section className="relative min-h-screen flex items-center justify-center gradient-hero overflow-hidden">
        {/* Efeitos visuais de fundo (círculos dourados com blur) */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 w-72 h-72 rounded-full bg-gold blur-3xl" />
          <div className="absolute bottom-20 right-10 w-96 h-96 rounded-full bg-gold blur-3xl" />
        </div>
        <div className="container mx-auto px-6 text-center relative z-10 pt-20">
          {/* Animação de entrada suave (aparece de baixo para cima) */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            {/* Badge "Comunidade de Louvor e Adoração Emanuel" */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-gold/30 bg-gold/5 mb-8">
              <Crown className="h-4 w-4 text-gold" />
              <span className="text-gold-light font-body text-sm tracking-wide">
                Comunidade de Louvor e Adoração Emanuel
              </span>
            </div>
            {/* Título principal */}
            <h1 className="font-display text-5xl md:text-7xl text-cream mb-6 leading-tight tracking-wide">
              Embaixadores<br />
              <span className="text-gold">do Reino</span>
            </h1>
            {/* Descrição */}
            <p className="font-body text-cream/70 text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
              Seja parte dessa missão. Cadastre-se, capacite-se e ajude a espalhar
              o Reino do nosso Amado Emanuel por toda a terra.
            </p>
            {/* Botões de ação */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                className="gradient-royal text-foreground font-display tracking-wider text-base px-8 py-6 shadow-gold hover:opacity-90"
                onClick={() => navigate("/login?modo=cadastro")}
              >
                Quero ser Embaixador
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-gold/30 text-gold hover:bg-gold/10 font-display tracking-wider text-base px-8 py-6"
                onClick={() => document.getElementById("sobre")?.scrollIntoView({ behavior: "smooth" })}
              >
                Saiba Mais
              </Button>
            </div>
          </motion.div>
          {/* Seta animada para baixo */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2, duration: 0.6 }}
            className="absolute bottom-10 left-1/2 -translate-x-1/2"
          >
            <ChevronDown className="h-6 w-6 text-gold/50 animate-bounce" />
          </motion.div>
        </div>
      </section>

      {/* ==========================================
          SOBRE — Explica o que é um Embaixador
          3 cards: Capacitação, Missões, Comunhão
          ========================================== */}
      <section id="sobre" className="py-24 bg-background">
        <div className="container mx-auto px-6">
          {/* Título da seção */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="font-display text-3xl md:text-4xl text-foreground mb-4">
              O que é um <span className="text-gold-dark">Embaixador do Reino</span>?
            </h2>
            <p className="font-body text-muted-foreground max-w-3xl mx-auto text-lg leading-relaxed">
              Embaixadores do Reino são pessoas que se comprometem a ajudar a Comunidade de Louvor
              e Adoração Emanuel, espalhando a mensagem do nosso Amado por onde passam. Através de
              capacitação, missões e comunhão, cada embaixador faz a diferença.
            </p>
          </motion.div>

          {/* 3 Cards explicativos */}
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              {
                icon: BookOpen,
                titulo: "Capacitação",
                descricao: "Módulos e aulas preparadas com carinho para fortalecer sua caminhada e equipar você para a missão.",
              },
              {
                icon: Crown,
                titulo: "Missões",
                descricao: "Participe de missões que impactam vidas e comunidades, levando esperança e amor a todos.",
              },
              {
                icon: Users,
                titulo: "Comunhão",
                descricao: "Faça parte de uma família que caminha junta, se apoia e celebra cada vitória do Reino.",
              },
            ].map((item, i) => (
              <motion.div
                key={item.titulo}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.15 }}
                className="bg-card rounded-xl p-8 shadow-card border border-border text-center hover:shadow-elevated transition-shadow"
              >
                <div className="w-14 h-14 rounded-full gradient-royal flex items-center justify-center mx-auto mb-5">
                  <item.icon className="h-7 w-7 text-foreground" />
                </div>
                <h3 className="font-display text-xl text-foreground mb-3">{item.titulo}</h3>
                <p className="font-body text-muted-foreground leading-relaxed">{item.descricao}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ==========================================
          COMUNIDADE — Seção com fundo escuro e CTA
          ========================================== */}
      <section className="py-24 gradient-navy relative overflow-hidden">
        {/* Efeito visual de fundo */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-10 right-20 w-64 h-64 rounded-full bg-gold blur-3xl" />
        </div>
        <div className="container mx-auto px-6 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="max-w-3xl mx-auto text-center"
          >
            <h2 className="font-display text-3xl md:text-4xl text-cream mb-6">
              Comunidade de Louvor e Adoração <span className="text-gold">Emanuel</span>
            </h2>
            <p className="font-body text-cream/70 text-lg leading-relaxed mb-10">
              Somos uma comunidade que vive para adorar e servir. Através do louvor, da adoração e
              do serviço ao próximo, buscamos manifestar o Reino de Deus aqui na terra. Cada
              embaixador é uma extensão desse propósito.
            </p>
            <Button
              size="lg"
              className="gradient-royal text-foreground font-display tracking-wider shadow-gold hover:opacity-90"
              onClick={() => navigate("/login?modo=cadastro")}
            >
              Faça Parte Dessa Família
            </Button>
          </motion.div>
        </div>
      </section>

      {/* ==========================================
          FOOTER — Rodapé com créditos
          ========================================== */}
      <footer className="bg-card border-t border-border py-10">
        <div className="container mx-auto px-6 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Crown className="h-5 w-5 text-gold-dark" />
            <span className="font-display text-sm text-foreground tracking-wider">
              Embaixadores do Reino
            </span>
          </div>
          <p className="font-body text-sm text-muted-foreground">
            Comunidade de Louvor e Adoração Emanuel © {new Date().getFullYear()}
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
