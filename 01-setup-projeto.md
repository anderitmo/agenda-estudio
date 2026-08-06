# Tarefa 01 — Estrutura Inicial do Projeto

## Objetivo

Criar o esqueleto do projeto, sem lógica de negócio ainda, apenas a base que as demais tarefas vão preencher.

## Depende de

Nenhuma tarefa anterior.

## Arquivos a criar

```text
studio-agendamento/
├── index.html
├── css/custom.css
├── js/config.js
├── .gitignore
```

### `index.html`

Página de entrada, com:

- `<head>` incluindo Pico.css via CDN (`<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@picocss/pico@2/css/pico.min.css">`).
- Import do Alpine.js via CDN com atributo `defer` (`https://cdn.jsdelivr.net/npm/alpinejs@3.x.x/dist/cdn.min.js`).
- Import do Supabase JS via CDN como módulo ES (`https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2`).
- Import do Day.js via CDN.
- Um menu de navegação simples (`<nav>` do Pico.css) apontando para as páginas: Agenda, Clientes, Bandas, Salas, Equipamentos, Histórico.
- Um `<main class="container">` vazio, que servirá de layout padrão nas demais páginas.

### `css/custom.css`

Arquivo inicialmente quase vazio, apenas com:

```css
:root {
  --pico-font-size: 100%;
}
```

Ajustes finos de espaçamento e cor virão nas tarefas específicas, sempre respeitando o tema claro padrão do Pico (evitar sobrescrever cores base do framework).

### `js/config.js`

```js
export const SUPABASE_URL = "https://hzcqkyjnuwikcchyaoyq.supabase.co";
export const SUPABASE_ANON_KEY = "sb_publishable_Yt_TFBbIV_mDGlGmb4pr5g_teJ-OsPq";
```

Este arquivo contém apenas a URL e a chave publicável. **Nunca** adicionar a senha do banco de dados aqui ou em qualquer outro arquivo versionado (ver aviso de segurança no plano geral).

### `.gitignore`

```text
.env
.env.local
*.local.js
node_modules/
```

Mesmo sem build step, o `.gitignore` protege contra a criação futura de um arquivo de configuração local com segredos adicionais.

## Critérios de aceite

- `index.html` abre localmente (ex.: via `npx serve` ou extensão Live Server) sem erros de console relacionados a CDN.
- Menu de navegação visível, com o tema claro do Pico.css aplicado (fundo claro, tipografia legível, sem CSS customizado pesado).
- `config.js` exporta as duas constantes e é importável por outros módulos JS.
- Nenhum arquivo do projeto contém a senha do banco de dados.
