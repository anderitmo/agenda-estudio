# Tarefa 14 — Autenticação e Níveis de Permissão

## Objetivo

Restringir o acesso ao sistema (que é uma ferramenta interna do estúdio, não voltada ao cliente final nesta v1) a usuários autenticados, com dois papéis: administrador e atendente.

## Depende de

Tarefa 02 (tabela `usuarios_papel` e RLS já criadas).

## Arquivos

- `js/auth.js`
- Ajuste em `index.html` e nas demais páginas para verificar sessão antes de renderizar conteúdo.

## Especificação

### Login

- Usar o Supabase Auth (e-mail + senha é suficiente nesta v1; método "magic link" é uma alternativa mais simples de implementar e evita gerenciar senhas, e pode ser preferido pelo agente se reduzir código).
- Tela de login simples (`paginas/login.html` ou modal na própria `index.html`).
- Após login bem-sucedido, `auth.js` consulta `usuarios_papel` para obter o papel do usuário e armazena em memória (não em `localStorage`, para evitar informação de sessão desatualizada; a sessão em si já é gerenciada pelo Supabase Auth internamente).

### `js/auth.js` — funções principais

```js
export async function login({ email, senha }) { /* ... */ }
export async function logout() { /* ... */ }
export async function sessaoAtual() { /* retorna usuário + papel, ou null */ }
export function requerAutenticacao() { /* redireciona para login se não houver sessão */ }
export function requerAdministrador() { /* redireciona ou bloqueia ação se papel !== 'administrador' */ }
```

### Regras de permissão por papel

| Ação | Atendente | Administrador |
|---|---|---|
| Criar/cancelar/remarcar reserva | Sim | Sim |
| Cadastrar cliente/banda | Sim | Sim |
| Criar/remover bloqueio administrativo de sala | Não | Sim |
| Editar configuração de sala (buffer, duração) | Não | Sim |
| Transferir responsável de banda | Sim | Sim |
| Cadastrar novo usuário do sistema (atendente/administrador) | Não | Sim |

Essas regras devem ser aplicadas tanto na interface (ocultar/desabilitar ações não permitidas) quanto reforçadas nas políticas de RLS do Supabase, criando políticas adicionais mais restritivas para `sala_bloqueios` e para `UPDATE` em `salas`, substituindo a política genérica "autenticados podem escrever" criada na Tarefa 02 por uma que verifique o papel do usuário via `usuarios_papel`.

### SQL adicional (a ser executado após esta tarefa)

```sql
drop policy "autenticados podem escrever bloqueios" on sala_bloqueios;

create policy "apenas administrador escreve bloqueios" on sala_bloqueios
  for all
  using (
    exists (
      select 1 from usuarios_papel
      where usuario_id = auth.uid() and papel = 'administrador'
    )
  );
```

(O mesmo padrão se aplica à tabela `salas` para `UPDATE`.)

## Critérios de aceite

- Acessar qualquer página sem sessão ativa redireciona para a tela de login.
- Um usuário com papel `atendente` não consegue criar um bloqueio administrativo, nem pela UI (botão ausente/desabilitado) nem via chamada direta ao Supabase (RLS recusa).
- Um usuário com papel `administrador` consegue todas as ações listadas na tabela acima.
- Logout encerra a sessão e impede novas chamadas autenticadas até novo login.
