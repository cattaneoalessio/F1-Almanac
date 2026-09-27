# Analisi GP — sezione di monoposto.ai

Sezione di analisi telemetrica per l'ultima stagione di Formula 1: telemetria
comparativa tra due piloti, strategie gomme e confronto tempi sul giro, GP
per GP. Dati da [FastF1](https://github.com/theOehrly/Fast-F1) (telemetria e
sessioni) e [Jolpica-F1](https://github.com/jolpica/jolpica-f1) (classifiche
— tramite il client integrato in FastF1, `fastf1.ergast`, non un pacchetto a
parte: "jolpica-f1" non esiste come pacchetto pip installabile).

Integrata nel repository principale di monoposto.ai (non un progetto a
parte): lo script Python vive qui in `analisi-gp/`, mentre la pagina statica
vive dentro `frontend/public/analisi-gp/` così Vite la pubblica così com'è,
raggiungibile su `/analisi-gp/` accanto al resto del sito.

## Struttura

```
analisi-gp/
  scripts/
    update_data.py       lo script che scarica e prepara i dati
    requirements.txt
frontend/public/analisi-gp/
  index.html, style.css, app.js    la dashboard statica
  data/                            JSON generati da update_data.py — Vite
                                    copia questa intera cartella così com'è
                                    nella build finale del sito
.github/workflows/
  f1-update.yml         aggiornamento automatico ogni lunedì
```

## Uso in locale

```bash
pip install -r analisi-gp/scripts/requirements.txt

# Ultimo GP disputato dell'anno corrente
python analisi-gp/scripts/update_data.py

# Un anno/round specifico
python analisi-gp/scripts/update_data.py --year 2026 --round 15

# Tutti i GP già disputati della stagione (prima esecuzione, o per
# ripopolare l'intero storico)
python analisi-gp/scripts/update_data.py --all
```

Per default lo script scrive in `data/` nella cartella corrente: da dentro il
repository, lancialo impostando la variabile d'ambiente in modo che scriva
dove il sito se li aspetta:

```bash
F1_DATA_DIR=frontend/public/analisi-gp/data python analisi-gp/scripts/update_data.py
```

Poi apri la pagina con un piccolo server locale (necessario perché il
browser blocca il `fetch()` dei JSON se apri il file direttamente da disco
con `file://`):

```bash
cd frontend/public/analisi-gp && python3 -m http.server 8000
# poi apri http://127.0.0.1:8000/
```

(Oppure lancia `npm run dev`/`npm run build` nel frontend come al solito: la
pagina sarà raggiungibile su `/analisi-gp/` accanto al resto del sito.)

## Aggiornamento automatico

Il workflow `.github/workflows/f1-update.yml` gira ogni lunedì alle 08:00
UTC, e può anche essere lanciato a mano dalla tab "Actions" di GitHub
(pulsante "Run workflow"), con la possibilità di specificare un anno/round
preciso o rigenerare l'intera stagione. Aggiorna
`frontend/public/analisi-gp/data/` e fa commit/push da solo: dato che il
sito si ripubblica automaticamente a ogni push, la sezione Analisi si
aggiorna da sola senza altri interventi.

**Nota sulla cache**: la cartella `analisi-gp/cache/` (cache di FastF1) NON
va versionata nel repository (già in `.gitignore`) — è tenuta in una cache
di GitHub Actions tra un'esecuzione e l'altra del workflow (vedi il
commento nel file `.yml`). Se lanci lo script in locale, la prima
esecuzione crea quella cartella da sola.

## Estendere i dati esportati

- **Un nuovo canale di telemetria** (es. RPM, marcia): aggiungi una riga al
  dizionario `CANALI_TELEMETRIA` in `update_data.py` e la colonna
  corrispondente nel dizionario ritornato da `estrai_telemetria_giro()`; poi
  aggiungi la voce corrispondente in `CANALI_TELEMETRIA` (array) in
  `app.js` per farla comparire come pannello nel grafico telemetria.
- **Weekend Sprint**: lo script oggi carica Qualifica ('Q') e Gara ('R');
  un weekend Sprint ha sessioni aggiuntive (Sprint, Sprint Qualifying/Shootout)
  non ancora estratte — `carica_sessione()` accetta già qualunque
  identificatore FastF1 valido, andrebbe solo aggiunta la chiamata e i
  relativi file di output.
