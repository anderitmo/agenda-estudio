import { SUPABASE_URL, SUPABASE_ANON_KEY } from "./js/config.js";

export const headers = {
  "apikey": SUPABASE_ANON_KEY,
  "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
  "Content-Type": "application/json",
  "Prefer": "return=representation"
};

export async function getBookings(inicio, fim) {
  try {
    let url = `${SUPABASE_URL}/rest/v1/reservas?select=*,salas(*),bandas(*),clientes(*)`;
    if (inicio) url += `&fim=gte.${inicio}`;
    if (fim) url += `&inicio=lte.${fim}`;
    const res = await fetch(url, { headers });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(text);
    }
    return await res.json();
  } catch (err) {
    console.error("getBookings error:", err);
    return [];
  }
}

export async function createBooking(bookingData) {
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/reservas`, {
      method: "POST",
      headers,
      body: JSON.stringify(bookingData)
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(text);
    }
    return await res.json();
  } catch (err) {
    console.error("createBooking error:", err);
    throw err;
  }
}

window.headers = headers;
window.getBookings = getBookings;
window.createBooking = createBooking;
