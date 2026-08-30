-- patch_nazionalita_costruttori.sql
--
-- Lo script di import di Fase B non aveva mai valorizzato la nazionalità
-- delle scuderie (colonna costruttori.nazione_id), perché non serviva
-- fino a quando non è arrivata la Sezione Scuderie del frontend, che la
-- usa per la bandierina. Questa patch la popola con dati storici noti e
-- pubblici (nessuna fonte proprietaria), per le 23 scuderie della
-- stagione 1950 già importata.
--
-- Sicura da rieseguire più volte (fa solo UPDATE su slug fissi): se in
-- futuro importi altre stagioni con nuove scuderie non coperte qui,
-- andrà semplicemente estesa con le righe mancanti.
--
-- Come eseguirla su Neon: apri il tuo progetto su neon.com, vai su
-- "SQL Editor", incolla questo file per intero e clicca Run.

UPDATE costruttori SET nazione_id = (SELECT id FROM nazioni WHERE codice_iso2 = 'IT')
WHERE codice_riferimento IN ('alfa-romeo', 'ferrari', 'maserati');

UPDATE costruttori SET nazione_id = (SELECT id FROM nazioni WHERE codice_iso2 = 'FR')
WHERE codice_riferimento IN ('talbot-lago', 'simca');

UPDATE costruttori SET nazione_id = (SELECT id FROM nazioni WHERE codice_iso2 = 'GB')
WHERE codice_riferimento IN ('era', 'cooper', 'alta');

UPDATE costruttori SET nazione_id = (SELECT id FROM nazioni WHERE codice_iso2 = 'US')
WHERE codice_riferimento IN (
    'adams', 'deidt', 'ewing', 'kurtis-kraft', 'langley', 'lesovsky',
    'marchese', 'milano', 'moore', 'nichels', 'olson', 'rae',
    'snowberger', 'stevens', 'wetteroth'
);

-- Verifica: deve restituire 0 righe (nessuna scuderia senza nazionalità).
SELECT codice_riferimento, nome FROM costruttori WHERE nazione_id IS NULL;
