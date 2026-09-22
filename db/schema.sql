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
    biografia           TEXT,                          -- breve biografia editoriale, opzionale (popolata via patch SQL dedicate)
    curiosita           TEXT,                           -- un aneddoto/curiosità, opzionale
    fonti_biografia      TEXT,                          -- URL delle fonti usate per biografia/curiosità (riferimento interno, non esposto dall'API)
    fonti_sufficienti   BOOLEAN NOT NULL DEFAULT false, -- true solo se le fonti erano sufficienti per scrivere una biografia affidabile ("meglio vuoto che inventato")
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
    indirizzo           VARCHAR(200),
    capienza            INTEGER,
    google_maps_url     TEXT,
    storia              TEXT,                          -- testo libero, oggi scritto a mano solo per i 7 circuiti del 1950
    url_wikipedia       TEXT,
    creato_il           TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_circuiti_nome ON circuiti (nome);

-- Curve e rettilinei di un circuito, in ordine di percorrenza: usati dal
-- box "Curve e rettilinei" nella pagina /circuiti/:slug. nome_moderno
-- nullo = tratto esistito solo nella configurazione storica, rimosso da
-- quella attuale; nome_1950 valorizzato solo se diverso (o assente)
-- rispetto al nome moderno.
CREATE TABLE circuiti_curve (
    id                  SERIAL PRIMARY KEY,
    circuito_id         INTEGER NOT NULL REFERENCES circuiti(id) ON DELETE CASCADE,
    ordine              SMALLINT NOT NULL,
    tipo                VARCHAR(20) NOT NULL,           -- 'curva' | 'rettilineo'
    nome_moderno        VARCHAR(150),
    nome_1950           VARCHAR(150),
    anno_intitolazione  SMALLINT,                       -- anno del nome moderno, se assegnato dopo il 1950
    nota                TEXT,
    UNIQUE (circuito_id, ordine)
);

-- Versioni del tracciato nel tempo (layout/lunghezza cambiati): usate dal
-- box "Configurazioni nel tempo" nella pagina /circuiti/:slug.
CREATE TABLE circuiti_configurazioni (
    id                  SERIAL PRIMARY KEY,
    circuito_id         INTEGER NOT NULL REFERENCES circuiti(id) ON DELETE CASCADE,
    anno_da             SMALLINT NOT NULL,
    anno_a              SMALLINT,                       -- NULL = tuttora in uso (o ultima nota)
    lunghezza_km        NUMERIC(6,3),
    descrizione         TEXT NOT NULL,
    UNIQUE (circuito_id, anno_da)
);
CREATE INDEX idx_circuiti_configurazioni_circuito ON circuiti_configurazioni (circuito_id);

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
    commento            TEXT,                           -- breve commento editoriale sulla gara, opzionale: NULL finché non scritto a mano (o da Claude Desktop), mai generato automaticamente
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
    tipo_sessione           VARCHAR(10) NOT NULL DEFAULT 'gara',  -- 'gara' | 'sprint' (aggiunto 2026-09-21,
                                                              -- vedi nota sui punti Sprint mancanti più sotto)
    creato_il               TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_risultato_gara_pilota UNIQUE (gran_premio_id, pilota_id, tipo_sessione),
    CONSTRAINT chk_punti_non_negativi CHECK (punti >= 0),
    CONSTRAINT chk_tipo_sessione CHECK (tipo_sessione IN ('gara', 'sprint'))
);
CREATE INDEX idx_risultati_gp ON risultati_gara (gran_premio_id);
CREATE INDEX idx_risultati_pilota ON risultati_gara (pilota_id);
CREATE INDEX idx_risultati_costruttore ON risultati_gara (costruttore_id);
-- Indice pensato per la query "risultati per anno + circuito" (Fase C)
CREATE INDEX idx_gp_stagione_circuito ON gran_premi (stagione_id, circuito_id);

