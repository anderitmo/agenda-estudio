import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "./config.js";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ---------- CLIENTES ----------
export async function buscarClientePorWhatsapp(whatsapp) {
  try {
    const { data, error } = await supabase
      .from("clientes")
      .select("*")
      .eq("whatsapp", whatsapp.trim())
      .maybeSingle();

    if (error) return { dados: null, erro: error.message };
    return { dados: data, erro: null };
  } catch (err) {
    return { dados: null, erro: err.message };
  }
}

export async function criarCliente({ nome, whatsapp }) {
  try {
    const exist = await buscarClientePorWhatsapp(whatsapp);
    if (exist.dados) {
      return { dados: exist.dados, erro: null };
    }

    const { data, error } = await supabase
      .from("clientes")
      .insert({ nome: nome.trim(), whatsapp: whatsapp.trim() })
      .select("*")
      .single();

    if (error) return { dados: null, erro: error.message };
    return { dados: data, erro: null };
  } catch (err) {
    return { dados: null, erro: err.message };
  }
}

export async function listarClientes({ busca } = {}) {
  try {
    let query = supabase.from("clientes").select("*").order("nome", { ascending: true });
    if (busca) {
      query = query.or(`nome.ilike.%${busca}%,whatsapp.ilike.%${busca}%`);
    }
    const { data, error } = await query;
    if (error) return { dados: null, erro: error.message };
    return { dados: data, erro: null };
  } catch (err) {
    return { dados: null, erro: err.message };
  }
}

// ---------- BANDAS ----------
export async function criarBanda({ nome, responsavelId }) {
  try {
    const { data, error } = await supabase
      .from("bandas")
      .insert({ nome: nome.trim(), responsavel_id: responsavelId })
      .select("*")
      .single();

    if (error) return { dados: null, erro: error.message };
    return { dados: data, erro: null };
  } catch (err) {
    return { dados: null, erro: err.message };
  }
}

export async function buscarBandaPorNome(nome) {
  try {
    const { data, error } = await supabase
      .from("bandas")
      .select("*")
      .eq("nome", nome.trim())
      .maybeSingle();

    if (error) return { dados: null, erro: error.message };
    return { dados: data, erro: null };
  } catch (err) {
    return { dados: null, erro: err.message };
  }
}

export async function adicionarIntegrante({ bandaId, clienteId }) {
  try {
    const { data, error } = await supabase
      .from("banda_integrantes")
      .insert({ banda_id: bandaId, cliente_id: clienteId, ativo: true })
      .select("*")
      .maybeSingle();

    if (error && error.code === '23505') {
      const { data: react, error: reErr } = await supabase
        .from("banda_integrantes")
        .update({ ativo: true, saiu_em: null })
        .eq("banda_id", bandaId)
        .eq("cliente_id", clienteId)
        .select("*")
        .single();
      if (reErr) return { dados: null, erro: reErr.message };
      return { dados: react, erro: null };
    }

    if (error) return { dados: null, erro: error.message };
    return { dados: data, erro: null };
  } catch (err) {
    return { dados: null, erro: err.message };
  }
}

export async function removerIntegrante({ bandaId, clienteId }) {
  try {
    const { data: band, error: bandErr } = await supabase
      .from("bandas")
      .select("responsavel_id")
      .eq("id", bandaId)
      .single();

    if (bandErr) return { dados: null, erro: bandErr.message };
    if (band.responsavel_id === clienteId) {
      return { dados: null, erro: "Não é permitido remover o responsável atual da banda sem antes transferir a responsabilidade." };
    }

    const { data, error } = await supabase
      .from("banda_integrantes")
      .update({ ativo: false, saiu_em: new Date().toISOString() })
      .eq("banda_id", bandaId)
      .eq("cliente_id", clienteId)
      .select("*")
      .single();

    if (error) return { dados: null, erro: error.message };
    return { dados: data, erro: null };
  } catch (err) {
    return { dados: null, erro: err.message };
  }
}

