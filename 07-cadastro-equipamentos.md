# Tarefa 07 — Cadastro de Equipamentos Extras

## Objetivo

Cadastro simples dos equipamentos disponíveis para locação junto com a reserva.

## Depende de

Tarefa 03.

## Arquivos

- `paginas/equipamentos.html`
- `js/paginas/equipamentos.js`

## Especificação da tela

Lista de equipamentos (nome + quantidade total), com formulário de criação/edição:

- Nome (texto, obrigatório)
- Quantidade total (número inteiro positivo, obrigatório)

Não há campo de valor de locação nesta versão.

## Critérios de aceite

- Criar um equipamento com quantidade zero ou negativa é rejeitado pela constraint do banco (`check (quantidade_total > 0)`) e a interface exibe a mensagem de erro correspondente.
- Lista de equipamentos é consumida pela Tarefa 10 (seleção de equipamentos na criação de reserva) e pela Tarefa 08 (cálculo de disponibilidade).
