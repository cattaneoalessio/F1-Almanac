/**
 * meta.js — aggiorna nella <head> i meta tag della pagina corrente: titolo,
 * descrizione, canonical, Open Graph, Twitter Card e robots. Il sito è una
 * single-page app, quindi l'HTML di partenza è uno solo (index.html) e questi
 * tag vanno cambiati a ogni cambio pagina. Google esegue il JavaScript e legge
 * i valori aggiornati; i social (Facebook, WhatsApp…) invece usano quelli di
 * index.html, uguali per tutto il sito: per anteprime diverse pagina per
 * pagina servirebbe il pre-rendering (vedi PRE-PUBBLICAZIONE.md).
 */
import { SITO } from '../config/sito.js';
import { normalizzaPercorso, valoreRobots } from './metaPagina.js';

function tag(selettore, crea) {
  let el = document.head.querySelector(selettore);
  if (!el) {
    el = crea();
    document.head.appendChild(el);
  }
  return el;
}
function metaNome(nome, contenuto) {
  tag(`meta[name="${nome}"]`, () => Object.assign(document.createElement('meta'), { name: nome })).setAttribute('content', contenuto);
}
function metaProprieta(proprieta, contenuto) {
  tag(`meta[property="${proprieta}"]`, () => {
    const el = document.createElement('meta');
    el.setAttribute('property', proprieta);
    return el;
  }).setAttribute('content', contenuto);
}

/** URL assoluto e "pulito" della pagina (senza query, hash o barra finale). */
export function urlCanonico(percorso) {
  const p = normalizzaPercorso(percorso);
  return `${SITO.url}${p}`;
}

export function applicaMeta({ percorso, titolo, descrizione, tipo = 'website', robots }) {
  const url = urlCanonico(percorso);
  const immagine = `${SITO.url}${SITO.immagineSocial}`;

  document.title = titolo;
  metaNome('description', descrizione);
  metaNome('robots', valoreRobots(robots));
  tag('link[rel="canonical"]', () => Object.assign(document.createElement('link'), { rel: 'canonical' })).setAttribute('href', url);

  metaProprieta('og:type', tipo);
  metaProprieta('og:site_name', SITO.nome);
  metaProprieta('og:locale', SITO.locale);
  metaProprieta('og:url', url);
  metaProprieta('og:title', titolo);
  metaProprieta('og:description', descrizione);
  metaProprieta('og:image', immagine);
  metaNome('twitter:card', 'summary_large_image');
  metaNome('twitter:title', titolo);
  metaNome('twitter:description', descrizione);
  metaNome('twitter:image', immagine);
}
