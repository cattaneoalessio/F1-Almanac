-- =====================================================================
-- SCHEMA DATABASE — Portale storico Gran Premi / Formula 1 (1901-oggi)
-- Database: PostgreSQL 14+
-- Nome di lavoro progetto: "GP Almanac" (nome provvisorio, non-F1)
-- =====================================================================
-- Note di progettazione:
-- 1) I punteggi storici della F1/Gran Premi sono cambiati moltissimo nel
--    tempo (nel 1950 vinceva chi arrivava 1° con 8 punti + 1 punto bonus
--    per il giro più veloce; nel 2019-2025 c'è ancora il punto per il
--    giro veloce ma solo in top 10; prima del 1950 spesso non esisteva
--    affatto una classifica a punti). Per gestire tutto questo SENZA
--    dover riscrivere lo schema ogni volta, la logica di punteggio è
--    esternalizzata in due tabelle: sistemi_punteggio e
--    punti_per_posizione. Ogni stagione referenzia un sistema di
--    punteggio, e i punti effettivi assegnati restano comunque
--    memorizzati riga per riga in risultati_gara (fonte di verità),
--    cosa che permette casi eccezionali (punti dimezzati per gare
--    interrotte, es. Spa 2021).
-- 2) risultati_gara.punti è NUMERIC per gestire punti frazionari
--    (es. i "mezzi punti" storici).
-- 3) pilota_secondario_id gestisce il caso raro (anni '50) di due
--    piloti che condividevano la stessa vettura durante una gara.
-- =====================================================================

BEGIN;

-- ---------------------------------------------------------------------
-- Tabelle di riferimento
-- ---------------------------------------------------------------------

CREATE TABLE nazioni (
    id              SMALLSERIAL PRIMARY KEY,
    codice_iso2     CHAR(2) NOT NULL UNIQUE,       -- es. 'IT', 'GB' -> usato anche per le bandierine nel frontend
    nome            VARCHAR(80) NOT NULL,
    nome_gentilizio VARCHAR(80)                    -- es. 'Italiana', 'Britannico' (facoltativo, per i testi)
);

CREATE TABLE stati_risultato (
    id              SMALLSERIAL PRIMARY KEY,
    codice          VARCHAR(20) NOT NULL UNIQUE,   -- es. 'FINISHED', 'RETIRED', 'DSQ', 'NOT_CLASSIFIED'
    descrizione     VARCHAR(100) NOT NULL          -- es. 'Ritirato per incidente'
);

CREATE TABLE sistemi_punteggio (
    id              SERIAL PRIMARY KEY,
    nome            VARCHAR(100) NOT NULL,         -- es. 'Sistema 1950-1959', 'Sistema 2010-2018', 'Sistema 2019-oggi'
    anno_inizio     SMALLINT NOT NULL,
    anno_fine       SMALLINT,                      -- NULL = ancora in vigore
    punto_giro_veloce BOOLEAN NOT NULL DEFAULT FALSE,
    note            TEXT,
    CHECK (anno_fine IS NULL OR anno_fine >= anno_inizio)
);

-- Mappa posizione -> punti per ciascun sistema (righe multiple per sistema)
CREATE TABLE punti_per_posizione (
    id                      SERIAL PRIMARY KEY,
    sistema_punteggio_id    INTEGER NOT NULL REFERENCES sistemi_punteggio(id) ON DELETE CASCADE,
    posizione               SMALLINT NOT NULL,      -- 1 = vincitore, 2 = secondo, ecc.
    punti                   NUMERIC(5,2) NOT NULL,
    UNIQUE (sistema_punteggio_id, posizione)
);

-- ---------------------------------------------------------------------
-- Entità principali
-- ---------------------------------------------------------------------

CREATE TABLE piloti (
    id                  SERIAL PRIMARY KEY,
    codice_riferimento  VARCHAR(60) NOT NULL UNIQUE,   -- slug univoco, es. 'nuvolari', 'hamilton' (usato per URL /piloti/hamilton)
    sigla               CHAR(3),                       -- es. 'HAM', 'SCH' (dagli anni '90 in poi)
    nome                VARCHAR(80) NOT NULL,
    cognome             VARCHAR(80) NOT NULL,
    data_nascita        DATE,
    data_morte          DATE,
    nazione_id          SMALLINT REFERENCES nazioni(id),
    url_wikipedia       TEXT,
    creato_il           TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_piloti_cognome ON piloti (cognome);

CREATE TABLE costruttori (
    id                  SERIAL PRIMARY KEY,
    codice_riferimento  VARCHAR(60) NOT NULL UNIQUE,   -- slug, es. 'ferrari', 'alfa-romeo'
    nome                VARCHAR(100) NOT NULL,
    nazione_id          SMALLINT REFERENCES nazioni(id),
    anno_esordio        SMALLINT,
    anno_ritiro         SMALLINT,
    url_wikipedia       TEXT,
    creato_il           TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_costruttori_nome ON costruttori (nome);

CREATE TABLE circuiti (
    id                  SERIAL PRIMARY KEY,
    codice_riferimento  VARCHAR(60) NOT NULL UNIQUE,   -- slug, es. 'monza', 'spa-francorchamps'
    nome                VARCHAR(120) NOT NULL,
    localita            VARCHAR(120),
    nazione_id          SMALLINT REFERENCES nazioni(id),
    lunghezza_km        NUMERIC(6,3),
    latitudine          NUMERIC(9,6),
    longitudine         NUMERIC(9,6),
    url_wikipedia       TEXT,
    creato_il           TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_circuiti_nome ON circuiti (nome);

CREATE TABLE stagioni (
    id                      SERIAL PRIMARY KEY,
    anno                    SMALLINT NOT NULL UNIQUE,   -- es. 1950, 1920, 2026
    sistema_punteggio_id    INTEGER REFERENCES sistemi_punteggio(id),
    nome_campionato         VARCHAR(120) DEFAULT 'Campionato del Mondo di Formula 1',
    note                    TEXT                        -- utile per annotare stagioni "pre-championship" (1901-1949)
);

CREATE TABLE gran_premi (
    id                  SERIAL PRIMARY KEY,
    stagione_id         INTEGER NOT NULL REFERENCES stagioni(id) ON DELETE CASCADE,
    circuito_id         INTEGER NOT NULL REFERENCES circuiti(id),
    nome_gp             VARCHAR(150) NOT NULL,          -- es. 'Gran Premio d'Italia'
    round               SMALLINT,                       -- numero di gara nella stagione (NULL se non applicabile/pre-1950)
    data_gara           DATE,
    numero_giri         SMALLINT,
    distanza_km         NUMERIC(7,3),
    url_wikipedia       TEXT,
    UNIQUE (stagione_id, circuito_id, data_gara)
);
CREATE INDEX idx_gran_premi_stagione ON gran_premi (stagione_id);
CREATE INDEX idx_gran_premi_circuito ON gran_premi (circuito_id);
CREATE INDEX idx_gran_premi_data ON gran_premi (data_gara);

CREATE TABLE risultati_gara (
    id                      BIGSERIAL PRIMARY KEY,
    gran_premio_id          INTEGER NOT NULL REFERENCES gran_premi(id) ON DELETE CASCADE,
    pilota_id               INTEGER NOT NULL REFERENCES piloti(id),
    pilota_secondario_id    INTEGER REFERENCES piloti(id),   -- solo per vetture condivise (raro, anni '50)
    costruttore_id          INTEGER NOT NULL REFERENCES costruttori(id),
    numero_vettura          SMALLINT,
    posizione_griglia       SMALLINT,                        -- posizione in griglia di partenza (NULL se sconosciuta)
    posizione_finale        SMALLINT,                        -- NULL se non classificato/ritirato
    posizione_finale_testo  VARCHAR(20),                     -- fallback testuale: 'Rit.', 'NC', 'SQU', 'DSQ' ecc.
    stato_id                SMALLINT REFERENCES stati_risultato(id),
    motivo_ritiro           VARCHAR(80),                     -- testo grezzo originale della fonte (es. 'Oil leak', 'Gearbox'):
                                                              -- stato_id resta la categoria per filtrare/aggregare, questo
                                                              -- campo conserva il dettaglio che altrimenti si perderebbe
    giri_completati         SMALLINT,
    tempo_totale            INTERVAL,                        -- tempo di gara del vincitore o distacco assoluto
    distacco_testo          VARCHAR(30),                     -- es. '+12.345', '+1 Giro' (comodo da mostrare così com'è)
    punti                   NUMERIC(6,2) NOT NULL DEFAULT 0,
    giro_veloce             BOOLEAN NOT NULL DEFAULT FALSE,
    tempo_giro_veloce       INTERVAL,
    creato_il               TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_risultato_gara_pilota UNIQUE (gran_premio_id, pilota_id),
    CONSTRAINT chk_punti_non_negativi CHECK (punti >= 0)
);
CREATE INDEX idx_risultati_gp ON risultati_gara (gran_premio_id);
CREATE INDEX idx_risultati_pilota ON risultati_gara (pilota_id);
CREATE INDEX idx_risultati_costruttore ON risultati_gara (costruttore_id);
-- Indice pensato per la query "risultati per anno + circuito" (Fase C)
CREATE INDEX idx_gp_stagione_circuito ON gran_premi (stagione_id, circuito_id);

COMMIT;

-- =====================================================================
-- Esempi di dati di riferimento (seed minimo, da espandere)
-- =====================================================================
-- Nazioni comuni nella storia della F1 — codice ISO 3166-1 alpha-2, usato
-- sia per le bandierine emoji nel frontend sia come chiave con cui lo
-- script di Fase B trova/crea la nazione di un pilota (colonna CSV
-- opzionale "nazionalita", da valorizzare col codice ISO2). Lista non
-- esaustiva: lo script ne crea automaticamente altre se mancanti.
INSERT INTO nazioni (codice_iso2, nome, nome_gentilizio) VALUES
    ('IT', 'Italia', 'Italiano'),
    ('GB', 'Regno Unito', 'Britannico'),
    ('FR', 'Francia', 'Francese'),
    ('DE', 'Germania', 'Tedesco'),
    ('ES', 'Spagna', 'Spagnolo'),
    ('NL', 'Paesi Bassi', 'Olandese'),
    ('BE', 'Belgio', 'Belga'),
    ('CH', 'Svizzera', 'Svizzero'),
    ('AT', 'Austria', 'Austriaco'),
    ('MC', 'Monaco', 'Monegasco'),
    ('AR', 'Argentina', 'Argentino'),
    ('BR', 'Brasile', 'Brasiliano'),
    ('US', 'Stati Uniti', 'Statunitense'),
    ('MX', 'Messico', 'Messicano'),
    ('CA', 'Canada', 'Canadese'),
    ('AU', 'Australia', 'Australiano'),
    ('NZ', 'Nuova Zelanda', 'Neozelandese'),
    ('JP', 'Giappone', 'Giapponese'),
    ('TH', 'Thailandia', 'Thailandese'),
    ('ZA', 'Sudafrica', 'Sudafricano'),
    ('FI', 'Finlandia', 'Finlandese'),
    ('SE', 'Svezia', 'Svedese'),
    ('DK', 'Danimarca', 'Danese'),
    ('PL', 'Polonia', 'Polacco'),
    ('IE', 'Irlanda', 'Irlandese')
ON CONFLICT (codice_iso2) DO NOTHING;

INSERT INTO stati_risultato (codice, descrizione) VALUES
    ('FINISHED', 'Classificato al traguardo'),
    ('RETIRED', 'Ritirato'),
    ('ACCIDENT', 'Ritirato per incidente'),
    ('ENGINE', 'Ritirato per problema al motore'),
    ('DSQ', 'Squalificato'),
    ('NOT_CLASSIFIED', 'Non classificato')
ON CONFLICT DO NOTHING;

-- Esempio di sistema di punteggio moderno (2019-oggi): 25-18-15-12-10-8-6-4-2-1 + 1 punto giro veloce top 10
INSERT INTO sistemi_punteggio (nome, anno_inizio, anno_fine, punto_giro_veloce, note)
VALUES ('Sistema 2019-oggi', 2019, NULL, TRUE, 'Punto aggiuntivo per il giro più veloce se in top 10')
ON CONFLICT DO NOTHING;

-- Esempio di sistema di punteggio storico anni '50 (senza punto giro veloce da un certo anno, qui semplificato)
INSERT INTO sistemi_punteggio (nome, anno_inizio, anno_fine, punto_giro_veloce, note)
VALUES ('Sistema 1950-1959', 1950, 1959, TRUE, 'Punto aggiuntivo per il giro più veloce, indipendentemente dalla posizione')
ON CONFLICT DO NOTHING;

-- Valori punti-per-posizione dei due sistemi seminati sopra. Senza queste
-- righe, la classifica piloti (Fase C) calcolerebbe sempre 0 punti anche
-- avendo i risultati: la tabella sistemi_punteggio da sola descrive SOLO
-- l'esistenza di un sistema, punti_per_posizione è quella che lo rende
-- effettivamente utilizzabile nelle query.
INSERT INTO punti_per_posizione (sistema_punteggio_id, posizione, punti)
SELECT sp.id, v.posizione, v.punti
FROM sistemi_punteggio sp
CROSS JOIN (VALUES (1,25),(2,18),(3,15),(4,12),(5,10),(6,8),(7,6),(8,4),(9,2),(10,1)) AS v(posizione, punti)
WHERE sp.nome = 'Sistema 2019-oggi'
ON CONFLICT DO NOTHING;

INSERT INTO punti_per_posizione (sistema_punteggio_id, posizione, punti)
SELECT sp.id, v.posizione, v.punti
FROM sistemi_punteggio sp
CROSS JOIN (VALUES (1,8),(2,6),(3,4),(4,3),(5,2)) AS v(posizione, punti)
WHERE sp.nome = 'Sistema 1950-1959'
ON CONFLICT DO NOTHING;
