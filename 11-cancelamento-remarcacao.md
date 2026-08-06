# Tarefa 11 — Cancelamento e Remarcação de Reservas

## Objetivo

Implementar as duas ações que alteram o ciclo de vida de uma reserva já criada.

## Depende de

Tarefa 10.

## Arquivos

- Extensão de `js/paginas/reserva.js` (painel de detalhes aberto a partir da Tarefa 09)

## Cancelamento

- Formulário simples: campo obrigatório "Motivo do cancelamento".
- Chama `cancelarReserva({ id, motivo })`, que atualiza `status = 'cancelada'` e `motivo_cancelamento`.
- A reserva cancelada libera o horário imediatamente (a Tarefa 08 já ignora reservas não confirmadas nas checagens de conflito).
- Apenas o responsável pela banda (validado contra `cliente_logado` ou, nesta v1 sem login de cliente, qualquer atendente/administrador autenticado) ou o administrador podem cancelar — a validação de papel específica é detalhada na Tarefa 14.

## Remarcação

- Reaproveita o formulário da Tarefa 10 (data, sala, horário, equipamentos), pré-preenchido com os dados da reserva original.
- Ao confirmar:
  1. Chama `verificarDisponibilidadeCompleta` para o novo período, com `ignorarReservaId` igual ao id da reserva original (para não conflitar consigo mesma, caso a sala não mude).
  2. Cria uma nova reserva com os novos dados.
  3. Atualiza a reserva original: `status = 'remarcada'`, `reserva_original_id` da nova reserva apontando de volta (ou campo equivalente definido na Tarefa 02), preservando o vínculo entre as duas.
- A reserva original nunca é apagada nem tem `inicio`/`fim` sobrescritos — isso é o que preserva o histórico (ver Tarefa 12).

## Critérios de aceite

- Cancelar uma reserva libera o horário imediatamente na agenda.
- Remarcar uma reserva cria um novo registro, mantendo o registro original visível no histórico com status `remarcada` e link para a nova reserva.
- Tentar remarcar para um horário indisponível é bloqueado, com a reserva original permanecendo inalterada.
