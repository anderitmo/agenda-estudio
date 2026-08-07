-- ==========================================================
-- SCRIPT DE POPULAÇÃO ALEATÓRIA (MOCK DATA)
-- ==========================================================

-- 1. Limpar todas as tabelas operacionais e de configuração
truncate table reserva_ajustes cascade;
truncate table reserva_equipamentos cascade;
truncate table reservas cascade;
truncate table banda_integrantes cascade;
truncate table bandas cascade;
truncate table clientes cascade;
truncate table sala_bloqueios cascade;
truncate table salas cascade;
truncate table equipamentos cascade;

-- 2. Salas (Configuração básica)
insert into salas (nome, descricao, capacidade, observacoes, duracao_minima_minutos, duracao_maxima_minutos, buffer_minutos)
values
  ('Estúdio A', 'Sala Premium com excelente acústica', 6, 'Equipada com bateria Tama e amplificador de guitarra Marshall', 60, 240, 15),
  ('Estúdio B', 'Sala Standart versátil', 4, 'Equipada com bateria Pearl e amplificador de guitarra Fender', 60, 180, 15);

-- 3. Equipamentos Extras
insert into equipamentos (nome, quantidade_total)
values
  ('Microfone Shure SM58', 5),
  ('Pedestal de Microfone', 4),
  ('Cabo XLR 5m', 8),
  ('Prato de Condução Zildjian 20', 2);

-- 4. Clientes (Gerar 15 clientes realistas)
insert into clientes (nome, whatsapp, consentimento_dados, anonimizado)
values
  ('Carlos Alberto', '11988881111', true, false),
  ('Fernanda Souza', '11988882222', true, false),
  ('Ricardo Menezes', '11988883333', true, false),
  ('Amanda Silva', '11988884444', true, false),
  ('Roberto Garcia', '11988885555', true, false),
  ('Juliana Lima', '11988886666', true, false),
  ('Marcelo Castro', '11988887777', true, false),
  ('Patrícia Reis', '11988888888', true, false),
  ('Gustavo Rocha', '11988889999', true, false),
  ('Camila Pires', '11988880000', true, false),
  ('Thiago Neves', '11977771111', true, false),
  ('Sofia Santos', '11977772222', true, false),
  ('Matheus Oliveira', '11977773333', true, false),
  ('Beatriz Costa', '11977774444', true, false),
  ('André Almeida', '11977775555', true, false);

-- 5. Bandas (Gerar 6 bandas lideradas por alguns dos clientes acima)
insert into bandas (nome, responsavel_id)
values
  ('Os Alquimistas', (select id from clientes where whatsapp = '11988881111')),
  ('Sunset Rock', (select id from clientes where whatsapp = '11988882222')),
  ('Jazz & Blues Band', (select id from clientes where whatsapp = '11988883333')),
  ('Gritos Suburbanos', (select id from clientes where whatsapp = '11988884444')),
  ('Metal Core S/A', (select id from clientes where whatsapp = '11988885555')),
  ('Acústico MPB', (select id from clientes where whatsapp = '11988886666'));

-- 6. Integrantes (Adicionar múltiplos integrantes a cada banda)
insert into banda_integrantes (banda_id, cliente_id, ativo)
values
  -- Os Alquimistas (Carlos Alberto, Juliana Lima, Patrícia Reis)
  ((select id from bandas where nome = 'Os Alquimistas'), (select id from clientes where whatsapp = '11988881111'), true),
  ((select id from bandas where nome = 'Os Alquimistas'), (select id from clientes where whatsapp = '11988886666'), true),
  ((select id from bandas where nome = 'Os Alquimistas'), (select id from clientes where whatsapp = '11988888888'), true),

  -- Sunset Rock (Fernanda Souza, Gustavo Rocha, Marcelo Castro)
  ((select id from bandas where nome = 'Sunset Rock'), (select id from clientes where whatsapp = '11988882222'), true),
  ((select id from bandas where nome = 'Sunset Rock'), (select id from clientes where whatsapp = '11988889999'), true),
  ((select id from bandas where nome = 'Sunset Rock'), (select id from clientes where whatsapp = '11988887777'), true),

  -- Jazz & Blues Band (Ricardo Menezes, Camila Pires, Thiago Neves)
  ((select id from bandas where nome = 'Jazz & Blues Band'), (select id from clientes where whatsapp = '11988883333'), true),
  ((select id from bandas where nome = 'Jazz & Blues Band'), (select id from clientes where whatsapp = '11988880000'), true),
  ((select id from bandas where nome = 'Jazz & Blues Band'), (select id from clientes where whatsapp = '11977771111'), true),

  -- Gritos Suburbanos (Amanda Silva, Sofia Santos, Beatriz Costa)
  ((select id from bandas where nome = 'Gritos Suburbanos'), (select id from clientes where whatsapp = '11988884444'), true),
  ((select id from bandas where nome = 'Gritos Suburbanos'), (select id from clientes where whatsapp = '11977772222'), true),
  ((select id from bandas where nome = 'Gritos Suburbanos'), (select id from clientes where whatsapp = '11977774444'), true);

