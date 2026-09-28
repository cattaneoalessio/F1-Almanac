/**
 * plugin-seo.mjs — plugin di Vite. Fa due cose, entrambe guidate dall'unico
 * interruttore `pubblico` (SITO_PUBBLICO):
 *  1) riempie i segnaposto {{...}} di index.html (nome, descrizione, meta
 *     robots, Open Graph…) con i valori di src/config/sito.js;
 *  2) a fine build scrive in dist/ robots.txt, sitemap.xml, llms.txt e (solo se
 *     il sito non è pubblico) _headers con X-Robots-Tag.
 */
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  contenutoHeaders, contenutoLlms, contenutoRobots, contenutoSitemap, raccogliPercorsiDinamici, riempiSegnaposto,
} from './seo-dati.mjs';

export function pluginSeo({ pubblico, apiBase }) {
  let cartellaUscita;
  return {
    name: 'monoposto-seo',
    configResolved(config) {
      cartellaUscita = resolve(config.root, config.build.outDir);
    },
    transformIndexHtml: {
      order: 'pre',
      handler: (html) => riempiSegnaposto(html, { pubblico }),
    },
    async closeBundle() {
      if (!cartellaUscita) return;
      const percorsiDinamici = pubblico ? await raccogliPercorsiDinamici(apiBase) : [];
      const scrivi = (nome, contenuto) => writeFileSync(resolve(cartellaUscita, nome), contenuto, 'utf-8');
      scrivi('robots.txt', contenutoRobots({ pubblico }));
      scrivi('sitemap.xml', contenutoSitemap({ pubblico, percorsiDinamici }));
      scrivi('llms.txt', contenutoLlms({ pubblico }));
      const headers = contenutoHeaders({ pubblico });
      if (headers) scrivi('_headers', headers);
      console.log(`[seo] sito ${pubblico ? 'PUBBLICO: indicizzabile' : 'NON pubblico: noindex ovunque'} — file scritti in dist/`);
    },
  };
}
