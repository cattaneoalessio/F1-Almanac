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

Tutti rispondono `404` con un messaggio chiaro se anno/circuito/pilota
non esistono nel database (verificato: vedi sotto).

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

## CORS

`CORSMiddleware` in `main.py` è già ristretto al dominio reale del
frontend pubblicato (`https://f1-almanac.netlify.app`), non più aperto a
tutte le origini. Se lavori in locale e il frontend gira su
`http://127.0.0.1:5173` (l'indirizzo di default di Vite), aggiungilo
temporaneamente all'elenco `allow_origins` in `main.py`, altrimenti le
richieste dal frontend locale verranno bloccate dal browser.
