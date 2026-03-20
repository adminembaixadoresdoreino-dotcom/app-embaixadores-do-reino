/**
 * Login.tsx — Página de Login e Cadastro
 * 
 * REFATORADO: Agora envia os dados para o backend Spring Boot
 * via api.ts ao invés de salvar no localStorage.
 * 
 * O backend é responsável por:
 * - Validar email/CPF duplicados
 * - Gerar código de indicação
 * - Hash da senha (BCrypt)
 * - Registrar indicação automaticamente
 */

import { useState, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Crown, ArrowLeft, Eye, EyeOff } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { apiCadastro, apiLogin, salvarSessao } from "@/lib/api";
import { paises } from "@/lib/localidades";

const Login = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const [modoCadastro, setModoCadastro] = useState(searchParams.get("modo") === "cadastro");
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [lembrarMe, setLembrarMe] = useState(false);
  const [carregando, setCarregando] = useState(false);

  const [form, setForm] = useState({
    nome: "",
    email: "",
    senha: "",
    cpf: "",
    dataNascimento: "",
    rua: "",
    numero: "",
    bairro: "",
    cep: "",
    pais: "",
    estado: "",
    cidade: "",
    codigoIndicacao: "",
  });

  // Cascata de localidade: País → Estado → Cidade
  const paisSelecionado = useMemo(() => paises.find((p) => p.nome === form.pais), [form.pais]);
  const estadoSelecionado = useMemo(() => paisSelecionado?.estados.find((e) => e.nome === form.estado), [paisSelecionado, form.estado]);

  /** Formata CPF conforme o usuário digita: 000.000.000-00 */
  const formatarCPF = (valor: string) => {
    const nums = valor.replace(/\D/g, "").slice(0, 11);
    if (nums.length <= 3) return nums;
    if (nums.length <= 6) return `${nums.slice(0, 3)}.${nums.slice(3)}`;
    if (nums.length <= 9) return `${nums.slice(0, 3)}.${nums.slice(3, 6)}.${nums.slice(6)}`;
    return `${nums.slice(0, 3)}.${nums.slice(3, 6)}.${nums.slice(6, 9)}-${nums.slice(9)}`;
  };

  /** Processa o login ou cadastro — agora via API do backend */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCarregando(true);

    try {
      if (modoCadastro) {
        // ===== MODO CADASTRO — POST /api/auth/cadastro =====
        
        if (!form.nome || !form.email || !form.senha || !form.cpf || !form.dataNascimento || !form.rua || !form.numero || !form.bairro || !form.cep || !form.pais || !form.estado || !form.cidade) {
          toast.error("Preencha todos os campos obrigatórios");
          setCarregando(false);
          return;
        }

        // Envia para o backend que faz toda a validação e criação
        const usuario = await apiCadastro({
          nome: form.nome,
          email: form.email,
          senha: form.senha,
          cpf: form.cpf,
          dataNascimento: form.dataNascimento,
          rua: form.rua,
          numero: form.numero,
          bairro: form.bairro,
          cep: form.cep,
          pais: form.pais,
          estado: form.estado,
          cidade: form.cidade,
          codigoIndicacao: form.codigoIndicacao || undefined,
        });

        // Salva a sessão localmente (cache)
        salvarSessao(usuario, lembrarMe);
        
        toast.success("Bem-vindo(a), Embaixador(a)! 👑");
        navigate("/dashboard");
      } else {
        // ===== MODO LOGIN — POST /api/auth/login =====
        
        if (!form.email || !form.senha) {
          toast.error("Preencha email e senha");
          setCarregando(false);
          return;
        }

        // Envia para o backend que valida credenciais
        const usuario = await apiLogin({
          email: form.email,
          senha: form.senha,
        });

        // Salva a sessão localmente (cache)
        salvarSessao(usuario, lembrarMe);
        
        toast.success(`Bem-vindo(a) de volta, ${usuario.nome}! 👑`);
        
        // Redireciona: admin/moderador/auxiliar vão para /admin, os demais para /dashboard
        navigate(["admin", "moderador", "auxiliar"].includes(usuario.role) ? "/admin" : "/dashboard");
      }
    } catch (error) {
      // O backend retorna mensagens de erro amigáveis (email já existe, CPF duplicado, etc.)
      const mensagem = error instanceof Error ? error.message : "Erro ao processar. Tente novamente.";
      toast.error(mensagem);
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div className="min-h-screen gradient-hero flex items-center justify-center p-6 relative overflow-hidden">
      {/* Efeitos visuais de fundo */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-20 left-10 w-72 h-72 rounded-full bg-gold blur-3xl" />
        <div className="absolute bottom-20 right-20 w-60 h-60 rounded-full bg-gold blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-lg relative z-10"
      >
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-2 text-cream/60 hover:text-cream mb-8 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="font-body text-sm">Voltar ao início</span>
        </button>

        <div className="bg-card/95 backdrop-blur-sm rounded-2xl p-8 shadow-elevated border border-border max-h-[85vh] overflow-y-auto">
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-full gradient-royal flex items-center justify-center mx-auto mb-4 shadow-gold">
              <Crown className="h-8 w-8 text-foreground" />
            </div>
            <h1 className="font-display text-2xl text-foreground">
              {modoCadastro ? "Seja um Embaixador" : "Bem-vindo de volta"}
            </h1>
            <p className="font-body text-sm text-muted-foreground mt-2">
              {modoCadastro ? "Cadastre-se e comece sua jornada no Reino" : "Entre na sua conta para continuar"}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {modoCadastro && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="nome" className="font-body text-foreground">Nome completo *</Label>
                  <Input id="nome" placeholder="Seu nome completo" value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} className="bg-background border-border" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cpf" className="font-body text-foreground">CPF *</Label>
                  <Input id="cpf" placeholder="000.000.000-00" value={form.cpf} onChange={(e) => setForm({ ...form, cpf: formatarCPF(e.target.value) })} className="bg-background border-border" maxLength={14} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dataNascimento" className="font-body text-foreground">Data de nascimento *</Label>
                  <Input id="dataNascimento" type="date" value={form.dataNascimento} onChange={(e) => setForm({ ...form, dataNascimento: e.target.value })} className="bg-background border-border" />
                </div>

                <div className="border border-border rounded-lg p-4 space-y-3">
                  <p className="font-display text-sm text-foreground">Endereço *</p>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="col-span-2 space-y-1">
                      <Label className="font-body text-xs text-muted-foreground">Rua</Label>
                      <Input placeholder="Nome da rua" value={form.rua} onChange={(e) => setForm({ ...form, rua: e.target.value })} className="bg-background border-border" />
                    </div>
                    <div className="space-y-1">
                      <Label className="font-body text-xs text-muted-foreground">Número</Label>
                      <Input placeholder="Nº" value={form.numero} onChange={(e) => setForm({ ...form, numero: e.target.value })} className="bg-background border-border" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="font-body text-xs text-muted-foreground">Bairro</Label>
                      <Input placeholder="Bairro" value={form.bairro} onChange={(e) => setForm({ ...form, bairro: e.target.value })} className="bg-background border-border" />
                    </div>
                    <div className="space-y-1">
                      <Label className="font-body text-xs text-muted-foreground">CEP</Label>
                      <Input placeholder="00000-000" value={form.cep} onChange={(e) => {
                        const nums = e.target.value.replace(/\D/g, "").slice(0, 8);
                        const formatted = nums.length > 5 ? `${nums.slice(0, 5)}-${nums.slice(5)}` : nums;
                        setForm({ ...form, cep: formatted });
                      }} className="bg-background border-border" maxLength={9} />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="font-body text-xs text-muted-foreground">País</Label>
                    <Select value={form.pais} onValueChange={(v) => setForm({ ...form, pais: v, estado: "", cidade: "" })}>
                      <SelectTrigger className="bg-background border-border"><SelectValue placeholder="Selecione o país" /></SelectTrigger>
                      <SelectContent>
                        {paises.map((p) => (
                          <SelectItem key={p.codigo} value={p.nome}>{p.nome}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {paisSelecionado && (
                    <div className="space-y-1">
                      <Label className="font-body text-xs text-muted-foreground">Estado / Região</Label>
                      <Select value={form.estado} onValueChange={(v) => setForm({ ...form, estado: v, cidade: "" })}>
                        <SelectTrigger className="bg-background border-border"><SelectValue placeholder="Selecione o estado" /></SelectTrigger>
                        <SelectContent>
                          {paisSelecionado.estados
                            .slice()
                            .sort((a, b) => a.nome.localeCompare(b.nome))
                            .map((e) => (
                              <SelectItem key={e.sigla} value={e.nome}>{e.nome}</SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  {estadoSelecionado && (
                    <div className="space-y-1">
                      <Label className="font-body text-xs text-muted-foreground">Cidade</Label>
                      <Select value={form.cidade} onValueChange={(v) => setForm({ ...form, cidade: v })}>
                        <SelectTrigger className="bg-background border-border"><SelectValue placeholder="Selecione a cidade" /></SelectTrigger>
                        <SelectContent>
                          {estadoSelecionado.cidades
                            .slice()
                            .sort((a, b) => a.localeCompare(b))
                            .map((c) => (
                              <SelectItem key={c} value={c}>{c}</SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
              </>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="email" className="font-body text-foreground">Email *</Label>
              <Input id="email" type="email" placeholder="seu@email.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="bg-background border-border" />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="senha" className="font-body text-foreground">Senha *</Label>
              <div className="relative">
                <Input id="senha" type={mostrarSenha ? "text" : "password"} placeholder="••••••••" value={form.senha} onChange={(e) => setForm({ ...form, senha: e.target.value })} className="bg-background border-border pr-10" />
                <button type="button" onClick={() => setMostrarSenha(!mostrarSenha)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {mostrarSenha ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            
            {modoCadastro && (
              <div className="space-y-2">
                <Label htmlFor="codigoIndicacao" className="font-body text-foreground">
                  Código de indicação <span className="text-muted-foreground text-xs">(opcional)</span>
                </Label>
                <div className="flex">
                  <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-border bg-muted text-muted-foreground text-sm font-mono">EMB-</span>
                  <Input
                    id="codigoIndicacao"
                    placeholder="0000"
                    value={form.codigoIndicacao.replace(/^EMB-/i, "")}
                    onChange={(e) => {
                      const digits = e.target.value.replace(/\D/g, "").slice(0, 4);
                      setForm({ ...form, codigoIndicacao: digits ? `EMB-${digits}` : "" });
                    }}
                    className="bg-background border-border rounded-l-none"
                    maxLength={4}
                  />
                </div>
              </div>
            )}

            <div className="flex items-center gap-2 pt-1">
              <Checkbox id="lembrarMe" checked={lembrarMe} onCheckedChange={(v) => setLembrarMe(v === true)} />
              <Label htmlFor="lembrarMe" className="font-body text-sm text-muted-foreground cursor-pointer">
                Lembrar-me por 48 horas
              </Label>
            </div>

            <Button 
              type="submit" 
              disabled={carregando}
              className="w-full gradient-royal text-foreground font-display tracking-wider py-5 shadow-gold hover:opacity-90 disabled:opacity-50"
            >
              {carregando ? "Processando..." : modoCadastro ? "Cadastrar" : "Entrar"}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <button onClick={() => setModoCadastro(!modoCadastro)} className="font-body text-sm text-muted-foreground hover:text-foreground transition-colors">
              {modoCadastro ? "Já tem uma conta? Entre aqui" : "Ainda não é embaixador? Cadastre-se"}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
