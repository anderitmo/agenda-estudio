# Tarefa 08 — Motor Central de Disponibilidade (`js/disponibilidade.js`)

## Objetivo

Esta é a tarefa mais importante do projeto do ponto de vista de regra de negócio. Toda verificação de conflito de horário, buffer, bloqueio administrativo, disponibilidade de equipamento e horário de funcionamento deve passar por este único módulo, nunca ser reimplementada em outras telas.

## Depende de

Tarefa 02 (schema), Tarefa 06 (salas com buffer/duração configurados), Tarefa 07 (equipamentos).

## Arquivo a criar: `js/disponibilidade.js`

```js
import { supabase } from "./db.js";
import dayjs from "https://cdn.jsdelivr.net/npm/dayjs@1/+esm";

const HORARIO_ABERTURA = "09:00";
const HORARIO_FECHAMENTO = "23:00";

/**
 * Verifica se um período é válido para uma sala, considerando:
 * - horário de funcionamento do estúdio
 * - duração mínima e máxima da sala
 * - horário inicial < horário final
 */
export function validarPeriodoBasico({ inicio, fim, sala }) { /* ... */ }

/**
 * Verifica conflito de horário de sala, incluindo o buffer
 * configurado na sala. Considera apenas reservas com status
 * 'confirmada' (canceladas e remarcadas não bloqueiam).
 * Ignora a própria reserva quando `ignorarReservaId` é passado
 * (uso: remarcação).
 */
export async function verificarConflitoSala({ salaId, inicio, fim, ignorarReservaId }) { /* ... */ }

/**
 * Verifica se o período está coberto por algum bloqueio
 * administrativo da sala.
 */
export async function verificarBloqueioAdministrativo({ salaId, inicio, fim }) { /* ... */ }

/**
 * Para uma lista de equipamentos solicitados (id + quantidade),
 * verifica se a soma das reservas que se sobrepõem ao período
 * (status = 'confirmada') mais a quantidade solicitada não excede
 * a quantidade_total cadastrada.
 * Retorna a lista de equipamentos que ESTÃO disponíveis no período,
 * útil para filtrar a seleção na Tarefa 10.
 */
export async function listarEquipamentosDisponiveis({ inicio, fim }) { /* ... */ }

/**
 * Função de mais alto nível: roda todas as verificações acima
 * e retorna { disponivel: boolean, motivos: string[] }.
 * Usada tanto na criação quanto na remarcação de reserva.
 */
export async function verificarDisponibilidadeCompleta({
  salaId, inicio, fim, equipamentosSolicitados, ignorarReservaId
}) { /* ... */ }
```

## Algoritmo de sobreposição de horário

Dois intervalos `[inicio1, fim1)` e `[inicio2, fim2)` se sobrepõem quando `inicio1 < fim2 AND inicio2 < fim1`. Para aplicar o buffer da sala, expandir o intervalo existente em `buffer_minutos` para os dois lados antes de comparar:

```js
const inicioComBuffer = dayjs(reservaExistente.inicio).subtract(sala.buffer_minutos, "minute");
const fimComBuffer = dayjs(reservaExistente.fim).add(sala.buffer_minutos, "minute");
// conflito se: inicioNovo < fimComBuffer && inicioComBuffer < fimNovo
```

O mesmo princípio de sobreposição de intervalo é usado para equipamentos, mas sem buffer (o buffer é um conceito de sala, não de equipamento).

## Critérios de aceite

- Duas reservas na mesma sala, back-to-back sem respeitar o buffer configurado, são recusadas.
- Duas reservas na mesma sala, com intervalo igual ou maior que o buffer entre elas, são aceitas.
- Uma reserva sobre um bloqueio administrativo é recusada, com motivo explícito retornado em `motivos`.
- Reservar a última unidade de um equipamento em duas salas com horários que se sobrepõem é recusado na segunda tentativa; se os horários não se sobrepõem, ambas são aceitas.
- Todas as funções deste módulo são puras em relação à UI: não manipulam DOM, apenas retornam dados, para poderem ser reaproveitadas pelas Tarefas 09, 10 e 11 sem duplicação de lógica.
