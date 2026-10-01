/**
 * contenuti.js — articoli "In Primo Piano" e News (backend: contenuti.py).
 * Le funzioni pubbliche non lanciano mai eccezioni per un 404: restituiscono
 * null, e la pagina decide cosa mostrare.
 */
const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';
const CHIAVE_SESSIONE = 'monoposto_sessione_contenuti';

function url(percorso, parametri = {}) {
  const u = new URL(percorso, BASE_URL);
  Object.entries(parametri).forEach(([k, v]) => v != null && u.searchParams.set(k, v));
  return u;
}

async function leggi(risposta) {
  if (risposta.status === 404) return null;
  let corpo = null;
  try {
    corpo = await risposta.json();
  } catch {
    corpo = null;
  }
  if (!risposta.ok) {
    const errore = new Error(corpo?.detail && typeof corpo.detail === 'string' ? corpo.detail : `Errore ${risposta.status}`);
    errore.status = risposta.status;
    throw errore;
  }
  return corpo;
}

// ---- pubblico ---------------------------------------------------------------
export const getPrimoPiano = () => fetch(url('/contenuti/primo-piano')).then(leggi);
export const getNews = (pagina = 1, limite = 10) => fetch(url('/contenuti/news', { pagina, limite })).then(leggi);
export const getArticolo = (slug) => fetch(url(`/contenuti/articolo/${encodeURIComponent(slug)}`)).then(leggi);

// ---- pannello ---------------------------------------------------------------
export function sessioneSalvata() {
  try {
    const dati = JSON.parse(window.sessionStorage.getItem(CHIAVE_SESSIONE) || 'null');
    if (dati && dati.scadenza * 1000 > Date.now()) return dati.sessione;
  } catch {
    /* sessione illeggibile: si rifà l'accesso */
  }
  return null;
}
export function salvaSessione({ sessione, scadenza }) {
  window.sessionStorage.setItem(CHIAVE_SESSIONE, JSON.stringify({ sessione, scadenza }));
}
export function cancellaSessione() {
  window.sessionStorage.removeItem(CHIAVE_SESSIONE);
}

export async function getStatoAdmin(tokenNetlify) {
  const headers = tokenNetlify ? { Authorization: `Bearer ${tokenNetlify}` } : {};
  return fetch(url('/admin/stato'), { headers }).then(leggi);
}

export async function accediAdmin(tokenNetlify, codice) {
  const dati = await fetch(url('/admin/accesso'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenNetlify}` },
    body: JSON.stringify({ codice }),
  }).then(leggi);
  salvaSessione(dati);
  return dati;
}

function admin(percorso, { method = 'GET', body } = {}) {
  const sessione = sessioneSalvata();
  return fetch(url(percorso), {
    method,
    headers: { 'X-Admin-Sessione': sessione || '', ...(body ? { 'Content-Type': 'application/json' } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  }).then(async (r) => {
    if (r.status === 401) cancellaSessione();
    return leggi(r);
  });
}

export const adminElenco = () => admin('/admin/contenuti');
export const adminDettaglio = (id) => admin(`/admin/contenuti/${id}`);
export const adminCrea = (dati) => admin('/admin/contenuti', { method: 'POST', body: dati });
export const adminAggiorna = (id, dati) => admin(`/admin/contenuti/${id}`, { method: 'PUT', body: dati });
export const adminElimina = (id) => admin(`/admin/contenuti/${id}`, { method: 'DELETE' });
export const adminCaricaImmagine = (nome, datiBase64) =>
  admin('/admin/immagini', { method: 'POST', body: { nome, dati_base64: datiBase64 } });