-- 7. Reservas (Popular agendamentos realistas distribuídos no tempo)
insert into reservas (sala_id, banda_id, criado_por_cliente_id, inicio, fim, status, observacoes)
values
  -- Reservas Passadas Concluídas (Dias anteriores)
  (
    (select id from salas where nome = 'Estúdio A' limit 1),
    (select id from bandas where nome = 'Os Alquimistas'),
    (select id from clientes where whatsapp = '11988881111'),
    now() - interval '5 days' + interval '10 hours',
    now() - interval '5 days' + interval '12 hours',
    'concluida',
    'Primeiro ensaio do mês.'
  ),
  (
    (select id from salas where nome = 'Estúdio B' limit 1),
    (select id from bandas where nome = 'Sunset Rock'),
    (select id from clientes where whatsapp = '11988882222'),
    now() - interval '4 days' + interval '14 hours',
    now() - interval '4 days' + interval '16 hours',
    'concluida',
    'Trazer guitarra reserva.'
  ),
  (
    (select id from salas where nome = 'Estúdio A' limit 1),
    (select id from bandas where nome = 'Jazz & Blues Band'),
    (select id from clientes where whatsapp = '11988883333'),
    now() - interval '3 days' + interval '18 hours',
    now() - interval '3 days' + interval '20 hours',
    'concluida',
    'Uso de teclado adicional.'
  ),

  -- Reservas Futuras Confirmadas (Dias posteriores)
  (
    (select id from salas where nome = 'Estúdio A' limit 1),
    (select id from bandas where nome = 'Gritos Suburbanos'),
    (select id from clientes where whatsapp = '11988884444'),
    now() + interval '2 days' + interval '11 hours',
    now() + interval '2 days' + interval '13 hours',
    'confirmada',
    'Preparação para o festival.'
  ),
  (
    (select id from salas where nome = 'Estúdio B' limit 1),
    (select id from bandas where nome = 'Os Alquimistas'),
    (select id from clientes where whatsapp = '11988881111'),
    now() + interval '3 days' + interval '15 hours',
    now() + interval '3 days' + interval '17 hours',
    'confirmada',
    'Ensaio de acústico.'
  ),
  (
    (select id from salas where nome = 'Estúdio A' limit 1),
    (select id from bandas where nome = 'Sunset Rock'),
    (select id from clientes where whatsapp = '11988882222'),
    now() + interval '4 days' + interval '19 hours',
    now() + interval '4 days' + interval '21 hours',
    'confirmada',
    'Gravação teste.'
  );

-- 8. Reserva Equipamentos (Adicionar equipamentos para algumas reservas)
insert into reserva_equipamentos (reserva_id, equipamento_id, quantidade)
values
  -- Reserva 1 (Microfones e Cabos)
  (
    (select id from reservas where status = 'concluida' order by inicio asc limit 1),
    (select id from equipamentos where nome = 'Microfone Shure SM58' limit 1),
    2
  ),
  (
    (select id from reservas where status = 'concluida' order by inicio asc limit 1),
    (select id from equipamentos where nome = 'Cabo XLR 5m' limit 1),
    2
  ),
  -- Reserva Futura (Prato de Condução e Pedestal)
  (
    (select id from reservas where status = 'confirmada' order by inicio desc limit 1),
    (select id from equipamentos where nome = 'Prato de Condução Zildjian 20' limit 1),
    1
  ),
  (
    (select id from reservas where status = 'confirmada' order by inicio desc limit 1),
    (select id from equipamentos where nome = 'Pedestal de Microfone' limit 1),
    1
  );

-- 9. Reserva Ajustes (Adicionar uma nota de ajuste a uma reserva concluída)
insert into reserva_ajustes (reserva_id, nota)
values
  (
    (select id from reservas where status = 'concluida' order by inicio asc limit 1),
    'Equipamento microfone devolvido sem avarias. Tudo ok.'
  );
