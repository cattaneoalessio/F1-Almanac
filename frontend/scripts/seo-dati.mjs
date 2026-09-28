/**
 * seo-dati.mjs — contenuto dei file per i motori di ricerca e gli assistenti AI
 * (robots.txt, sitemap.xml, llms.txt, _headers) e valore del meta "robots".
 * Funzioni pure: il plugin di build (plugin-seo.mjs) le usa per scrivere i file
 * in dist/, e verifica-seo.mjs per controllarli. Tutto dipende da UN solo
 * interruttore, `pubblico` (variabile d'ambiente SITO_PUBBLICO su Netlify).
 */
import { SITO, ROBOTS_NON_PUBBLICO } from '../src/config/sito.js';

/** Pagine con indirizzo fisso, da mettere in sitemap. Se aggiungi una pagina
 * in App.jsx con un percorso fisso, aggiungila anche qui (o in ROTTE_ESCLUSE):
 * verifica-seo.mjs lo controlla a ogni build. */
export const ROTTE_SITEMAP = [
  '/', '/piloti', '/scuderie', '/circuiti', '/news', '/analisi', '/arcade', '/arcade/chronoquiz',
  '/arcade/time-attack', '/idols', '/idols/senna', '/idols/schumacher', '/idols/hamilton', '/privacy',
];
/** Percorsi fissi di App.jsx volutamente FUORI dalla sitemap (amministrazione, ecc.). */
export const ROTTE_ESCLUSE = ['/admin/chiudi-gp'];

/** Le stagioni dell'archivio: /archivio/1950 … /archivio/<anno in corso>. */
export function pagineArchivio(annoCorrente = new Date().getFullYear()) {
  const pagine = [];
  for (let anno = 1950; anno <= annoCorrente; anno += 1) pagine.push(`/archivio/${anno}`);
  return pagine;
}

/** Sezioni descritte in llms.txt (titolo, percorso, cosa contiene). */
const SEZIONI_LLMS = [
  ['Archivio storico', '/archivio/2026', 'Classifiche piloti e costruttori e calendario di ogni stagione dal 1950; risultati di ogni Gran Premio.'],
  ['Piloti', '/piloti', 'Tutti i piloti della storia della F1: carriera, vittorie, punti e risultati.'],
  ['Scuderie', '/scuderie', 'Le scuderie e i costruttori, con piloti, gare e risultati.'],
  ['Circuiti', '/circuiti', 'I circuiti: tracciato, storia, curve, vincitori e albo d\'oro.'],
  ['Analisi GP', '/analisi', 'Telemetria comparativa, strategie gomme e ritmo gara dei Gran Premi dal 2023.'],
  ['News', '/news', 'Notizie dal mondo della Formula 1.'],
  ['Idols', '/idols', 'Approfondimenti sui piloti leggendari.'],
  ['Arcade', '/arcade', 'Giochi e quiz sulla storia della Formula 1.'],
];

/** Meta tag "robots" per l'HTML. */
export function robotsMeta({ pubblico }) {
  return pubblico ? 'index, follow, max-image-preview:large' : ROBOTS_NON_PUBBLICO;
}

/** Bot di intelligenza artificiale (addestramento e ricerca AI). Usati per il
 * blocco esplicito quando il sito non è pubblico. */
const BOT_AI = [
  'GPTBot', 'ChatGPT-User', 'OAI-SearchBot', 'ClaudeBot', 'Claude-Web', 'anthropic-ai', 'Google-Extended',
  'PerplexityBot', 'CCBot', 'Bytespider', 'Amazonbot', 'Applebot-Extended', 'cohere-ai', 'Meta-ExternalAgent',
  'FacebookBot', 'Diffbot', 'ImagesiftBot',
];

