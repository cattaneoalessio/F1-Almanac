-- =====================================================================
-- patch_stagioni_1951_1970.sql
-- ---------------------------------------------------------------------
-- Prepara il database per l'importazione delle stagioni di Formula 1
-- dal 1951 al 1970 (il 1950 resta quello già importato ed arricchito a
-- mano, questo script NON lo tocca).
--
-- Aggiunge:
--   1) due tabelle per la CLASSIFICA UFFICIALE di fine stagione (piloti
--      e costruttori), presa così com'è dalla fonte storica (Jolpica,
--      erede pubblico di Ergast) — che tiene già conto delle regole
--      dell'epoca (es. negli anni '50-'60 spesso si contavano solo i
--      migliori N risultati stagionali, non la somma di tutte le gare).
--      La nostra classifica calcolata "a somma" (quella già esistente,
--      endpoint /classifica/piloti) resta anche lei disponibile: le due
--      cose vengono mostrate separatamente nel frontend, non sostituite
--      l'una con l'altra, perché sono due criteri diversi e dichiarati
--      come tali.
--   2) alcune nazioni storiche che compaiono tra piloti/costruttori di
--      questo periodo e non erano ancora nel seed minimo di schema.sql.
--
-- Sicura da rieseguire più volte (IF NOT EXISTS / ON CONFLICT DO NOTHING).
-- =====================================================================

BEGIN;

CREATE TABLE IF NOT EXISTS classifica_ufficiale_piloti (
    id              SERIAL PRIMARY KEY,
    stagione_id     INTEGER NOT NULL REFERENCES stagioni(id) ON DELETE CASCADE,
    pilota_id       INTEGER NOT NULL REFERENCES piloti(id),
    -- NULLABLE, non NOT NULL: per un pilota/costruttore con zero punti in
    -- stagione, Jolpica non assegna alcuna posizione (la chiave "position"
    -- è letteralmente assente dal JSON sorgente, non "0") — vedi
    -- db/patch_nullable_posizione_ufficiale.sql per il bug reale scoperto
    -- al primo import vero e la spiegazione completa.
    posizione       SMALLINT,
    punti           NUMERIC(6,2) NOT NULL,
    vittorie        SMALLINT NOT NULL DEFAULT 0,
    UNIQUE (stagione_id, pilota_id)
);
CREATE INDEX IF NOT EXISTS idx_classifica_ufficiale_piloti_stagione
    ON classifica_ufficiale_piloti (stagione_id);

CREATE TABLE IF NOT EXISTS classifica_ufficiale_costruttori (
    id              SERIAL PRIMARY KEY,
    stagione_id     INTEGER NOT NULL REFERENCES stagioni(id) ON DELETE CASCADE,
    costruttore_id  INTEGER NOT NULL REFERENCES costruttori(id),
    -- NULLABLE, non NOT NULL: per un pilota/costruttore con zero punti in
    -- stagione, Jolpica non assegna alcuna posizione (la chiave "position"
    -- è letteralmente assente dal JSON sorgente, non "0") — vedi
    -- db/patch_nullable_posizione_ufficiale.sql per il bug reale scoperto
    -- al primo import vero e la spiegazione completa.
    posizione       SMALLINT,
    punti           NUMERIC(6,2) NOT NULL,
    vittorie        SMALLINT NOT NULL DEFAULT 0,
    UNIQUE (stagione_id, costruttore_id)
);
CREATE INDEX IF NOT EXISTS idx_classifica_ufficiale_costruttori_stagione
    ON classifica_ufficiale_costruttori (stagione_id);

-- Nazioni storiche 1951-1970 non ancora presenti nel seed minimo.
INSERT INTO nazioni (codice_iso2, nome, nome_gentilizio) VALUES
    ('PT', 'Portogallo', 'Portoghese'),
    ('UY', 'Uruguay', 'Uruguaiano'),
    ('VE', 'Venezuela', 'Venezuelano'),
    ('CO', 'Colombia', 'Colombiano'),
    ('IN', 'India', 'Indiano'),
    ('LI', 'Liechtenstein', 'Liechtensteinese'),
    -- La Rhodesia (oggi Zimbabwe) esisteva come entità distinta negli
    -- anni '60-'70: usiamo il codice ISO2 attuale (ZW) per compatibilità
    -- con la tabella bandiere del frontend, col nome storico in chiaro.
    ('ZW', 'Rhodesia', 'Rhodesiano'),
    ('HK', 'Hong Kong', 'Hongkonghese')
ON CONFLICT (codice_iso2) DO NOTHING;

COMMIT;
