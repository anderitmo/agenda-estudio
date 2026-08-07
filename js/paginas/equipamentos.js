import { sessaoAtual, logout } from "../auth.js";
import { listarEquipamentos, criarEquipamento } from "../db.js";

const controller = function() {
  return {
    role: "",
    equipamentos: [],
    form: {
      nome: "",
      quantidadeTotal: 1
    },
    mensagemErro: "",
    mensagemSucesso: "",

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

      await this.carregarEquipamentos();
    },

    async carregarEquipamentos() {
      const res = await listarEquipamentos();
      if (res.erro) {
        this.mensagemErro = "Erro ao buscar equipamentos: " + res.erro;
        return;
      }
      this.equipamentos = res.dados;
    },

    async salvarEquipamento() {
      this.mensagemErro = "";
      this.mensagemSucesso = "";

      if (this.form.quantidadeTotal <= 0) {
        this.mensagemErro = "A quantidade total deve ser maior que zero.";
        return;
      }

      const res = await criarEquipamento({
        nome: this.form.nome,
        quantidadeTotal: this.form.quantidadeTotal
      });

      if (res.erro) {
        this.mensagemErro = "Erro ao criar equipamento: " + res.erro;
        return;
      }

      this.mensagemSucesso = `Equipamento "${this.form.nome}" cadastrado com sucesso!`;
      this.form = { nome: "", quantidadeTotal: 1 };
      await this.carregarEquipamentos();
    },

    async sair() {
      await logout();
      window.location.replace("login.html");
    }
  };
};

window.equipamentosComponent = controller;

if (typeof Alpine !== 'undefined') {
  Alpine.data('equipamentosComponent', controller);
} else {
  document.addEventListener('alpine:init', () => {
    Alpine.data('equipamentosComponent', controller);
  });
}
