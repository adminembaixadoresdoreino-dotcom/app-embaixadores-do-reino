-- Conecte no banco: psql -h localhost -p 5433 -U postgres -d embaixadores

INSERT INTO usuarios (nome, email, senha, cpf, data_nascimento, rua, numero, bairro, cep, pais, estado, cidade, role, status, codigo_indicacao, data_cadastro)
VALUES (
  'Administrador',
  'admin@reinodosembaixadores.com',
  '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', -- senha: admin123
  '000.000.000-00',
  '1990-01-01',
  'Rua Principal',
  '1',
  'Centro',
  '00000-000',
  'Brasil',
  'São Paulo',
  'São Paulo',
  'admin',
  'embaixador',
  'EMB-0001',
  NOW()
);