export function contenutoRobots({ pubblico }) {
  if (!pubblico) {
    return `# ============================================================================
# ${SITO.nome} — SITO NON ANCORA PUBBLICO
# Nessuna indicizzazione: né motori di ricerca né bot di intelligenza artificiale.
#
# Per aprire il sito ai motori di ricerca: imposta SITO_PUBBLICO=true nelle
# variabili d'ambiente di Netlify e ripubblica (guida: PRE-PUBBLICAZIONE.md),
# poi in Google Search Console invia la sitemap ${SITO.url}/sitemap.xml
# ============================================================================
User-agent: *
Disallow: /
Allow: /ads.txt

${BOT_AI.map((bot) => `User-agent: ${bot}\nDisallow: /`).join('\n\n')}

# Crawler di AdSense: NON sono motori di ricerca e non indicizzano nulla, ma servono a
# Google per verificare il sito, leggere ads.txt e valutarne i contenuti. Se li blocchi,
# la richiesta di approvazione non può completarsi e AdSense segnala "ads.txt non trovato".
User-agent: Mediapartners-Google
Allow: /

User-agent: Google-adstxt
Allow: /

User-agent: Google-Display-Ads-Bot
Allow: /
`;
  }
  return `# ${SITO.nome} — sito pubblico
User-agent: *
Allow: /
Disallow: /admin/

# Bot di intelligenza artificiale: decisione del gestore. Per vietare
# l'addestramento dei modelli sui contenuti, togli il "#" davanti a queste righe.
${BOT_AI.map((bot) => `# User-agent: ${bot}\n# Disallow: /`).join('\n')}

Sitemap: ${SITO.url}/sitemap.xml
`;
}

const XML_ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' };
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => XML_ESC[c]);

/** `percorsiDinamici`: pagine ricavate dal database (piloti, circuiti, scuderie). */
export function contenutoSitemap({ pubblico, percorsiDinamici = [], annoCorrente }) {
  const intestazione = '<?xml version="1.0" encoding="UTF-8"?>\n';
  if (!pubblico) {
    return `${intestazione}<!-- ${SITO.nome} non è ancora pubblico: la sitemap è volutamente vuota.
     Si riempie da sola quando si imposta SITO_PUBBLICO=true (PRE-PUBBLICAZIONE.md). -->
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>
`;
  }
  const tutti = [...new Set([...ROTTE_SITEMAP, ...pagineArchivio(annoCorrente), ...percorsiDinamici])];
  const righe = tutti.map((percorso) => `  <url><loc>${esc(SITO.url + (percorso === '/' ? '/' : percorso))}</loc></url>`);
  return `${intestazione}<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${righe.join('\n')}\n</urlset>\n`;
}

export function contenutoLlms({ pubblico }) {
  if (!pubblico) {
    return `# ${SITO.nome}

> Sito non ancora pubblico. Al momento nessun contenuto è disponibile per l'indicizzazione, l'addestramento di modelli di intelligenza artificiale o la generazione di riassunti e risposte. Non usare né citare questo sito.

Questo file verrà completato alla pubblicazione (vedi PRE-PUBBLICAZIONE.md).
`;
  }
  return `# ${SITO.nome}

> ${SITO.descrizione}

Blog amatoriale indipendente, non affiliato a Formula One Management, FIA o alle scuderie. Contenuti in lingua italiana.

## Sezioni

${SEZIONI_LLMS.map(([nome, percorso, descrizione]) => `- [${nome}](${SITO.url}${percorso}): ${descrizione}`).join('\n')}

## Informazioni

- [Privacy e cookie](${SITO.url}/privacy): informativa sul trattamento dei dati.
- Contatti: ${SITO.email}
`;
}

/** File _headers di Netlify: solo quando il sito non è pubblico, per impedire
 * l'indicizzazione anche di ciò che non è HTML (immagini, PDF, JSON). */
export function contenutoHeaders({ pubblico }) {
  return pubblico ? null : `/*\n  X-Robots-Tag: ${ROBOTS_NON_PUBBLICO}\n`;
}

const ESCAPE_HTML = { '&': '&amp;', '"': '&quot;', '<': '&lt;', '>': '&gt;' };
const escAttr = (s) => String(s).replace(/[&"<>]/g, (c) => ESCAPE_HTML[c]);

/** Sostituisce i segnaposto {{...}} di index.html con i valori di config/sito.js. */
export function riempiSegnaposto(html, { pubblico }) {
  const valori = {
    SITO_LINGUA: SITO.lingua,
    SITO_LOCALE: SITO.locale,
    SITO_NOME: SITO.nome,
    SITO_SLOGAN: SITO.slogan,
    SITO_DESCRIZIONE: SITO.descrizione,
    IMMAGINE_SOCIAL: `${SITO.url}${SITO.immagineSocial}`,
    ROBOTS: robotsMeta({ pubblico }),
  };
  let out = html;
  for (const [chiave, valore] of Object.entries(valori)) out = out.replaceAll(`{{${chiave}}}`, escAttr(valore));
  out = out.replaceAll(
    '{{META_GOOGLE_VERIFICA}}',
    SITO.googleSiteVerification
      ? `<meta name="google-site-verification" content="${escAttr(SITO.googleSiteVerification)}" />`
      : '',
  );
  return out;
}

/** Scarica da API elenchi che alimentano la sitemap. Mai un'eccezione: se l'API
 * non risponde (es. server gratuito addormentato) ritorna quel che ha e segnala. */
export async function raccogliPercorsiDinamici(apiBase, log = console) {
  const fonti = [['/piloti', 'piloti'], ['/circuiti', 'circuiti'], ['/scuderie', 'scuderie']];
  const percorsi = [];
  if (!apiBase) {
    log.warn('[seo] VITE_API_BASE_URL non impostata: la sitemap non conterrà piloti, circuiti e scuderie.');
    return percorsi;
  }
  for (const [endpoint, sezione] of fonti) {
    let riuscito = false;
    for (let tentativo = 1; tentativo <= 3 && !riuscito; tentativo += 1) {
      try {
        const risposta = await fetch(`${apiBase}${endpoint}`, { signal: AbortSignal.timeout(60000) });
        if (!risposta.ok) throw new Error(`HTTP ${risposta.status}`);
        const elenco = await risposta.json();
        for (const voce of elenco) if (voce.slug) percorsi.push(`/${sezione}/${encodeURIComponent(voce.slug)}`);
        riuscito = true;
      } catch (errore) {
        log.warn(`[seo] ${endpoint}: tentativo ${tentativo}/3 fallito (${errore.message})`);
      }
    }
    if (!riuscito) log.warn(`[seo] ATTENZIONE: la sitemap NON conterrà le pagine di /${sezione}.`);
  }
  return percorsi;
}
