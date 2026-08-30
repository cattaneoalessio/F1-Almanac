#!/usr/bin/env node
/**
 * fetch-pirelli.js — legge i feed RSS pubblici di Pirelli F1 Press Area
 * (italiano e inglese) e aggiorna src/data/pirelli-news.json con
 * titolo, data, estratto e link all'articolo originale.
 *
 * COSA NON FA, DI PROPOSITO (letto prima di scrivere questo script):
 * - Non scarica né rihosta immagini. Le foto del feed stampa Pirelli
 *   sono soggette a copyright "tutti i diritti riservati" (verificato
 *   sulle pagine legali di pirelli.com: riproduzione/distribuzione
 *   vietata senza permesso scritto, nessuna licenza Creative Commons),
 *   quindi copiarle sul nostro server per un sito monetizzato con ads
 *   sarebbe un rischio di violazione di copyright reale, non solo
 *   teorico. Una didascalia "courtesy of" è un'attribuzione, non una
 *   licenza: non basta.
 * - Non riscrive i testi con l'AI. Un semplice script Node non ha
 *   intelligenza propria: userebbe solo l'"estratto" (<description>)
 *   che Pirelli stessa pubblica nel feed apposta per essere ripreso da
 *   terzi (è lo scopo di un RSS feed), pulito da tag HTML e tagliato a
 *   una lunghezza fissa. Non è un riassunto "riscritto in originale":
 *   è il loro estratto, con link all'articolo integrale e attribuzione
 *   "Fonte: Pirelli" — uso lecito in stile aggregatore di notizie, ma
 *   diverso da un riassunto scritto da zero. Per un vero riassunto
 *   riscritto servirebbe una chiamata a un'API di AI (costo + chiave
 *   da configurare), non inclusa qui.
 *
 * Uso: node scripts/fetch-pirelli.js   (Node 18+, usa solo built-in:
 * nessuna dipendenza da installare, "rss-parser" non serve per un
 * parsing così semplice).
 */

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT_PATH = path.join(__dirname, '..', 'src', 'data', 'pirelli-news.json');

// Numero massimo di notizie tenute nel JSON (le più vecchie escono man
// mano che arrivano nuovi articoli): evita che il file cresca all'infinito.
const MAX_NOTIZIE = 40;
// Lunghezza massima dell'estratto. Il conteggio "15 righe" dipende da
// quanto è largo il contenitore nel sito (non è una misura che uno
// script possa calcolare in astratto): questo è un limite in caratteri
// pensato per restare comodamente entro 15 righe in una card normale.
const MAX_CARATTERI_ESTRATTO = 700;

const FEEDS = [
  { lingua: 'it', url: 'https://f1pressarea.pirelli.com/feed/it' },
  { lingua: 'en', url: 'https://f1pressarea.pirelli.com/feed/en' },
];

// Tabella delle entità HTML nominate più comuni nei feed WordPress in
// italiano: oltre alle tipografiche (virgolette, trattini), servono
// tutte le vocali accentate perché in alcuni feed compaiono come
// entità invece che come carattere UTF-8 diretto (es. "pi&ugrave;"
// invece di "più") — un bug reale trovato testando lo script contro un
// feed finto prima di consegnarlo, non un'ipotesi.
const ENTITA_NOMINATE = {
  agrave: 'à', Agrave: 'À', egrave: 'è', Egrave: 'È', igrave: 'ì', Igrave: 'Ì',
  ograve: 'ò', Ograve: 'Ò', ugrave: 'ù', Ugrave: 'Ù',
  eacute: 'é', Eacute: 'É', oacute: 'ó', Oacute: 'Ó', iacute: 'í', Iacute: 'Í', aacute: 'á', Aacute: 'Á',
  acirc: 'â', ecirc: 'ê', icirc: 'î', ocirc: 'ô', ucirc: 'û',
  ccedil: 'ç', Ccedil: 'Ç', ntilde: 'ñ', Ntilde: 'Ñ',
  rsquo: '’', lsquo: '‘', ldquo: '“', rdquo: '”', ndash: '–', mdash: '—', hellip: '…',
  nbsp: ' ', amp: '&', quot: '"', apos: "'", lt: '<', gt: '>',
};

