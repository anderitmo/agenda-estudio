import { supabase } from "./db.js";

let cachedSession = null;

export async function login({ email, senha }) {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password: senha
    });

    if (error) return { dados: null, erro: error.message };

    const { data: roleData } = await supabase
      .from("usuarios_papel")
      .select("papel")
      .eq("usuario_id", data.user.id)
      .maybeSingle();

    const papel = (roleData && roleData.papel) || "atendente";

    cachedSession = {
      usuario: data.user,
      papel
    };

    window.dispatchEvent(new CustomEvent("auth-changed"));
    return { dados: cachedSession, erro: null };
  } catch (err) {
    return { dados: null, erro: err.message };
  }
}

export async function logout() {
  try {
    await supabase.auth.signOut();
    cachedSession = null;
    window.dispatchEvent(new CustomEvent("auth-changed"));
    return { erro: null };
  } catch (err) {
    return { erro: err.message };
  }
}

export async function sessaoAtual() {
  if (cachedSession) return cachedSession;

  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session || !session.user) {
      return null;
    }

    const { data: roleData } = await supabase
      .from("usuarios_papel")
      .select("papel")
      .eq("usuario_id", session.user.id)
      .maybeSingle();

    const papel = (roleData && roleData.papel) || "atendente";

    cachedSession = {
      usuario: session.user,
      papel
    };

    return cachedSession;
  } catch (err) {
    return null;
  }
}

export async function requerAutenticacao() {
  const session = await sessaoAtual();
  if (!session) {
    window.location.replace("login.html");
    return false;
  }
  return true;
}

export async function requerAdministrador() {
  const session = await sessaoAtual();
  if (!session || session.papel !== 'administrador') {
    window.location.replace("agenda.html");
    return false;
  }
  return true;
}