-- ---------------------------------------------------------------------
-- Arcade: utenti e punteggi
-- ---------------------------------------------------------------------
-- Introdotte per portare i punteggi Arcade oltre il localStorage attuale
-- (solo locale al browser, vedi ArcadeView.jsx/ChronoQuizView.jsx) verso
-- account utente reali e classifiche persistenti/condivise. auth_id
-- arriva dal sistema di autenticazione esterno (non ancora deciso al
-- momento in cui scrivo — Netlify Identity o Clerk sono le due opzioni
-- allo studio): questa tabella non gestisce password o login in proprio,
-- solo il collegamento tra quell'identità esterna e i dati Arcade.
--
-- NOTA: creato_il qui è TIMESTAMP (senza fuso orario), a differenza di
-- TIMESTAMPTZ usato da ogni altra tabella di questo schema (piloti,
-- circuiti, gran_premi, ecc.). Riportato così di proposito, identico a
-- come è stato creato realmente su Neon: schema.sql deve rispecchiare
-- il database vero, non la mia opinione su come andrebbe scritto. Da
-- valutare se allinearlo con una migrazione, non fatto qui.
CREATE TABLE utenti (
    id              SERIAL PRIMARY KEY,
    auth_id         VARCHAR(255) NOT NULL UNIQUE,   -- id univoco dal sistema di login esterno
    username        VARCHAR(50) NOT NULL UNIQUE,
    avatar_url      VARCHAR(255),
    livello_pilota  VARCHAR(50) DEFAULT 'Rookie',
    creato_il       TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Una riga per OGNI partita giocata (non solo il record personale): così
-- in futuro si possono costruire classifiche per periodo (es. "questo
-- mese"), non solo quella assoluta. Il record assoluto per gioco resta
-- comunque un semplice MAX(punti) GROUP BY gioco, non serve altro.
-- utente_id è nullable (nessun vincolo NOT NULL): da chiarire se è
-- voluto (punteggi anche da partite senza login) o da stringere.
CREATE TABLE arcade_punteggi (
    id          SERIAL PRIMARY KEY,
    utente_id   INTEGER REFERENCES utenti(id) ON DELETE CASCADE,
    gioco       VARCHAR(50) NOT NULL,   -- es. 'chronoquiz', in futuro altri slug gioco
    punti       INTEGER NOT NULL,
    creato_il   TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_arcade_punteggi_gioco_punti ON arcade_punteggi (gioco, punti DESC);

-- ---------------------------------------------------------------------
-- Arcade: Time Attack asincrono ("Monoposto Virtual Arena")
-- ---------------------------------------------------------------------
-- Nessuna tabella utenti_gioco separata: riusa la utenti già collegata a
-- Netlify Identity qui sopra, stessa identità/stesso "Livello Pilota" di
-- ChronoQuiz. Nessuna geometria di circuito salvata qui (né altrove):
-- il tracciato di gioco è generico e generato lato frontend, i circuiti
-- reali del DB influenzano solo un modificatore numerico (lunghezza del
-- rettilineo), non la forma — vedi frontend/src/game/pista.js.

-- Un solo tempo ufficiale per utente/circuito/tipo sessione: la riga
-- viene AGGIORNATA (non duplicata) quando arriva un tempo migliore del
-- precedente, la logica "solo se migliora" vive nel backend (vedi
-- backend/api/game.py), qui il vincolo garantisce solo l'unicità.
CREATE TABLE gioco_tempi (
    id               SERIAL PRIMARY KEY,
    utente_id        INTEGER NOT NULL REFERENCES utenti(id) ON DELETE CASCADE,
    circuito_id      INTEGER NOT NULL REFERENCES circuiti(id) ON DELETE CASCADE,
    tipo_sessione    VARCHAR(20) NOT NULL CHECK (tipo_sessione IN ('qualifica', 'gara')),
    tempo_totale     NUMERIC(8,3) NOT NULL,   -- secondi, es. 47.812
    telemetria_json  JSONB,                   -- checkpoint [{giro, indice, t}], vedi game.py
    creato_il        TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (utente_id, circuito_id, tipo_sessione)
);
-- Indice pensato per la query di classifica di un circuito (Fase C-gioco):
-- filtra per circuito+tipo, ordina per tempo — esattamente l'ordinamento
-- della query, quindi utilizzabile direttamente dal planner senza sort.
CREATE INDEX idx_gioco_tempi_circuito_tipo_tempo ON gioco_tempi (circuito_id, tipo_sessione, tempo_totale ASC);

CREATE TABLE gioco_classifica_campionato (
    utente_id       INTEGER PRIMARY KEY REFERENCES utenti(id) ON DELETE CASCADE,
    punti_totali    INTEGER NOT NULL DEFAULT 0,
    gare_disputate  INTEGER NOT NULL DEFAULT 0,
    aggiornato_il   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Traccia quali GP (circuiti) sono già stati "chiusi" (punti assegnati):
-- senza questa tabella, chiamare due volte /game/close-gp sullo stesso
-- circuito assegnerebbe i punti due volte. Non prevista nella richiesta
-- originale, aggiunta per rendere l'operazione sicura da ripetere per
-- errore (vedi nota nel backend).
CREATE TABLE gioco_gp_chiusi (
    circuito_id  INTEGER PRIMARY KEY REFERENCES circuiti(id) ON DELETE CASCADE,
    chiuso_il    TIMESTAMPTZ NOT NULL DEFAULT now()
);

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
    ('IE', 'Irlanda', 'Irlandese'),
    -- Nazioni ospitanti dei circuiti più recenti (aggiunte il 2026-09-20
    -- insieme al backfill di circuiti.nazione_id, vedi
    -- db/patch_backfill_nazioni_circuiti.sql e MAPPA_PAESE_CIRCUITO_ISO2
    -- in backend/import_stagioni_jolpica.py per il perché mancavano):
    ('PT', 'Portogallo', 'Portoghese'),
    ('MA', 'Marocco', 'Marocchino'),
    ('BH', 'Bahrein', 'Bahreinita'),
    ('AZ', 'Azerbaigian', 'Azero'),
    ('IN', 'India', 'Indiano'),
    ('TR', 'Turchia', 'Turco'),
    ('SA', 'Arabia Saudita', 'Saudita'),
    ('QA', 'Qatar', 'Qatariota'),
    ('SG', 'Singapore', 'Singaporiano'),
    ('HU', 'Ungheria', 'Ungherese'),
    ('MY', 'Malesia', 'Malese'),
    ('CN', 'Cina', 'Cinese'),
    ('RU', 'Russia', 'Russo'),
    ('KR', 'Corea del Sud', 'Sudcoreano'),
    ('AE', 'Emirati Arabi Uniti', 'Emiratino')
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
