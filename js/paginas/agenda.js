import { sessaoAtual, logout } from "../auth.js";
import {
  supabase,
  listarSalas,
  listarReservas,
  listarBloqueios,
  buscarClientePorWhatsapp,
  buscarReserva,
  cancelarReserva,
  remarcarReserva,
  concluirReservasVencidas,
  criarReserva,
  criarCliente,
  buscarBandaPorNome,
  criarBanda,
  adicionarIntegrante
} from "../db.js";
import {
  verificarDisponibilidadeCompleta,
  listarEquipamentosDisponiveis
} from "../disponibilidade.js";

const controller = function() {
  return {
    role: "",
    user: null,
    calendar: null,
    salas: [],
    equipamentosDisponiveis: [],

    // Modal state
    modalAberto: false,
    modalTitulo: "",
    modalErro: "",
    viewMode: "criar", // 'criar' | 'detalhes' | 'cancelar' | 'remarcar'

    // Form inputs
    reservaForm: {
      id: null,
      data: "",
      salaId: "",
      horaInicio: "",
      horaFim: "",
      bandaId: "",
      equipamentosSelecionadosIds: [],
      equipamentosQuantidades: {},
      observacoes: ""
    },

    clienteBuscaWA: "",
    clienteSelecionado: null,
    clienteBuscado: false,
    bandasDoCliente: [],

    // Cancellation Form
    cancelForm: {
      motivo: ""
    },

    // Nested quick registration form
    autoRegModalAberto: false,
    regForm: {
      nome: "",
      whatsapp: "",
      banda: ""
    },

    salvandoReserva: false,
    detalheReserva: {},
    mensagemErro: "",
    mensagemSucesso: "",

    async init() {
      // 1. Fetch current role if logged in (Agenda itself remains public)
      const session = await sessaoAtual();
      if (session) {
        this.user = session.usuario;
        this.role = session.papel;
      }

      // Concluir reservas vencidas automatically
      await concluirReservasVencidas();

      // 2. Fetch active rooms
      const sRes = await listarSalas({ apenasAtivas: true });
      if (sRes.erro) {
        this.mensagemErro = "Ops! Ocorreu um erro ao conectar com o banco de dados e carregar as salas: " + sRes.erro;
        console.error("Erro ao carregar salas:", sRes.erro);
        return;
      }
      this.salas = sRes.dados;

      if (!this.salas || this.salas.length === 0) {
        this.mensagemErro = "Atenção: Nenhuma sala ativa foi encontrada no sistema.";
        return;
      }

      // 3. Initialize FullCalendar
      this.renderCalendar();
    },

    renderCalendar() {
      const calendarEl = document.getElementById('calendar');
      if (!calendarEl) return;

      const resources = this.salas.map(s => ({
        id: s.id,
        title: s.nome
      }));

      this.calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'dayGridMonth', // Default standard view in Core MIT
        headerToolbar: {
          left: 'prev,next today',
          center: 'title',
          right: 'dayGridMonth,timeGridWeek,timeGridDay'
        },
        locale: 'pt-br',
        timeZone: 'local',
        selectable: true,
        editable: false,
        events: async (info, successCallback, failureCallback) => {
          try {
            // Load Confirmadas and Concluidas bookings
            const resRes = await listarReservas({
              inicio: info.start.toISOString(),
              fim: info.end.toISOString()
            });

            // Load administrative blocks
            const blRes = await listarBloqueios({
              inicio: info.start.toISOString(),
              fim: info.end.toISOString()
            });

            const calendarEvents = [];

            if (resRes.dados) {
              resRes.dados.forEach(r => {
                if (r.status === 'confirmada' || r.status === 'concluida') {
                  calendarEvents.push({
                    id: r.id,
                    resourceId: r.sala_id,
                    title: `${r.bandas.nome} (Ensaio)`,
                    start: r.inicio,
                    end: r.fim,
                    className: 'fc-event-booking',
                    extendedProps: {
                      type: 'booking',
                      status: r.status
                    }
                  });
                }
              });
            }

            if (blRes.dados) {
              blRes.dados.forEach(b => {
                calendarEvents.push({
                  id: b.id,
                  resourceId: b.sala_id,
                  title: `MANUTENÇÃO: ${b.motivo || 'Bloqueado'}`,
                  start: b.inicio,
                  end: b.fim,
                  className: 'fc-event-block',
                  extendedProps: {
                    type: 'block'
                  }
                });
              });
            }

            successCallback(calendarEvents);
          } catch (e) {
            console.error(e);
            failureCallback(e);
          }
        },
        dateClick: (info) => {
          // Pre-populate modal
          this.prepararNovoAgendamento(info.dateStr, info.resource ? info.resource.id : null);
        },
        eventClick: async (info) => {
          const type = info.event.extendedProps.type;
          if (type === 'booking') {
            await this.abrirDetalhesReserva(info.event.id);
          }
        }
      });

      this.calendar.render();
    },

    prepararNovoAgendamento(dateStr, resourceId) {
      this.mensagemErro = "";
      this.modalErro = "";
      this.viewMode = "criar";
      this.modalTitulo = "Novo Agendamento";

      // Reset Form fields
      this.reservaForm = {
        id: null,
        data: dateStr.includes("T") ? dateStr.substring(0, 10) : dateStr,
        salaId: resourceId || (this.salas.length > 0 ? this.salas[0].id : ""),
        horaInicio: dateStr.includes("T") ? dateStr.substring(11, 16) : "09:00",
        horaFim: dateStr.includes("T") ? dayjs(dateStr).add(2, 'hour').format("HH:mm") : "11:00",
        bandaId: "",
        equipamentosSelecionadosIds: [],
        equipamentosQuantidades: {},
        observacoes: ""
      };

      this.clienteBuscaWA = "";
      this.clienteSelecionado = null;
      this.clienteBuscado = false;
      this.bandasDoCliente = [];

      this.atualizarEquipamentosDisponiveis();
      this.modalAberto = true;
    },

    abrirNovoAgendamento() {
      const today = dayjs().format("YYYY-MM-DD");
      this.prepararNovoAgendamento(today, null);
    },

    async atualizarEquipamentosDisponiveis() {
      if (!this.reservaForm.data || !this.reservaForm.horaInicio || !this.reservaForm.horaFim) return;

      const inicioISO = `${this.reservaForm.data}T${this.reservaForm.horaInicio}:00`;
      const fimISO = `${this.reservaForm.data}T${this.reservaForm.horaFim}:00`;

      const res = await listarEquipamentosDisponiveis({ inicio: inicioISO, fim: fimISO });
      if (res.erro) {
        this.modalErro = "Erro ao carregar equipamentos: " + res.erro;
        return;
      }
      this.equipamentosDisponiveis = res.dados;
    },

    async buscarCliente() {
      this.modalErro = "";
      const cleanWA = this.clienteBuscaWA.replace(/\D/g, "");
      if (!cleanWA) {
        this.modalErro = "Por favor, digite um WhatsApp válido para pesquisar.";
        return;
      }

      const res = await buscarClientePorWhatsapp(cleanWA);
      this.clienteBuscado = true;
      if (res.erro) {
        this.modalErro = "Erro ao buscar cliente: " + res.erro;
        return;
      }

      this.clienteSelecionado = res.dados;
      if (this.clienteSelecionado) {
        // Query bands where this customer isIntegrante
        const { data: bandsList, error: bErr } = await supabase
          .from("banda_integrantes")
          .select("bandas (*)")
          .eq("cliente_id", this.clienteSelecionado.id)
          .eq("ativo", true);

        if (bErr) {
          this.modalErro = "Erro ao carregar bandas do cliente: " + bErr.message;
          return;
        }

        this.bandasDoCliente = (bandsList || []).map(b => b.bandas).filter(Boolean);
        if (this.bandasDoCliente.length === 1) {
          // Pre-select if only 1 band
          this.reservaForm.bandaId = this.bandasDoCliente[0].id;
        } else {
          this.reservaForm.bandaId = "";
        }
      }
    },

    abrirAutoRegModal() {
      this.regForm = {
        nome: "",
        whatsapp: this.clienteBuscaWA.replace(/\D/g, ""),
        banda: ""
      };
      this.autoRegModalAberto = true;
    },

    fecharAutoRegModal() {
      this.autoRegModalAberto = false;
    },

    async salvarNovoClienteCompleto() {
      const cleanWA = this.regForm.whatsapp.replace(/\D/g, "");
      const resCli = await criarCliente({
        nome: this.regForm.nome,
        whatsapp: cleanWA
      });

      if (resCli.erro) {
        alert("Erro ao cadastrar cliente: " + resCli.erro);
        return;
      }
      const client = resCli.dados;

      // Create band
      const resBanda = await buscarBandaPorNome(this.regForm.banda);
      let banda = resBanda.dados;
      if (!banda) {
        const resCrBand = await criarBanda({
          nome: this.regForm.banda,
          responsavelId: client.id
        });
        if (resCrBand.erro) {
          alert("Erro ao cadastrar banda: " + resCrBand.erro);
          return;
        }
        banda = resCrBand.dados;

        // Add integrante link
        await adicionarIntegrante({
          bandaId: banda.id,
          clienteId: client.id
        });
      }

      // Autoselect freshly created elements
      this.clienteSelecionado = client;
      this.bandasDoCliente = [banda];
      this.reservaForm.bandaId = banda.id;
      this.clienteBuscaWA = cleanWA;
      this.clienteBuscado = true;

      this.fecharAutoRegModal();
    },

    async abrirDetalhesReserva(bookingId) {
      this.modalErro = "";
      this.modalTitulo = "Detalhes do Ensaio";
      this.viewMode = "detalhes";

      const res = await buscarReserva(bookingId);
      if (res.erro) {
        alert("Erro ao carregar dados da reserva: " + res.erro);
        return;
      }

      const r = res.dados;
      this.detalheReserva = {
        id: r.id,
        salaNome: r.salas.nome,
        bandaNome: r.bandas.nome,
        clienteNome: r.clientes.nome,
        clienteFormatado: r.clientes.whatsapp,
        observacoes: r.observacoes,
        equipamentos: r.reserva_equipamentos,
        status: r.status,
        horarioFormatado: `${dayjs(r.inicio).format("DD/MM/YYYY")} das ${dayjs(r.inicio).format("HH:mm")} às ${dayjs(r.fim).format("HH:mm")}`
      };

      // Set forms to match current details
      this.reservaForm = {
        id: r.id,
        data: dayjs(r.inicio).format("YYYY-MM-DD"),
        salaId: r.sala_id,
        horaInicio: dayjs(r.inicio).format("HH:mm"),
        horaFim: dayjs(r.fim).format("HH:mm"),
        bandaId: r.banda_id,
        equipamentosSelecionadosIds: r.reserva_equipamentos.map(eq => eq.equipamento_id),
        equipamentosQuantidades: {},
        observacoes: r.observacoes || ""
      };
      r.reserva_equipamentos.forEach(eq => {
        this.reservaForm.equipamentosQuantidades[eq.equipamento_id] = eq.quantidade;
      });

      this.cancelForm.motivo = "";
      this.modalAberto = true;
    },

    mudarParaRemarcar() {
      this.viewMode = "remarcar";
      this.modalTitulo = "Remarcar Horário";
      this.atualizarEquipamentosDisponiveis();
    },

    mudarParaCancelar() {
      this.viewMode = "cancelar";
      this.modalTitulo = "Confirmar Cancelamento";
    },

    mudarParaDetalhes() {
      this.viewMode = "detalhes";
      this.modalTitulo = "Detalhes do Ensaio";
    },

    async submeterCancelamento() {
      this.modalErro = "";
      const res = await cancelarReserva({
        id: this.detalheReserva.id,
        motivo: this.cancelForm.motivo
      });

      if (res.erro) {
        this.modalErro = res.erro;
        return;
      }

      this.fecharModal();
      this.calendar.refetchEvents();
    },

    async confirmarReservaCompleta() {
      this.modalErro = "";
      this.salvandoReserva = true;

      try {
        const inicioISO = `${this.reservaForm.data}T${this.reservaForm.horaInicio}:00`;
        const fimISO = `${this.reservaForm.data}T${this.reservaForm.horaFim}:00`;

        const eqSolicitados = this.reservaForm.equipamentosSelecionadosIds.map(id => ({
          equipamento_id: id,
          quantidade: this.reservaForm.equipamentosQuantidades[id] || 1
        }));

        // 1. High level full validations (overlaps, buffers, blocks)
        const check = await verificarDisponibilidadeCompleta({
          salaId: this.reservaForm.salaId,
          inicio: inicioISO,
          fim: fimISO,
          equipamentosSolicitados: eqSolicitados,
          ignorarReservaId: this.viewMode === 'remarcar' ? this.reservaForm.id : null
        });

        if (!check.disponivel) {
          this.modalErro = check.motivos.join(" | ");
          this.salvandoReserva = false;
          return;
        }

        if (this.viewMode === 'criar') {
          if (!this.clienteSelecionado || !this.reservaForm.bandaId) {
            this.modalErro = "Cliente e Banda são obrigatórios para agendar.";
            this.salvandoReserva = false;
            return;
          }

          // Write Booking
          const resRes = await criarReserva({
            sala_id: this.reservaForm.salaId,
            banda_id: this.reservaForm.bandaId,
            criado_por_cliente_id: this.clienteSelecionado.id,
            inicio: inicioISO,
            fim: fimISO,
            status: 'confirmada',
            observacoes: this.reservaForm.observacoes
          });

          if (resRes.erro) {
            this.modalErro = "Erro ao gravar agendamento: " + resRes.erro;
            this.salvandoReserva = false;
            return;
          }

          // Link equipments if any
          if (eqSolicitados.length > 0) {
            const inserts = eqSolicitados.map(eq => ({
              reserva_id: resRes.dados.id,
              equipamento_id: eq.equipamento_id,
              quantidade: eq.quantidade
            }));
            const { error: eqErr } = await supabase.from("reserva_equipamentos").insert(inserts);
            if (eqErr) {
              this.modalErro = "Reserva criada, mas falhou ao gravar equipamentos adicionais: " + eqErr.message;
              this.salvandoReserva = false;
              return;
            }
          }

        } else if (this.viewMode === 'remarcar') {
          // Rescheduling logic
          const resRem = await remarcarReserva({
            id: this.reservaForm.id,
            novoInicio: inicioISO,
            novoFim: fimISO,
            novaSalaId: this.reservaForm.salaId
          });

          if (resRem.erro) {
            this.modalErro = "Erro ao remarcar agendamento: " + resRem.erro;
            this.salvandoReserva = false;
            return;
          }
        }

        this.fecharModal();
        this.calendar.refetchEvents();

      } catch (err) {
        this.modalErro = "Erro inesperado: " + err.message;
      } finally {
        this.salvandoReserva = false;
      }
    },

    fecharModal() {
      this.modalAberto = false;
    },

    async sair() {
      await logout();
      window.location.replace("login.html");
    }
  };
};

window.agendaComponent = controller;

if (typeof Alpine !== 'undefined') {
  Alpine.data('agendaComponent', controller);
} else {
  document.addEventListener('alpine:init', () => {
    Alpine.data('agendaComponent', controller);
  });
}
