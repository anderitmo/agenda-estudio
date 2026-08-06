# Tarefa 04 — Cadastro de Clientes

## Objetivo

Tela de autoatendimento onde o cliente se cadastra antes da primeira reserva, simples e usável em celular.

## Depende de

Tarefa 03 (`db.js`).

## Arquivos

- `paginas/clientes.html`
- `js/paginas/clientes.js`

## Especificação da tela

Formulário único (Pico.css `<form>`), com três campos:

- Nome (texto, obrigatório)
- WhatsApp (texto com máscara simples de telefone, obrigatório)
- Nome da banda (texto, obrigatório)

Um checkbox de consentimento de uso dos dados, marcado por padrão, com texto curto explicando a finalidade (agendamento e histórico de ensaios).

Botão único "Cadastrar".

## Lógica (`clientes.js`, usando Alpine.js para o estado do formulário)

1. Ao submeter, chama `buscarClientePorWhatsapp`. Se já existir, informa "Você já está cadastrado" e segue para a etapa de banda sem recriar o cliente.
2. Se não existir, chama `criarCliente`.
3. Em seguida, chama `buscarBandaPorNome`.
   - Se a banda não existir, chama `criarBanda` com `responsavelId` igual ao cliente recém-criado.
   - Se existir, chama `adicionarIntegrante` vinculando o cliente à banda (sem alterar o responsável existente).
4. Exibe mensagem de sucesso com o nome da banda e, se aplicável, quem é o responsável atual.

## Critérios de aceite

- Cadastrar o mesmo WhatsApp duas vezes não cria dois registros em `clientes`.
- Cadastrar um nome de banda já existente vincula o novo cliente como integrante, sem sobrescrever o responsável.
- Cadastrar um nome de banda novo cria a banda com o cliente atual como responsável.
- Formulário funciona e é legível em viewport de 375px de largura (teste mobile).
