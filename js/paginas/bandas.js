import { sessaoAtual, logout } from "../auth.js";
import { supabase, listarIntegrantes, adicionarIntegrante, removerIntegrante, transferirResponsavel, buscarClientePorWhatsapp } from "../db.js";

const controller = function() {
  return {
    role: "",
    bandas: [],
    bandasFiltradas: [],
    buscaBanda: "",
    selecionada: null,
    integrantes: [],
    responsavelNome: "",
    novoIntegranteWA: "",
    mensagemErro: "",
    mensagemSucesso: "",

    async init() {
      const session = await sessaoAtual();
      if (!session) {
        window.location.replace("login.html");
        return;
      }
      this.role = session.papel;
      await this.carregarBandas();
    },

    async carregarBandas() {
      const { data, error } = await supabase.from("bandas").select("*").order("nome", { ascending: true });
      if (error) {
        this.mensagemErro = "Erro ao buscar bandas: " + error.message;
        return;
      }
      this.bandas = data;
      this.filtrarBandas();
    },

    filtrarBandas() {
      const b = this.buscaBanda.toLowerCase();
      this.bandasFiltradas = this.bandas.filter(banda => banda.nome.toLowerCase().includes(b));
    },

    async selecionarBanda(banda) {
      this.mensagemErro = "";
      this.mensagemSucesso = "";
      this.selecionada = banda;
      await this.carregarIntegrantes();
    },

    async carregarIntegrantes() {
      if (!this.selecionada) return;
      const res = await listarIntegrantes(this.selecionada.id);
      if (res.erro) {
        this.mensagemErro = "Erro ao carregar integrantes: " + res.erro;
        return;
      }
      this.integrantes = res.dados;

      const resp = this.integrantes.find(i => i.clientes.id === this.selecionada.responsavel_id);
      if (resp) {
        this.responsavelNome = resp.clientes.nome;
      } else {
        const { data } = await supabase.from("clientes").select("nome").eq("id", this.selecionada.responsavel_id).single();
        this.responsavelNome = data ? data.nome : "Não definido";
      }
    },

    async tornarResponsavel(clienteId) {
      this.mensagemErro = "";
      this.mensagemSucesso = "";
      const res = await transferirResponsavel({
        bandaId: this.selecionada.id,
        novoResponsavelId: clienteId
      });

      if (res.erro) {
        this.mensagemErro = "Erro ao transferir responsabilidade: " + res.erro;
        return;
      }

      this.mensagemSucesso = "Responsabilidade transferida com sucesso!";
      this.selecionada.responsavel_id = clienteId;
      await this.carregarBandas();
      await this.carregarIntegrantes();
    },

    async remover(clienteId) {
      this.mensagemErro = "";
      this.mensagemSucesso = "";

      const res = await removerIntegrante({
        bandaId: this.selecionada.id,
        clienteId: clienteId
      });

      if (res.erro) {
        this.mensagemErro = res.erro;
        return;
      }

      this.mensagemSucesso = "Integrante removido com sucesso!";
      await this.carregarIntegrantes();
    },

    async adicionarNovoIntegrante() {
      this.mensagemErro = "";
      this.mensagemSucesso = "";

      const cleanWA = this.novoIntegranteWA.replace(/\D/g, "");
      if (!cleanWA) {
        this.mensagemErro = "WhatsApp inválido.";
        return;
      }

      const cliRes = await buscarClientePorWhatsapp(cleanWA);
      if (cliRes.erro) {
        this.mensagemErro = "Erro ao buscar cliente: " + cliRes.erro;
        return;
      }

      const client = cliRes.dados;
      if (!client) {
        this.mensagemErro = "Cliente não cadastrado! Direcione o cliente para preencher a página de Autoatendimento primeiro.";
        return;
      }

      const res = await adicionarIntegrante({
        bandaId: this.selecionada.id,
        clienteId: client.id
      });

      if (res.erro) {
        this.mensagemErro = "Erro ao adicionar integrante: " + res.erro;
        return;
      }

      this.mensagemSucesso = `${client.nome} foi adicionado à banda com sucesso!`;
      this.novoIntegranteWA = "";
      await this.carregarIntegrantes();
    },

    async sair() {
      await logout();
      window.location.replace("login.html");
    }
  };
};

window.bandasComponent = controller;

if (typeof Alpine !== 'undefined') {
  Alpine.data('bandasComponent', controller);
} else {
  document.addEventListener('alpine:init', () => {
    Alpine.data('bandasComponent', controller);
  });
}
