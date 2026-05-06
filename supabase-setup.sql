-- =============================================
-- CIMI ALIMENTOS — Supabase Setup
-- Execute no SQL Editor do Supabase
-- =============================================

-- 1. PRODUTOS
create table if not exists produtos (
  codigo      text primary key,
  nome        text not null,
  preco       numeric(10,2) not null,
  tipo        text not null default 'kg',
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

-- 2. ESTOQUE
create table if not exists estoque (
  codigo      text primary key references produtos(codigo) on delete cascade,
  saldo       numeric(10,3) not null default 0,
  unidade     text not null default 'kg',
  updated_at  timestamptz default now()
);

-- 3. HISTORICO DE PRODUÇÕES
create table if not exists producoes (
  id          bigserial primary key,
  produto_codigo text references produtos(codigo),
  produto_nome   text not null,
  qty         numeric(10,3) not null,
  unit        text not null,
  mult        int not null default 1,
  data        timestamptz default now()
);

-- 4. TRANSFERÊNCIAS (romaneios)
create table if not exists transferencias (
  id          bigserial primary key,
  total       numeric(10,2) not null,
  responsavel text,
  observacao  text,
  data        timestamptz default now()
);

-- 5. ITENS DE TRANSFERÊNCIA
create table if not exists transferencia_itens (
  id                 bigserial primary key,
  transferencia_id   bigint references transferencias(id) on delete cascade,
  produto_codigo     text,
  produto_nome       text not null,
  produto_preco      numeric(10,2) not null,
  qty                numeric(10,3) not null,
  unit               text not null,
  mult               int default 1
);

-- =============================================
-- POLICIES (acesso público leitura/escrita)
-- Habilitar RLS mas permitir tudo por enquanto
-- =============================================
alter table produtos           enable row level security;
alter table estoque            enable row level security;
alter table producoes          enable row level security;
alter table transferencias     enable row level security;
alter table transferencia_itens enable row level security;

create policy "public_all" on produtos            for all using (true) with check (true);
create policy "public_all" on estoque             for all using (true) with check (true);
create policy "public_all" on producoes           for all using (true) with check (true);
create policy "public_all" on transferencias      for all using (true) with check (true);
create policy "public_all" on transferencia_itens for all using (true) with check (true);

-- =============================================
-- REALTIME (para NOC ao vivo)
-- =============================================
alter publication supabase_realtime add table producoes;
alter publication supabase_realtime add table transferencias;
alter publication supabase_realtime add table estoque;

-- =============================================
-- ÍNDICES para performance
-- =============================================
create index if not exists idx_producoes_data   on producoes(data desc);
create index if not exists idx_transferencias_data on transferencias(data desc);
create index if not exists idx_estoque_saldo    on estoque(saldo);