export async function transferirResponsavel({ bandaId, novoResponsavelId }) {
  try {
    const { data, error } = await supabase
      .from("bandas")
      .update({ responsavel_id: novoResponsavelId })
      .eq("id", bandaId)
      .select("*")
      .single();

    if (error) return { dados: null, erro: error.message };
    return { dados: data, erro: null };
  } catch (err) {
    return { dados: null, erro: err.message };
  }
}

export async function listarIntegrantes(bandaId) {
  try {
    const { data, error } = await supabase
      .from("banda_integrantes")
      .select(`
        id,
        ativo,
        entrou_em,
        saiu_em,
        clientes (
          id,
          nome,
          whatsapp
        )
      `)
      .eq("banda_id", bandaId)
      .eq("ativo", true);

    if (error) return { dados: null, erro: error.message };
    return { dados: data, erro: null };
  } catch (err) {
    return { dados: null, erro: err.message };
  }
}

// ---------- SALAS ----------
export async function listarSalas({ apenasAtivas = true } = {}) {
  try {
    let query = supabase.from("salas").select("*").order("nome", { ascending: true });
    if (apenasAtivas) {
      query = query.eq("ativa", true);
    }
    const { data, error } = await query;
    if (error) return { dados: null, erro: error.message };
    return { dados: data, erro: null };
  } catch (err) {
    return { dados: null, erro: err.message };
  }
}

export async function criarSala(dadosSala) {
  try {
    const { data, error } = await supabase
      .from("salas")
      .insert(dadosSala)
      .select("*")
      .single();

    if (error) return { dados: null, erro: error.message };
    return { dados: data, erro: null };
  } catch (err) {
    return { dados: null, erro: err.message };
  }
}

export async function atualizarSala(id, dadosSala) {
  try {
    const { data, error } = await supabase
      .from("salas")
      .update(dadosSala)
      .eq("id", id)
      .select("*")
      .single();

    if (error) return { dados: null, erro: error.message };
    return { dados: data, erro: null };
  } catch (err) {
    return { dados: null, erro: err.message };
  }
}

export async function criarBloqueio({ salaId, inicio, fim, motivo }) {
  try {
    const { data, error } = await supabase
      .from("sala_bloqueios")
      .insert({ sala_id: salaId, inicio, fim, motivo })
      .select("*")
      .single();

    if (error) return { dados: null, erro: error.message };
    return { dados: data, erro: null };
  } catch (err) {
    return { dados: null, erro: err.message };
  }
}

export async function listarBloqueios({ salaId, inicio, fim } = {}) {
  try {
    let query = supabase.from("sala_bloqueios").select("*, salas(nome)");
    if (salaId) query = query.eq("sala_id", salaId);
    if (inicio) query = query.gte("inicio", inicio);
    if (fim) query = query.lte("fim", fim);

    const { data, error } = await query.order("inicio", { ascending: true });
    if (error) return { dados: null, erro: error.message };
    return { dados: data, erro: null };
  } catch (err) {
    return { dados: null, erro: err.message };
  }
}

export async function removerBloqueio(id) {
  try {
    const { data, error } = await supabase
      .from("sala_bloqueios")
      .delete()
      .eq("id", id)
      .select("*")
      .single();

    if (error) return { dados: null, erro: error.message };
    return { dados: data, erro: null };
  } catch (err) {
    return { dados: null, erro: err.message };
  }
}

// ---------- EQUIPAMENTOS ----------
export async function listarEquipamentos() {
  try {
    const { data, error } = await supabase
      .from("equipamentos")
      .select("*")
      .order("nome", { ascending: true });

    if (error) return { dados: null, erro: error.message };
    return { dados: data, erro: null };
  } catch (err) {
    return { dados: null, erro: err.message };
  }
}

