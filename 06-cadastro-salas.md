# Tarefa 06 — Cadastro de Salas e Bloqueios Administrativos

## Objetivo

Gerenciar as duas salas do estúdio (dados básicos, parâmetros de agendamento) e permitir bloqueios administrativos de horário.

## Depende de

Tarefa 03.

## Arquivos

- `paginas/salas.html`
- `js/paginas/salas.js`

## Especificação da tela

### Cadastro/edição de sala

Formulário com:

- Nome, descrição, capacidade, observações
- Duração mínima e máxima de sessão (minutos)
- Buffer entre sessões (minutos)
- Status (ativa/inativa)

### Bloqueios administrativos

Para cada sala, uma sublista de bloqueios futuros, com:

- Data/hora de início e fim
- Motivo (texto livre: manutenção, limpeza, uso interno etc.)
- Botão para remover bloqueio

Ao criar um bloqueio, chamar internamente a função de verificação de disponibilidade (Tarefa 08) antes de salvar, para alertar caso o período já tenha uma reserva confirmada (não impedir o bloqueio, mas exigir confirmação explícita do administrador, já que resolver esse conflito pode envolver contatar o cliente).

## Critérios de aceite

- Criar, editar e desativar uma sala funciona e reflete na Tarefa 09 (agenda) e Tarefa 08 (disponibilidade).
- Criar um bloqueio administrativo aparece na agenda como um evento distinto de uma reserva (cor/estilo diferente).
- Criar um bloqueio sobre um período com reserva confirmada exibe aviso antes de confirmar.
