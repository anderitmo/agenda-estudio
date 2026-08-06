# Plano de Desenvolvimento
## Sistema de Agendamento para Estúdio de Ensaios — Especificação para Agente de IA

Este documento é o índice geral do projeto. Cada tarefa listada abaixo possui um arquivo próprio na pasta `tarefas/`, com objetivo, arquivos a criar, esquema de dados envolvido, critérios de aceite e dependências. A ideia é que um agente de IA execute os arquivos em ordem, tratando cada um como uma unidade de trabalho fechada.

Este plano parte da revisão funcional já validada anteriormente (status de reserva, buffer entre sessões, responsável pela banda, bloqueios administrativos, disponibilidade de equipamento por período, níveis de acesso e imutabilidade do histórico). Aqui o foco muda de regra de negócio para especificação técnica de implementação.

---

## Stack definida

| Camada | Tecnologia | Motivo |
|---|---|---|
| Marcação e estilo | HTML5 + CSS3 | Base do projeto, sem build step |
| Framework CSS | [Pico.css](https://picocss.com/) via CDN | Visual minimalista, claro, sem necessidade de escrever componentes do zero |
| Reatividade de UI | [Alpine.js](https://alpinejs.dev/) via CDN | Reduz JavaScript imperativo (manipulação manual de DOM) mantendo a filosofia "sem build" |
| Backend / banco de dados | Supabase (Postgres + REST + Auth) | Já provisionado; elimina necessidade de backend próprio |
| Cliente Supabase | `@supabase/supabase-js` via CDN (ESM) | Cliente oficial, evita chamadas manuais à REST API |
| Agenda (dia/semana/mês) | [FullCalendar](https://fullcalendar.io/) (core + timegrid + resource-timeline, licença MIT) | Resolve visualização de calendário com colunas por sala sem código customizado de grade |
| Datas e horários | [Day.js](https://day.js.org/) via CDN | Leve, evita erros de manipulação manual de datas (buffer, sobreposição) |

Não há build step (webpack/vite) nesta v1: todos os arquivos são HTML/CSS/JS servidos estaticamente, com bibliotecas carregadas via CDN. Isso simplifica o deploy (qualquer hospedagem estática serve) e reduz a superfície de erro para um agente autônomo, que não precisa gerenciar um pipeline de build.

---

## ⚠️ Aviso de segurança sobre as credenciais fornecidas

Duas credenciais foram fornecidas para este projeto e têm usos muito diferentes:

- **URL do projeto** (`https://hzcqkyjnuwikcchyaoyq.supabase.co`) **e chave publicável** (`sb_publishable_...`): são seguras para uso no código do frontend (arquivo `config.js`). A chave publicável só permite o que as políticas de Row Level Security (RLS) autorizarem, então a segurança real depende das políticas definidas na Tarefa 02.
- **Senha do banco de dados** (`b.p_eR&TC5CX.qz`): **não deve aparecer em nenhum arquivo do frontend, nem ser commitada em nenhum repositório**. Ela serve apenas para conexão administrativa direta (psql, ferramenta de migração, ou o SQL Editor do painel do Supabase). O agente de IA deve usá-la somente para executar as migrações da Tarefa 02 diretamente no painel do Supabase (SQL Editor), nunca incorporá-la a um arquivo `.js`, `.html` ou `.env` versionado.
- Recomenda-se adicionar um arquivo `.gitignore` já na Tarefa 01 cobrindo qualquer arquivo de configuração local que venha a conter segredos adicionais.

**Confiança: Alta** quanto a esta recomendação, pois reflete o modelo de segurança documentado do próprio Supabase (chave publicável + RLS para acesso do cliente, credencial de banco restrita a acesso administrativo).

---

## Estrutura de pastas do projeto (resultado esperado)

```text
studio-agendamento/
├── index.html
├── css/
│   └── custom.css
├── js/
│   ├── config.js              # URL + chave publicável do Supabase
│   ├── db.js                  # camada de acesso a dados (Tarefa 03)
│   ├── disponibilidade.js     # motor central de disponibilidade (Tarefa 08)
│   ├── auth.js                # autenticação e permissões (Tarefa 14)
│   └── paginas/
│       ├── clientes.js
│       ├── bandas.js
│       ├── salas.js
│       ├── equipamentos.js
│       ├── agenda.js
│       ├── reserva.js
│       ├── historico.js
│       └── pesquisa.js
├── paginas/
│   ├── clientes.html
│   ├── bandas.html
│   ├── salas.html
│   ├── equipamentos.html
│   ├── agenda.html
│   └── historico.html
├── sql/
│   └── 001_schema_inicial.sql  # Tarefa 02
└── .gitignore
```

---

## Índice de tarefas

| # | Arquivo | Tarefa | Depende de |
|---|---|---|---|
| 01 | `tarefas/01-setup-projeto.md` | Estrutura inicial, CDNs, config | — |
| 02 | `tarefas/02-schema-banco-dados.md` | Modelagem e migração SQL no Supabase | 01 |
| 03 | `tarefas/03-camada-dados-supabase.md` | Módulo `db.js` (CRUD por entidade) | 02 |
| 04 | `tarefas/04-cadastro-clientes.md` | Tela e lógica de cadastro de clientes | 03 |
| 05 | `tarefas/05-cadastro-bandas.md` | Bandas, integrantes, responsável | 03, 04 |
| 06 | `tarefas/06-cadastro-salas.md` | Salas e bloqueios administrativos | 03 |
| 07 | `tarefas/07-cadastro-equipamentos.md` | Equipamentos extras | 03 |
| 08 | `tarefas/08-disponibilidade.md` | Motor central de disponibilidade | 02, 06, 07 |
| 09 | `tarefas/09-agenda.md` | Visualização dia/semana/mês (FullCalendar) | 06, 08 |
| 10 | `tarefas/10-criacao-reserva.md` | Fluxo completo de criação de reserva | 04, 05, 07, 08, 09 |
| 11 | `tarefas/11-cancelamento-remarcacao.md` | Cancelamento e remarcação | 10 |
| 12 | `tarefas/12-historico.md` | Histórico de cliente e banda, imutabilidade | 10, 11 |
| 13 | `tarefas/13-pesquisa.md` | Busca por múltiplos critérios | 12 |
| 14 | `tarefas/14-autenticacao-permissoes.md` | Login, papéis admin/atendente, RLS | 02 |
| 15 | `tarefas/15-testes-usabilidade.md` | Checklist de testes e ajustes finais | todas as anteriores |

A Tarefa 14 (autenticação) pode ser desenvolvida em paralelo às Tarefas 04–09, mas deve estar concluída antes da Tarefa 15, já que a checklist final valida controle de acesso.

---

## Convenções gerais para o agente de IA

- Todo texto de interface em português do Brasil.
- Nomes de tabelas, colunas e funções JS em português quando forem específicos do domínio (ex.: `salas`, `bandas`, `integrantes`), e em inglês quando forem genéricos de infraestrutura (ex.: `config.js`, `db.js`).
- Cada entidade tem `id` (UUID, gerado pelo Postgres), `criado_em` e `atualizado_em` (timestamps).
- Toda função assíncrona de acesso a dados deve tratar erro do Supabase explicitamente e retornar um objeto `{ dados, erro }`, nunca lançar exceção não tratada na camada de UI.
- Cores e tipografia seguem o tema claro padrão do Pico.css, sem customização pesada nesta v1 (interface minimalista é requisito explícito).
