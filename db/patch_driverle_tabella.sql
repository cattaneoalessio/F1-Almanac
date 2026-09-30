-- Migrazione da eseguire UNA VOLTA sul database Neon già esistente (SQL
-- Editor della dashboard Neon), per aggiungere la tabella di Driverle senza
-- toccare nient'altro. schema.sql resta la fonte di verità per un database
-- nuovo da zero, ma non si riapplica da sola su uno già esistente.
--
-- Sicura da rilanciare per errore: IF NOT EXISTS non fa nulla se la
-- tabella è già stata creata da un lancio precedente.

BEGIN;

CREATE TABLE IF NOT EXISTS driverle_partite (
    id                     SERIAL PRIMARY KEY,
    utente_id              INTEGER NOT NULL REFERENCES utenti(id) ON DELETE CASCADE,
    data_puzzle            DATE NOT NULL,
    pilota_misterioso_id   INTEGER NOT NULL REFERENCES piloti(id),
    tentativi              JSONB NOT NULL DEFAULT '[]',
    stato                  VARCHAR(10) NOT NULL DEFAULT 'in_corso',
    punti                  INTEGER NOT NULL DEFAULT 0,
    creato_il              TIMESTAMPTZ NOT NULL DEFAULT now(),
    aggiornato_il          TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (utente_id, data_puzzle)
);

COMMIT;

-- Verifica: deve rispondere con una riga (la tabella appena creata o già
-- esistente) e zero righe di dati (nessuna partita ancora giocata).
SELECT count(*) AS partite_esistenti FROM driverle_partite;
