import { sessaoAtual, logout } from "../auth.js";
import { supabase, listarSalas, criarSala, atualizarSala, listarBloqueios, criarBloqueio, removerBloqueio } from "../db.js";

const controller = function() {
  return {
    role: "",
    salas: [],
    selecionada: null,
    bloqueios: [],
    mensagemErro: "",
    mensagemSucesso: "",

    formSala: {
      nome: "",
      descricao: "",
      capacidade: 4,
      buffer_minutos: 15,
      duracao_minima_minutos: 60,
      duracao_maxima_minutos: 240,
      observacoes: "",
      ativa: true
    },

    formBloq: {
      inicio: "",
      fim: "",
      motivo: ""
    },

    async init() {
      const session = await sessaoAtual();
      if (!session) {
        window.location.replace("login.html");
        return;
      }
      this.role = session.papel;

      if (this.role !== "administrador") {
        window.location.replace("agenda.html");
        return;
      }

      await this.carregarSalas();
    },

    async carregarSalas() {
      const res = await listarSalas({ apenasAtivas: false });
      if (res.erro) {
        this.mensagemErro = "Erro ao buscar salas: " + res.erro;
        return;
      }
      this.salas = res.dados;
    },

    selecionarSala(sala) {
      this.mensagemErro = "";
      this.mensagemSucesso = "";
      this.selecionada = sala;

      this.formSala = {
        nome: sala.nome,
        descricao: sala.descricao || "",
        capacidade: sala.capacidade,
        buffer_minutos: sala.buffer_minutos,
        duracao_minima_minutos: sala.duracao_minima_minutos,
        duracao_maxima_minutos: sala.duracao_maxima_minutos,
        observacoes: sala.observacoes || "",
        ativa: sala.ativa
      };

      this.carregarBloqueios();
    },

    resetFormSala() {
      this.selecionada = null;
      this.formSala = {
        nome: "",
        descricao: "",
        capacidade: 4,
        buffer_minutos: 15,
        duracao_minima_minutos: 60,
        duracao_maxima_minutos: 240,
        observacoes: "",
        ativa: true
      };
      this.bloqueios = [];
    },

    async salvarSala() {
      this.mensagemErro = "";
      this.mensagemSucesso = "";

      if (this.selecionada) {
        const res = await atualizarSala(this.selecionada.id, this.formSala);
        if (res.erro) {
          this.mensagemErro = "Erro ao salvar sala: " + res.erro;
          return;
        }
        this.mensagemSucesso = "Sala atualizada com sucesso!";
      } else {
        const res = await criarSala(this.formSala);
        if (res.erro) {
          this.mensagemErro = "Erro ao cadastrar sala: " + res.erro;
          return;
        }
        this.mensagemSucesso = "Sala cadastrada com sucesso!";
      }

      this.resetFormSala();
      await this.carregarSalas();
    },

    async carregarBloqueios() {
      if (!this.selecionada) return;
      const now = new Date().toISOString();
      const res = await listarBloqueios({
        salaId: this.selecionada.id,
        inicio: now
      });

      if (res.erro) {
        this.mensagemErro = "Erro ao carregar bloqueios: " + res.erro;
        return;
      }
      this.bloqueios = res.dados;
    },

    async salvarBloqueio() {
      this.mensagemErro = "";
      this.mensagemSucesso = "";

      const start = new Date(this.formBloq.inicio).toISOString();
      const end = new Date(this.formBloq.fim).toISOString();

      if (new Date(start) >= new Date(end)) {
        this.mensagemErro = "A data final do bloqueio deve ser posterior à data inicial.";
        return;
      }

      const { data: bookings, error: bErr } = await supabase
        .from("reservas")
        .select("id, inicio, fim, status, bandas(nome)")
        .eq("sala_id", this.selecionada.id)
        .eq("status", "confirmada");

      if (bErr) {
        this.mensagemErro = "Erro ao checar conflitos com bookings: " + bErr.message;
        return;
      }

      const confList = bookings.filter(b => {
        const s1 = new Date(start);
        const e1 = new Date(end);
        const s2 = new Date(b.inicio);
        const e2 = new Date(b.fim);
        return s1 < e2 && s2 < e1;
      });

      if (confList.length > 0) {
        const confirmResult = confirm(`AVISO: Há ${confList.length} reserva(s) confirmada(s) que conflitam com este período de bloqueio administrativo. Deseja prosseguir com a criação do bloqueio mesmo assim? (Você precisará entrar em contato com os clientes para resolver as colisões manualmente).`);
        if (!confirmResult) return;
      }

      const res = await criarBloqueio({
        salaId: this.selecionada.id,
        inicio: start,
        fim: end,
        motivo: this.formBloq.motivo
      });

      if (res.erro) {
        this.mensagemErro = "Erro ao criar bloqueio: " + res.erro;
        return;
      }

      this.mensagemSucesso = "Bloqueio administrativo criado com sucesso!";
      this.formBloq = { inicio: "", fim: "", motivo: "" };
      await this.carregarBloqueios();
    },

    async removerBloq(id) {
      this.mensagemErro = "";
      this.mensagemSucesso = "";

      const res = await removerBloqueio(id);
      if (res.erro) {
        this.mensagemErro = "Erro ao remover bloqueio: " + res.erro;
        return;
      }

      this.mensagemSucesso = "Bloqueio administrativo removido com sucesso!";
      await this.carregarBloqueios();
    },

    formatarData(isoStr) {
      if (!isoStr) return "";
      const date = new Date(isoStr);
      return date.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }).substring(0, 16);
    },

    async sair() {
      await logout();
      window.location.replace("login.html");
    }
  };
};

window.salasComponent = controller;

if (typeof Alpine !== 'undefined') {
  Alpine.data('salasComponent', controller);
} else {
  document.addEventListener('alpine:init', () => {
    Alpine.data('salasComponent', controller);
  });
}
