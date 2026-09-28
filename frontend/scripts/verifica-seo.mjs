/**
 * verifica-seo.mjs — eseguito a ogni build (dopo verifica-adsense.mjs).
 * Controlla che indicizzazione e file SEO in dist/ siano COERENTI con
 * l'interruttore SITO_PUBBLICO. L'errore da evitare è lasciarne una parte
 * aperta e una chiusa (es. sito pubblico ma con un noindex dimenticato, o
 * non pubblico ma con la sitemap piena): in entrambi i casi la build fallisce.
 *
 * Uso: node scripts/verifica-seo.mjs [cartella_dist]   (SITO_PUBBLICO da ambiente)
 */
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { SITO, ROBOTS_NON_PUBBLICO } from '../src/config/sito.js';
import { ROTTE_ESCLUSE, ROTTE_SITEMAP } from './seo-dati.mjs';

const RADICE = fileURLToPath(new URL('..', import.meta.url));
const DIST = resolve(process.argv[2] || resolve(RADICE, 'dist'));
const pubblico = process.env.SITO_PUBBLICO === 'true';

const errori = [];
const avvisi = [];
const leggi = (nome) => (existsSync(resolve(DIST, nome)) ? readFileSync(resolve(DIST, nome), 'utf-8') : null);
const controlla = (condizione, messaggio) => { if (!condizione) errori.push(messaggio); };

// ---- index.html ----
const html = leggi('index.html');
controlla(html !== null, 'dist/index.html non trovato');
if (html) {
  controlla(!/\{\{[A-Z_]+\}\}/.test(html), 'index.html contiene segnaposto {{...}} non sostituiti');
  const robots = html.match(/<meta name="robots" content="([^"]*)"/)?.[1];
  controlla(robots !== undefined, 'index.html: manca <meta name="robots">');
  if (robots !== undefined) {
    if (pubblico) controlla(!/noindex|nofollow/i.test(robots), `sito PUBBLICO ma index.html ha robots="${robots}"`);
    else controlla(robots === ROBOTS_NON_PUBBLICO, `sito NON pubblico ma index.html ha robots="${robots}" (atteso "${ROBOTS_NON_PUBBLICO}")`);
  }
  controlla(/<html lang="it"/.test(html), 'index.html: manca lang="it"');
  controlla(/<title>[^<]{10,}<\/title>/.test(html), 'index.html: titolo mancante o troppo corto');
  const descrizione = html.match(/<meta name="description" content="([^"]*)"/)?.[1] || '';
  controlla(descrizione.length >= 70 && descrizione.length <= 170, `index.html: descrizione di ${descrizione.length} caratteri (attesi 70-170)`);
  controlla(/property="og:image" content="https:\/\//.test(html), 'index.html: og:image mancante o non assoluto');
  controlla(!/rel="canonical"/.test(html), 'index.html: NON deve avere un canonical fisso (punterebbe ogni pagina alla home)');
  controlla(!/monoposto\.ai/i.test(html), 'index.html: compare il vecchio nome "monoposto.ai"');
}

