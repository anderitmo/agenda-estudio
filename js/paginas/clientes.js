import { buscarClientePorWhatsapp, criarCliente, buscarBandaPorNome, criarBanda, adicionarIntegrante } from "../db.js";

const controller = function() {
  return {
    form: {
      nome: "",
      whatsapp: "",
      banda: "",
      consentimento: true
    },
    carregando: false,
    mensagemSucesso: "",
    mensagemErro: "",

    formatarTelefone(e) {
      let val = e.target.value.replace(/\D/g, "");
      if (val.length > 11) val = val.substring(0, 11);

      if (val.length > 6) {
        val = `(${val.substring(0, 2)}) ${val.substring(2, 7)}-${val.substring(7)}`;
      } else if (val.length > 2) {
        val = `(${val.substring(0, 2)}) ${val.substring(2)}`;
      } else if (val.length > 0) {
        val = `(${val}`;
      }
      this.form.whatsapp = val;
    },

    resetForm() {
      this.form.nome = "";
      this.form.whatsapp = "";
      this.form.banda = "";
      this.form.consentimento = true;
      this.mensagemSucesso = "";
      this.mensagemErro = "";
    },

    async submeter() {
      this.mensagemErro = "";
      this.mensagemSucesso = "";
      this.carregando = true;

      try {
        const rawWhatsApp = this.form.whatsapp.replace(/\D/g, "");
        if (rawWhatsApp.length < 10) {
          this.mensagemErro = "Por favor, digite um número de WhatsApp válido.";
          this.carregando = false;
          return;
        }

        const resCliente = await buscarClientePorWhatsapp(rawWhatsApp);
        let client = resCliente.dados;

        if (client) {
          this.mensagemErro = "Você já está cadastrado!";
        } else {
          const resCriar = await criarCliente({
            nome: this.form.nome,
            whatsapp: rawWhatsApp
          });
          if (resCriar.erro) {
            this.mensagemErro = "Erro ao criar cadastro: " + resCriar.erro;
            this.carregando = false;
            return;
          }
          client = resCriar.dados;
        }

        const resBanda = await buscarBandaPorNome(this.form.banda);
        let banda = resBanda.dados;

        if (!banda) {
          const resCriarBanda = await criarBanda({
            nome: this.form.banda,
            responsavelId: client.id
          });
          if (resCriarBanda.erro) {
            this.mensagemErro = "Erro ao cadastrar banda: " + resCriarBanda.erro;
            this.carregando = false;
            return;
          }
          banda = resCriarBanda.dados;

          await adicionarIntegrante({
            bandaId: banda.id,
            clienteId: client.id
          });

          this.mensagemSucesso = `Cadastro concluído com sucesso! A banda "${banda.nome}" foi cadastrada com você (${client.nome}) como responsável.`;
        } else {
          const resIntegrante = await adicionarIntegrante({
            bandaId: banda.id,
            clienteId: client.id
          });

          if (resIntegrante.erro) {
            this.mensagemErro = "Erro ao vincular integrante à banda: " + resIntegrante.erro;
            this.carregando = false;
            return;
          }

          const { dados: bDetails } = await buscarBandaPorNome(this.form.banda);
          let responsavelMsg = "";
          if (bDetails && bDetails.responsavel_id) {
            const { supabase } = await import("../db.js");
            const { data: owner } = await supabase.from("clientes").select("nome").eq("id", bDetails.responsavel_id).single();
            if (owner) {
              responsavelMsg = ` O responsável atual pela banda é ${owner.nome}.`;
            }
          }

          this.mensagemSucesso = `Você foi adicionado à banda "${banda.nome}" com sucesso!${responsavelMsg}`;
        }
      } catch (err) {
        this.mensagemErro = "Erro inesperado no fluxo de cadastro: " + err.message;
      } finally {
        this.carregando = false;
      }
    }
  };
};

window.cadastroClienteComponent = controller;

if (typeof Alpine !== 'undefined') {
  Alpine.data('cadastroClienteComponent', controller);
} else {
  document.addEventListener('alpine:init', () => {
    Alpine.data('cadastroClienteComponent', controller);
  });
}
