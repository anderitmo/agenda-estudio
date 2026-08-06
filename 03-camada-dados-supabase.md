# Tarefa 03 — Camada de Acesso a Dados (`js/db.js`)

## Objetivo

Criar um módulo único que centraliza toda comunicação com o Supabase, para que as páginas nunca chamem o cliente Supabase diretamente. Isso facilita manutenção e testes, e evita duplicação de tratamento de erro.

## Depende de

Tarefa 01 (config.js), Tarefa 02 (schema já existir no banco).

## Arquivo a criar: `js/db.js`

Estrutura geral:

```js
import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "./config.js";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Padrão de retorno de toda função deste módulo:
// { dados: T | null, erro: string | null }

// ---------- CLIENTES ----------
export async function buscarClientePorWhatsapp(whatsapp) { /* ... */ }
export async function criarCliente({ nome, whatsapp }) { /* ... */ }
export async function listarClientes({ busca } = {}) { /* ... */ }

// ---------- BANDAS ----------
export async function criarBanda({ nome, responsavelId }) { /* ... */ }
export async function buscarBandaPorNome(nome) { /* ... */ }
export async function adicionarIntegrante({ bandaId, clienteId }) { /* ... */ }
export async function removerIntegrante({ bandaId, clienteId }) { /* ... */ } // marca ativo = false, não deleta
export async function transferirResponsavel({ bandaId, novoResponsavelId }) { /* ... */ }
export async function listarIntegrantes(bandaId) { /* ... */ }

// ---------- SALAS ----------
export async function listarSalas({ apenasAtivas = true } = {}) { /* ... */ }
export async function criarSala(dadosSala) { /* ... */ }
export async function atualizarSala(id, dadosSala) { /* ... */ }
export async function criarBloqueio({ salaId, inicio, fim, motivo }) { /* ... */ }
export async function listarBloqueios({ salaId, inicio, fim }) { /* ... */ }
export async function removerBloqueio(id) { /* ... */ }

// ---------- EQUIPAMENTOS ----------
export async function listarEquipamentos() { /* ... */ }
export async function criarEquipamento({ nome, quantidadeTotal }) { /* ... */ }

// ---------- RESERVAS ----------
export async function criarReserva(dadosReserva) { /* ... */ }
export async function listarReservas({ salaId, inicio, fim, status } = {}) { /* ... */ }
export async function buscarReserva(id) { /* ... */ }
export async function cancelarReserva({ id, motivo }) { /* ... */ }
export async function remarcarReserva({ id, novoInicio, novoFim, novaSalaId }) { /* ... */ }
export async function concluirReservasVencidas() { /* ... */ } // marca como 'concluida' as que já passaram do horário fim
export async function adicionarAjuste({ reservaId, nota }) { /* ... */ }

// ---------- HISTÓRICO / PESQUISA ----------
export async function historicoCliente(clienteId) { /* ... */ }
export async function historicoBanda(bandaId) { /* ... */ }
export async function pesquisarReservas(filtros) { /* ... */ }
```

## Regras de implementação

- Toda função captura erro do Supabase (`const { data, error } = await supabase.from(...)`) e converte para o formato `{ dados, erro }`. Nenhuma função lança exceção não tratada.
- `criarCliente` deve primeiro chamar `buscarClientePorWhatsapp` para evitar duplicidade (regra de negócio: "evitar cadastros duplicados").
- `removerIntegrante` nunca executa `DELETE`, apenas `UPDATE ativo = false, saiu_em = now()`, preservando o histórico da banda.
- `cancelarReserva` faz `UPDATE status = 'cancelada', motivo_cancelamento = ...`, nunca `DELETE`.
- `adicionarAjuste` é a única forma de "editar" informação associada a uma reserva com `status = 'concluida'`; a função deve verificar o status atual e recusar `UPDATE` direto na tabela `reservas` nesse caso, retornando erro explicativo.
- Funções de listagem aceitam filtros opcionais e devem sempre ordenar por `inicio` (para reservas) ou `nome` (para cadastros), para previsibilidade na UI.

## Critérios de aceite

- Cada função pode ser testada isoladamente no console do navegador (via `import` no `index.html` em modo de teste) contra o banco já criado na Tarefa 02.
- Criar um cliente duplicado (mesmo WhatsApp) retorna o cliente existente em vez de criar um novo registro.
- Cancelar uma reserva não remove a linha da tabela `reservas`, apenas altera o status.
- Tentar `adicionarAjuste` funciona mesmo para reserva concluída; tentar alterar campos como `inicio`/`fim` de uma reserva concluída diretamente via `criarReserva`/função de update genérica não é exposta pelo módulo (não existe função `atualizarReserva` genérica — apenas `cancelarReserva`, `remarcarReserva` e `adicionarAjuste`, por design).