export async function criarEquipamento({ nome, quantidadeTotal }) {
  try {
    if (quantidadeTotal <= 0) {
      return { dados: null, erro: "A quantidade total deve ser maior que zero." };
    }
    const { data, error } = await supabase
      .from("equipamentos")
      .insert({ nome: nome.trim(), quantidade_total: quantidadeTotal })
      .select("*")
      .single();

    if (error) return { dados: null, erro: error.message };
    return { dados: data, erro: null };
  } catch (err) {
    return { dados: null, erro: err.message };
  }
}

// ---------- RESERVAS ----------
export async function criarReserva(dadosReserva) {
  try {
    const { data, error } = await supabase
      .from("reservas")
      .insert(dadosReserva)
      .select("*")
      .single();

    if (error) return { dados: null, erro: error.message };
    return { dados: data, erro: null };
  } catch (err) {
    return { dados: null, erro: err.message };
  }
}

export async function listarReservas({ salaId, inicio, fim, status } = {}) {
  try {
    let query = supabase.from("reservas").select(`
      *,
      salas (id, nome, buffer_minutos),
      bandas (id, nome),
      clientes (id, nome, whatsapp)
    `);

    if (salaId) query = query.eq("sala_id", salaId);
    if (inicio) query = query.gte("fim", inicio);
    if (fim) query = query.lte("inicio", fim);
    if (status) query = query.eq("status", status);

    const { data, error } = await query.order("inicio", { ascending: true });
    if (error) return { dados: null, erro: error.message };
    return { dados: data, erro: null };
  } catch (err) {
    return { dados: null, erro: err.message };
  }
}

export async function buscarReserva(id) {
  try {
    const { data, error } = await supabase
      .from("reservas")
      .select(`
        *,
        salas (*),
        bandas (*),
        clientes (*),
        reserva_equipamentos (
          id,
          quantidade,
          equipamentos (*)
        )
      `)
      .eq("id", id)
      .single();

    if (error) return { dados: null, erro: error.message };
    return { dados: data, erro: null };
  } catch (err) {
    return { dados: null, erro: err.message };
  }
}

export async function cancelarReserva({ id, motivo }) {
  try {
    const cur = await buscarReserva(id);
    if (cur.dados && cur.dados.status === 'concluida') {
      return { dados: null, erro: "reserva já concluída, use 'adicionar nota' para registrar informações adicionais" };
    }

    const { data, error } = await supabase
      .from("reservas")
      .update({ status: 'cancelada', motivo_cancelamento: motivo, atualizado_em: new Date().toISOString() })
      .eq("id", id)
      .select("*")
      .single();

    if (error) return { dados: null, erro: error.message };
    return { dados: data, erro: null };
  } catch (err) {
    return { dados: null, erro: err.message };
  }
}

export async function remarcarReserva({ id, novoInicio, novoFim, novaSalaId }) {
  try {
    const cur = await buscarReserva(id);
    if (cur.dados && cur.dados.status === 'concluida') {
      return { dados: null, erro: "reserva já concluída, use 'adicionar nota' para registrar informações adicionais" };
    }

    const original = cur.dados;
    const { data: nova, error: novaErr } = await supabase
      .from("reservas")
      .insert({
        sala_id: novaSalaId,
        banda_id: original.banda_id,
        criado_por_cliente_id: original.criado_por_cliente_id,
        inicio: novoInicio,
        fim: novoFim,
        status: 'confirmada',
        observacoes: original.observacoes
      })
      .select("*")
      .single();

    if (novaErr) return { dados: null, erro: novaErr.message };

    if (original.reserva_equipamentos && original.reserva_equipamentos.length > 0) {
      const inserts = original.reserva_equipamentos.map(eq => ({
        reserva_id: nova.id,
        equipamento_id: eq.equipamentos.id,
        quantidade: eq.quantidade
      }));
      await supabase.from("reserva_equipamentos").insert(inserts);
    }

    const { data: origUpdated, error: origErr } = await supabase
      .from("reservas")
      .update({
        status: 'remarcada',
        reserva_original_id: nova.id,
        atualizado_em: new Date().toISOString()
      })
      .eq("id", id)
      .select("*")
      .single();

    if (origErr) return { dados: null, erro: origErr.message };
    return { dados: nova, erro: null };
  } catch (err) {
    return { dados: null, erro: err.message };
  }
}