// ---- robots.txt / sitemap / llms / _headers ----
const robotsTxt = leggi('robots.txt');
const sitemap = leggi('sitemap.xml');
const llms = leggi('llms.txt');
const headers = leggi('_headers');
controlla(robotsTxt !== null && sitemap !== null && llms !== null, 'mancano robots.txt, sitemap.xml o llms.txt in dist/');
if (robotsTxt && sitemap && llms) {
  const righeSitemap = (sitemap.match(/<loc>/g) || []).length;
  if (pubblico) {
    controlla(!/^Disallow:\s*\/\s*$/m.test(robotsTxt.split(/^User-agent: Mediapartners/m)[0]), 'sito PUBBLICO ma robots.txt blocca tutto (Disallow: /)');
    controlla(robotsTxt.includes(`Sitemap: ${SITO.url}/sitemap.xml`), 'sito PUBBLICO: robots.txt non indica la sitemap');
    controlla(righeSitemap >= ROTTE_SITEMAP.length, `sito PUBBLICO: la sitemap ha solo ${righeSitemap} indirizzi`);
    controlla(headers === null || !/noindex/i.test(headers), 'sito PUBBLICO ma _headers contiene X-Robots-Tag noindex');
    controlla(/\]\(https:\/\//.test(llms), 'sito PUBBLICO: llms.txt senza collegamenti alle sezioni');
    const urlErrati = [...sitemap.matchAll(/<loc>([^<]*)<\/loc>/g)].map((m) => m[1]).filter((u) => !u.startsWith(`${SITO.url}/`));
    controlla(urlErrati.length === 0, `sitemap: indirizzi fuori dal dominio ${SITO.url}: ${urlErrati.slice(0, 3).join(', ')}`);
    const tutti = [...sitemap.matchAll(/<loc>([^<]*)<\/loc>/g)].map((m) => m[1]);
    controlla(new Set(tutti).size === tutti.length, 'sitemap: indirizzi duplicati');
    const dinamici = tutti.filter((u) => /\/(piloti|circuiti|scuderie)\/[^/]+$/.test(u)).length;
    if (dinamici === 0) avvisi.push('la sitemap NON contiene schede di piloti, circuiti e scuderie (API non raggiunta durante la build?). Il sito è pubblico ma la sitemap è incompleta.');
  } else {
    controlla(/^User-agent: \*\s*\nDisallow: \/\s*$/m.test(robotsTxt), 'sito NON pubblico ma robots.txt non blocca tutto');
    controlla(!/^Sitemap:/m.test(robotsTxt), 'sito NON pubblico ma robots.txt indica una sitemap');
    controlla(righeSitemap === 0, `sito NON pubblico ma la sitemap contiene ${righeSitemap} indirizzi`);
    controlla(headers !== null && /X-Robots-Tag:.*noindex/i.test(headers), 'sito NON pubblico ma manca _headers con X-Robots-Tag noindex');
    controlla(/non ancora pubblico/i.test(llms) && !/\]\(https:\/\//.test(llms), 'sito NON pubblico ma llms.txt descrive contenuti come disponibili');
  }
}

// ---- le pagine di App.jsx sono tutte in sitemap (o escluse di proposito)? ----
const app = readFileSync(resolve(RADICE, 'src/App.jsx'), 'utf-8');
const percorsiApp = [...app.matchAll(/<Route[^>]*\bpath="([^"]+)"/g)].map((m) => m[1]).filter((p) => !p.includes(':') && p !== '*');
const dimenticate = percorsiApp.filter((p) => !ROTTE_SITEMAP.includes(p) && !ROTTE_ESCLUSE.includes(p));
if (dimenticate.length > 0) {
  const msg = `pagine in App.jsx non presenti in scripts/seo-dati.mjs (ROTTE_SITEMAP o ROTTE_ESCLUSE): ${dimenticate.join(', ')}`;
  if (pubblico) errori.push(msg); else avvisi.push(msg);
}
const inesistenti = ROTTE_SITEMAP.filter((p) => !percorsiApp.includes(p));
if (inesistenti.length > 0) avvisi.push(`in ROTTE_SITEMAP ma non più in App.jsx: ${inesistenti.join(', ')}`);

avvisi.forEach((a) => console.warn(`verifica-seo: ATTENZIONE — ${a}`));
if (errori.length > 0) {
  console.error('\nERRORE verifica-seo: indicizzazione incoerente.');
  errori.forEach((e) => console.error(`  - ${e}`));
  console.error('');
  process.exit(1);
}
console.log(`verifica-seo: OK, sito ${pubblico ? 'PUBBLICO' : 'NON pubblico'}: index.html, robots.txt, sitemap.xml, llms.txt${pubblico ? '' : ', _headers'} coerenti.`);
