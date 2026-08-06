# Relatório de Análise Técnica — Sistema de Agendamento para Estúdio de Ensaios

Este relatório apresenta uma análise detalhada dos requisitos, da arquitetura, do esquema de banco de dados e dos fluxos operacionais especificados nos documentos (`00-plano-geral.md` a `15-testes-usabilidade.md`) para o desenvolvimento da versão 1 (v1) do **Sistema de Agendamento de Ensaios**.

---

## 1. Visão Geral do Sistema e Arquitetura

O sistema é uma ferramenta administrativa interna para estúdios de ensaio de música, focada em simplicidade técnica, estabilidade operacional e controle estrito das regras de negócio (disponibilidade, bloqueios e imutabilidade de histórico).

### Filosofia "Sem Build" (Zero Build Pipeline)
A escolha arquitetural central é a ausência de um pipeline de build complexo (sem Webpack, Vite, Babel, npm build, etc.). Toda a aplicação consiste de arquivos estáticos HTML, CSS e JavaScript nativo que importam as dependências diretamente de CDNs usando módulos ES (ESM).

*   **Vantagens:**
    *   **Deploy instantâneo:** Pode ser hospedado diretamente em qualquer CDN de arquivos estáticos (GitHub Pages, Netlify, Vercel, Cloudflare Pages) apenas apontando para a pasta raiz.
    *   **Facilidade de manutenção:** Sem quebra de dependências por atualizações de pacotes do npm ou complexidades de configurações de build de terceiros.
    *   **Baixo acoplamento:** Bibliotecas atualizadas via CDN de forma explícita e controlada.
*   **Desvantagens/Pontos de Atenção:**
    *   Falta de minificação nativa ou empacotamento em um único arquivo (resolvido em partes pelas conexões HTTP/2 que lidam bem com múltiplos arquivos JS menores).
    *   Dependência de rede externa (CDNs) para funcionamento. Esse risco é mitigado especificando versões fixas nas URLs das CDNs.

### Stack de Tecnologias Detalhada

