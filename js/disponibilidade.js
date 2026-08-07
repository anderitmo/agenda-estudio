import { supabase } from "./db.js";
import dayjs from "https://cdn.jsdelivr.net/npm/dayjs@1/+esm";

const HORARIO_ABERTURA = "09:00";
const HORARIO_FECHAMENTO = "23:00";

export function validarPeriodoBasico({ inicio, fim, sala }) {
  const tInicio = dayjs(inicio);
  const tFim = dayjs(fim);

  if (!tInicio.isValid() || !tFim.isValid()) {
    return { valido: false, motivo: "Formato de data inválido." };
  }

  if (tInicio.isAfter(tFim) || tInicio.isSame(tFim)) {
    return { valido: false, motivo: "O horário de início deve ser anterior ao horário final." };
  }

  const startHour = tInicio.hour() + tInicio.minute() / 60;
  const endHour = tFim.hour() + tFim.minute() / 60;

  if (startHour < 9 || startHour > 23 || endHour < 9 || endHour > 23) {
    return { valido: false, motivo: "O estúdio funciona exclusivamente entre as 09:00 e as 23:00." };
  }

  const durationMinutes = tFim.diff(tInicio, "minute");
  if (durationMinutes < sala.duracao_minima_minutos) {
    return { valido: false, motivo: `A duração mínima de ensaio nesta sala é de ${sala.duracao_minima_minutos} minutos.` };
  }
  if (durationMinutes > sala.duracao_maxima_minutos) {
    return { valido: false, motivo: `A duração máxima de ensaio nesta sala é de ${sala.duracao_maxima_minutos} minutos.` };
  }

  return { valido: true, motivo: null };
}

export async function verificarConflitoSala({ salaId, inicio, fim, ignorarReservaId }) {
  try {
    const { data: sala, error: sErr } = await supabase
      .from("salas")
      .select("buffer_minutos")
      .eq("id", salaId)
      .single();

    if (sErr) return { conflito: true, erro: sErr.message };

    const tInicio = dayjs(inicio);
    const dayStart = tInicio.startOf("day").toISOString();
    const dayEnd = tInicio.endOf("day").toISOString();

    const { data: bookings, error: bErr } = await supabase
      .from("reservas")
      .select("id, inicio, fim, status")
      .eq("sala_id", salaId)
      .eq("status", "confirmada")
      .gte("fim", dayStart)
      .lte("inicio", dayEnd);

    if (bErr) return { conflito: true, erro: bErr.message };

    const novoInicio = dayjs(inicio);
    const novoFim = dayjs(fim);

    const conflito = bookings.some(reserva => {
      if (ignorarReservaId && reserva.id === ignorarReservaId) return false;

      const inicioComBuffer = dayjs(reserva.inicio).subtract(sala.buffer_minutos, "minute");
      const fimComBuffer = dayjs(reserva.fim).add(sala.buffer_minutos, "minute");

      return novoInicio.isBefore(fimComBuffer) && inicioComBuffer.isBefore(novoFim);
    });

    return { conflito, erro: null };
  } catch (err) {
    return { conflito: true, erro: err.message };
  }
}

export async function verificarBloqueioAdministrativo({ salaId, inicio, fim }) {
  try {
    const { data: blocks, error } = await supabase
      .from("sala_bloqueios")
      .select("*")
      .eq("sala_id", salaId);

    if (error) return { bloqueado: true, erro: error.message };

    const tInicio = dayjs(inicio);
    const tFim = dayjs(fim);

    const bloqueado = blocks.some(b => {
      const s = dayjs(b.inicio);
      const e = dayjs(b.fim);
      return tInicio.isBefore(e) && s.isBefore(tFim);
    });

    return { bloqueado, erro: null };
  } catch (err) {
    return { bloqueado: true, erro: err.message };
  }
}

