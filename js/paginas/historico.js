import { sessaoAtual, logout } from "../auth.js";
import {
  supabase,
  listarSalas,
  listarClientes,
  historicoCliente,
  historicoBanda,
  adicionarAjuste,
  pesquisarReservas
} from "../db.js";

const controller = function() {
  return {
    role: "",
    aba: "historico",
    mensagemErro: "",
    mensagemSucesso: "",

    buscaCliente: "",
    buscaBanda: "",
    clientesEncontrados: [],
    bandasEncontradas: [],

    historicoTitulo: "",
    historicoReservas: [],
    frequencia90Dias: null,

    ajusteModalAberto: false,
    ajusteForm: {
      reservaId: "",
      nota: ""
    },

    salas: [],
    filtros: {
      clienteNome: "",
      whatsapp: "",
      bandaNome: "",
      dataInicio: "",
      dataFim: "",
      salaId: "",
      status: ""
    },
    resultadosPesquisa: [],

    async init() {
      const session = await sessaoAtual();
      if (!session) {
        window.location.replace("login.html");
        return;
      }
      this.role = session.papel;

      const sRes = await listarSalas({ apenasAtivas: true });
      if (!sRes.erro) {
        this.salas = sRes.dados;
      }

      await this.executarBuscaAvancada();
    },

    async buscarClientesNoHist() {
      if (this.buscaCliente.trim().length < 2) {
        this.clientesEncontrados = [];
        return;
      }
      const res = await listarClientes({ busca: this.buscaCliente });
      if (!res.erro) {
        this.clientesEncontrados = res.dados;
      }
    },

    async buscarBandasNoHist() {
      if (this.buscaBanda.trim().length < 2) {
        this.bandasEncontradas = [];
        return;
      }
      const { data } = await supabase
        .from("bandas")
        .select("*")
        .ilike("nome", `%${this.buscaBanda}%`)
        .order("nome", { ascending: true });

      if (data) {
        this.bandasEncontradas = data;
      }
    },

    async carregarHistoricoCli(cli) {
      this.mensagemErro = "";
      this.mensagemSucesso = "";
      this.historicoTitulo = `Reservas do Cliente: ${cli.nome}`;
      this.frequencia90Dias = null;

      const res = await historicoCliente(cli.id);
      if (res.erro) {
        this.mensagemErro = "Erro ao carregar histórico: " + res.erro;
        return;
      }

      this.historicoReservas = await this.anexarNotasAjuste(res.dados);
    },

    async carregarHistoricoBand(band) {
      this.mensagemErro = "";
      this.mensagemSucesso = "";
      this.historicoTitulo = `Reservas da Banda: ${band.nome}`;
      this.frequencia90Dias = 0;

      const res = await historicoBanda(band.id);
      if (res.erro) {
        this.mensagemErro = "Erro ao carregar histórico: " + res.erro;
        return;
      }

      const list = res.dados;
      const limit = new Date();
      limit.setDate(limit.getDate() - 90);

      const concluded90 = list.filter(r => r.status === 'concluida' && new Date(r.inicio) >= limit);
      this.frequencia90Dias = concluded90.length;

      this.historicoReservas = await this.anexarNotasAjuste(list);
    },

    async anexarNotasAjuste(reservasArray) {
      if (!reservasArray || reservasArray.length === 0) return [];
      const ids = reservasArray.map(r => r.id);
      const { data: notes } = await supabase
        .from("reserva_ajustes")
        .select("*")
        .in("reserva_id", ids)
        .order("criado_em", { ascending: true });

      return reservasArray.map(r => {
        return {
          ...r,
          ajustes: (notes || []).filter(n => n.reserva_id === r.id)
        };
      });
    },

    prepararNotaAjuste(reserva) {
      this.ajusteForm = {
        reservaId: reserva.id,
        nota: ""
      };
      this.ajusteModalAberto = true;
    },

    fecharAjusteModal() {
      this.ajusteModalAberto = false;
    },

    async salvarNotaAjuste() {
      this.mensagemErro = "";
      this.mensagemSucesso = "";

      const res = await adicionarAjuste({
        reservaId: this.ajusteForm.reservaId,
        nota: this.ajusteForm.nota
      });

      if (res.erro) {
        this.mensagemErro = "Erro ao adicionar ajuste: " + res.erro;
        return;
      }

      this.mensagemSucesso = "Nota de auditoria adicionada com sucesso!";
      this.fecharAjusteModal();

      this.historicoReservas = this.historicoReservas.map(r => {
        if (r.id === this.ajusteForm.reservaId) {
          const list = r.ajustes || [];
          return {
            ...r,
            ajustes: [...list, res.dados]
          };
        }
        return r;
      });
    },

    async executarBuscaAvancada() {
      this.mensagemErro = "";
      const res = await pesquisarReservas(this.filtros);
      if (res.erro) {
        this.mensagemErro = "Erro na pesquisa: " + res.erro;
        return;
      }
      this.resultadosPesquisa = res.dados;
    },

    getStatusColor(status) {
      switch (status) {
        case 'confirmada': return '#3b82f6';
        case 'cancelada': return '#ef4444';
        case 'remarcada': return '#f59e0b';
        case 'concluida': return '#10b981';
        case 'nao_compareceu': return '#6b7280';
        default: return '#6b7280';
      }
    },

    formatarData(isoStr) {
      if (!isoStr) return "";
      const date = new Date(isoStr);
      return date.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' });
    },

    formatarDataCompleta(isoStr) {
      if (!isoStr) return "";
      const date = new Date(isoStr);
      return date.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }).substring(0, 16);
    },

    formatarHora(isoStart, isoEnd) {
      if (!isoStart || !isoEnd) return "";
      const s = new Date(isoStart).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' });
      const e = new Date(isoEnd).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' });
      return `${s} - ${e}`;
    },

    async sair() {
      await logout();
      window.location.replace("login.html");
    }
  };
};

window.historicoComponent = controller;

if (typeof Alpine !== 'undefined') {
  Alpine.data('historicoComponent', controller);
} else {
  document.addEventListener('alpine:init', () => {
    Alpine.data('historicoComponent', controller);
  });
}
