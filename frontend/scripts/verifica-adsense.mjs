/**
 * verifica-adsense.mjs — eseguito a ogni build (vedi "build" in package.json).
 *
 * Controlla che OGNI pagina HTML del sito pubblicato (cartella dist/) abbia lo
 * snippet di Google AdSense dentro <head>. Se ne manca anche una, esce con
 * errore e la pubblicazione su Netlify si ferma (il sito online resta quello
 * precedente): meglio un deploy bloccato con un messaggio chiaro che una
 * pagina senza pubblicità scoperta settimane dopo.
 *
 * Non serve toccarlo quando si creano nuove pagine React (usano tutte
 * index.html). Serve solo se si aggiunge un file .html a parte.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const CARTELLA = process.argv[2] || fileURLToPath(new URL('../dist', import.meta.url));
const SNIPPET = 'pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-8142312526608548';
// File di verifica proprietà di Google (google1234abcd.html): sono solo testo,
// non pagine del sito, e devono restare esattamente come li fornisce Google.
const ESCLUSI = /^google[0-9a-f]+\.html$/i;

function paginaHtml(cartella) {
  return readdirSync(cartella).flatMap((nome) => {
    const percorso = join(cartella, nome);
    if (statSync(percorso).isDirectory()) return paginaHtml(percorso);
    return nome.toLowerCase().endsWith('.html') && !ESCLUSI.test(nome) ? [percorso] : [];
  });
}

function haSnippetNelHead(html) {
  const head = html.match(/<head[\s>][\s\S]*?<\/head>/i);
  return head !== null && head[0].includes(SNIPPET);
}

const pagine = paginaHtml(CARTELLA);
if (pagine.length === 0) {
  console.error(`verifica-adsense: nessuna pagina HTML trovata in ${CARTELLA}: build incompleta?`);
  process.exit(1);
}
const senza = pagine.filter((p) => !haSnippetNelHead(readFileSync(p, 'utf-8')));
if (senza.length > 0) {
  console.error('\nERRORE: lo snippet Google AdSense manca dal <head> di queste pagine:');
  senza.forEach((p) => console.error(`  - ${relative(CARTELLA, p)}`));
  console.error('\nIncolla lo stesso snippet di frontend/index.html nel <head> di ognuna, poi rifai la build.\n');
  process.exit(1);
}
console.log(`verifica-adsense: OK, snippet presente nel <head> di ${pagine.length} pagina/e HTML.`);
