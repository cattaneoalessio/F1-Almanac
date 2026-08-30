-- patch_arricchimento_piloti_circuiti.sql
--
-- Aggiunge i campi per l'arricchimento richiesto delle sezioni Piloti e
-- Circuiti: biografia/curiosità per i piloti, e per i circuiti indirizzo,
-- capienza, storia, link mappa, elenco curve/rettilinei ed elenco delle
-- configurazioni del tracciato nel tempo.
--
-- Sicura da rieseguire più volte: usa "IF NOT EXISTS"/"CREATE TABLE IF
-- NOT EXISTS", quindi non fallisce se lanciata per errore una seconda
-- volta.
--
-- Come eseguirla su Neon: apri il tuo progetto su neon.com, vai su
-- "SQL Editor", incolla questo file per intero e clicca Run.

BEGIN;

-- ---------------------------------------------------------------------
-- Piloti: biografia scritta in modo originale (mai copiata da altre
-- fonti), curiosità, e i "fonti" usate per trasparenza (elenco testuale
-- di URL, una per riga: non è mostrato per forza in pagina, serve a noi
-- per poter verificare/aggiornare in futuro). fonti_sufficienti=FALSE
-- significa che le fonti pubbliche trovate erano troppo scarse per una
-- biografia vera: in quel caso la scheda mostra solo i dati di gara
-- (già presenti) con una nota, invece di testo inventato.
-- ---------------------------------------------------------------------
ALTER TABLE piloti ADD COLUMN IF NOT EXISTS biografia TEXT;
ALTER TABLE piloti ADD COLUMN IF NOT EXISTS curiosita TEXT;
ALTER TABLE piloti ADD COLUMN IF NOT EXISTS fonti_biografia TEXT;
ALTER TABLE piloti ADD COLUMN IF NOT EXISTS fonti_sufficienti BOOLEAN NOT NULL DEFAULT FALSE;

-- ---------------------------------------------------------------------
-- Circuiti: informazioni pratiche (indirizzo, capienza, link mappa) e
-- storia narrativa, scritta in modo originale.
-- ---------------------------------------------------------------------
ALTER TABLE circuiti ADD COLUMN IF NOT EXISTS indirizzo VARCHAR(200);
ALTER TABLE circuiti ADD COLUMN IF NOT EXISTS capienza INTEGER;
ALTER TABLE circuiti ADD COLUMN IF NOT EXISTS storia TEXT;
ALTER TABLE circuiti ADD COLUMN IF NOT EXISTS google_maps_url TEXT;
ALTER TABLE circuiti ADD COLUMN IF NOT EXISTS fonti TEXT;

-- Curve e rettilinei di un circuito, in ordine. nome_1950 è valorizzato
-- solo se il nome all'epoca era diverso (o assente) rispetto a quello
-- moderno; anno_intitolazione è l'anno in cui la curva ha preso il nome
-- moderno, se noto e successivo al 1950 (es. curve intitolate a piloti
-- deceduti in incidenti avvenuti dopo quella stagione) — evita di
-- presentare un nome come se esistesse già nel 1950 quando non era così.
-- nome_moderno può essere NULL: capita per un tratto che esisteva SOLO
-- nella configurazione 1950 e non fa più parte del tracciato attuale
-- (es. Burnenville e Masta Kink a Spa, escluse dall'accorciamento degli
-- anni '70): in quel caso la curva ha comunque un nome_1950 valorizzato.
CREATE TABLE IF NOT EXISTS circuiti_curve (
    id                  SERIAL PRIMARY KEY,
    circuito_id         INTEGER NOT NULL REFERENCES circuiti(id) ON DELETE CASCADE,
    ordine              SMALLINT NOT NULL,
    tipo                VARCHAR(20) NOT NULL DEFAULT 'curva',   -- 'curva' | 'rettilineo'
    nome_moderno        VARCHAR(120),
    nome_1950           VARCHAR(120),
    anno_intitolazione  SMALLINT,
    nota                TEXT,
    UNIQUE (circuito_id, ordine)
);
ALTER TABLE circuiti_curve ALTER COLUMN nome_moderno DROP NOT NULL;

-- Configurazioni del tracciato nel tempo (lunghezza/layout cambiati):
-- una riga per ogni versione, con l'intervallo di anni in cui è stata
-- in uso (anno_a NULL = tuttora in uso, o comunque l'ultima nota).
CREATE TABLE IF NOT EXISTS circuiti_configurazioni (
    id              SERIAL PRIMARY KEY,
    circuito_id     INTEGER NOT NULL REFERENCES circuiti(id) ON DELETE CASCADE,
    anno_da         SMALLINT NOT NULL,
    anno_a          SMALLINT,
    lunghezza_km    NUMERIC(6,3),
    descrizione     TEXT NOT NULL,
    UNIQUE (circuito_id, anno_da)
);

COMMIT;
