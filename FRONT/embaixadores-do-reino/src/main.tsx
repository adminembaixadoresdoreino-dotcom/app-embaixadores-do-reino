/**
 * main.tsx — Ponto de entrada da aplicação
 * 
 * REFATORADO: O seedAdmin foi removido porque o backend Java
 * já cria o admin automaticamente via DataLoader.
 */

import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// O admin é criado automaticamente pelo backend Spring Boot
// Não é mais necessário seedAdmin() aqui

createRoot(document.getElementById("root")!).render(<App />);
