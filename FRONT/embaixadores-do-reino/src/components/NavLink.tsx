/**
 * NavLink.tsx — Componente de link de navegação
 * 
 * Wrapper em torno do NavLink do react-router-dom que adiciona
 * suporte a classes CSS condicionais para estado ativo (isActive)
 * e pendente (isPending).
 * 
 * Uso: <NavLink to="/rota" className="estilo" activeClassName="estilo-ativo" />
 */

import { NavLink as RouterNavLink, NavLinkProps } from "react-router-dom";
import { forwardRef } from "react";
import { cn } from "@/lib/utils";

interface NavLinkCompatProps extends Omit<NavLinkProps, "className"> {
  className?: string;
  activeClassName?: string;   // Classe aplicada quando o link está ativo
  pendingClassName?: string;  // Classe aplicada quando a navegação está pendente
}

const NavLink = forwardRef<HTMLAnchorElement, NavLinkCompatProps>(
  ({ className, activeClassName, pendingClassName, to, ...props }, ref) => {
    return (
      <RouterNavLink
        ref={ref}
        to={to}
        className={({ isActive, isPending }) =>
          cn(className, isActive && activeClassName, isPending && pendingClassName)
        }
        {...props}
      />
    );
  },
);

NavLink.displayName = "NavLink";

export { NavLink };
