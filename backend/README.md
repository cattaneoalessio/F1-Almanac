# Backend — Fase A (schema), Fase B (import risultati) e Fase C (API)

## Schema database

Lo schema è in `../db/schema.sql`. Per crearlo su un database PostgreSQL
vuoto (locale o su un servizio come Supabase/Railway/Neon):

```
psql "postgresql://utente:password@host:5432/nome_db" -f ../db/schema.sql
```

## Script di import (`import_risultati_gp.py`)

Testato per davvero in questa sessione con i risultati reali del **Gran
Premio di Gran Bretagna 1950** (la primissima gara del Mondiale F1,
Silverstone) — non con dati inventati. Il file `gp_1950_british.csv`
incluso è esattamente quello usato per il test, così puoi rilanciarlo tu
stesso e vedere il risultato.

Il test ha fatto emergere due cose reali, non ipotetiche:

1. **Un bug nello script** (già corretto): la libreria pandas trasforma
   silenziosamente in `NaN` i valori mancanti che lo script aveva già
   pulito, sia costruendo nuove colonne con `.apply()` sia leggendo le
   righe con `.iterrows()`. Il dettaglio è commentato direttamente nel
   codice, nel punto in cui è stato risolto.
2. **Un campo mancante nello schema**: i motivi di ritiro storici (es.
   "Oil leak" per il ritiro di Fangio in questa gara) non avevano dove
   finire — venivano ridotti a una categoria generica ("Ritirato") perdendo
   un dettaglio che un sito di statistiche vorrebbe invece mostrare. Ho
   aggiunto la colonna `motivo_ritiro` alla tabella `risultati_gara` (in
   `db/schema.sql`) apposta per conservare il testo originale, accanto
   alla categoria generica usata per filtri/aggregazioni.

### Come lanciarlo

```
pip install pandas psycopg2-binary python-dotenv --break-system-packages
cp .env.example .env      # poi modifica .env con i tuoi dati di accesso reali
python import_risultati_gp.py --csv gp_1950_british.csv \
    --anno 1950 --circuito silverstone --nome-gp "British Grand Prix" \
    --data-gara 1950-05-13 --dry-run   # prova senza scrivere nulla

# quando l'anteprima ti convince, rilancialo senza --dry-run
```

**Nota importante**: prima di lanciarlo su un circuito diverso da
Silverstone, quel circuito deve già esistere nella tabella `circuiti`
(nome, paese...). Lo script segnala chiaramente l'errore se manca.

**Limite noto**: lo script divide "Nome Cognome" in automatico usando la
prima parola come nome e il resto come cognome. Per la maggior parte dei
piloti funziona, ma per nomi composti come "Juan Manuel Fangio" il
risultato è impreciso (cognome salvato come "Manuel Fangio" invece di
"Fangio"). Lo script avvisa sempre in console quando crea un nuovo
pilota, apposta per invitarti a controllare/correggere questi casi a
mano prima di fidarti ciecamente dei dati.

## Stagione 1950 completa, per una demo più ricca

Oltre al GP di Gran Bretagna, ho importato (stessa fonte pubblica,
stesso procedimento) anche le altre 6 gare del campionato 1950: Monaco,
Indianapolis 500, Svizzera, Belgio, Francia, Italia (i CSV sono tutti
inclusi, `gp_1950_*.csv`). Questo ha fatto emergere due limiti reali
dello schema attuale, accettati consapevolmente per restare nell'MVP
invece di ingrandire lo schema in questa fase:

- **Cambio vettura a gara in corso**: nel 1950 era normale che un
  pilota, dopo un ritiro, prendesse il volante dell'auto di un compagno
  di squadra (è successo davvero a Fangio e Ascari nel GP d'Italia a
  Monza). La fonte registra questi casi come DUE risultati distinti per
  lo stesso pilota nella stessa gara. Il nostro schema ammette un solo
  risultato per coppia (gara, pilota): il secondo viene scartato
  automaticamente (`ON CONFLICT ... DO NOTHING`), senza errori. Ho
  verificato via query SQL che in ogni caso resta la riga giusta (il
  risultato ufficiale), perché nei CSV la riga con la posizione
  classificata è sempre elencata per prima.
- **Un'incongruenza nella fonte stessa**: nei risultati del GP del
  Belgio, il pilota in ottava posizione (Claes) risulta con meno giri
  completati (22) del nono (Crossley, 30 giri) pur avendo un distacco
  "+3 giri" contro "+5 giri" — matematicamente incoerente. Ho verificato
  col JSON grezzo che il dato è proprio così alla fonte (non un errore
  di lettura mio): l'ho importato fedelmente, senza "correggerlo" di
  testa mia, perché i dati di gare di 75+ anni fa non sempre sono
  incrociabili con certezza assoluta. Se un giorno trovi una fonte più
  affidabile per questa gara, va corretto a mano in database.
- **Punteggio "a somma", non "migliori N risultati"**: fino al 1990 il
  Mondiale F1 contava solo i migliori risultati stagionali di ogni
  pilota (nel 1950, i migliori 4 su 7 gare), scartando gli altri. La
  classifica di Fase C (`/classifica/piloti`, vedi `api/README.md`)
  somma invece TUTTI i punti di tutte le gare disputate: per questo
  l'ordine può differire da quello ufficiale dei libri di storia. I
  conteggi vittorie però tornano esatti (verificato: Farina e Fangio 3
  vittorie ciascuno nel 1950, come da storia reale) — è solo la somma
  punti a non replicare ancora la regola storica degli scarti.
