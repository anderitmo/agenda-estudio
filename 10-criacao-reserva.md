# Tarefa 10 — Fluxo Completo de Criação de Reserva

## Objetivo

Implementar o fluxo de nove passos definido no plano funcional, como um formulário/modal acionado a partir da agenda.

## Depende de

Tarefa 04 (cadastro de cliente), Tarefa 05 (bandas), Tarefa 07 (equipamentos), Tarefa 08 (disponibilidade), Tarefa 09 (agenda, que aciona este fluxo).

## Arquivos

- `js/paginas/reserva.js` (modal/formulário reaproveitado pela Tarefa 09)

## Especificação do fluxo

1. **Data e sala**: pré-preenchidas quando acionado por clique na agenda; editáveis manualmente.
2. **Horário inicial e final**: campos de hora, com validação de duração mínima/máxima da sala (chamando `validarPeriodoBasico` da Tarefa 08 em tempo real, antes mesmo de submeter).
3. **Busca de cliente**: campo de busca por nome ou WhatsApp (`listarClientes` com filtro). Se não encontrado, botão "Cadastrar novo cliente" abre o formulário da Tarefa 04 em um modal, sem sair da tela de reserva.
4. **Banda**: preenchida automaticamente a partir do cliente selecionado (um cliente pode pertencer a mais de uma banda — nesse caso, exibir um seletor com as bandas do cliente).
5. **Equipamentos**: lista de checkboxes com quantidade, filtrada por `listarEquipamentosDisponiveis` (Tarefa 08) para o período já definido nos passos 1–2. Equipamentos indisponíveis aparecem desabilitados, não ocultos, para transparência.
6. **Observações**: campo de texto livre opcional (ex.: "trazer amplificador próprio", "gravação de ensaio").
7. **Validação final**: ao clicar em "Confirmar", chamar `verificarDisponibilidadeCompleta` (Tarefa 08) novamente (revalidação, já que tempo pode ter passado entre a abertura do formulário e o clique em confirmar). Se houver conflito, exibir os motivos retornados e não submeter.
8. **Gravação**: se válido, chamar `criarReserva` com status `confirmada` e, se aplicável, `criarReservaEquipamento` para cada item selecionado (dentro da mesma operação lógica; se o Supabase client não suportar transação multi-tabela diretamente, gravar a reserva primeiro e depois os equipamentos, tratando falha parcial com uma mensagem clara ao usuário).
9. **Confirmação**: mensagem de sucesso e fechamento do modal, com recarregamento dos eventos da agenda (Tarefa 09).

## Critérios de aceite

- Não é possível confirmar uma reserva sem cliente e banda selecionados.
- Tentar confirmar um horário que se tornou indisponível entre a abertura do formulário e o clique em "Confirmar" (ex.: outra reserva foi criada nesse meio tempo) é bloqueado na revalidação do passo 7.
- Equipamentos indisponíveis no período aparecem desabilitados com uma indicação textual do motivo (ex.: "indisponível neste horário").
- Após confirmar, a agenda reflete a nova reserva sem necessidade de recarregar a página manualmente.
