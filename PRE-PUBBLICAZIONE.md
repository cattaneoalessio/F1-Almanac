# Prima di pubblicare monoposto.io — lista di controllo

Il sito, oggi, è **volutamente invisibile ai motori di ricerca** (nessuna
indicizzazione, nemmeno dei bot di intelligenza artificiale). Questa lista dice
cosa verificare e come "aprirlo" quando sarà il momento. Spunta man mano.

## 1. Dati da verificare (promemoria)

- [ ] **Titolare della privacy**: oggi sono `Alessio Cattaneo` e `info@monoposto.io`,
      inseriti provvisoriamente. Confermare nome (o denominazione, se il sito sarà
      gestito da una ditta/associazione/società, con sede e P.IVA se dovute) e che
      la casella `info@monoposto.io` esista e venga letta. File: `frontend/src/data/titolare.js`.
- [ ] **n8n**: scrivere cosa tratta davvero. Nell'informativa è descritto solo come
      "strumento di automazione usato dal gestore" e non compare nel codice del sito.
      Se un'automazione riceve dati personali dei visitatori (es. iscrizioni, moduli,
      email), va dichiarato nell'informativa (`frontend/src/views/PrivacyView.jsx`).
- [ ] **Instagram**: inserire l'indirizzo del profilo in `frontend/src/config/sito.js`
      (`instagramUrl`). Finché è vuoto non compare nessun link nel sito.
- [ ] **Logo con la scritta ".AI"**: il file `frontend/public/branding/monoposto-logo-completo.png`
      contiene ancora il vecchio nome. Il sito non lo mostra, ma è pubblico a quell'indirizzo:
      farlo rifare con ".IO" o rimuoverlo.
- [ ] **Immagine di anteprima social** (`frontend/public/og-image.png`): è provvisoria (font
      diverso da quello del sito). Sostituirla con la versione definitiva, 1200×630.
- [ ] **Username pubblico**: se un utente non imposta un nome, nelle classifiche dei giochi
      compare la parte della sua email prima della "@". Da correggere (nickname obbligatorio
      o nome generato). File: `backend/api/auth.py`.

## 2. Dominio e servizi

- [ ] Dominio `monoposto.io` collegato al sito su Netlify (DNS e HTTPS attivi).
- [ ] **Backend**: dopo il push, controllare che Render abbia pubblicato la modifica che
      aggiunge `https://monoposto.io` e `https://www.monoposto.io` all'elenco CORS
      (`backend/api/main.py`). Senza, dal nuovo dominio il sito appare vuoto.
- [ ] Facoltativo: aggiornare su Render la variabile `NETLIFY_IDENTITY_URL` al nuovo dominio.
- [ ] AdSense: aggiungere il sito `monoposto.io` nel pannello. Se il pannello dice "non è
      stato trovato alcun file ads.txt": il file è in `frontend/public/ads.txt`; controlla da
      terminale che il sito lo serva davvero (deve stampare la riga `google.com, pub-…, DIRECT, …`):
      `curl -iL https://monoposto.io/ads.txt` e, per simulare il crawler di Google,
      `curl -iL -A "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)" https://monoposto.io/ads.txt`.
      Se risponde correttamente non c'è altro da fare: Google rilegge il file di sua iniziativa,
      di solito entro 24 ore, a volte qualche giorno (il rapporto del crawler AdSense è settimanale).
      Il file va controllato sul dominio esatto aggiunto in AdSense (`monoposto.io` e
      `www.monoposto.io` sono per Google due siti diversi). Il `robots.txt` deve lasciare entrare
      i crawler di AdSense: la build lo verifica.

## 3. Aprire il sito ai motori di ricerca (l'interruttore)

Un'unica impostazione governa robots.txt, sitemap, llms.txt, intestazione HTTP
`X-Robots-Tag` e meta tag "robots". Il valore predefinito è "non pubblico".