export async function concluirReservasVencidas() {
  try {
    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from("reservas")
      .select("id")
      .eq("status", "confirmada")
      .lt("fim", now);

    if (error) return { dados: null, erro: error.message };

    if (data && data.length > 0) {
      const ids = data.map(r => r.id);
      const { error: updErr } = await supabase
        .from("reservas")
        .update({ status: 'concluida', atualizado_em: now })
        .in("id", ids);

      if (updErr) return { dados: null, erro: updErr.message };
    }

    return { dados: data, erro: null };
  } catch (err) {
    return { dados: null, erro: err.message };
  }
}

export async function adicionarAjuste({ reservaId, nota }) {
  try {
    const { data, error } = await supabase
      .from("reserva_ajustes")
      .insert({ reserva_id: reservaId, nota })
      .select("*")
      .single();

    if (error) return { dados: null, erro: error.message };
    return { dados: data, erro: null };
  } catch (err) {
    return { dados: null, erro: err.message };
  }
}

// ---------- HISTÓRICO / PESQUISA ----------
export async function historicoCliente(clienteId) {
  try {
    const { data, error } = await supabase
      .from("reservas")
      .select(`
        *,
        salas (id, nome),
        bandas (id, nome),
        reserva_equipamentos (
          quantidade,
          equipamentos (nome)
        )
      `)
      .eq("criado_por_cliente_id", clienteId)
      .order("inicio", { ascending: false });

    if (error) return { dados: null, erro: error.message };
    return { dados: data, erro: null };
  } catch (err) {
    return { dados: null, erro: err.message };
  }
}

export async function historicoBanda(bandaId) {
  try {
    const { data, error } = await supabase
      .from("reservas")
      .select(`
        *,
        salas (id, nome),
        clientes (id, nome, whatsapp),
        reserva_equipamentos (
          quantidade,
          equipamentos (nome)
        )
      `)
      .eq("banda_id", bandaId)
      .order("inicio", { ascending: false });

    if (error) return { dados: null, erro: error.message };
    return { dados: data, erro: null };
  } catch (err) {
    return { dados: null, erro: err.message };
  }
}

export async function pesquisarReservas(filtros = {}) {
  try {
    let query = supabase.from("reservas").select(`
      *,
      salas (id, nome),
      bandas (id, nome),
      clientes (id, nome, whatsapp)
    `);

    if (filtros.salaId) {
      query = query.eq("sala_id", filtros.salaId);
    }
    if (filtros.status) {
      query = query.eq("status", filtros.status);
    }
    if (filtros.dataInicio) {
      query = query.gte("inicio", filtros.dataInicio);
    }
    if (filtros.dataFim) {
      query = query.lte("fim", filtros.dataFim);
    }

    let { data, error } = await query.order("inicio", { ascending: false });
    if (error) return { dados: null, erro: error.message };

    if (filtros.clienteNome) {
      const nom = filtros.clienteNome.toLowerCase();
      data = data.filter(r => r.clientes && r.clientes.nome.toLowerCase().includes(nom));
    }
    if (filtros.whatsapp) {
      data = data.filter(r => r.clientes && r.clientes.whatsapp.includes(filtros.whatsapp.trim()));
    }
    if (filtros.bandaNome) {
      const bnom = filtros.bandaNome.toLowerCase();
      data = data.filter(r => r.bandas && r.bandas.nome.toLowerCase().includes(bnom));
    }

    return { dados: data, erro: null };
  } catch (err) {
    return { dados: null, erro: err.message };
  }
}
