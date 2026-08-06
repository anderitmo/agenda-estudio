# Tarefa 15 — Testes e Ajustes de Usabilidade

## Objetivo

Checklist final de validação ponta a ponta, cobrindo as regras de negócio críticas definidas ao longo do plano. Esta tarefa não introduz funcionalidade nova, apenas valida e ajusta o que já foi construído.

## Depende de

Todas as tarefas anteriores (01–14).

## Checklist funcional

- [ ] Cadastro de cliente novo não permite WhatsApp duplicado.
- [ ] Criação de banda automática funciona; vínculo a banda existente funciona; responsável é definido corretamente em ambos os casos.
- [ ] Transferência de responsável impede remoção do responsável sem transferência prévia.
- [ ] Duas reservas na mesma sala, sem respeitar o buffer configurado, são recusadas.
- [ ] Bloqueio administrativo impede reserva no período bloqueado.
- [ ] Reserva de equipamento respeita a quantidade disponível cruzada com o período.
- [ ] Duração mínima e máxima de sessão são respeitadas.
- [ ] Cancelamento libera o horário imediatamente na agenda.
- [ ] Remarcação preserva a reserva original com status `remarcada` e cria uma nova reserva vinculada.
- [ ] Reserva concluída não pode ser cancelada, remarcada ou ter `inicio`/`fim` alterados — apenas recebe notas de ajuste.
- [ ] Histórico de cliente e de banda mostra todas as reservas, com status correto.
- [ ] Pesquisa combinando múltiplos filtros retorna resultados corretos.
- [ ] Atendente não consegue criar bloqueio administrativo nem editar configuração de sala.
- [ ] Administrador consegue todas as ações do sistema.
- [ ] Acesso sem login é bloqueado em todas as páginas internas.

## Checklist de usabilidade

- [ ] Interface consistente com Pico.css em todas as páginas (tema claro, sem CSS conflitante).
- [ ] Formulário de cadastro de cliente (Tarefa 04) é usável em viewport de 375px.
- [ ] Agenda é usável em tablet/desktop (colunas de sala legíveis); em mobile, considerar priorizar a view de dia sobre semana/mês, já que colunas por sala ficam apertadas em telas pequenas — ajuste de CSS/breakpoint permitido nesta tarefa.
- [ ] Mensagens de erro (conflitos de disponibilidade, validação de formulário) são claras e em português, sem exibir mensagens de erro cruas do Supabase.
- [ ] Tempo de carregamento da agenda ao trocar de semana/mês é aceitável (sem múltiplas chamadas redundantes ao banco).

## Critérios de aceite

- Todos os itens dos dois checklists marcados como concluídos.
- Nenhum console.error não tratado durante o fluxo completo: cadastro → criação de reserva → cancelamento → remarcação → consulta de histórico.
