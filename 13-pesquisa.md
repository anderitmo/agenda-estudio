# Tarefa 13 — Pesquisa

## Objetivo

Ponto único de busca de reservas por múltiplos critérios, reaproveitando as demais telas.

## Depende de

Tarefa 12.

## Arquivos

- Pode ser uma seção dentro de `paginas/historico.html` ou uma página própria `paginas/pesquisa.html` — decisão livre do agente, mantendo consistência com a navegação definida na Tarefa 01.
- `js/paginas/pesquisa.js`

## Especificação

Formulário de filtros combináveis (todos opcionais, aplicados em conjunto):

- Nome do cliente
- WhatsApp
- Nome da banda
- Data (intervalo: de/até)
- Sala
- Status da reserva

Chama `pesquisarReservas(filtros)` (Tarefa 03), que monta a query Supabase combinando os filtros preenchidos com `.eq()`/`.gte()`/`.lte()`/`.ilike()` conforme o campo.

Resultado exibido em tabela simples (Pico.css `<table>`): data, horário, sala, banda, cliente responsável, status.

## Critérios de aceite

- Pesquisar sem nenhum filtro preenchido retorna todas as reservas (paginadas ou limitadas a um número razoável, ex. 100 mais recentes, para não sobrecarregar a tela).
- Combinar dois ou mais filtros (ex.: sala + intervalo de data) retorna apenas os resultados que atendem a todos simultaneamente.
- Buscar por WhatsApp parcial (ex. DDD) retorna correspondências parciais, usando `ilike`.
