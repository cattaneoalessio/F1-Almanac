# Frontend — "Pit Wall" (React + Vite)

Struttura React reale, verificata (build, lint e screenshot Playwright
passati), con **routing vero** (React Router: ogni stagione/gara/pilota/
circuito ha un proprio URL, condivisibile e più indicizzabile di una
singola pagina) e **cinque sezioni** raggiungibili dalla barra in alto:

- **Archivio storico** (`/archivio/:anno`) — collegato **per davvero** al
  backend FastAPI del progetto (Fase C): selezioni una stagione
  (1950-2026), vedi l'elenco delle gare (cliccabili, `/archivio/:anno/
  :circuito`), la classifica piloti reale letta dal database
  PostgreSQL, con bandiera del pilota (icona SVG, non emoji: le emoji
  bandiera non si vedono su Windows), e — sotto — la classifica
  scuderie della stessa stagione (stesso criterio "a somma" dei punti,
  non una classifica storica realmente esistita: il Mondiale Costruttori
  è nato solo nel 1958). Ogni pilota/scuderia rimanda alla propria
  scheda (`/piloti/:slug`, `/scuderie/:slug`). Se la stagione non ha
  ancora dati nel database, lo dice chiaramente invece di mostrare una
  tabella vuota o rompersi.
- **Piloti** (`/piloti`) — indice di tutti i piloti nel database, con
  totali di carriera (gare/vittorie/punti) e un campo di ricerca per
  nome (filtrato lato client: se l'elenco crescesse molto, andrà
  spostato lato server). Ogni scheda rimanda a `/piloti/:slug`, che ora
  mostra anche: avatar-casco stilizzato con i colori dell'ULTIMA
  scuderia del pilota (non più grigio fisso), anni di nascita/morte,
  link a Wikipedia quando disponibile, e quattro pannelli — Biografia,
  Curiosità, Vittorie (solo le gare vinte) e Piazzamenti (tutte le
  gare). Biografia/Curiosità mostrano un messaggio invece di restare
  vuoti quando le fonti pubbliche disponibili non sono sufficienti
  (succede per un certo numero di comprimari dell'epoca).
- **Scuderie** (`/scuderie`) — indice di tutte le scuderie, ognuna con la
  propria scheda (`/scuderie/:slug`): gare disputate (col miglior
  risultato ottenuto in ognuna) e piloti che ci hanno corso, con i loro
  totali relativi al solo periodo passato in quella scuderia.
- **Circuiti** (`/circuiti`) — indice di tutti i tracciati, ognuno con la
  propria scheda (`/circuiti/:slug`): gare storiche disputate lì e
  "albo d'oro" dei piloti più vincenti su quel circuito, più — quando
  disponibili — indirizzo/capienza/link a Google Maps, un pannello
  "Storia" in prosa originale, e due tabelle: "Curve e rettilinei" (nome
  moderno vs nome nel 1950, con l'anno di intitolazione quando una curva
  ha preso il nome attuale dopo il 1950) e "Configurazioni nel tempo"
  (le diverse planimetrie/lunghezze avute dal circuito nei decenni).
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
│   │   ├── CircuitView.jsx/.css         <- scheda circuito, rotta /circuiti/:slug
│   │   ├── ScuderiesIndexView.jsx/.css  <- indice scuderie, rotta /scuderie
│   │   └── ScuderiaView.jsx             <- scheda scuderia, rotta /scuderie/:slug (riusa CircuitView.css)
│   ├── styles/
│   │   └── theme.css         <- IL design system: colori, font, badge, pannelli "vetro"
│   ├── data/
│   │   └── teamColors.js     <- colori scuderie (moderne + storiche 1950) + mescole gomme, in un unico posto
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

## Nota importante: il file `.env` va creato PRIMA di `npm run build`

Vite legge `VITE_API_BASE_URL` una volta sola, nel momento in cui lanci
`npm run build`, e lo "cuoce" dentro i file in `dist/`: se cambi o crei
il file `.env` DOPO aver già fatto la build, non succede nulla finché
non rilanci `npm run build` da capo. Se dopo aver pubblicato il sito le
pagine restano bloccate su "Non riesco a contattare il backend", il
primo sospetto è proprio questo: verifica che `.env` esista con
l'indirizzo giusto e poi rilancia la build.

## Colori delle scuderie storiche (1950)

Nel 1950 le vetture correvano nei colori nazionali del proprio paese
(rosso Italia, blu Francia, verde Gran Bretagna), non con livree
sponsorizzate come oggi: `src/data/teamColors.js` assegna quindi un
colore di stile — non una riproduzione fedele di una livrea reale — a
ogni scuderia della stagione 1950 presente nel database (Alfa Romeo,
Maserati, Talbot-Lago, Simca, ERA, Alta, Cooper, Kurtis Kraft). Le
scuderie minori non elencate lì (per lo più singoli telai artigianali
di Indianapolis, con una o due presenze ciascuno) restano nel grigio di
fallback: se in futuro vuoi assegnargli un colore specifico, quello è
l'unico file da toccare — sia l'avatar pilota (`DriverAvatar`) sia il
badge scuderia (`TeamBadge`) lo leggono da lì automaticamente.

## Nota sul brand "Sky Sport"

Lo stile grafico (colori scuri, pannelli in vetro, font digitali) è
ispirato all'estetica dei grafismi da diretta motorsport, ma il sito
**non usa il nome o il logo Sky**: il wordmark placeholder è "PIT WALL",
del tutto originale. Quando deciderai il nome definitivo del sito, va
sostituito solo in `LiveTimingSidebar.jsx` (prop `brandPrefix`/`brandSuffix`).
