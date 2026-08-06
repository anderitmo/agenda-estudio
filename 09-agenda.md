# Tarefa 09 — Agenda (Dia / Semana / Mês)

## Objetivo

Visualização principal do sistema, com colunas por sala e navegação entre dia, semana e mês.

## Depende de

Tarefa 06 (salas), Tarefa 08 (disponibilidade, para o clique em horário livre já validar antes de abrir o formulário).

## Arquivos

- `paginas/agenda.html`
- `js/paginas/agenda.js`

## Bibliotecas adicionais (via CDN, apenas nesta página)

- `@fullcalendar/core`, `@fullcalendar/timegrid`, `@fullcalendar/resource-timegrid`, `@fullcalendar/interaction` (build ESM via CDN, ex. `https://cdn.jsdelivr.net/npm/@fullcalendar/...`).

## Especificação da tela

- View padrão: `resourceTimeGridDay`, com um seletor para alternar entre dia, semana (`resourceTimeGridWeek`) e mês (`dayGridMonth`, sem recurso por sala nesta view, já que mês não comporta colunas por sala de forma legível).
- Recursos (`resources`) carregados a partir de `listarSalas({ apenasAtivas: true })`, um recurso por sala.
- Eventos carregados a partir de `listarReservas` (status `confirmada`) e `listarBloqueios`, no intervalo visível (`datesSet` callback do FullCalendar para recarregar ao navegar).
- Reservas confirmadas: cor de fundo neutra do tema (verde claro ou azul claro do Pico).
- Bloqueios administrativos: cor de fundo diferenciada (cinza hachurado ou similar), com `editable: false`.
- Clique em horário vazio (`dateClick` / `select`): dispara a Tarefa 10 (formulário de criação de reserva), pré-preenchendo sala, data e horário.
- Clique em uma reserva existente: abre painel de detalhes com opções "Editar observações", "Cancelar" e "Remarcar" (ligando às Tarefas 10 e 11).

## Critérios de aceite

- As duas salas aparecem como colunas separadas na view de dia e semana.
- Reservas canceladas ou remarcadas não aparecem na agenda (apenas `confirmada` e, opcionalmente com estilo diferente, `concluida` do dia corrente).
- Bloqueios administrativos aparecem visualmente distintos de reservas e não são clicáveis para edição de reserva.
- Navegar entre datas recarrega os eventos do período correto (sem sobra de eventos de períodos anteriores).
