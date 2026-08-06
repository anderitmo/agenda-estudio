# Tarefa 12 — Histórico de Cliente e Banda, Princípio de Imutabilidade

## Objetivo

Telas de consulta ao histórico, e reforço em código do princípio de que reservas concluídas não são livremente editáveis.

## Depende de

Tarefa 10, Tarefa 11.

## Arquivos

- `paginas/historico.html`
- `js/paginas/historico.js`

## Especificação da tela

Duas abas ou seções:

### Histórico do cliente

- Campo de busca (nome ou WhatsApp) → `historicoCliente(clienteId)`.
- Lista de reservas com: data, sala, banda, duração, equipamentos, status.

### Histórico da banda

- Campo de busca (nome da banda) → `historicoBanda(bandaId)`.
- Lista de reservas com: data, sala, integrante responsável pela reserva, duração, status.
- Indicador simples de frequência (contagem de reservas com status `concluida` nos últimos 90 dias, calculado no frontend a partir da lista retornada, sem necessidade de nova função de banco).

### Ajustes em reserva concluída

- Em uma reserva com `status = 'concluida'`, em vez de um botão "Editar", exibir um botão "Adicionar nota" que chama `adicionarAjuste({ reservaId, nota })`.
- As notas de ajuste aparecem listadas abaixo da reserva, com data e conteúdo, nunca substituindo os dados originais.

## Reforço da imutabilidade em `db.js`

Confirmar (herdado da Tarefa 03) que não existe nenhuma função exposta capaz de alterar `inicio`, `fim` ou `sala_id` de uma reserva com `status = 'concluida'`. Se necessário, adicionar uma verificação explícita no início de `remarcarReserva` e `cancelarReserva` que recusa a operação quando o status atual já é `concluida`, retornando erro claro ("reserva já concluída, use 'adicionar nota' para registrar informações adicionais").

## Critérios de aceite

- Buscar o histórico de um cliente ou banda retorna todas as reservas, incluindo canceladas e remarcadas, cada uma com seu status visível.
- Tentar cancelar ou remarcar uma reserva já concluída é recusado pela camada de dados, não apenas escondido na UI.
- Adicionar uma nota a uma reserva concluída não altera nenhum campo da reserva original.