export async function listarEquipamentosDisponiveis({ inicio, fim }) {
  try {
    const { data: stock, error: sErr } = await supabase
      .from("equipamentos")
      .select("*")
      .order("nome", { ascending: true });

    if (sErr) return { dados: null, erro: sErr.message };

    const tInicio = dayjs(inicio);
    const dayStart = tInicio.startOf("day").toISOString();
    const dayEnd = tInicio.endOf("day").toISOString();

    const { data: activeBookings, error: bErr } = await supabase
      .from("reservas")
      .select(`
        id,
        inicio,
        fim,
        status,
        reserva_equipamentos (
          equipamento_id,
          quantidade
        )
      `)
      .eq("status", "confirmada")
      .gte("fim", dayStart)
      .lte("inicio", dayEnd);

    if (bErr) return { dados: null, erro: bErr.message };

    const novoInicio = dayjs(inicio);
    const novoFim = dayjs(fim);

    const overlappingBookings = activeBookings.filter(b => {
      const s = dayjs(b.inicio);
      const e = dayjs(b.fim);
      return novoInicio.isBefore(e) && s.isBefore(novoFim);
    });

    const bookedTotals = {};
    for (const ob of overlappingBookings) {
      if (ob.reserva_equipamentos && ob.reserva_equipamentos.length > 0) {
        for (const req of ob.reserva_equipamentos) {
          const eqId = req.equipamento_id;
          bookedTotals[eqId] = (bookedTotals[eqId] || 0) + req.quantidade;
        }
      }
    }

    const result = stock.map(eq => {
      const booked = bookedTotals[eq.id] || 0;
      const free = eq.quantidade_total - booked;
      return {
        ...eq,
        quantidade_disponivel: free < 0 ? 0 : free
      };
    });

    return { dados: result, erro: null };
  } catch (err) {
    return { dados: null, erro: err.message };
  }
}

export async function verificarDisponibilidadeCompleta({
  salaId, inicio, fim, equipamentosSolicitados = [], ignorarReservaId
}) {
  const motivos = [];
  try {
    const { data: sala, error: sErr } = await supabase
      .from("salas")
      .select("*")
      .eq("id", salaId)
      .single();

    if (sErr) return { disponivel: false, motivos: ["Erro ao carregar configurações da sala: " + sErr.message] };

    const basico = validarPeriodoBasico({ inicio, fim, sala });
    if (!basico.valido) {
      motivos.push(basico.motivo);
    }

    const blRes = await verificarBloqueioAdministrativo({ salaId, inicio, fim });
    if (blRes.bloqueado) {
      motivos.push("O horário desejado está bloqueado administrativamente para manutenção.");
    }

    const confRes = await verificarConflitoSala({ salaId, inicio, fim, ignorarReservaId });
    if (confRes.conflito) {
      motivos.push(`Conflito de horários! Já existe uma reserva confirmada para este horário ou dentro do intervalo de buffer de segurança de ${sala.buffer_minutos} minutos.`);
    }

    if (equipamentosSolicitados && equipamentosSolicitados.length > 0) {
      const eqRes = await listarEquipamentosDisponiveis({ inicio, fim });
      if (eqRes.erro) {
        motivos.push("Erro ao verificar estoque de equipamentos extras: " + eqRes.erro);
      } else {
        const availableStock = eqRes.dados;
        for (const req of equipamentosSolicitados) {
          const item = availableStock.find(x => x.id === req.equipamento_id);
          if (!item) {
            motivos.push("Equipamento solicitado não encontrado no inventário.");
          } else if (req.quantidade > item.quantidade_disponivel) {
            motivos.push(`A quantidade solicitada de "${item.nome}" (${req.quantidade}) excede o estoque disponível para este horário (${item.quantidade_disponivel} unidade(s) livre(s)).`);
          }
        }
      }
    }

    return {
      disponivel: motivos.length === 0,
      motivos
    };
  } catch (err) {
    return { disponivel: false, motivos: ["Erro inesperado na verificação: " + err.message] };
  }
}
