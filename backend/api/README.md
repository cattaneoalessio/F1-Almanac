# API — Fase C (FastAPI)

Endpoint, tutti testati per davvero con `uvicorn` avviato in locale e
richieste `curl` reali contro il database con i dati del 1950 (non solo
letti a occhio):

- `GET /gare/risultati?anno=1950&circuito=silverstone` — ordine di
  arrivo completo di quella gara, punti già calcolati.
- `GET /gare?anno=1950` — elenco delle gare di una stagione (per i link
  cliccabili nella pagina della classifica).
- `GET /classifica/piloti?anno=1950` — classifica piloti della stagione,
  con `nazione_codice` (ISO2) per la bandierina nel frontend.
- `GET /classifica/scuderie?anno=1950` — classifica scuderie della
  stagione, stesso criterio "a somma" della classifica piloti: si
  sommano i punti di TUTTI i piloti schierati dalla scuderia in ogni
  gara, non solo il migliore. **Attenzione**: nel 1950 non esisteva
  ancora un Mondiale Costruttori ufficiale (introdotto nel 1958), quindi
  questa non è una classifica storica realmente esistita all'epoca, ma
  un criterio nostro scelto per coerenza con la classifica piloti già
  presente. Usata dentro `/archivio/:anno` nel frontend, non in una
  sezione a sé stante.
- `GET /piloti` — indice di tutti i piloti nel database con i totali di
  carriera (punti/vittorie/gare), usato dalla pagina `/piloti` del
  frontend. È un roster (ordinato per cognome), non una classifica: per
  questo l'ordinamento è alfabetico e non per punti.