| Camada | Tecnologia | Implementação / URL do Recurso | Função |
|---|---|---|---|
| **Aparência e Layout** | HTML5 + CSS3 | [Pico.css v2](https://picocss.com/) via CDN | Interface minimalista baseada em tags semânticas, sem necessidade de classes utilitárias pesadas. Garante tema claro padrão automático. |
| **Reatividade Front** | Alpine.js | [Alpine.js v3](https://alpinejs.dev/) via CDN | Manipulação leve e declarativa do estado da interface (ex: modais, buscas reativas, submissão de formulários). |
| **Backend & Banco** | Supabase | Postgres + REST PostgREST + Auth | Provedor Backend-as-a-Service (BaaS). Armazenamento de dados persistentes, autenticação de usuários e controle de acesso via RLS. |
| **Cliente Supabase** | `@supabase/supabase-js` | Cliente JS ESM via CDN | Biblioteca oficial do Supabase rodando diretamente no browser via JavaScript Modules para envio de queries. |
| **Visualização Principal** | FullCalendar | FullCalendar core + plugins via CDN | Biblioteca rica para renderização de grades horárias por salas (Resource Timeline / TimeGrid views). |
| **Manipulação de Datas** | Day.js | Day.js via CDN | Biblioteca leve para manipulação e validação de datas, buffers e fusos horários. |

---

## 2. Modelagem do Banco de Dados & RLS (Supabase)

O banco de dados PostgreSQL do Supabase foi modelado de forma a refletir perfeitamente as regras de negócio através de restrições relacionais, constraints de integridade e tipos enumerados (ENUM).

### Diagrama Lógico de Tabelas

```text
  [clientes]
      │ (1)
      ├───────────────────────┐
      │ (1)                   │ (1)
  [bandas] (N)                │
      │                       │
      ├─► [banda_integrantes] ◄ (N)
      │
      │ (1)
      ▼
  [reservas] ◄─── [reserva_ajustes] (1:N)
      │
      ├─► [reserva_equipamentos] (1:N)
      │          ▲
      │ (N)      │ (N)
  [salas]   [equipamentos]
      │
      └─► [sala_bloqueios] (1:N)
```

### Análise das Tabelas e Constraints

1.  **`clientes`**:
    *   *Chave:* `id` (UUID gerado por `pgcrypto`).
    *   *Regra de Unicidade:* `whatsapp` é único (`unique`). Impede cadastros duplicados de forma nativa.
    *   *Campos de Consentimento:* `consentimento_dados` e `anonimizado` para compliance básico com diretrizes de proteção de dados.
2.  **`bandas`**:
    *   *Regra de Unicidade:* `nome` da banda é único.
    *   *Relacionamento:* Possui um `responsavel_id` apontando para `clientes(id)`.
3.  **`banda_integrantes`**:
    *   Relação Muitos-para-Muitos ($N:N$) entre `clientes` e `bandas`.
    *   *Constraint de Unicidade:* `unique (banda_id, cliente_id)` garante que um cliente não seja adicionado mais de uma vez na mesma banda.
    *   *Histórico preservado:* A deleção é lógica (`ativo boolean default true`, campo `saiu_em timestamptz`).
4.  **`salas`**:
    *   Armazena configurações críticas de negócio: `duracao_minima_minutos`, `duracao_maxima_minutos`, `buffer_minutos` e `ativa`.
5.  **`sala_bloqueios`**:
    *   *Constraint:* `bloqueio_intervalo_valido CHECK (fim > inicio)` impede inserção de intervalos corrompidos ou invertidos.
6.  **`equipamentos`**:
    *   *Constraint:* `quantidade_total > 0` impede cadastros inválidos.
7.  **`reservas`**:
    *   *Status:* Controlado via PostgreSQL ENUM (`status_reserva`): `confirmada`, `cancelada`, `remarcada`, `concluida`, `nao_compareceu`.
    *   *Indexação Inteligente:* `idx_reservas_sala_periodo` e `idx_reservas_status` otimizam consultas de sobreposição e geração da agenda.
    *   *Rastreabilidade:* `reserva_original_id` auto-referencia a tabela de reservas para criar a árvore de rastreamento de remarcações.
8.  **`reserva_equipamentos`**:
    *   Associa equipamentos adicionais a uma reserva específica.
9.  **`reserva_ajustes`**:
    *   Armazena notas/auditorias adicionadas a reservas concluídas, mantendo os dados originais intactos e imutáveis.
10. **`usuarios_papel`**:
    *   Mapeia o UID do Supabase Auth para os papéis de nível de aplicação: `administrador` ou `atendente`.

### Estratégia de Segurança: Row Level Security (RLS)

O Supabase protege o acesso direto às tabelas utilizando Row Level Security (RLS). Por padrão, todo acesso não autenticado é bloqueado nesta modelagem.

*   **Fase Inicial (Tarefa 02):** Todos os usuários autenticados (`authenticated`) têm permissão total de leitura e escrita operacional para agilizar o setup básico.
*   **Fase de Autenticação (Tarefa 14):** As políticas de segurança são estreitadas.
    *   Políticas genéricas de escrita em tabelas críticas como `sala_bloqueios` e `salas` são deletadas.
    *   Políticas novas são criadas exigindo que o usuário possua a função de `administrador` na tabela `usuarios_papel` para poder realizar operações de modificação (INSERT, UPDATE, DELETE).

---

## 3. Regras de Negócio Críticas e Lógica de Implementação

Três pilares fundamentais definem as regras operacionais do estúdio e exigem implementação lógica cuidadosa no arquivo `js/disponibilidade.js`:

### A. Algoritmo de Disponibilidade de Horário e Buffer entre Sessões
Para que um novo agendamento no período `[inicioNovo, fimNovo)` seja aceito em uma determinada sala, ele não pode colidir com nenhuma reserva ativa (status = `confirmada`) existente no período, considerando o **buffer específico** daquela sala.

O cálculo da colisão expande virtualmente a reserva existente pelo tempo de buffer necessário antes e depois:
$$\text{inicioComBuffer} = \text{reservaExistente.inicio} - \text{sala.buffer\_minutos}$$
$$\text{fimComBuffer} = \text{reservaExistente.fim} + \text{sala.buffer\_minutos}$$

Haverá conflito se:
$$\text{inicioNovo} < \text{fimComBuffer} \quad \text{e} \quad \text{inicioComBuffer} < \text{fimNovo}$$

```javascript
// Exemplo prático de verificação usando Day.js
const inicioNovo = dayjs(novoInicio);
const fimNovo = dayjs(novoFim);

const conflito = reservasExistentes.some(reserva => {
  const inicioComBuffer = dayjs(reserva.inicio).subtract(sala.buffer_minutos, "minute");
  const fimComBuffer = dayjs(reserva.fim).add(sala.buffer_minutos, "minute");

  return inicioNovo.isBefore(fimComBuffer) && inicioComBuffer.isBefore(fimNovo);
});
```

### B. Gestão de Equipamentos Compartilhados por Período
Diferente das salas, os equipamentos extras são compartilhados por todo o estúdio. O motor de disponibilidade deve garantir que a soma das quantidades solicitadas por todas as reservas confirmadas em um determinado horário não exceda a `quantidade_total` do estoque físico.

Para validar a reserva de um equipamento $E$ com quantidade solicitada $Q_{\text{sol}}$ no período $P$:
1.  Encontrar todas as reservas que se sobrepõem ao período $P$.
2.  Para cada reserva sobreposta, somar as quantidades de $E$ reservadas na tabela `reserva_equipamentos`.
3.  $\text{Quantidade Reservada Total} = \sum Q_{\text{res}}$
4.  Garantir que $\text{Quantidade Reservada Total} + Q_{\text{sol}} \le E.\text{quantidade\_total}$.

### C. Princípio de Imutabilidade do Histórico
Para auditoria financeira e gerencial, o estúdio exige que **reservas com status 'concluida' nunca tenham seus dados de dia, hora, sala ou equipamentos alterados**.
*   **Implementação em código:** O arquivo centralizado de dados `db.js` não fornece nenhuma função genérica de `atualizarReserva`. As alterações são feitas estritamente através das funções encapsuladas `cancelarReserva`, `remarcarReserva` e `adicionarAjuste`.
*   **Tentativa de alteração:** Caso a UI chame uma remarcação em uma reserva de ID correspondente a um registro já concluído, a camada de dados em `db.js` intercepta, recusa a operação e retorna um erro amigável ao usuário.
*   **Ajustes permitidos:** O único ajuste possível em reservas concluídas é a inclusão de uma nota descritiva na tabela `reserva_ajustes` através da função `adicionarAjuste()`.

---

## 4. Fluxos Front-End e Experiência do Usuário (UX)

Os arquivos de página (`paginas/`) utilizam o Alpine.js de forma modular para gerenciar o estado sem acoplar a lógica diretamente no HTML.

```text
[Agenda Principal (FullCalendar)]
   │
   ├─► Clique em horário livre ──► Abre Modal de Criação (Tarefa 10)
   │                                  │
   │                                  ├──► Valida duração mínima/máxima da sala
   │                                  ├──► Busca/Cadastra Cliente (Modal aninhado - Tarefa 04)
   │                                  ├──► Vincula/Busca Banda reativamente (Tarefa 05)
   │                                  ├──► Lista equipamentos filtrando estoque livre
   │                                  └──► Confirmação (Grava reserva + equipamentos)
   │
   └─► Clique em reserva ativa ──► Abre Painel de Detalhes (Tarefa 11)
                                      │
                                      ├──► Opção: Cancelar (Exige preencher motivo)
                                      └──► Opção: Remarcar (Carrega dados no modal, valida disponibilidade,
                                                             cria nova reserva e marca antiga como remarcada)
```

### Detalhes Importantes de UX
*   **Auto-seleção de Banda:** Ao buscar e selecionar um cliente no passo do agendamento, o Alpine.js reage imediatamente consultando as bandas a que ele pertence. Se ele pertence a apenas uma banda, ela é pré-selecionada. Se ele pertence a mais de uma, um seletor dropdown é exibido para o operador escolher.
*   **Equipamentos Indisponíveis:** Em vez de ocultar equipamentos indisponíveis (o que causaria estranheza ao atendente), eles são renderizados como desabilitados (`disabled`) com uma tag explicativa vermelha "Indisponível neste horário" ao lado.

---

## 5. Análise de Riscos Técnicos e Mitigações

Durante a análise profunda das especificações, foram mapeados alguns pontos críticos de falha técnica ou operacional que exigem atenção especial na implementação:

| Risco Técnico / Operacional | Impacto | Estratégia de Mitigação Sugerida |
|---|---|---|
| **Condição de Corrida (Race Condition) no Agendamento** | Reservas duplicadas sobrepostas criadas simultaneamente por atendentes diferentes. | **Dupla Validação:** Realizar a checagem de disponibilidade local reativa e, ao submeter o formulário de reserva, revalidar a disponibilidade no banco de dados imediatamente antes de rodar o `INSERT` (passo 7 do fluxo de gravação). |
| **Inconsistência na Transação de Reserva com Equipamentos** | Uma reserva ser criada, mas a gravação dos equipamentos extras falhar por oscilação de rede, deixando o cliente sem equipamentos e o estoque dessincronizado. | **Transações do Supabase (RPC):** Como estamos usando client-side direto, o ideal é criar uma função de banco (PostgreSQL Function) no Supabase exposta via RPC (ex: `criar_reserva_com_equipamentos`) que processe as duas inserções dentro de uma transação SQL nativa (`BEGIN ... COMMIT`). |
| **Fuso Horário (Timezone Shift)** | O estúdio opera em horário local (ex: Horário de Brasília, UTC-3), mas o Supabase armazena em UTC. Reservas salvas podem aparecer no dia/horário errado no FullCalendar. | **Uso Estrito de ISO8601 com Timezone:** Utilizar o Day.js para formatar todas as datas de envio sempre contendo a informação de fuso horário local explicitamente (ex: `YYYY-MM-DDTHH:mm:ss-03:00`) e configurar as views do FullCalendar para respeitar o fuso local (`timeZone: 'local'`). |
| **Bypass de RLS por Vulnerabilidade no Client** | Um usuário de nível "atendente" inspecionar o código fonte do JS, obter as credenciais publicáveis e enviar uma query direta para criar um Bloqueio Administrativo contornando a UI. | **Bloqueio Hardened no Postgres (RLS):** Garantir que a Tarefa 14 remova completamente as políticas genéricas do banco de dados e exija a existência de registro de administrador para qualquer alteração na tabela `sala_bloqueios` de forma estrita. |

---

## 6. Conclusão

Os documentos fornecidos constituem uma especificação técnica altamente madura, estruturada e de extrema clareza operacional. O mapeamento sequencial das 15 tarefas garante um fluxo lógico sem caminhos cruzados ou dependências circulares.

A arquitetura sem pipeline de build (Zero Build Step) é ideal para a manutenção a longo prazo deste sistema administrativo interno, reduzindo custos de infraestrutura e barreiras técnicas para modificações futuras. Ao mitigar os riscos de fusos horários e condições de corrida no desenvolvimento da camada `js/disponibilidade.js`, o sistema se tornará uma solução extremamente robusta, leve e perfeitamente aderente às necessidades de gestão do estúdio.
