-- verifica_link_lo_sapevi.sql
-- Controlla che ogni link delle curiosità "Lo sapevi che"
-- (frontend/src/data/loSapevi.js) punti a una pagina esistente.
-- Da incollare nell'SQL Editor di Neon e lanciare: se il risultato è VUOTO
-- (zero righe) è tutto a posto. Ogni riga restituita è un link rotto.
-- Sola lettura: non modifica nulla.

WITH piloti_link(slug) AS (VALUES
  ('alain-prost'),
  ('alberto-ascari'),
  ('damon-hill'),
  ('emerson-fittipaldi'),
  ('graham-hill'),
  ('jack-brabham'),
  ('jacques-villeneuve'),
  ('james-hunt'),
  ('jenson-button'),
  ('jim-clark'),
  ('jochen-rindt'),
  ('jody-scheckter'),
  ('john-surtees'),
  ('juan-manuel-fangio'),
  ('keke-rosberg'),
  ('kimi-raikkonen'),
  ('lewis-hamilton'),
  ('luigi-fagioli'),
  ('mario-andretti'),
  ('max-verstappen'),
  ('michael-schumacher'),
  ('mike-hawthorn'),
  ('nigel-mansell'),
  ('niki-lauda'),
  ('phil-hill'),
  ('sebastian-vettel'),
  ('stirling-moss')
), circuiti_link(slug) AS (VALUES
  ('monaco'),
  ('montreal'),
  ('monza'),
  ('nurburgring'),
  ('silverstone'),
  ('singapore'),
  ('spa'),
  ('suzuka')
), gare_link(anno, circuito) AS (VALUES
  (1950, 'indianapolis'),
  (1950, 'monaco'),
  (1950, 'silverstone'),
  (1951, 'silverstone'),
  (1954, 'reims'),
  (1955, 'monaco'),
  (1957, 'nurburgring'),
  (1957, 'pescara'),
  (1968, 'spa'),
  (1971, 'monza'),
  (1984, 'monaco'),
  (1985, 'estoril'),
  (1986, 'hungaroring'),
  (1988, 'monza'),
  (1992, 'spa'),
  (1996, 'monaco'),
  (2005, 'indianapolis'),
  (2008, 'interlagos'),
  (2012, 'shanghai'),
  (2021, 'yas-marina'),
  (2024, 'monaco')
)
SELECT 'pilota mancante' AS problema, pl.slug AS link
FROM piloti_link pl
WHERE NOT EXISTS (SELECT 1 FROM piloti p WHERE p.codice_riferimento = pl.slug)
UNION ALL
SELECT 'circuito mancante', cl.slug
FROM circuiti_link cl
WHERE NOT EXISTS (SELECT 1 FROM circuiti c WHERE c.codice_riferimento = cl.slug)
UNION ALL
SELECT 'gara mancante', gl.anno || '/' || gl.circuito
FROM gare_link gl
WHERE NOT EXISTS (
  SELECT 1 FROM gran_premi gp
  JOIN stagioni s ON s.id = gp.stagione_id
  JOIN circuiti c ON c.id = gp.circuito_id
  WHERE s.anno = gl.anno AND c.codice_riferimento = gl.circuito
);