- `GET /piloti/{slug}` (es. `/piloti/nino-farina`) — scheda di carriera
  di un pilota: totali (punti/vittorie/gare) e risultati gara per gara,
  usata dalla pagina `/piloti/:slug` del frontend (Fase D). Include anche
  `data_nascita`, `data_morte`, `url_wikipedia`, `biografia`, `curiosita`
  e `fonti_sufficienti` (vedi "Arricchimento Piloti e Circuiti" sotto):
  i campi testuali possono essere `null` per i piloti con fonti scarse
  (es. molti comprimari dell'Indianapolis 500 1950), e il frontend lo
  gestisce mostrando un messaggio invece di un vuoto.
- `GET /circuiti` — indice di tutti i circuiti nel database.
- `GET /circuiti/{slug}` (es. `/circuiti/monza`) — scheda di un circuito:
  info di base, elenco gare storiche disputate lì (con vincitore) e
  "albo d'oro" (i piloti più vincenti su quel tracciato), usata dalla
  pagina `/circuiti/:slug` del frontend. Include anche `indirizzo`,
  `capienza`, `google_maps_url`, `storia`, e i due array `curve` e
  `configurazioni` (vedi sotto).
- `GET /scuderie` — indice di tutte le scuderie nel database.
- `GET /scuderie/{slug}` (es. `/scuderie/alfa-romeo`) — scheda di una
  scuderia: gare disputate (con il miglior risultato ottenuto in
  ognuna, dato che una scuderia può schierare più piloti nella stessa
  gara) e i piloti che ci hanno corso, coi loro totali **solo per il
  periodo passato in quella scuderia** (non di carriera — uno stesso
  pilota può comparire in più schede scuderia con numeri diversi).
  Usata dalla pagina `/scuderie/:slug` del frontend. Se la scuderia
  esiste ma non ha ancora risultati importati, risponde con liste
  vuote invece di un 404 (la scuderia c'è davvero, solo senza dati).

Tutti rispondono `404` con un messaggio chiaro se anno/circuito/pilota/
scuderia non esistono nel database (verificato: vedi sotto).

## Come avviarla

```
pip install fastapi "uvicorn[standard]" psycopg2-binary python-dotenv --break-system-packages
cp ../.env.example .env      # stessa cartella backend/, con i tuoi dati reali
cd api
uvicorn main:app --reload
```

Poi apri **http://127.0.0.1:8000/docs**: FastAPI genera da solo una
pagina interattiva per provare gli endpoint dal browser, utile per fare
domande veloci al database senza scrivere query SQL a mano.

## Cosa fa il calcolo dei punti

I punti in entrambi gli endpoint **non** vengono letti dalla colonna
`risultati_gara.punti` (che l'import di Fase B lascia sempre a 0): sono
calcolati al momento della richiesta unendo la posizione di arrivo di
ogni pilota alla tabella `punti_per_posizione` del sistema di punteggio
della sua stagione (`sistemi_punteggio`). Per questo, nello schema
(`db/schema.sql`), ho aggiunto anche i valori punti-per-posizione dei
due sistemi di esempio (2019-oggi: 25-18-15-...-1; anni '50: 8-6-4-3-2),
e lo script di Fase B ora collega automaticamente ogni nuova stagione
al sistema giusto in base all'anno.

**Limite noto**: il punto bonus per il giro più veloce non è incluso
nel calcolo, perché lo script di Fase B non popola ancora il campo
`giro_veloce` dei risultati (nessuna fonte dati usata finora lo fornisce
in modo affidabile). Se vuoi aggiungerlo, il posto giusto è la query in
`main.py`: un `CASE WHEN r.giro_veloce AND sp.punto_giro_veloce THEN 1
ELSE 0 END` da sommare ai punti.

## Arricchimento Piloti e Circuiti (biografie, curve, configurazioni)

Due nuove patch SQL una tantum, da lanciare **in quest'ordine** (la
seconda dipende dalle colonne/tabelle create dalla prima):

1. `db/patch_arricchimento_piloti_circuiti.sql` — aggiunge le colonne
   `piloti.biografia/curiosita/fonti_biografia/fonti_sufficienti` e
   `circuiti.indirizzo/capienza/storia/google_maps_url/fonti`, più due
   nuove tabelle: `circuiti_curve` (curve e rettilinei, con nome
   moderno/1950 e anno di intitolazione se assegnato dopo il 1950) e
   `circuiti_configurazioni` (le diverse lunghezze/planimetrie che un
   circuito ha avuto nel tempo). `circuiti_curve.nome_moderno` è
   volutamente nullable: alcune curve storiche (es. Burnenville, Malmedy
   e Masta Kink a Spa) non esistono più nel tracciato attuale.
2. `db/patch_contenuti_piloti_circuiti_1950.sql` — il contenuto vero e
   proprio: tutti i 77 piloti e i 7 circuiti della stagione 1950,
   raccolto da fonti pubbliche (Wikipedia, siti storici di settore) e
   riscritto in prosa originale (non copiato) per ogni voce con fonti
   sufficienti. Per i piloti con fonti scarse (per lo più comprimari
   dell'Indianapolis 500 mai scesi in pista in Europa quell'anno),
   `biografia` resta `null` con `fonti_sufficienti = false`: sono
   comunque presenti con dati di gara reali e un'eventuale `curiosita`
   breve verificata, invece di essere inventati.

Entrambe sono scritte con `ON CONFLICT ... DO UPDATE`/`COALESCE`, quindi
si possono rilanciare senza problemi. In particolare la lunghezza
circuito (`circuiti.lunghezza_km`) viene aggiornata solo dove è `NULL`
(`COALESCE`), per non sovrascrivere un valore già presente (es.
Silverstone aveva già la lunghezza moderna da un'importazione
precedente: resta quella, le altre 6 piste prendono la lunghezza
dell'epoca 1950 appena raccolta).

## Nazionalità delle scuderie

Lo script di import di Fase B non valorizzava `costruttori.nazione_id`
(non serviva finché non è arrivata la Sezione Scuderie). È stata
aggiunta una patch una tantum, `db/patch_nazionalita_costruttori.sql`,
che la popola con dati storici noti per le scuderie del 1950 — vedi le
istruzioni nel file stesso. **Se importi nuove stagioni con scuderie
non coperte da quella patch**, le loro schede scuderia mostreranno
comunque tutto correttamente, solo senza bandierina finché non estendi
la patch (o imposti `nazione_id` direttamente nell'import).

## CORS

`CORSMiddleware` in `main.py` è ristretto al dominio reale del frontend
pubblicato (`https://f1-almanac.netlify.app`) più gli indirizzi locali
di sviluppo di Vite (`127.0.0.1`/`localhost` sulle porte 5173 e 4173,
usate rispettivamente da `npm run dev` e `npm run preview`): non è più
aperto a tutte le origini. Se in futuro pubblichi il frontend anche su
un dominio proprio (es. dopo aver comprato un dominio), aggiungilo qui.
