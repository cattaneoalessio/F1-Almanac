# Frontend — "Pit Wall" (React + Vite)

Struttura React reale, verificata (build, lint e screenshot Playwright
passati), con **routing vero** (React Router: ogni stagione/gara/pilota/
circuito ha un proprio URL, condivisibile e più indicizzabile di una
singola pagina) e **quattro sezioni** raggiungibili dalla barra in alto:

- **Archivio storico** (`/archivio/:anno`) — collegato **per davvero** al
  backend FastAPI del progetto (Fase C): selezioni una stagione
  (1950-2026), vedi l'elenco delle gare (cliccabili, `/archivio/:anno/
  :circuito`) e la classifica piloti reale letta dal database
  PostgreSQL, con bandiera del pilota (icona SVG, non emoji: le emoji
  bandiera non si vedono su Windows). Ogni pilota rimanda alla sua
  scheda di carriera (`/piloti/:slug`). Se la stagione non ha ancora
  dati nel database, lo dice chiaramente invece di mostrare una tabella
  vuota o rompersi.
- **Piloti** (`/piloti`) — indice di tutti i piloti nel database, con
  totali di carriera (gare/vittorie/punti) e un campo di ricerca per
  nome (filtrato lato client: se l'elenco crescesse molto, andrà
  spostato lato server). Ogni scheda rimanda a `/piloti/:slug`.
- **Circuiti** (`/circuiti`) — indice di tutti i tracciati, ognuno con la
  propria scheda (`/circuiti/:slug`): gare storiche disputate lì e
  "albo d'oro" dei piloti più vincenti su quel circuito.
- **Live Timing** (`/live`) — il mockup grafico originale (dati di
  esempio + tentativo di lettura da OpenF1 per le gomme).

## Come avviarlo (passo-passo, zero esperienza richiesta)

1. Installa [Node.js](https://nodejs.org) (versione 18 o superiore) se non
   lo hai già. Su Mac/Windows scarica l'installer dal sito, segui la
   procedura guidata.
2. Apri un terminale dentro questa cartella (`frontend`).
3. Installa le dipendenze (va fatto una sola volta):
   ```
   npm install
   ```
4. Avvia l'anteprima in locale:
   ```
   npm run dev
   ```
   Il terminale mostrerà un indirizzo tipo `http://localhost:5173` da
   aprire nel browser: lì vedi la pagina, e ogni modifica ai file si
   aggiorna da sola senza dover ricaricare a mano.
5. Per vedere dati reali nella sezione "Archivio storico" serve anche il
   backend Fase C avviato (vedi `backend/api/README.md`): di default il
   frontend cerca l'API su `http://127.0.0.1:8000`. Per usare un altro
   indirizzo (es. quando l'API sarà online), crea un file `.env` in
   questa cartella con:
   ```
   VITE_API_BASE_URL=https://indirizzo-della-tua-api
   ```
6. Quando sei pronto per pubblicare il sito, genera i file ottimizzati
   con:
   ```
   npm run build
   ```
   Il risultato finisce nella cartella `dist/`: è quello che va caricato
   su un hosting come Vercel o Netlify (vedi la guida di deployment
   consegnata insieme al resto del progetto).

## Struttura delle cartelle

```
frontend/
├── index.html              <- file HTML principale: titolo pagina, font, punto di ingresso
├── package.json             <- elenco dipendenze e comandi (npm run dev/build/lint)
├── public/
│   └── flags/               <- bandiere SVG dei soli paesi presenti nel database (vedi utils/flags.jsx)
├── src/
│   ├── main.jsx             <- avvia l'app React (con BrowserRouter) dentro index.html
│   ├── App.jsx               <- barra di navigazione + tutte le rotte (React Router)
│   ├── App.css               <- layout condiviso (griglia, sezioni, card, tab)
│   ├── views/
│   │   ├── LiveTimingView.jsx           <- vista "Live Timing" (mockup originale), rotta /live
│   │   ├── HistoricalView.jsx           <- vista stagione, rotta /archivio/:anno
│   │   ├── RaceDetailView.jsx/.css      <- vista gara, rotta /archivio/:anno/:circuito
│   │   ├── DriverView.jsx/.css          <- scheda pilota, rotta /piloti/:slug
│   │   ├── PilotsIndexView.jsx/.css     <- indice piloti (con ricerca), rotta /piloti
│   │   ├── CircuitsIndexView.jsx/.css   <- indice circuiti, rotta /circuiti
│   │   └── CircuitView.jsx/.css         <- scheda circuito, rotta /circuiti/:slug
│   ├── styles/
│   │   └── theme.css         <- IL design system: colori, font, badge, pannelli "vetro"
│   ├── data/
│   │   └── teamColors.js     <- colori ufficiali scuderie + mescole gomme, in un unico posto
│   ├── utils/
│   │   └── flags.jsx         <- <FlagIcon codiceIso2="IT" />, SVG locale (non emoji: illeggibili su Windows)
│   ├── components/
│   │   ├── LiveTimingSidebar.jsx/.css  <- colonna dei tempi live
│   │   ├── StatusBadge.jsx             <- indicatore LIVE / FINISHED
│   │   ├── GlassPanel.jsx              <- contenitore "vetro" riusabile
│   │   ├── TeamBadge.jsx/.css          <- badge scuderia originale (colore + sigla)
│   │   ├── DriverAvatar.jsx/.css       <- avatar pilota illustrato (casco stilizzato)
│   │   ├── CircuitArt.jsx              <- illustrazione circuito originale (non una mappa reale)
│   │   ├── TyrePanel.jsx/.css          <- pannello strategia gomme
│   │   └── HistoricalStandings.jsx/.css <- classifica piloti storica + elenco gare stagione
│   └── api/
│       ├── openf1.js         <- funzioni generiche per interrogare OpenF1
│       ├── tires.js          <- script richiesto per collegare l'API delle gomme
│       └── backend.js        <- chiamate alla NOSTRA API FastAPI (Fase C)
```

## Per le prossime pagine: parti sempre da qui

- Colori, font, badge e pannelli **non vanno reinventati pagina per
  pagina**: si importano da `src/styles/theme.css` e dai componenti in
  `src/components/`. Se serve un nuovo tipo di card, meglio creare un
  nuovo componente che riusa `<GlassPanel>` piuttosto che scrivere CSS
  da zero.
- Se una pagina nuova deve mostrare dati diversi da OpenF1 (es. storico
  gare, circuiti), il pattern giusto è lo stesso di `api/tires.js`:
  un file in `src/api/` con una funzione che va a prendere i dati e li
  "normalizza" in un formato semplice per i componenti.

## Nota sull'endpoint delle gomme

`src/api/tires.js` chiama `/v1/stints` di OpenF1. Non ho potuto
verificare in questa sessione la documentazione più recente
(https://openf1.org/#stints) per un limite di ricerca web raggiunto:
prima di fare affidamento sui dati reali, apri quella pagina e controlla
che i nomi dei campi restituiti coincidano con quelli usati nella
funzione `normalizeStint()` dello script. Se sono cambiati, va
aggiornata solo quella funzione.

## Nota sul brand "Sky Sport"

Lo stile grafico (colori scuri, pannelli in vetro, font digitali) è
ispirato all'estetica dei grafismi da diretta motorsport, ma il sito
**non usa il nome o il logo Sky**: il wordmark placeholder è "PIT WALL",
del tutto originale. Quando deciderai il nome definitivo del sito, va
sostituito solo in `LiveTimingSidebar.jsx` (prop `brandPrefix`/`brandSuffix`).