1. Netlify → *Site configuration → Environment variables* → aggiungere
   `SITO_PUBBLICO` = `true` (deve esistere anche `VITE_API_BASE_URL`, l'indirizzo
   dell'API: serve alla sitemap per elencare piloti, circuiti e scuderie).
2. Rifare il deploy. Nel log della build devono comparire
   `[seo] sito PUBBLICO` e `verifica-seo: OK, sito PUBBLICO`. Se compare un
   "ATTENZIONE… la sitemap NON contiene schede di piloti…", l'API non ha risposto
   durante la build: rifare il deploy dopo aver "svegliato" il servizio Render.
3. Controllare a mano: `https://monoposto.io/robots.txt` (niente `Disallow: /` per tutti),
   `/sitemap.xml` (elenco di indirizzi), `/llms.txt`, e che la pagina non abbia più
   `noindex` (tasto destro → "Visualizza sorgente" → cercare `robots`). Da terminale:
   `curl -I https://monoposto.io/` non deve mostrare `x-robots-tag`.
4. **Google Search Console** (https://search.google.com/search-console):
   - aggiungere la proprietà `monoposto.io` (tipo "Dominio", verifica con record DNS TXT;
     oppure "Prefisso URL" con il meta tag: incollare il codice in `googleSiteVerification`
     di `frontend/src/config/sito.js`);
   - *Sitemap* → inviare `https://monoposto.io/sitemap.xml`;
   - *Controllo URL* → provare la home e chiedere l'indicizzazione;
   - dopo qualche giorno, rapporto *Pagine*: nessuna voce "Esclusa dal tag noindex" sulle
     pagine che devono essere indicizzate.
5. Decidere sui bot di intelligenza artificiale: in `robots.txt` (a sito pubblico) sono
   permessi; le righe per vietarli sono già scritte, commentate, in `frontend/scripts/seo-dati.mjs`.
6. Ripubblicando con `SITO_PUBBLICO` rimosso o diverso da `true`, il sito torna invisibile.

Limiti noti: le anteprime social (Facebook, WhatsApp, X) sono uguali per tutte le
pagine, perché i loro strumenti non eseguono JavaScript; per anteprime diverse pagina
per pagina serve il pre-rendering. Le pagine dei singoli Gran Premi
(`/archivio/anno/circuito`) non sono ancora nella sitemap.

## 4. Consenso ai cookie e pubblicità

- [ ] Il banner attuale è **proprio** (`frontend/src/consenso/`). Funziona per gli USA e come
      base per l'Europa, ma Google richiede un sistema di consenso **certificato e integrato
      con lo standard TCF** per mostrare annunci *personalizzati* a utenti di UE, Regno Unito
      e Svizzera (senza, in quelle regioni vengono serviti solo annunci limitati).
      Strada consigliata: in AdSense → *Privacy e messaggi* creare il messaggio per le
      "normative europee" (gratuito), poi mettere `PROPRIO: false` in
      `frontend/src/config/consenso.js`. In alternativa un CMP a pagamento certificato.
- [ ] Provare il banner da fuori Italia (VPN in Europa e negli USA) e con il browser in
      modalità privata.
- [ ] Annunci veri: vedi la sezione 5 ("Pubblicità").
- [ ] Google Fonts: i caratteri vengono scaricati dai server di Google al primo caricamento,
      prima di qualsiasi scelta. Per evitarlo, ospitarli sul sito.

## 5. Pubblicità: dagli spazi agli annunci veri

**Stato attuale.** In produzione gli spazi pubblicitari sono **spenti** (modalità `off`):
nessun riquadro vuoto, il sito appare normale mentre AdSense lo valuta. Gli spazi
(colonne laterali, banner tra i blocchi e in fondo) restano nel codice e riappaiono
quando si attiva la modalità giusta. Il pannello AdSense non li "vede" perché sono solo
spazio riservato: a Google servono le **unità pubblicitarie** (o gli annunci automatici).

**Quando AdSense approva il sito** (scelta consigliata: unità manuali, annunci automatici spenti):

1. In AdSense, sezione *Annunci → Per unità pubblicitaria → Annunci display* (i nomi dei menu
   possono cambiare) crea **tre unità adattive (responsive)**:
   - `monoposto-orizzontale` (banner tra i blocchi e in fondo alla pagina);
   - `monoposto-rettangolo` (rettangoli tra i blocchi);
   - `monoposto-verticale` (colonne laterali).
   Per ognuna, nel codice che AdSense mostra, copia il numero indicato in `data-ad-slot="..."`.
2. Incolla i tre numeri in `frontend/src/config/pubblicita.js`, dentro `UNITA`.
3. Netlify → *Environment variables* → aggiungi `VITE_PUBBLICITA` = `reale` → nuovo deploy.
4. In AdSense, sezione *Annunci → Per sito → monoposto.io*: **Annunci automatici spenti**.
   Motivo: Google aggiungerebbe formati non previsti (anche a schermo intero) che si sovrappongono
   agli spazi già progettati e al banner dei cookie.
5. Controllo: apri una pagina, accetta il banner dei cookie, e nell'ispezione elementi cerca
   `<ins class="adsbygoogle" ... data-adsbygoogle-status="done">`. I primi annunci possono
   impiegare qualche ora a comparire.

**Come funziona.** Se un'unità manca, gli spazi che la usano scompaiono da soli (senza la
verticale, per esempio, non ci sono le colonne e la pagina resta centrata). Uno spazio
senza annunci da mostrare si chiude invece di restare vuoto. Le colonne laterali esistono
solo dai 1280 px in su. Prima che l'utente scelga nel banner dei cookie, le richieste sono
in pausa.

**Per vedere il layout con i riquadri** (in sviluppo lo fa già `npm run dev`):
`VITE_PUBBLICITA=segnaposto npm run build`.
