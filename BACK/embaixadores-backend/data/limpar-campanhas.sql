✅ OPÇÃO 1 — LIMPAR TUDO (RECOMENDADO)

Ordem correta:

-- 1. Apagar participações primeiro
DELETE FROM participacoes;

-- 2. Depois apagar campanhas
DELETE FROM campanhas;
💥 OPÇÃO 2 — RESET TOTAL (mais forte)

Se quiser zerar tudo mesmo:

TRUNCATE TABLE participacoes RESTART IDENTITY CASCADE;
TRUNCATE TABLE campanhas RESTART IDENTITY CASCADE;

👉 CASCADE remove dependências automaticamente
👉 RESTART IDENTITY reseta IDs (se tiver)