import { login } from "../auth.js";

const controller = function() {
  return {
    form: {
      email: "",
      senha: ""
    },
    carregando: false,
    mensagemErro: "",

    async executarLogin() {
      this.mensagemErro = "";
      this.carregando = true;

      try {
        const res = await login({
          email: this.form.email,
          senha: this.form.senha
        });

        if (res.erro) {
          if (res.erro.includes("Invalid login credentials")) {
            const signupConfirm = confirm("Credenciais não encontradas. Deseja cadastrar esta conta de administrador agora mesmo para realizar os testes do estúdio?");
            if (signupConfirm) {
              const { supabase } = await import("../db.js");
              const { data: suData, error: suErr } = await supabase.auth.signUp({
                email: this.form.email,
                password: this.form.senha
              });

              if (suErr) {
                this.mensagemErro = "Falha ao registrar: " + suErr.message;
                return;
              }

              const retry = await login({
                email: this.form.email,
                senha: this.form.senha
              });

              if (retry.erro) {
                this.mensagemErro = "Registrado, mas falhou ao efetuar login: " + retry.erro;
              } else {
                window.location.replace("agenda.html");
              }
            } else {
              this.mensagemErro = "E-mail ou senha incorretos.";
            }
          } else {
            this.mensagemErro = res.erro;
          }
          return;
        }

        // Redirect on success
        window.location.replace("agenda.html");
      } catch (err) {
        this.mensagemErro = "Erro inesperado: " + err.message;
      } finally {
        this.carregando = false;
      }
    }
  };
};

window.loginComponent = controller;

if (typeof Alpine !== 'undefined') {
  Alpine.data('loginComponent', controller);
} else {
  document.addEventListener('alpine:init', () => {
    Alpine.data('loginComponent', controller);
  });
}
