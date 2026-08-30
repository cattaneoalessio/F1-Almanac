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
- `GET /piloti` — indice di tutti i piloti nel database con i totali di
  carriera (punti/vittorie/gare), usato dalla pagina `/piloti` del
  frontend. È un roster (ordinato per cognome), non una classifica: per
  questo l'ordinamento è alfabetico e non per punti.
- `GET /piloti/{slug}` (es. `/piloti/nino-farina`) — scheda di carriera
  di un pilota: totali (punti/vittorie/gare) e risultati gara per gara,
  usata dalla pagina `/piloti/:slug` del frontend (Fase D).
- `GET /circuiti` — indice di tutti i circuiti nel database.
- `GET /circuiti/{slug}` (es. `/circuiti/monza`) — scheda di un circuito:
  info di base, elenco gare storiche disputate lì (con vincitore) e
  "albo d'oro" (i piloti più vincenti su quel tracciato), usata dalla
  pagina `/circuiti/:slug` del frontend.
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
