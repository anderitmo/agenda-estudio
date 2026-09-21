-- Extensão para geração de UUID
create extension if not exists "pgcrypto";

-- ==========================================================
-- ENUM: status da reserva
-- ==========================================================
create type status_reserva as enum (
  'confirmada',
  'cancelada',
  'remarcada',
  'concluida',
  'nao_compareceu'
);

-- ==========================================================
-- CLIENTES
-- ==========================================================
create table clientes (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  whatsapp text not null unique,
  consentimento_dados boolean not null default true,
  anonimizado boolean not null default false,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

-- ==========================================================
-- BANDAS
-- ==========================================================
create table bandas (
  id uuid primary key default gen_random_uuid(),
  nome text not null unique,
  responsavel_id uuid references clientes(id),
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

-- ==========================================================
-- INTEGRANTES (relação N:N entre clientes e bandas)
-- ==========================================================
create table banda_integrantes (
  id uuid primary key default gen_random_uuid(),
  banda_id uuid not null references bandas(id) on delete cascade,
  cliente_id uuid not null references clientes(id),
  ativo boolean not null default true,
  entrou_em timestamptz not null default now(),
  saiu_em timestamptz,
  unique (banda_id, cliente_id)
);

alter table bandas
  add constraint fk_responsavel_integrante
  foreign key (responsavel_id) references clientes(id);

-- ==========================================================
-- SALAS
-- ==========================================================
create table salas (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  descricao text,
  capacidade int,
  observacoes text,
  ativa boolean not null default true,
  duracao_minima_minutos int not null default 60,
  duracao_maxima_minutos int not null default 240,
  buffer_minutos int not null default 15,
  criado_em timestamptz not null default now()
);

-- Bloqueios administrativos (manutenção, limpeza, uso interno)
create table sala_bloqueios (
  id uuid primary key default gen_random_uuid(),
  sala_id uuid not null references salas(id),
  inicio timestamptz not null,
  fim timestamptz not null,
  motivo text,
  criado_por uuid, -- referencia auth.users, ver Tarefa 14
  criado_em timestamptz not null default now(),
  constraint bloqueio_intervalo_valido check (fim > inicio)
);

-- ==========================================================
-- EQUIPAMENTOS
-- ==========================================================
create table equipamentos (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  quantidade_total int not null check (quantidade_total > 0),
  criado_em timestamptz not null default now()
);

-- ==========================================================
-- RESERVAS
-- ==========================================================
create table reservas (
  id uuid primary key default gen_random_uuid(),
  sala_id uuid not null references salas(id),
  banda_id uuid not null references bandas(id),
  criado_por_cliente_id uuid not null references clientes(id),
  inicio timestamptz not null,
  fim timestamptz not null,
  status status_reserva not null default 'confirmada',
  observacoes text,
  motivo_cancelamento text,
  reserva_original_id uuid references reservas(id), -- preenchido quando status = 'remarcada' aponta para a nova reserva
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  constraint reserva_intervalo_valido check (fim > inicio)
);

create index idx_reservas_sala_periodo on reservas (sala_id, inicio, fim);
create index idx_reservas_banda on reservas (banda_id);
create index idx_reservas_status on reservas (status);

-- Equipamentos vinculados a uma reserva
create table reserva_equipamentos (
  id uuid primary key default gen_random_uuid(),
  reserva_id uuid not null references reservas(id) on delete cascade,
  equipamento_id uuid not null references equipamentos(id),
  quantidade int not null check (quantidade > 0)
);

create index idx_reserva_equipamentos_equip on reserva_equipamentos (equipamento_id);

-- ==========================================================
-- HISTÓRICO / AUDITORIA (princípio de imutabilidade)
-- ==========================================================
-- Registra ajustes pontuais em reservas já concluídas, sem
-- sobrescrever os dados originais da reserva.
create table reserva_ajustes (
  id uuid primary key default gen_random_uuid(),
  reserva_id uuid not null references reservas(id),
  nota text not null,
  criado_por uuid, -- referencia auth.users
  criado_em timestamptz not null default now()
);

-- ==========================================================
-- PAPÉIS DE ACESSO (ver Tarefa 14 para uso completo)
-- ==========================================================
create type papel_usuario as enum ('administrador', 'atendente');

create table usuarios_papel (
  usuario_id uuid primary key references auth.users(id),
  papel papel_usuario not null default 'atendente',
  criado_em timestamptz not null default now()
);

-- ==========================================================
-- ROW LEVEL SECURITY
-- ==========================================================
alter table clientes enable row level security;
alter table bandas enable row level security;
alter table banda_integrantes enable row level security;
alter table salas enable row level security;
alter table sala_bloqueios enable row level security;
alter table equipamentos enable row level security;
alter table reservas enable row level security;
alter table reserva_equipamentos enable row level security;
alter table reserva_ajustes enable row level security;
alter table usuarios_papel enable row level security;

create policy "autenticados podem ler" on clientes for select using (auth.role() = 'authenticated');
create policy "autenticados podem escrever" on clientes for all using (auth.role() = 'authenticated');

create policy "autenticados podem ler bandas" on bandas for select using (auth.role() = 'authenticated');
create policy "autenticados podem escrever bandas" on bandas for all using (auth.role() = 'authenticated');

create policy "autenticados podem ler integrantes" on banda_integrantes for select using (auth.role() = 'authenticated');
create policy "autenticados podem escrever integrantes" on banda_integrantes for all using (auth.role() = 'authenticated');

create policy "autenticados podem ler salas" on salas for select using (auth.role() = 'authenticated');
create policy "autenticados podem escrever salas" on salas for all using (auth.role() = 'authenticated');

create policy "autenticados podem ler bloqueios" on sala_bloqueios for select using (auth.role() = 'authenticated');
create policy "autenticados podem escrever bloqueios" on sala_bloqueios for all using (auth.role() = 'authenticated');

create policy "autenticados podem ler equipamentos" on equipamentos for select using (auth.role() = 'authenticated');
create policy "autenticados podem escrever equipamentos" on equipamentos for all using (auth.role() = 'authenticated');

create policy "autenticados podem ler reservas" on reservas for select using (auth.role() = 'authenticated');
create policy "autenticados podem escrever reservas" on reservas for all using (auth.role() = 'authenticated');

create policy "autenticados podem ler reserva_equipamentos" on reserva_equipamentos for select using (auth.role() = 'authenticated');
create policy "autenticados podem escrever reserva_equipamentos" on reserva_equipamentos for all using (auth.role() = 'authenticated');

create policy "autenticados podem ler ajustes" on reserva_ajustes for select using (auth.role() = 'authenticated');
create policy "autenticados podem inserir ajustes" on reserva_ajustes for insert with check (auth.role() = 'authenticated');

create policy "usuario le seu proprio papel" on usuarios_papel for select using (auth.uid() = usuario_id);
