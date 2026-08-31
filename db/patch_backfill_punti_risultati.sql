-- =====================================================================
-- patch_backfill_punti_risultati.sql
-- ---------------------------------------------------------------------
-- BUG REALE trovato mentre si preparava l'import delle stagioni
-- 1951-1970: risultati_gara.punti (la colonna che lo schema descrive
-- esplicitamente come "fonte di verità" per i punti, vedi commento in
-- schema.sql) in realtà non è mai stata valorizzata dall'import del
-- 1950 — resta sempre 0.00 (lo script di import CSV la scrive a 0 di
-- proposito, rimandando l'assegnazione punti a punti_per_posizione).
-- Le classifiche calcolate ("a somma", /classifica/piloti e
-- /classifica/scuderie) hanno sempre funzionato SOLO perché derivano i
-- punti da un JOIN con punti_per_posizione in base alla posizione
-- finale, non dalla colonna punti.
--
-- Per le nuove stagioni importate da Jolpica, invece, i punti reali
-- (già corretti per l'epoca, arrivi a pari merito compresi) arrivano
-- già pronti dalla fonte e vengono scritti DIRETTAMENTE in
-- risultati_gara.punti — coerentemente con quello che lo schema dice di
-- fare. Perché le classifiche calcolate continuino a funzionare allo
-- stesso modo per TUTTE le stagioni (vecchie e nuove) senza dover
-- mantenere due meccanismi diversi, questa patch:
--   1) riempie risultati_gara.punti anche per il 1950 con lo stesso
--      valore che punti_per_posizione avrebbe dato (backfill, una
--      tantum, verificato per dare ESATTAMENTE gli stessi numeri già
--      mostrati oggi in classifica per il 1950 — non cambia nulla per
--      chi guarda il sito);
--   2) da qui in avanti /classifica/piloti e /classifica/scuderie
--      (nel backend, non in questa patch SQL) sommano direttamente
--      risultati_gara.punti invece di ricalcolare tramite
--      punti_per_posizione — un solo meccanismo, quello che lo schema
--      aveva già dichiarato come corretto fin dall'inizio.
--
-- Sicura da rieseguire più volte: aggiorna solo le righe con punti=0
-- che hanno un valore diverso da assegnare secondo punti_per_posizione;
-- non tocca righe già valorizzate (es. quelle scritte da
-- import_stagioni_jolpica.py, che scrive già il valore vero).
-- =====================================================================

BEGIN;

-- NOTA TECNICA: la condizione "pp.posizione = r.posizione_finale" non può
-- stare nell'ON di un JOIN dentro la clausola FROM di una UPDATE, perché a
-- quel punto "r" (la tabella target) non è ancora visibile a quel JOIN —
-- Postgres restituisce "invalid reference to FROM-clause entry for table
-- r" (errore reale incontrato applicando questa patch). Le tabelle in FROM
-- vengono quindi accostate senza quella condizione, e tutti i confronti
-- con "r" (compreso questo) si spostano nella WHERE, dove "r" è visibile.
UPDATE risultati_gara r
SET punti = pp.punti
FROM gran_premi gp
JOIN stagioni s ON s.id = gp.stagione_id
JOIN punti_per_posizione pp
    ON pp.sistema_punteggio_id = s.sistema_punteggio_id
WHERE r.gran_premio_id = gp.id
  AND pp.posizione = r.posizione_finale
  AND r.punti = 0
  AND pp.punti IS NOT NULL;

COMMIT;
