/**
 * sito.js — dati d'identità del sito, in UN solo punto. Nome, dominio e
 * contatti si cambiano qui e valgono ovunque (titoli, meta tag, piè di pagina,
 * privacy, sitemap…): non ripeterli a mano nel codice.
 */
export const SITO = {
  nome: 'Monoposto.io',
  dominio: 'monoposto.io',
  url: 'https://monoposto.io', // senza barra finale: è la base di canonical, Open Graph e sitemap
  slogan: "L'almanacco della Formula 1",
  descrizione:
    'Monoposto.io: risultati, classifiche, piloti, scuderie e circuiti della Formula 1 dal 1950 a oggi, con analisi di telemetria dei Gran Premi.',
  email: 'info@monoposto.io',
  lingua: 'it',
  locale: 'it_IT',
  immagineSocial: '/og-image.png', // 1200×630: anteprima quando si condivide un link
  instagramUrl: 'https://www.instagram.com/monoposto.io/',
  googleSiteVerification: '', // codice "meta tag HTML" di Search Console: se vuoto, il tag non viene inserito
};

/**
 * Il sito è PUBBLICO (indicizzabile dai motori di ricerca)? Vale false finché
 * non si imposta la variabile d'ambiente SITO_PUBBLICO=true su Netlify: un solo
 * interruttore governa robots.txt, sitemap, llms.txt, intestazioni HTTP e meta
 * tag "robots" (vedi vite.config.js e PRE-PUBBLICAZIONE.md). Il valore
 * predefinito è "non pubblico": dimenticarsi l'interruttore è sicuro.
 */
export const SITO_PUBBLICO = typeof __SITO_PUBBLICO__ !== 'undefined' ? __SITO_PUBBLICO__ : false;

/** Valore del meta tag / intestazione "robots" quando il sito NON è pubblico. */
export const ROBOTS_NON_PUBBLICO = 'noindex, nofollow, noarchive, nosnippet, noimageindex';
