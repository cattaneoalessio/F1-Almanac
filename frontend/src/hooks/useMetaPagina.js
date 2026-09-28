import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { SITO } from '../config/sito.js';
import { applicaMeta } from '../utils/meta.js';
import { metaPerPercorso } from '../utils/metaPagina.js';

/**
 * useMetaPagina({ titolo, descrizione, robots }) — affina i meta tag della
 * pagina quando i suoi dati sono noti (es. il nome del pilota). Ogni campo è
 * facoltativo; quelli omessi restano i predefiniti della sezione.
 *   robots: 'noindex' per le pagine che non devono comparire nei motori di
 *   ricerca anche a sito pubblico (pagina non trovata, amministrazione, schede vuote).
 * Se `titolo` è passato senza il nome del sito, viene aggiunto in coda.
 * Va chiamato con valori già pronti (o non chiamato con undefined): finché
 * mancano, restano i predefiniti.
 */
export function useMetaPagina({ titolo, descrizione, robots, tipo } = {}) {
  const { pathname } = useLocation();
  useEffect(() => {
    if (!titolo && !descrizione && !robots) return;
    const base = metaPerPercorso(pathname);
    applicaMeta({
      percorso: pathname,
      ...base,
      ...(titolo ? { titolo: titolo.includes(SITO.nome) ? titolo : `${titolo} — ${SITO.nome}` } : {}),
      ...(descrizione ? { descrizione } : {}),
      ...(tipo ? { tipo } : {}),
      robots,
    });
  }, [pathname, titolo, descrizione, robots, tipo]);
}
