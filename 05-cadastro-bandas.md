# Tarefa 05 — Cadastro de Bandas

## Objetivo

Tela administrativa para gerenciar bandas: listar, ver integrantes, adicionar/remover integrantes, transferir responsável.

## Depende de

Tarefa 03, Tarefa 04.

## Arquivos

- `paginas/bandas.html`
- `js/paginas/bandas.js`

## Especificação da tela

- Lista de bandas (nome + responsável atual), com campo de busca por nome.
- Ao selecionar uma banda, exibir:
  - Lista de integrantes ativos (`listarIntegrantes`), com indicação visual de quem é o responsável.
  - Botão "Adicionar integrante" (busca cliente existente por WhatsApp ou nome; se não existir, direciona para a Tarefa 04).
  - Botão "Remover" ao lado de cada integrante (chama `removerIntegrante`; desabilitado para o responsável atual, que precisa ser transferido antes de ser removido).
  - Ação "Tornar responsável" ao lado de cada integrante que não seja o atual (chama `transferirResponsavel`).

## Regras de UI

- Não permitir remoção do responsável sem antes transferir a responsabilidade (regra de negócio da Tarefa 05 do plano funcional).
- Após qualquer ação, recarregar a lista de integrantes a partir do banco (não apenas atualizar o estado local), para refletir o dado real.

## Critérios de aceite

- Transferir responsabilidade funciona e reflete imediatamente na lista de bandas.
- Tentar remover o responsável atual sem transferência prévia é bloqueado na interface (botão desabilitado ou mensagem de erro).
- Adicionar um integrante já existente à mesma banda não duplica o vínculo (respeita a constraint `unique (banda_id, cliente_id)` do banco).
