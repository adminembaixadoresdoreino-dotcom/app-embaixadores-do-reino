/**
 * App.tsx — Componente raiz da aplicação
 * 
 * Responsável por:
 * - Configurar as rotas (páginas) do sistema
 * - Prover contextos globais (React Query, Tooltips, Toasts)
 * - Definir qual componente renderiza em cada URL
 * 
 * ROTAS:
 * /           → Página inicial (landing page pública)
 * /login      → Tela de login e cadastro
 * /dashboard  → Painel do embaixador (área logada)
 * /modulo/:id → Detalhes de um módulo de formação
 * /admin      → Painel administrativo (apenas para roles com permissão)
 * *           → Página 404 (não encontrado)
 */

import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import ModuloDetalhe from "./pages/ModuloDetalhe";
import Admin from "./pages/Admin";
import NotFound from "./pages/NotFound";

// Instância do React Query para gerenciar cache de dados (usado caso integre com API futuramente)
const queryClient = new QueryClient();

const App = () => (
  // QueryClientProvider: provê o cache de dados para toda a aplicação
  <QueryClientProvider client={queryClient}>
    {/* TooltipProvider: permite usar tooltips em qualquer lugar */}
    <TooltipProvider>
      {/* Toaster e Sonner: sistemas de notificação/toast na tela */}
      <Toaster />
      <Sonner />
      {/* BrowserRouter: gerencia a navegação por URL */}
      <BrowserRouter>
        <Routes>
          {/* Página inicial pública */}
          <Route path="/" element={<Index />} />
          {/* Tela de login/cadastro */}
          <Route path="/login" element={<Login />} />
          {/* Dashboard do embaixador (área protegida) */}
          <Route path="/dashboard" element={<Dashboard />} />
          {/* Página de detalhes de um módulo de formação */}
          <Route path="/modulo/:moduloId" element={<ModuloDetalhe />} />
          {/* Painel administrativo */}
          <Route path="/admin" element={<Admin />} />
          {/* Página 404 - Qualquer rota não encontrada */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