function decodeEntitaHtml(testo) {
  return testo
    // Entità numeriche decimali (&#8217;) ed esadecimali (&#x2019;),
    // qualunque carattere Unicode rappresentino.
    .replace(/&#(\d+);/g, (_, codice) => String.fromCodePoint(Number(codice)))
    .replace(/&#[xX]([0-9a-fA-F]+);/g, (_, codice) => String.fromCodePoint(parseInt(codice, 16)))
    // Entità nominate della tabella sopra.
    .replace(/&([a-zA-Z]+);/g, (originale, nome) => ENTITA_NOMINATE[nome] ?? originale);
}

function pulisciTesto(grezzo) {
  if (!grezzo) return '';
  let testo = grezzo.trim();
  // Rimuove un eventuale wrapper CDATA rimasto (la regex sotto lo toglie
  // già nella maggior parte dei casi, questo è solo un fallback).
  testo = testo.replace(/^<!\[CDATA\[/, '').replace(/\]\]>$/, '');
  testo = testo.replace(/<[^>]+>/g, ' '); // via i tag HTML (<p>, <a>, ecc.)
  testo = decodeEntitaHtml(testo);
  testo = testo.replace(/\s+/g, ' ').trim();
  return testo;
}

function estraiCampo(bloccoItem, nomeTag) {
  const conCdata = new RegExp(`<${nomeTag}>\\s*<!\\[CDATA\\[([\\s\\S]*?)\\]\\]>\\s*<\\/${nomeTag}>`, 'i');
  const senzaCdata = new RegExp(`<${nomeTag}>([\\s\\S]*?)<\\/${nomeTag}>`, 'i');
  const match = bloccoItem.match(conCdata) || bloccoItem.match(senzaCdata);
  return match ? match[1].trim() : null;
}

function tagliaEstratto(testo) {
  if (testo.length <= MAX_CARATTERI_ESTRATTO) return testo;
  const tagliato = testo.slice(0, MAX_CARATTERI_ESTRATTO);
  const ultimoSpazio = tagliato.lastIndexOf(' ');
  return `${tagliato.slice(0, ultimoSpazio > 0 ? ultimoSpazio : MAX_CARATTERI_ESTRATTO)}…`;
}

/** Id stabile per una notizia, usato per evitare duplicati tra le
 * esecuzioni: basato sul link (unico per articolo), non sul titolo
 * (che in teoria potrebbe ripetersi). */
function idDaLink(link) {
  return link.replace(/^https?:\/\//, '').replace(/\/+$/, '');
}

async function scaricaFeed({ lingua, url }) {
  console.log(`Scarico il feed ${lingua}: ${url}`);
  const risposta = await fetch(url, {
    headers: { 'User-Agent': 'gp-almanac-news-fetcher/1.0 (+https://f1-almanac.netlify.app)' },
  });
  if (!risposta.ok) {
    throw new Error(`Feed ${lingua} non raggiungibile: HTTP ${risposta.status}`);
  }
  const xml = await risposta.text();

  const blocchiItem = xml.match(/<item>[\s\S]*?<\/item>/g) || [];
  console.log(`  trovati ${blocchiItem.length} articoli nel feed ${lingua}`);

  return blocchiItem.map((blocco) => {
    const titoloGrezzo = estraiCampo(blocco, 'title');
    const link = estraiCampo(blocco, 'link');
    const pubDateGrezza = estraiCampo(blocco, 'pubDate');
    const descrizioneGrezza = estraiCampo(blocco, 'description');

    const dataIso = pubDateGrezza ? new Date(pubDateGrezza).toISOString() : null;

    return {
      id: idDaLink(link || titoloGrezzo || String(Math.random())),
      lingua,
      titolo: pulisciTesto(titoloGrezzo),
      link,
      data: dataIso,
      estratto: tagliaEstratto(pulisciTesto(descrizioneGrezza)),
      fonte: 'Pirelli',
    };
  });
}

async function main() {
  let notizieEsistenti = [];
  try {
    const contenuto = await readFile(OUTPUT_PATH, 'utf-8');
    notizieEsistenti = JSON.parse(contenuto);
  } catch (errore) {
    if (errore.code !== 'ENOENT') throw errore;
    console.log('Nessun pirelli-news.json esistente, ne creo uno nuovo.');
  }

  const risultatiFeed = await Promise.allSettled(FEEDS.map(scaricaFeed));

  const nuoveNotizie = [];
  for (const [indice, risultato] of risultatiFeed.entries()) {
    if (risultato.status === 'fulfilled') {
      nuoveNotizie.push(...risultato.value);
    } else {
      // Un feed irraggiungibile non deve far fallire l'intero
      // aggiornamento: si tiene quello che si riesce a scaricare e si
      // segnala chiaramente l'errore nei log della Action.
      console.error(`Errore sul feed ${FEEDS[indice].lingua}:`, risultato.reason.message);
    }
  }

  if (nuoveNotizie.length === 0 && notizieEsistenti.length === 0) {
    throw new Error('Nessun feed raggiungibile e nessun dato precedente: interrompo senza scrivere un file vuoto.');
  }

  const perId = new Map();
  // Prima le notizie esistenti, poi quelle nuove sopra: se un articolo è
  // già presente, la versione nuova (più aggiornata) sovrascrive quella
  // vecchia mantenendo comunque un solo record per id.
  for (const notizia of notizieEsistenti) perId.set(notizia.id, notizia);
  for (const notizia of nuoveNotizie) perId.set(notizia.id, notizia);

  const tutte = Array.from(perId.values())
    .sort((a, b) => new Date(b.data || 0) - new Date(a.data || 0))
    .slice(0, MAX_NOTIZIE);

  await mkdir(path.dirname(OUTPUT_PATH), { recursive: true });
  await writeFile(OUTPUT_PATH, `${JSON.stringify(tutte, null, 2)}\n`, 'utf-8');

  console.log(`Scritte ${tutte.length} notizie in ${path.relative(process.cwd(), OUTPUT_PATH)}`);
  console.log(`(${nuoveNotizie.length} lette dai feed in questa esecuzione, ${notizieEsistenti.length} già presenti prima)`);
}

main().catch((errore) => {
  console.error('fetch-pirelli.js: errore fatale:', errore);
  process.exitCode = 1;
});
