-- patch_contenuti_piloti_circuiti_1950.sql
--
-- Popola i nuovi campi di arricchimento (aggiunti da
-- patch_arricchimento_piloti_circuiti.sql, da eseguire PRIMA di questo
-- file se non gia' fatto) con i contenuti raccolti per la stagione 1950:
--   - piloti: data di nascita/morte, link Wikipedia, biografia,
--     curiosita' (tutte scritte in modo originale, mai copiate da altre
--     fonti: il campo fonti_biografia riporta gli URL usati per
--     trasparenza/verifica futura, non e' pensato per essere mostrato
--     in pagina cosi' com'e')
--   - circuiti: indirizzo, capienza, link mappa, storia narrativa,
--     configurazioni del tracciato nel tempo, elenco curve/rettilinei
--     (con nome 1950 quando diverso da quello moderno, e l'anno in cui
--     il nome moderno e' stato assegnato se successivo al 1950)
--
-- Alcuni piloti minori hanno fonti_sufficienti = FALSE (o campi a NULL):
-- e' voluto, significa che le fonti pubbliche disponibili erano troppo
-- scarse per una biografia vera, quindi la scheda mostra solo i dati di
-- gara (gia' presenti) invece di testo inventato.
--
-- Sicura da rieseguire piu' volte (tutti UPDATE su slug fissi, o INSERT
-- ... ON CONFLICT ... DO UPDATE per le tabelle curve/configurazioni).
--
-- Come eseguirla su Neon: apri il tuo progetto su neon.com, vai su
-- "SQL Editor", incolla questo file per intero e clicca Run. Esegui
-- PRIMA patch_arricchimento_piloti_circuiti.sql se non l'hai gia' fatto
-- (altrimenti queste colonne/tabelle non esistono ancora).

BEGIN;

UPDATE circuiti SET
                indirizzo = 'Bremgartenwald (bosco di Bremgarten), a nord-ovest della città di Berna, Svizzera',
                capienza = NULL,
                storia = 'Il circuito di Bremgarten nacque agli inizi degli anni ''30 nella foresta del Bremgartenwald, immediatamente a nord-ovest di Berna, come tracciato inizialmente pensato per le competizioni motociclistiche. Nel 1934 il percorso boschivo ospitò la prima edizione automobilistica del Gran Premio di Svizzera, imponendosi rapidamente come una delle piste più spettacolari e temute del panorama internazionale. Il tracciato si sviluppava per oltre 7 km attraverso un fitto bosco, senza un vero rettilineo: una sequenza quasi ininterrotta di curve veloci e medie, spesso cieche, incorniciate dagli alberi. L''ombra della vegetazione manteneva l''asfalto costantemente umido anche nelle giornate soleggiate, rendendo la superficie scivolosa e imprevedibile, mentre l''assenza quasi totale di vie di fuga trasformava ogni errore in un rischio mortale. Proprio queste caratteristiche resero Bremgarten teatro di incidenti gravissimi, culminati nel luglio 1948 con la morte, nel giro di pochi giorni, del pilota Achille Varzi e del motociclista Omobono Tenni nella zona della curva di Eymatt, seguiti dal decesso dello svizzero Christian Kautz. Quando nel 1950 nacque il Campionato del Mondo di Formula 1, Bremgarten fu scelto come sede del Gran Premio di Svizzera inaugurale, confermando il ruolo del circuito bernese tra le tappe fondatrici del Mondiale. La pista rimase nel calendario iridato fino al 1954, ospitando complessivamente cinque Gran Premi di Formula 1 oltre a diverse gare motociclistiche di velocità. Il disastro della 24 Ore di Le Mans del giugno 1955, che costò la vita a decine di spettatori, spinse le autorità svizzere a vietare per legge qualsiasi competizione motoristica con gare di velocità su circuito chiuso disputata sul territorio della Confederazione. Il Gran Premio di Svizzera già programmato per l''agosto 1955 fu di conseguenza cancellato e Bremgarten non ospitò mai più una gara, restando l''unica configurazione mai utilizzata dal circuito. Con il passare dei decenni gran parte del tracciato originale è stata inglobata dall''espansione urbana di Berna e dalla costruzione dell''autostrada, e oggi solo alcuni tratti nel bosco sopravvivono come sentieri e piste ciclabili.',
                google_maps_url = 'https://www.google.com/maps/search/?api=1&query=Bremgartenwald+Bern+Svizzera',
                fonti = 'https://en.wikipedia.org/wiki/Circuit_Bremgarten
https://it.wikipedia.org/wiki/Circuito_di_Bremgarten
https://en.wikipedia.org/wiki/1950_Swiss_Grand_Prix
https://www.f1-fansite.com/f1-circuits/circuit-bremgarten-layout-records/
https://www.motorsportmagazine.com/database/circuits/bremgarten/
https://permanenttourist.ch/2013/06/bremgarten-grand-prix-circuit/',
                lunghezza_km = COALESCE(lunghezza_km, 7.28)
            WHERE codice_riferimento = 'bremgarten';

INSERT INTO circuiti_configurazioni (circuito_id, anno_da, anno_a, lunghezza_km, descrizione)
                SELECT id, 1934, 1955, 7.28, 'Unica configurazione mai esistita del circuito: un anello stradale boschivo di circa 7,28 km rimasto sostanzialmente invariato dal debutto automobilistico del 1934 fino all''ultimo Gran Premio disputato nel 1954, mai più utilizzato dopo il divieto svizzero delle corse su circuito introdotto nel 1955.'
                FROM circuiti WHERE codice_riferimento = 'bremgarten'
                ON CONFLICT (circuito_id, anno_da) DO UPDATE SET
                    anno_a = EXCLUDED.anno_a,
                    lunghezza_km = EXCLUDED.lunghezza_km,
                    descrizione = EXCLUDED.descrizione;

INSERT INTO circuiti_curve (circuito_id, ordine, tipo, nome_moderno, nome_1950, anno_intitolazione, nota)
                SELECT id, 1, 'rettilineo', 'Forsthaus', NULL, NULL, 'Zona della casa forestale presso cui si trovava il rettilineo di partenza e arrivo.'
                FROM circuiti WHERE codice_riferimento = 'bremgarten'
                ON CONFLICT (circuito_id, ordine) DO UPDATE SET
                    tipo = EXCLUDED.tipo,
                    nome_moderno = EXCLUDED.nome_moderno,
                    nome_1950 = EXCLUDED.nome_1950,
                    anno_intitolazione = EXCLUDED.anno_intitolazione,
                    nota = EXCLUDED.nota;

INSERT INTO circuiti_curve (circuito_id, ordine, tipo, nome_moderno, nome_1950, anno_intitolazione, nota)
                SELECT id, 2, 'curva', 'Eymatt', NULL, NULL, 'Veloce curva nel settore nord-ovest, tristemente nota per gli incidenti mortali del luglio 1948.'
                FROM circuiti WHERE codice_riferimento = 'bremgarten'
                ON CONFLICT (circuito_id, ordine) DO UPDATE SET
                    tipo = EXCLUDED.tipo,
                    nome_moderno = EXCLUDED.nome_moderno,
                    nome_1950 = EXCLUDED.nome_1950,
                    anno_intitolazione = EXCLUDED.anno_intitolazione,
                    nota = EXCLUDED.nota;

INSERT INTO circuiti_curve (circuito_id, ordine, tipo, nome_moderno, nome_1950, anno_intitolazione, nota)
                SELECT id, 3, 'curva', 'Jordenrain / Jordanweiher', NULL, NULL, 'Settore boschivo presso il laghetto Jordenweiher, tra le zone più insidiose del tracciato.'
                FROM circuiti WHERE codice_riferimento = 'bremgarten'
                ON CONFLICT (circuito_id, ordine) DO UPDATE SET
                    tipo = EXCLUDED.tipo,
                    nome_moderno = EXCLUDED.nome_moderno,
                    nome_1950 = EXCLUDED.nome_1950,
                    anno_intitolazione = EXCLUDED.anno_intitolazione,
                    nota = EXCLUDED.nota;

INSERT INTO circuiti_curve (circuito_id, ordine, tipo, nome_moderno, nome_1950, anno_intitolazione, nota)
                SELECT id, 4, 'curva', 'Glasbrunnen', NULL, NULL, 'Ampia curva del bosco, oggi in parte scomparsa a causa delle modifiche stradali successive.'
                FROM circuiti WHERE codice_riferimento = 'bremgarten'
                ON CONFLICT (circuito_id, ordine) DO UPDATE SET
                    tipo = EXCLUDED.tipo,
                    nome_moderno = EXCLUDED.nome_moderno,
                    nome_1950 = EXCLUDED.nome_1950,
                    anno_intitolazione = EXCLUDED.anno_intitolazione,
                    nota = EXCLUDED.nota;

INSERT INTO circuiti_curve (circuito_id, ordine, tipo, nome_moderno, nome_1950, anno_intitolazione, nota)
                SELECT id, 5, 'curva', 'Eichholz', NULL, NULL, 'Sezione a curve rapide nel tratto boschivo del circuito.'
                FROM circuiti WHERE codice_riferimento = 'bremgarten'
                ON CONFLICT (circuito_id, ordine) DO UPDATE SET
                    tipo = EXCLUDED.tipo,
                    nome_moderno = EXCLUDED.nome_moderno,
                    nome_1950 = EXCLUDED.nome_1950,
                    anno_intitolazione = EXCLUDED.anno_intitolazione,
                    nota = EXCLUDED.nota;

INSERT INTO circuiti_curve (circuito_id, ordine, tipo, nome_moderno, nome_1950, anno_intitolazione, nota)
                SELECT id, 6, 'curva', 'Bethlehem', NULL, NULL, 'Punto del tracciato successivamente attraversato dal tracciato autostradale per Neuchâtel.'
                FROM circuiti WHERE codice_riferimento = 'bremgarten'
                ON CONFLICT (circuito_id, ordine) DO UPDATE SET
                    tipo = EXCLUDED.tipo,
                    nome_moderno = EXCLUDED.nome_moderno,
                    nome_1950 = EXCLUDED.nome_1950,
                    anno_intitolazione = EXCLUDED.anno_intitolazione,
                    nota = EXCLUDED.nota;

UPDATE circuiti SET
                indirizzo = '4790 W 16th St, Speedway, Indiana 46224, Stati Uniti',
                capienza = 235000,
                storia = 'L''Indianapolis Motor Speedway nasce nel 1909 come pista da collaudo per l''industria automobilistica statunitense, allora in piena espansione. Il fondo originario, composto da terra battuta e pietrisco, si rivelò presto pericoloso, tanto da spingere i proprietari a farlo ricoprire con oltre tre milioni di mattoni posati a mano tra il 1909 e il 1910: da qui nacque il soprannome popolare di "Brickyard", ovvero "fabbrica di mattoni". La pavimentazione in laterizio rimase quasi integralmente in uso per oltre cinquant''anni, finché nel 1961 fu ricoperta di asfalto, lasciando visibile solo una striscia di circa un metro all''altezza del traguardo, oggi nota come "yard of bricks" e diventata un simbolo identitario dell''impianto. Fin dal 1911 l''ovale ospita la 500 Miglia di Indianapolis, gara che nel tempo è diventata uno degli eventi motoristici più seguiti e importanti degli Stati Uniti, capace di richiamare folle oceaniche. Tra il 1950 e il 1960 la 500 Miglia venne inserita a tutti gli effetti nel calendario del Campionato del Mondo di Formula 1, assegnando punti validi per il titolo iridato: si trattò tuttavia di un caso del tutto particolare, perché la corsa continuò a svolgersi con regolamento, vetture e piloti tipici delle competizioni americane dell''epoca, e i protagonisti abituali del Mondiale europeo non vi presero quasi mai parte. Questa convivenza formale ma di fatto separata tra i due mondi corsistici rende la gara del 1950 un caso a sé nella storia del campionato, da leggere più come un''eredità organizzativa iniziale della neonata Formula 1 che come una vera tappa condivisa con i circuiti europei. L''impianto di Indianapolis è inoltre celebre per la sua capienza fuori scala, che lo colloca tra gli impianti sportivi con posti a sedere permanenti più numerosi al mondo, un primato che contribuisce non poco al suo status di icona dello sport motoristico statunitense.',
                google_maps_url = 'https://www.google.com/maps/search/?api=1&query=Indianapolis+Motor+Speedway+4790+W+16th+St+Speedway+Indiana',
                fonti = 'https://en.wikipedia.org/wiki/Indianapolis_Motor_Speedway
https://www.guinnessworldrecords.com/world-records/69197-largest-stadium-overall-capacity
https://en.wikipedia.org/wiki/Speedway,_Indiana',
                lunghezza_km = COALESCE(lunghezza_km, 4.023)
            WHERE codice_riferimento = 'indianapolis';

INSERT INTO circuiti_configurazioni (circuito_id, anno_da, anno_a, lunghezza_km, descrizione)
                SELECT id, 1909, NULL, 4.023, 'L''ovale ha mantenuto sostanzialmente invariate le proprie dimensioni principali dal 1909 a oggi: cambiò più volte la pavimentazione (terra e pietrisco, poi mattoni, poi asfalto), ma non lo sviluppo del tracciato, pari a 2,5 miglia.'
                FROM circuiti WHERE codice_riferimento = 'indianapolis'
                ON CONFLICT (circuito_id, anno_da) DO UPDATE SET
                    anno_a = EXCLUDED.anno_a,
                    lunghezza_km = EXCLUDED.lunghezza_km,
                    descrizione = EXCLUDED.descrizione;

INSERT INTO circuiti_curve (circuito_id, ordine, tipo, nome_moderno, nome_1950, anno_intitolazione, nota)
                SELECT id, 1, 'rettilineo', 'Main Straightaway (Yard of Bricks)', NULL, NULL, 'Rettilineo del traguardo, dove resta visibile la storica striscia di mattoni originari.'
                FROM circuiti WHERE codice_riferimento = 'indianapolis'
                ON CONFLICT (circuito_id, ordine) DO UPDATE SET
                    tipo = EXCLUDED.tipo,
                    nome_moderno = EXCLUDED.nome_moderno,
                    nome_1950 = EXCLUDED.nome_1950,
                    anno_intitolazione = EXCLUDED.anno_intitolazione,
                    nota = EXCLUDED.nota;

INSERT INTO circuiti_curve (circuito_id, ordine, tipo, nome_moderno, nome_1950, anno_intitolazione, nota)
                SELECT id, 2, 'curva', 'Turn 1', NULL, NULL, NULL
                FROM circuiti WHERE codice_riferimento = 'indianapolis'
                ON CONFLICT (circuito_id, ordine) DO UPDATE SET
                    tipo = EXCLUDED.tipo,
                    nome_moderno = EXCLUDED.nome_moderno,
                    nome_1950 = EXCLUDED.nome_1950,
                    anno_intitolazione = EXCLUDED.anno_intitolazione,
                    nota = EXCLUDED.nota;

INSERT INTO circuiti_curve (circuito_id, ordine, tipo, nome_moderno, nome_1950, anno_intitolazione, nota)
                SELECT id, 3, 'rettilineo', 'Short Chute (tra Turn 1 e Turn 2)', NULL, NULL, 'Breve rettilineo di raccordo tra le due curve accoppiate del lato nord.'
                FROM circuiti WHERE codice_riferimento = 'indianapolis'
                ON CONFLICT (circuito_id, ordine) DO UPDATE SET
                    tipo = EXCLUDED.tipo,
                    nome_moderno = EXCLUDED.nome_moderno,
                    nome_1950 = EXCLUDED.nome_1950,
                    anno_intitolazione = EXCLUDED.anno_intitolazione,
                    nota = EXCLUDED.nota;

INSERT INTO circuiti_curve (circuito_id, ordine, tipo, nome_moderno, nome_1950, anno_intitolazione, nota)
                SELECT id, 4, 'curva', 'Turn 2', NULL, NULL, NULL
                FROM circuiti WHERE codice_riferimento = 'indianapolis'
                ON CONFLICT (circuito_id, ordine) DO UPDATE SET
                    tipo = EXCLUDED.tipo,
                    nome_moderno = EXCLUDED.nome_moderno,
                    nome_1950 = EXCLUDED.nome_1950,
                    anno_intitolazione = EXCLUDED.anno_intitolazione,
                    nota = EXCLUDED.nota;

INSERT INTO circuiti_curve (circuito_id, ordine, tipo, nome_moderno, nome_1950, anno_intitolazione, nota)
                SELECT id, 5, 'rettilineo', 'Backstretch', NULL, NULL, 'Rettilineo opposto al traguardo, sul lato est del tracciato.'
                FROM circuiti WHERE codice_riferimento = 'indianapolis'
                ON CONFLICT (circuito_id, ordine) DO UPDATE SET
                    tipo = EXCLUDED.tipo,
                    nome_moderno = EXCLUDED.nome_moderno,
                    nome_1950 = EXCLUDED.nome_1950,
                    anno_intitolazione = EXCLUDED.anno_intitolazione,
                    nota = EXCLUDED.nota;

INSERT INTO circuiti_curve (circuito_id, ordine, tipo, nome_moderno, nome_1950, anno_intitolazione, nota)
                SELECT id, 6, 'curva', 'Turn 3', NULL, NULL, NULL
                FROM circuiti WHERE codice_riferimento = 'indianapolis'
                ON CONFLICT (circuito_id, ordine) DO UPDATE SET
                    tipo = EXCLUDED.tipo,
                    nome_moderno = EXCLUDED.nome_moderno,
                    nome_1950 = EXCLUDED.nome_1950,
                    anno_intitolazione = EXCLUDED.anno_intitolazione,
                    nota = EXCLUDED.nota;

INSERT INTO circuiti_curve (circuito_id, ordine, tipo, nome_moderno, nome_1950, anno_intitolazione, nota)
                SELECT id, 7, 'rettilineo', 'Short Chute (tra Turn 3 e Turn 4)', NULL, NULL, 'Breve rettilineo di raccordo tra le due curve accoppiate del lato sud.'
                FROM circuiti WHERE codice_riferimento = 'indianapolis'
                ON CONFLICT (circuito_id, ordine) DO UPDATE SET
                    tipo = EXCLUDED.tipo,
                    nome_moderno = EXCLUDED.nome_moderno,
                    nome_1950 = EXCLUDED.nome_1950,
                    anno_intitolazione = EXCLUDED.anno_intitolazione,
                    nota = EXCLUDED.nota;

INSERT INTO circuiti_curve (circuito_id, ordine, tipo, nome_moderno, nome_1950, anno_intitolazione, nota)
                SELECT id, 8, 'curva', 'Turn 4', NULL, NULL, NULL
                FROM circuiti WHERE codice_riferimento = 'indianapolis'
                ON CONFLICT (circuito_id, ordine) DO UPDATE SET
                    tipo = EXCLUDED.tipo,
                    nome_moderno = EXCLUDED.nome_moderno,
                    nome_1950 = EXCLUDED.nome_1950,
                    anno_intitolazione = EXCLUDED.anno_intitolazione,
                    nota = EXCLUDED.nota;

UPDATE circuiti SET
                indirizzo = 'Monte Carlo, Principato di Monaco — tracciato cittadino sviluppato attorno a Place du Casino, Port Hercule e Boulevard Albert Ier',
                capienza = 37000,
                storia = 'Il tracciato di Monte Carlo nasce nel 1929 per iniziativa di Antony Noghès, all''epoca presidente dell''Automobile Club di Monaco, che ottenne l''appoggio della famiglia Grimaldi per organizzare una gara automobilistica lungo le strade del Principato. La prima edizione, disputata quello stesso anno, fu vinta dal francese William Grover-Williams al volante di una Bugatti. Fin dall''origine il circuito si snoda tra le vie di Monte Carlo sfruttando saliscendi, tornanti strettissimi e l''affaccio sul porto, elementi che lo hanno reso unico rispetto agli autodromi permanenti. Nel 1950 il tracciato monegasco entrò a far parte del calendario del primissimo Campionato del Mondo di Formula 1, ospitando la seconda prova stagionale dell''anno. La gara del 1950 fu condizionata da un''onda anomala che allagò il tratto del Tabac, provocando un maxi-incidente che coinvolse gran parte dello schieramento. Nonostante alcune modifiche apportate nei decenni successivi, l''impianto generale del percorso è rimasto sorprendentemente fedele a quello originario, a differenza di molti altri circuiti storici completamente ridisegnati o scomparsi. La ristrettezza delle vie cittadine, i muretti a bordo pista e l''assenza quasi totale di vie di fuga hanno reso Monaco il banco di prova per eccellenza dell''abilità dei piloti più che della velocità pura. Ancora oggi il Gran Premio di Monaco è considerato, insieme a Indianapolis 500 e 24 Ore di Le Mans, uno degli appuntamenti più prestigiosi del motorsport mondiale.',
                google_maps_url = 'https://www.google.com/maps/search/?api=1&query=Circuit+de+Monaco+Monte+Carlo',
                fonti = 'https://en.wikipedia.org/wiki/Circuit_de_Monaco
https://en.wikipedia.org/wiki/1950_Monaco_Grand_Prix
https://en.wikipedia.org/wiki/1929_Monaco_Grand_Prix
https://www.formula1.com/en/latest/article/explained-how-every-monaco-corner-got-its-name.5ClYqWmfpeUpsRJA6mDNaX
https://monacolife.net/how-monacos-most-famous-grand-prix-corners-got-their-names/
https://www.motorsportmagazine.com/articles/single-seaters/f1/monaco-grand-prix-circuit-layout-how-its-changed-since-1929/',
                lunghezza_km = COALESCE(lunghezza_km, 3.18)
            WHERE codice_riferimento = 'monaco';

INSERT INTO circuiti_configurazioni (circuito_id, anno_da, anno_a, lunghezza_km, descrizione)
                SELECT id, 1929, 1972, 3.18, 'Configurazione originaria, rimasta sostanzialmente invariata dal 1929 ai primi anni ''70: dopo il Tabac la pista tornava verso il traguardo con un unico tornante stretto, senza il tratto della piscina realizzato in seguito.'
                FROM circuiti WHERE codice_riferimento = 'monaco'
                ON CONFLICT (circuito_id, anno_da) DO UPDATE SET
                    anno_a = EXCLUDED.anno_a,
                    lunghezza_km = EXCLUDED.lunghezza_km,
                    descrizione = EXCLUDED.descrizione;

INSERT INTO circuiti_configurazioni (circuito_id, anno_da, anno_a, lunghezza_km, descrizione)
                SELECT id, 1973, 1985, 3.278, 'Nel 1973 fu inserito un nuovo tratto su terreno guadagnato al mare, che introdusse la chicane della piscina e allungò il percorso tra Tabac e il traguardo, dando forma definitiva alle curve La Rascasse e Anthony Noghès.'
                FROM circuiti WHERE codice_riferimento = 'monaco'
                ON CONFLICT (circuito_id, anno_da) DO UPDATE SET
                    anno_a = EXCLUDED.anno_a,
                    lunghezza_km = EXCLUDED.lunghezza_km,
                    descrizione = EXCLUDED.descrizione;

INSERT INTO circuiti_configurazioni (circuito_id, anno_da, anno_a, lunghezza_km, descrizione)
                SELECT id, 1986, 2014, 3.34, 'La vecchia chicane veloce vicino al porto fu ridisegnata nel 1986 in versione più lenta a doppio cambio di direzione, ribattezzata Nouvelle Chicane per motivi di sicurezza.'
                FROM circuiti WHERE codice_riferimento = 'monaco'
                ON CONFLICT (circuito_id, anno_da) DO UPDATE SET
                    anno_a = EXCLUDED.anno_a,
                    lunghezza_km = EXCLUDED.lunghezza_km,
                    descrizione = EXCLUDED.descrizione;

INSERT INTO circuiti_configurazioni (circuito_id, anno_da, anno_a, lunghezza_km, descrizione)
                SELECT id, 2015, NULL, 3.337, 'Una lieve rettifica al profilo della curva del Tabac nel 2015 ha ridotto la lunghezza complessiva del tracciato di alcuni metri, portandola alla misura attuale.'
                FROM circuiti WHERE codice_riferimento = 'monaco'
                ON CONFLICT (circuito_id, anno_da) DO UPDATE SET
                    anno_a = EXCLUDED.anno_a,
                    lunghezza_km = EXCLUDED.lunghezza_km,
                    descrizione = EXCLUDED.descrizione;

INSERT INTO circuiti_curve (circuito_id, ordine, tipo, nome_moderno, nome_1950, anno_intitolazione, nota)
                SELECT id, 1, 'curva', 'Sainte-Dévote', 'Sainte-Dévote', 1929, 'Prima curva dopo il traguardo, già presente e denominata fin dalla prima edizione del 1929 in onore della santa patrona di Monaco.'
                FROM circuiti WHERE codice_riferimento = 'monaco'
                ON CONFLICT (circuito_id, ordine) DO UPDATE SET
                    tipo = EXCLUDED.tipo,
                    nome_moderno = EXCLUDED.nome_moderno,
                    nome_1950 = EXCLUDED.nome_1950,
                    anno_intitolazione = EXCLUDED.anno_intitolazione,
                    nota = EXCLUDED.nota;

INSERT INTO circuiti_curve (circuito_id, ordine, tipo, nome_moderno, nome_1950, anno_intitolazione, nota)
                SELECT id, 2, 'curva', 'Casino (Casino Square)', 'Casino', NULL, 'Prende il nome dal Casinò di Monte-Carlo, già esistente all''epoca del primo GP; il nome non è cambiato nel tempo.'
                FROM circuiti WHERE codice_riferimento = 'monaco'
                ON CONFLICT (circuito_id, ordine) DO UPDATE SET
                    tipo = EXCLUDED.tipo,
                    nome_moderno = EXCLUDED.nome_moderno,
                    nome_1950 = EXCLUDED.nome_1950,
                    anno_intitolazione = EXCLUDED.anno_intitolazione,
                    nota = EXCLUDED.nota;

INSERT INTO circuiti_curve (circuito_id, ordine, tipo, nome_moderno, nome_1950, anno_intitolazione, nota)
                SELECT id, 3, 'curva', 'Mirabeau', 'Mirabeau', NULL, 'Deve il nome allo storico Hotel Mirabeau, poi demolito; in epoche successive il tratto è stato distinto in Mirabeau Alta e Bassa.'
                FROM circuiti WHERE codice_riferimento = 'monaco'
                ON CONFLICT (circuito_id, ordine) DO UPDATE SET
                    tipo = EXCLUDED.tipo,
                    nome_moderno = EXCLUDED.nome_moderno,
                    nome_1950 = EXCLUDED.nome_1950,
                    anno_intitolazione = EXCLUDED.anno_intitolazione,
                    nota = EXCLUDED.nota;

INSERT INTO circuiti_curve (circuito_id, ordine, tipo, nome_moderno, nome_1950, anno_intitolazione, nota)
                SELECT id, 4, 'curva', 'Fairmont Hairpin', 'Virage de la Gare (tornante della Stazione)', 2005, 'Negli anni ''50 era noto come tornante ''della Stazione'' per la vicinanza alla stazione ferroviaria; fu poi chiamato Loews Hairpin dal 1975 e Fairmont dai primi anni 2000, seguendo i nomi degli hotel costruiti sul posto.'
                FROM circuiti WHERE codice_riferimento = 'monaco'
                ON CONFLICT (circuito_id, ordine) DO UPDATE SET
                    tipo = EXCLUDED.tipo,
                    nome_moderno = EXCLUDED.nome_moderno,
                    nome_1950 = EXCLUDED.nome_1950,
                    anno_intitolazione = EXCLUDED.anno_intitolazione,
                    nota = EXCLUDED.nota;

INSERT INTO circuiti_curve (circuito_id, ordine, tipo, nome_moderno, nome_1950, anno_intitolazione, nota)
                SELECT id, 5, 'curva', 'Portier', 'Portier', NULL, 'Nome legato al quartiere Le Portier, già presente nel tracciato originale del 1929.'
                FROM circuiti WHERE codice_riferimento = 'monaco'
                ON CONFLICT (circuito_id, ordine) DO UPDATE SET
                    tipo = EXCLUDED.tipo,
                    nome_moderno = EXCLUDED.nome_moderno,
                    nome_1950 = EXCLUDED.nome_1950,
                    anno_intitolazione = EXCLUDED.anno_intitolazione,
                    nota = EXCLUDED.nota;

INSERT INTO circuiti_curve (circuito_id, ordine, tipo, nome_moderno, nome_1950, anno_intitolazione, nota)
                SELECT id, 6, 'rettilineo', 'Tunnel', NULL, NULL, 'Un tratto in galleria esisteva già nel 1950, ma la struttura attuale sotto l''hotel Fairmont risale ai lavori edilizi degli anni ''70; le fonti non concordano sul nome esatto usato nel 1950.'
                FROM circuiti WHERE codice_riferimento = 'monaco'
                ON CONFLICT (circuito_id, ordine) DO UPDATE SET
                    tipo = EXCLUDED.tipo,
                    nome_moderno = EXCLUDED.nome_moderno,
                    nome_1950 = EXCLUDED.nome_1950,
                    anno_intitolazione = EXCLUDED.anno_intitolazione,
                    nota = EXCLUDED.nota;

INSERT INTO circuiti_curve (circuito_id, ordine, tipo, nome_moderno, nome_1950, anno_intitolazione, nota)
                SELECT id, 7, 'curva', 'Nouvelle Chicane', 'Chicane du Port', 1986, 'Nel 1950 esisteva già una chicane veloce nei pressi del porto; fu resa più lenta e ribattezzata ''Nouvelle Chicane'' nel 1986 per ragioni di sicurezza.'
                FROM circuiti WHERE codice_riferimento = 'monaco'
                ON CONFLICT (circuito_id, ordine) DO UPDATE SET
                    tipo = EXCLUDED.tipo,
                    nome_moderno = EXCLUDED.nome_moderno,
                    nome_1950 = EXCLUDED.nome_1950,
                    anno_intitolazione = EXCLUDED.anno_intitolazione,
                    nota = EXCLUDED.nota;

INSERT INTO circuiti_curve (circuito_id, ordine, tipo, nome_moderno, nome_1950, anno_intitolazione, nota)
                SELECT id, 8, 'curva', 'Tabac', 'Tabac', NULL, 'Deve il nome a una storica tabaccheria adiacente alla pista, presente fin dalle prime edizioni della gara.'
                FROM circuiti WHERE codice_riferimento = 'monaco'
                ON CONFLICT (circuito_id, ordine) DO UPDATE SET
                    tipo = EXCLUDED.tipo,
                    nome_moderno = EXCLUDED.nome_moderno,
                    nome_1950 = EXCLUDED.nome_1950,
                    anno_intitolazione = EXCLUDED.anno_intitolazione,
                    nota = EXCLUDED.nota;

INSERT INTO circuiti_curve (circuito_id, ordine, tipo, nome_moderno, nome_1950, anno_intitolazione, nota)
                SELECT id, 9, 'curva', 'Piscine (Nouvelle Piscine)', NULL, 1973, 'Questo tratto non esisteva nel 1950: fu realizzato nel 1973 su terreno guadagnato al mare in concomitanza con la costruzione dello Stade Nautique Rainier III.'
                FROM circuiti WHERE codice_riferimento = 'monaco'
                ON CONFLICT (circuito_id, ordine) DO UPDATE SET
                    tipo = EXCLUDED.tipo,
                    nome_moderno = EXCLUDED.nome_moderno,
                    nome_1950 = EXCLUDED.nome_1950,
                    anno_intitolazione = EXCLUDED.anno_intitolazione,
                    nota = EXCLUDED.nota;

INSERT INTO circuiti_curve (circuito_id, ordine, tipo, nome_moderno, nome_1950, anno_intitolazione, nota)
                SELECT id, 10, 'curva', 'La Rascasse', NULL, 1973, 'Nel 1950 il tracciato proseguiva dal Tabac al traguardo con un unico tornante (informalmente detto ''del Gasometro''); l''attuale curva La Rascasse, che prende nome da un locale situato lì accanto, assunse la forma odierna con la riconfigurazione del 1973.'
                FROM circuiti WHERE codice_riferimento = 'monaco'
                ON CONFLICT (circuito_id, ordine) DO UPDATE SET
                    tipo = EXCLUDED.tipo,
                    nome_moderno = EXCLUDED.nome_moderno,
                    nome_1950 = EXCLUDED.nome_1950,
                    anno_intitolazione = EXCLUDED.anno_intitolazione,
                    nota = EXCLUDED.nota;

UPDATE circuiti SET
                indirizzo = 'Via Vedano, 5, 20900 Monza (MB), Italia',
                capienza = 118865,
                storia = 'L''Autodromo Nazionale di Monza nacque nel 1922 per volontà dell''Automobile Club di Milano, che volle dotare l''Italia di un impianto permanente per le corse in occasione del proprio venticinquesimo anniversario, in un momento in cui l''industria automobilistica nazionale cercava un banco di prova stabile per le vetture ad alta velocità. Realizzato all''interno del Parco di Monza in appena 110 giorni di lavori, l''impianto fu inaugurato il 3 settembre 1922 e divenne da subito uno dei circuiti permanenti più importanti al mondo, ospitando fin dal primo anno il Gran Premio d''Italia. Il tracciato originario combinava un anello stradale con una pista sopraelevata ad alta velocità, ma dopo alcuni gravi incidenti tra la fine degli anni Venti e i primi anni Trenta l''anello sopraelevato fu abbandonato e infine smantellato. Alla fine degli anni Trenta il circuito fu quindi ridisegnato in una versione esclusivamente stradale, più sicura ma ancora estremamente veloce: è proprio questa configurazione, lunga circa 6,3 km, a essere stata utilizzata per il Gran Premio d''Italia 1950, valido per il primo Campionato del Mondo di Formula 1. Solo nel 1955, cinque anni dopo quella gara, un''importante ristrutturazione introdusse un nuovo anello sopraelevato con curve paraboliche in cemento, affiancato a un tracciato stradale leggermente accorciato: la combinazione delle due piste, per un totale di circa 10 km, fu utilizzata in alcune edizioni del Gran Premio fino ai primi anni Sessanta, prima che l''anello venisse abbandonato per motivi di sicurezza. Monza si guadagnò presto il soprannome di ''Tempio della Velocità'' per le altissime medie orarie che vi si registravano, ma pagò anche un tributo doloroso in vite umane, con diversi incidenti mortali che negli anni ne segnarono profondamente l''evoluzione in chiave di sicurezza. Nel 1972 furono introdotte le prime varianti-chicane, tra cui quella nel tratto oggi noto come Variante Ascari, dedicata al pilota Alberto Ascari morto nel 1955 durante una sessione di prove proprio su quel tracciato. Il circuito fu poi ulteriormente rimaneggiato nei decenni successivi, in particolare dopo la stagione 1994-1995, fino ad assumere l''attuale configurazione stradale di circa 5,79 km, sostanzialmente stabile dal 2000. Ancora oggi Monza è sede storica del Gran Premio d''Italia e resta uno dei tracciati più amati dell''intero calendario di Formula 1.',
                google_maps_url = 'https://www.google.com/maps/search/?api=1&query=Via+Vedano+5+20900+Monza+MB+Italia+Autodromo+Nazionale+Monza',
                fonti = 'https://it.wikipedia.org/wiki/Autodromo_nazionale_di_Monza
https://en.wikipedia.org/wiki/Monza_Circuit
https://en.wikipedia.org/wiki/1950_Italian_Grand_Prix
https://en.wikipedia.org/wiki/1955_Italian_Grand_Prix
https://www.racingcircuits.info/europe/italy/monza.html
https://www.monzanet.it/en/history/
https://www.monzanet.it/en/circuit/
https://www.autohebdo.it/notizie/f1/parabolica-ascari-lesmo-da-cui-prendono-il-nome-le-curve-del-circuito-di-monza.html
https://www.circusf1.com/2018/08/autodromo-nazionale-di-monza-si-rinnova-arrivano-parabolica-1955-e-variante-ascari-1972.php
https://www.in-lombardia.it/operatore/autodromo-nazionale-monza',
                lunghezza_km = COALESCE(lunghezza_km, 6.3)
            WHERE codice_riferimento = 'monza';

INSERT INTO circuiti_configurazioni (circuito_id, anno_da, anno_a, lunghezza_km, descrizione)
                SELECT id, 1922, 1938, 10.0, 'Tracciato originario che combinava l''anello stradale con una pista sopraelevata ad alta velocità; dopo alcuni gravi incidenti fu affiancato dal 1928 da un percorso alternativo (circuito Florio) e infine abbandonato nella sua parte sopraelevata nei primi anni Trenta.'
                FROM circuiti WHERE codice_riferimento = 'monza'
                ON CONFLICT (circuito_id, anno_da) DO UPDATE SET
                    anno_a = EXCLUDED.anno_a,
                    lunghezza_km = EXCLUDED.lunghezza_km,
                    descrizione = EXCLUDED.descrizione;

INSERT INTO circuiti_configurazioni (circuito_id, anno_da, anno_a, lunghezza_km, descrizione)
                SELECT id, 1938, 1955, 6.3, 'Circuito interamente stradale ricostruito alla fine degli anni Trenta dopo la demolizione dell''anello sopraelevato: è la configurazione utilizzata per il Gran Premio d''Italia 1950.'
                FROM circuiti WHERE codice_riferimento = 'monza'
                ON CONFLICT (circuito_id, anno_da) DO UPDATE SET
                    anno_a = EXCLUDED.anno_a,
                    lunghezza_km = EXCLUDED.lunghezza_km,
                    descrizione = EXCLUDED.descrizione;

INSERT INTO circuiti_configurazioni (circuito_id, anno_da, anno_a, lunghezza_km, descrizione)
                SELECT id, 1955, 1961, 10.0, 'Ricostruzione dell''anello sopraelevato con curve paraboliche in cemento, abbinato a un tracciato stradale leggermente accorciato (5,75 km): la pista combinata da circa 10 km fu usata per alcune edizioni del Gran Premio fino al 1961.'
                FROM circuiti WHERE codice_riferimento = 'monza'
                ON CONFLICT (circuito_id, anno_da) DO UPDATE SET
                    anno_a = EXCLUDED.anno_a,
                    lunghezza_km = EXCLUDED.lunghezza_km,
                    descrizione = EXCLUDED.descrizione;

INSERT INTO circuiti_configurazioni (circuito_id, anno_da, anno_a, lunghezza_km, descrizione)
                SELECT id, 1961, 1972, 5.75, 'Dopo l''abbandono dell''anello sopraelevato per motivi di sicurezza, la Formula 1 tornò a correre solo sul tracciato stradale, ancora privo di chicane.'
                FROM circuiti WHERE codice_riferimento = 'monza'
                ON CONFLICT (circuito_id, anno_da) DO UPDATE SET
                    anno_a = EXCLUDED.anno_a,
                    lunghezza_km = EXCLUDED.lunghezza_km,
                    descrizione = EXCLUDED.descrizione;

INSERT INTO circuiti_configurazioni (circuito_id, anno_da, anno_a, lunghezza_km, descrizione)
                SELECT id, 1972, 2000, 5.8, 'Introduzione delle prime varianti-chicane (sul rettilineo dei box e nel tratto dell''attuale Variante Ascari, con l''aggiunta della Variante della Roggia nel 1976) per ridurre le velocità di percorrenza dopo vari incidenti.'
                FROM circuiti WHERE codice_riferimento = 'monza'
                ON CONFLICT (circuito_id, anno_da) DO UPDATE SET
                    anno_a = EXCLUDED.anno_a,
                    lunghezza_km = EXCLUDED.lunghezza_km,
                    descrizione = EXCLUDED.descrizione;

INSERT INTO circuiti_configurazioni (circuito_id, anno_da, anno_a, lunghezza_km, descrizione)
                SELECT id, 2000, NULL, 5.793, 'Configurazione attuale, con la prima variante ridisegnata nella forma a doppia curva destra-sinistra tuttora in uso.'
                FROM circuiti WHERE codice_riferimento = 'monza'
                ON CONFLICT (circuito_id, anno_da) DO UPDATE SET
                    anno_a = EXCLUDED.anno_a,
                    lunghezza_km = EXCLUDED.lunghezza_km,
                    descrizione = EXCLUDED.descrizione;

INSERT INTO circuiti_curve (circuito_id, ordine, tipo, nome_moderno, nome_1950, anno_intitolazione, nota)
                SELECT id, 1, 'rettilineo', 'Rettifilo tribune (rettilineo di partenza)', 'Rettilineo di partenza', NULL, 'Rettilineo dei box, presente fin dalla nascita del circuito.'
                FROM circuiti WHERE codice_riferimento = 'monza'
                ON CONFLICT (circuito_id, ordine) DO UPDATE SET
                    tipo = EXCLUDED.tipo,
                    nome_moderno = EXCLUDED.nome_moderno,
                    nome_1950 = EXCLUDED.nome_1950,
                    anno_intitolazione = EXCLUDED.anno_intitolazione,
                    nota = EXCLUDED.nota;

INSERT INTO circuiti_curve (circuito_id, ordine, tipo, nome_moderno, nome_1950, anno_intitolazione, nota)
                SELECT id, 2, 'curva', 'Curva Biassono (ex Curva Grande)', 'Curva Grande', 1972, 'Rinominata nel 1972 dal vicino comune di Biassono; nel 1950 era nota semplicemente come Curva Grande.'
                FROM circuiti WHERE codice_riferimento = 'monza'
                ON CONFLICT (circuito_id, ordine) DO UPDATE SET
                    tipo = EXCLUDED.tipo,
                    nome_moderno = EXCLUDED.nome_moderno,
                    nome_1950 = EXCLUDED.nome_1950,
                    anno_intitolazione = EXCLUDED.anno_intitolazione,
                    nota = EXCLUDED.nota;

INSERT INTO circuiti_curve (circuito_id, ordine, tipo, nome_moderno, nome_1950, anno_intitolazione, nota)
                SELECT id, 3, 'curva', 'Variante della Roggia (ex Curva della Roggia)', 'Curva della Roggia', NULL, 'Nel 1950 era una semplice curva intitolata al canale (roggia) che la costeggia; divenne una chicane solo nel 1976.'
                FROM circuiti WHERE codice_riferimento = 'monza'
                ON CONFLICT (circuito_id, ordine) DO UPDATE SET
                    tipo = EXCLUDED.tipo,
                    nome_moderno = EXCLUDED.nome_moderno,
                    nome_1950 = EXCLUDED.nome_1950,
                    anno_intitolazione = EXCLUDED.anno_intitolazione,
                    nota = EXCLUDED.nota;

INSERT INTO circuiti_curve (circuito_id, ordine, tipo, nome_moderno, nome_1950, anno_intitolazione, nota)
                SELECT id, 4, 'curva', 'Prima curva di Lesmo', 'Prima curva di Lesmo', NULL, 'In precedenza chiamata Curva delle Querce, prese il nome dal vicino paese di Lesmo già dagli anni Venti, quindi ben prima del 1950.'
                FROM circuiti WHERE codice_riferimento = 'monza'
                ON CONFLICT (circuito_id, ordine) DO UPDATE SET
                    tipo = EXCLUDED.tipo,
                    nome_moderno = EXCLUDED.nome_moderno,
                    nome_1950 = EXCLUDED.nome_1950,
                    anno_intitolazione = EXCLUDED.anno_intitolazione,
                    nota = EXCLUDED.nota;

INSERT INTO circuiti_curve (circuito_id, ordine, tipo, nome_moderno, nome_1950, anno_intitolazione, nota)
                SELECT id, 5, 'curva', 'Seconda curva di Lesmo', 'Seconda curva di Lesmo', NULL, 'In precedenza chiamata Curva dei 100 Metri; già nota come seconda di Lesmo nel 1950.'
                FROM circuiti WHERE codice_riferimento = 'monza'
                ON CONFLICT (circuito_id, ordine) DO UPDATE SET
                    tipo = EXCLUDED.tipo,
                    nome_moderno = EXCLUDED.nome_moderno,
                    nome_1950 = EXCLUDED.nome_1950,
                    anno_intitolazione = EXCLUDED.anno_intitolazione,
                    nota = EXCLUDED.nota;

INSERT INTO circuiti_curve (circuito_id, ordine, tipo, nome_moderno, nome_1950, anno_intitolazione, nota)
                SELECT id, 6, 'curva', 'Curva del Serraglio', 'Curva del Serraglio', NULL, 'Curva ad ampio raggio che prende nome da un antico serraglio di caccia della zona; denominazione già in uso nel 1950.'
                FROM circuiti WHERE codice_riferimento = 'monza'
                ON CONFLICT (circuito_id, ordine) DO UPDATE SET
                    tipo = EXCLUDED.tipo,
                    nome_moderno = EXCLUDED.nome_moderno,
                    nome_1950 = EXCLUDED.nome_1950,
                    anno_intitolazione = EXCLUDED.anno_intitolazione,
                    nota = EXCLUDED.nota;

INSERT INTO circuiti_curve (circuito_id, ordine, tipo, nome_moderno, nome_1950, anno_intitolazione, nota)
                SELECT id, 7, 'curva', 'Variante Ascari', 'Curva del Vialone (o del Platano)', 1955, 'Nel 1950 non esisteva ancora il nome Ascari: fu intitolata al pilota Alberto Ascari solo dopo la sua morte in un incidente in prova proprio in quel punto, il 26 maggio 1955; diventò una chicane solo nel 1972.'
                FROM circuiti WHERE codice_riferimento = 'monza'
                ON CONFLICT (circuito_id, ordine) DO UPDATE SET
                    tipo = EXCLUDED.tipo,
                    nome_moderno = EXCLUDED.nome_moderno,
                    nome_1950 = EXCLUDED.nome_1950,
                    anno_intitolazione = EXCLUDED.anno_intitolazione,
                    nota = EXCLUDED.nota;

INSERT INTO circuiti_curve (circuito_id, ordine, tipo, nome_moderno, nome_1950, anno_intitolazione, nota)
                SELECT id, 8, 'curva', 'Curva Alboreto (ex Parabolica)', 'Curva del Porfido', 2021, 'Nel 1950 la curva finale prima del rettilineo dei box era nota come Curva del Porfido; ricostruita nel 1955 con raggio progressivo prese il nome di Parabolica, poi dedicata nel 2021 al pilota Michele Alboreto.'
                FROM circuiti WHERE codice_riferimento = 'monza'
                ON CONFLICT (circuito_id, ordine) DO UPDATE SET
                    tipo = EXCLUDED.tipo,
                    nome_moderno = EXCLUDED.nome_moderno,
                    nome_1950 = EXCLUDED.nome_1950,
                    anno_intitolazione = EXCLUDED.anno_intitolazione,
                    nota = EXCLUDED.nota;

UPDATE circuiti SET
                indirizzo = 'Circuito stradale tra i comuni di Gueux e Thillois, dipartimento della Marna (Marne), regione Grand Est, Francia, circa 8 km a ovest di Reims',
                capienza = NULL,
                storia = 'Il circuito di Reims-Gueux nacque nel 1926 come tracciato stradale permanente tra i villaggi di Gueux e Thillois, nella campagna della Champagne a pochi chilometri da Reims. Il disegno, di forma pressoché triangolare e composto in gran parte da strade nazionali dritte e pianeggianti, univa due lunghi rettilinei a pochissime curve, quasi tutte ampie o affrontabili a pieno gas: per questo il tracciato divenne celebre per le velocità medie altissime, paragonabili a quelle di Le Mans o dell''AVUS di Berlino. L''assenza di curve lente, se non ai due estremi del triangolo, favoriva accese battaglie di scia tra i piloti, spesso decise negli ultimi metri del rettilineo principale. Il 6 luglio 1950 il circuito ospitò il Gran Premio di Francia valido per la primissima stagione del Campionato del Mondo di Formula 1, vinto da Juan Manuel Fangio. Negli anni successivi il tracciato fu più volte modificato, con una deviazione che nel 1952 aggirava l''abitato di Gueux e un allungamento tra il 1953 e il 1954 che lo portò alla sua configurazione definitiva, di poco superiore agli otto chilometri, rimasta in uso fino alla fine degli anni Sessanta per la Formula 1. La crescente pericolosità delle alte velocità su un percorso stradale non protetto, insieme a difficoltà organizzative ed economiche, portò alla chiusura definitiva del circuito nel 1972. Oggi il tracciato non è più utilizzato per competizioni: gran parte delle strade è tornata a uso pubblico ordinario, ma nei pressi dei vecchi box sopravvivono come sito storico i ruderi della tribuna principale, della torre di cronometraggio e degli edifici dei box, oggetto di un progetto di conservazione da parte di appassionati locali.',
                google_maps_url = 'https://www.google.com/maps/search/?api=1&query=Circuit+de+Reims-Gueux,+Gueux,+France',
                fonti = 'https://en.wikipedia.org/wiki/Reims-Gueux
https://www.circuitsofthepast.com/circuit-reims-gueux/
https://www.racingcircuits.info/europe/france/reims.html
https://www.f1-fansite.com/f1-circuits/reims-gueux-circuit-layout-records/',
                lunghezza_km = COALESCE(lunghezza_km, 7.826)
            WHERE codice_riferimento = 'reims';

INSERT INTO circuiti_configurazioni (circuito_id, anno_da, anno_a, lunghezza_km, descrizione)
                SELECT id, 1926, 1951, 7.826, 'Tracciato triangolare originale su strade pubbliche tra Gueux e Thillois, con passaggio all''interno dell''abitato di Gueux.'
                FROM circuiti WHERE codice_riferimento = 'reims'
                ON CONFLICT (circuito_id, anno_da) DO UPDATE SET
                    anno_a = EXCLUDED.anno_a,
                    lunghezza_km = EXCLUDED.lunghezza_km,
                    descrizione = EXCLUDED.descrizione;

INSERT INTO circuiti_configurazioni (circuito_id, anno_da, anno_a, lunghezza_km, descrizione)
                SELECT id, 1952, 1952, 7.152, 'Versione accorciata grazie a una deviazione (bypass) che evitava l''attraversamento del villaggio di Gueux.'
                FROM circuiti WHERE codice_riferimento = 'reims'
                ON CONFLICT (circuito_id, anno_da) DO UPDATE SET
                    anno_a = EXCLUDED.anno_a,
                    lunghezza_km = EXCLUDED.lunghezza_km,
                    descrizione = EXCLUDED.descrizione;

INSERT INTO circuiti_configurazioni (circuito_id, anno_da, anno_a, lunghezza_km, descrizione)
                SELECT id, 1953, 1953, 8.347, 'Estensione del tracciato con un nuovo tornante, che ne portò la lunghezza al valore più alto della sua storia.'
                FROM circuiti WHERE codice_riferimento = 'reims'
                ON CONFLICT (circuito_id, anno_da) DO UPDATE SET
                    anno_a = EXCLUDED.anno_a,
                    lunghezza_km = EXCLUDED.lunghezza_km,
                    descrizione = EXCLUDED.descrizione;

INSERT INTO circuiti_configurazioni (circuito_id, anno_da, anno_a, lunghezza_km, descrizione)
                SELECT id, 1954, 1972, 8.302, 'Configurazione definitiva del circuito, con raggi delle curve allargati per aumentare le velocità di percorrenza; rimase in uso fino alla chiusura del 1972.'
                FROM circuiti WHERE codice_riferimento = 'reims'
                ON CONFLICT (circuito_id, anno_da) DO UPDATE SET
                    anno_a = EXCLUDED.anno_a,
                    lunghezza_km = EXCLUDED.lunghezza_km,
                    descrizione = EXCLUDED.descrizione;

INSERT INTO circuiti_curve (circuito_id, ordine, tipo, nome_moderno, nome_1950, anno_intitolazione, nota)
                SELECT id, 1, 'rettilineo', 'Rettilineo dei box (Ligne droite de Champagne)', NULL, NULL, 'Rettilineo di partenza e arrivo, fiancheggiato dai box e dalla tribuna principale.'
                FROM circuiti WHERE codice_riferimento = 'reims'
                ON CONFLICT (circuito_id, ordine) DO UPDATE SET
                    tipo = EXCLUDED.tipo,
                    nome_moderno = EXCLUDED.nome_moderno,
                    nome_1950 = EXCLUDED.nome_1950,
                    anno_intitolazione = EXCLUDED.anno_intitolazione,
                    nota = EXCLUDED.nota;

INSERT INTO circuiti_curve (circuito_id, ordine, tipo, nome_moderno, nome_1950, anno_intitolazione, nota)
                SELECT id, 2, 'curva', 'Virage de la Garenne', 'Virage de la Garenne', NULL, 'Curva veloce percorsa in uscita dal rettifilo dei box, nei pressi dell''abitato di Gueux.'
                FROM circuiti WHERE codice_riferimento = 'reims'
                ON CONFLICT (circuito_id, ordine) DO UPDATE SET
                    tipo = EXCLUDED.tipo,
                    nome_moderno = EXCLUDED.nome_moderno,
                    nome_1950 = EXCLUDED.nome_1950,
                    anno_intitolazione = EXCLUDED.anno_intitolazione,
                    nota = EXCLUDED.nota;

INSERT INTO circuiti_curve (circuito_id, ordine, tipo, nome_moderno, nome_1950, anno_intitolazione, nota)
                SELECT id, 3, 'curva', 'Virage de Muizon', 'Virage de Muizon', NULL, 'Tornante che segna uno dei due vertici del tracciato triangolare, in seguito associato al nome della pilota Annie Bousquet.'
                FROM circuiti WHERE codice_riferimento = 'reims'
                ON CONFLICT (circuito_id, ordine) DO UPDATE SET
                    tipo = EXCLUDED.tipo,
                    nome_moderno = EXCLUDED.nome_moderno,
                    nome_1950 = EXCLUDED.nome_1950,
                    anno_intitolazione = EXCLUDED.anno_intitolazione,
                    nota = EXCLUDED.nota;

INSERT INTO circuiti_curve (circuito_id, ordine, tipo, nome_moderno, nome_1950, anno_intitolazione, nota)
                SELECT id, 4, 'rettilineo', 'Rettilineo della RN31', NULL, NULL, 'Lungo rettifilo lungo la strada nazionale RN31, spesso paragonato al rettilineo dell''Hunaudières di Le Mans per le velocità raggiunte.'
                FROM circuiti WHERE codice_riferimento = 'reims'
                ON CONFLICT (circuito_id, ordine) DO UPDATE SET
                    tipo = EXCLUDED.tipo,
                    nome_moderno = EXCLUDED.nome_moderno,
                    nome_1950 = EXCLUDED.nome_1950,
                    anno_intitolazione = EXCLUDED.anno_intitolazione,
                    nota = EXCLUDED.nota;

INSERT INTO circuiti_curve (circuito_id, ordine, tipo, nome_moderno, nome_1950, anno_intitolazione, nota)
                SELECT id, 5, 'curva', 'Virage de Thillois', 'Virage de Thillois', NULL, 'Tornante stretto al termine del lungo rettilineo, punto chiave per i sorpassi grazie all''effetto scia.'
                FROM circuiti WHERE codice_riferimento = 'reims'
                ON CONFLICT (circuito_id, ordine) DO UPDATE SET
                    tipo = EXCLUDED.tipo,
                    nome_moderno = EXCLUDED.nome_moderno,
                    nome_1950 = EXCLUDED.nome_1950,
                    anno_intitolazione = EXCLUDED.anno_intitolazione,
                    nota = EXCLUDED.nota;

INSERT INTO circuiti_curve (circuito_id, ordine, tipo, nome_moderno, nome_1950, anno_intitolazione, nota)
                SELECT id, 6, 'curva', 'Virage de la Hovette', 'Virage de la Hovette', NULL, 'Curva veloce nel tratto conclusivo del giro, prima del rientro sul rettilineo dei box.'
                FROM circuiti WHERE codice_riferimento = 'reims'
                ON CONFLICT (circuito_id, ordine) DO UPDATE SET
                    tipo = EXCLUDED.tipo,
                    nome_moderno = EXCLUDED.nome_moderno,
                    nome_1950 = EXCLUDED.nome_1950,
                    anno_intitolazione = EXCLUDED.anno_intitolazione,
                    nota = EXCLUDED.nota;

UPDATE circuiti SET
                indirizzo = 'Silverstone Circuit, Silverstone, Towcester, Northamptonshire, NN12 8TN, Regno Unito',
                capienza = 164000,
                storia = 'Il circuito sorge sull''area dell''aeroporto militare RAF Silverstone, base della Royal Air Force costruita nel 1943 e utilizzata durante la Seconda Guerra Mondiale per addestrare gli equipaggi dei bombardieri Wellington al volo notturno, con tre piste disposte a triangolo secondo lo schema tipico degli aeroporti britannici del periodo. Dismesso l''impianto militare a fine conflitto, l''area fu occupata informalmente nel 1947 da un gruppo di appassionati per una gara non ufficiale, passata alla storia con il soprannome di Mutton Grand Prix per un incidente con una pecora vagante sulla pista. Nel 1948 il Royal Automobile Club organizzò qui il primo British Grand Prix ufficiale, su un tracciato che combinava le due piste principali dell''aeroporto con tratti della strada perimetrale, per uno sviluppo di circa 5,9 km: fu l''unica edizione corsa su questa configurazione. Dal 1949 gli organizzatori scelsero di utilizzare esclusivamente la strada perimetrale dell''ex base, disegnando un circuito più scorrevole di circa 4,6 km caratterizzato da lunghi rettilinei e curve rapide. Il 13 maggio 1950 Silverstone entrò nella storia ospitando la prima gara del neonato Campionato del Mondo di Formula 1, vinta da Giuseppe Farina su Alfa Romeo davanti al compagno di squadra Luigi Fagioli. L''evento fu impreziosito dalla presenza del re Giorgio VI, della regina Elisabetta e della principessa Margaret: si tratta ancora oggi dell''unica occasione in cui un monarca regnante britannico abbia assistito dal vivo a una gara motoristica nel Regno Unito. Dal 1951 la gestione dell''impianto passò dal Royal Automobile Club al British Racing Drivers'' Club, che avviò una progressiva trasformazione da semplice pista d''aeroporto a circuito permanente dotato di strutture stabili per piloti e pubblico. Nei decenni successivi il tracciato fu più volte modificato per ragioni di sicurezza, con l''introduzione di una chicane a Woodcote nel 1975 e una profonda riprogettazione nel 1991 che aggiunse il complesso di curve tra Abbey e Woodcote e ridisegnò il tratto di Becketts. Un''ulteriore revisione nel 2010, con la creazione del nuovo complesso Arena e Wing, ha portato il circuito alla configurazione che, con successivi aggiustamenti, è utilizzata ancora oggi.',
                google_maps_url = 'https://www.google.com/maps/search/?api=1&query=Silverstone+Circuit,+Towcester,+Northamptonshire,+NN12+8TN,+UK',
                fonti = 'https://en.wikipedia.org/wiki/Silverstone_Circuit
https://en.wikipedia.org/wiki/Development_history_of_Silverstone_Circuit
https://en.wikipedia.org/wiki/1950_British_Grand_Prix
https://en.wikipedia.org/wiki/1948_British_Grand_Prix
https://www.formula1.com/en/latest/article/f1-first-race-1950-silverstone.2f2zI6BmGT9bnK4vX10paZ
https://www.silverstone.co.uk/about/our-history
https://www.racingcircuits.info/europe/united-kingdom/silverstone.html
https://oversteer48.com/silverstone-airfield/
https://www.motorsportmagazine.com/database/circuits/silverstone/',
                lunghezza_km = COALESCE(lunghezza_km, 4.649)
            WHERE codice_riferimento = 'silverstone';

INSERT INTO circuiti_configurazioni (circuito_id, anno_da, anno_a, lunghezza_km, descrizione)
                SELECT id, 1948, 1948, 5.9, 'Configurazione usata solo per il GP del 1948: univa le due piste principali dell''aeroporto a tratti della strada perimetrale, con doppie chicane realizzate con balle di paglia nei punti di intersezione delle piste.'
                FROM circuiti WHERE codice_riferimento = 'silverstone'
                ON CONFLICT (circuito_id, anno_da) DO UPDATE SET
                    anno_a = EXCLUDED.anno_a,
                    lunghezza_km = EXCLUDED.lunghezza_km,
                    descrizione = EXCLUDED.descrizione;

INSERT INTO circuiti_configurazioni (circuito_id, anno_da, anno_a, lunghezza_km, descrizione)
                SELECT id, 1949, 1951, 4.649, 'Tracciato ricavato interamente dalla strada perimetrale dell''ex base RAF: è la configurazione su cui si corse il primo GP di F1 del mondiale nel 1950, fatta di lunghi rettilinei e curve veloci.'
                FROM circuiti WHERE codice_riferimento = 'silverstone'
                ON CONFLICT (circuito_id, anno_da) DO UPDATE SET
                    anno_a = EXCLUDED.anno_a,
                    lunghezza_km = EXCLUDED.lunghezza_km,
                    descrizione = EXCLUDED.descrizione;

INSERT INTO circuiti_configurazioni (circuito_id, anno_da, anno_a, lunghezza_km, descrizione)
                SELECT id, 1952, 1974, 4.71, 'Layout sostanzialmente simile al precedente ma con la linea di partenza spostata dal Farm Straight al rettilineo tra Woodcote e Copse.'
                FROM circuiti WHERE codice_riferimento = 'silverstone'
                ON CONFLICT (circuito_id, anno_da) DO UPDATE SET
                    anno_a = EXCLUDED.anno_a,
                    lunghezza_km = EXCLUDED.lunghezza_km,
                    descrizione = EXCLUDED.descrizione;

INSERT INTO circuiti_configurazioni (circuito_id, anno_da, anno_a, lunghezza_km, descrizione)
                SELECT id, 1975, 1990, 4.72, 'Introdotta una chicane alla curva Woodcote per ridurre le velocità dopo alcuni incidenti, mantenendo per il resto l''impianto perimetrale storico.'
                FROM circuiti WHERE codice_riferimento = 'silverstone'
                ON CONFLICT (circuito_id, anno_da) DO UPDATE SET
                    anno_a = EXCLUDED.anno_a,
                    lunghezza_km = EXCLUDED.lunghezza_km,
                    descrizione = EXCLUDED.descrizione;

INSERT INTO circuiti_configurazioni (circuito_id, anno_da, anno_a, lunghezza_km, descrizione)
                SELECT id, 1991, 2009, 5.14, 'Grande ridisegno con l''aggiunta del nuovo complesso di curve tra Abbey e Woodcote (Bridge, Priory, Brooklands, Luffield) e il rifacimento del tratto di Becketts.'
                FROM circuiti WHERE codice_riferimento = 'silverstone'
                ON CONFLICT (circuito_id, anno_da) DO UPDATE SET
                    anno_a = EXCLUDED.anno_a,
                    lunghezza_km = EXCLUDED.lunghezza_km,
                    descrizione = EXCLUDED.descrizione;

INSERT INTO circuiti_configurazioni (circuito_id, anno_da, anno_a, lunghezza_km, descrizione)
                SELECT id, 2010, NULL, 5.891, 'Ulteriore ampliamento con la creazione del complesso Arena e Wing, che porta il circuito alla configurazione moderna, oggetto di piccoli aggiustamenti successivi.'
                FROM circuiti WHERE codice_riferimento = 'silverstone'
                ON CONFLICT (circuito_id, anno_da) DO UPDATE SET
                    anno_a = EXCLUDED.anno_a,
                    lunghezza_km = EXCLUDED.lunghezza_km,
                    descrizione = EXCLUDED.descrizione;

INSERT INTO circuiti_curve (circuito_id, ordine, tipo, nome_moderno, nome_1950, anno_intitolazione, nota)
                SELECT id, 1, 'curva', 'Woodcote', NULL, 1948, 'Curva veloce subito dopo il rettilineo dei box, presente fin dal primo tracciato del 1948.'
                FROM circuiti WHERE codice_riferimento = 'silverstone'
                ON CONFLICT (circuito_id, ordine) DO UPDATE SET
                    tipo = EXCLUDED.tipo,
                    nome_moderno = EXCLUDED.nome_moderno,
                    nome_1950 = EXCLUDED.nome_1950,
                    anno_intitolazione = EXCLUDED.anno_intitolazione,
                    nota = EXCLUDED.nota;

INSERT INTO circuiti_curve (circuito_id, ordine, tipo, nome_moderno, nome_1950, anno_intitolazione, nota)
                SELECT id, 2, 'curva', 'Copse', NULL, 1948, 'Curva destrorsa veloce, tra le poche presenti già nel layout del 1948 con lo stesso nome.'
                FROM circuiti WHERE codice_riferimento = 'silverstone'
                ON CONFLICT (circuito_id, ordine) DO UPDATE SET
                    tipo = EXCLUDED.tipo,
                    nome_moderno = EXCLUDED.nome_moderno,
                    nome_1950 = EXCLUDED.nome_1950,
                    anno_intitolazione = EXCLUDED.anno_intitolazione,
                    nota = EXCLUDED.nota;

INSERT INTO circuiti_curve (circuito_id, ordine, tipo, nome_moderno, nome_1950, anno_intitolazione, nota)
                SELECT id, 3, 'curva', 'Maggotts', NULL, 1949, 'Sequenza rapida di curve introdotta con l''adozione del tracciato perimetrale completo dal 1949.'
                FROM circuiti WHERE codice_riferimento = 'silverstone'
                ON CONFLICT (circuito_id, ordine) DO UPDATE SET
                    tipo = EXCLUDED.tipo,
                    nome_moderno = EXCLUDED.nome_moderno,
                    nome_1950 = EXCLUDED.nome_1950,
                    anno_intitolazione = EXCLUDED.anno_intitolazione,
                    nota = EXCLUDED.nota;

INSERT INTO circuiti_curve (circuito_id, ordine, tipo, nome_moderno, nome_1950, anno_intitolazione, nota)
                SELECT id, 4, 'curva', 'Becketts', NULL, 1949, 'Complesso di curve tecniche, ridisegnato nel 1991 pur mantenendo il nome originale.'
                FROM circuiti WHERE codice_riferimento = 'silverstone'
                ON CONFLICT (circuito_id, ordine) DO UPDATE SET
                    tipo = EXCLUDED.tipo,
                    nome_moderno = EXCLUDED.nome_moderno,
                    nome_1950 = EXCLUDED.nome_1950,
                    anno_intitolazione = EXCLUDED.anno_intitolazione,
                    nota = EXCLUDED.nota;

INSERT INTO circuiti_curve (circuito_id, ordine, tipo, nome_moderno, nome_1950, anno_intitolazione, nota)
                SELECT id, 5, 'curva', 'Chapel', NULL, 1949, 'Curva che conduce al lungo rettilineo di Hangar Straight.'
                FROM circuiti WHERE codice_riferimento = 'silverstone'
                ON CONFLICT (circuito_id, ordine) DO UPDATE SET
                    tipo = EXCLUDED.tipo,
                    nome_moderno = EXCLUDED.nome_moderno,
                    nome_1950 = EXCLUDED.nome_1950,
                    anno_intitolazione = EXCLUDED.anno_intitolazione,
                    nota = EXCLUDED.nota;

INSERT INTO circuiti_curve (circuito_id, ordine, tipo, nome_moderno, nome_1950, anno_intitolazione, nota)
                SELECT id, 6, 'rettilineo', 'Hangar Straight', NULL, 1948, 'Rettilineo che deve il nome agli hangar dell''ex base aerea visibili lungo il tracciato.'
                FROM circuiti WHERE codice_riferimento = 'silverstone'
                ON CONFLICT (circuito_id, ordine) DO UPDATE SET
                    tipo = EXCLUDED.tipo,
                    nome_moderno = EXCLUDED.nome_moderno,
                    nome_1950 = EXCLUDED.nome_1950,
                    anno_intitolazione = EXCLUDED.anno_intitolazione,
                    nota = EXCLUDED.nota;

INSERT INTO circuiti_curve (circuito_id, ordine, tipo, nome_moderno, nome_1950, anno_intitolazione, nota)
                SELECT id, 7, 'curva', 'Stowe', NULL, 1948, 'Ampia curva destrorsa presente già nella configurazione del 1948.'
                FROM circuiti WHERE codice_riferimento = 'silverstone'
                ON CONFLICT (circuito_id, ordine) DO UPDATE SET
                    tipo = EXCLUDED.tipo,
                    nome_moderno = EXCLUDED.nome_moderno,
                    nome_1950 = EXCLUDED.nome_1950,
                    anno_intitolazione = EXCLUDED.anno_intitolazione,
                    nota = EXCLUDED.nota;

INSERT INTO circuiti_curve (circuito_id, ordine, tipo, nome_moderno, nome_1950, anno_intitolazione, nota)
                SELECT id, 8, 'curva', 'Club', NULL, 1948, 'Curva presente sin dal primo GP del 1948, punto in cui il tracciato rientrava sulla strada perimetrale.'
                FROM circuiti WHERE codice_riferimento = 'silverstone'
                ON CONFLICT (circuito_id, ordine) DO UPDATE SET
                    tipo = EXCLUDED.tipo,
                    nome_moderno = EXCLUDED.nome_moderno,
                    nome_1950 = EXCLUDED.nome_1950,
                    anno_intitolazione = EXCLUDED.anno_intitolazione,
                    nota = EXCLUDED.nota;

INSERT INTO circuiti_curve (circuito_id, ordine, tipo, nome_moderno, nome_1950, anno_intitolazione, nota)
                SELECT id, 9, 'curva', 'Abbey', NULL, 1948, 'Ultima curva prima del rettilineo dei box, vicino alla quale nel 1950 erano posizionati i box e la griglia di partenza.'
                FROM circuiti WHERE codice_riferimento = 'silverstone'
                ON CONFLICT (circuito_id, ordine) DO UPDATE SET
                    tipo = EXCLUDED.tipo,
                    nome_moderno = EXCLUDED.nome_moderno,
                    nome_1950 = EXCLUDED.nome_1950,
                    anno_intitolazione = EXCLUDED.anno_intitolazione,
                    nota = EXCLUDED.nota;

UPDATE circuiti SET
                indirizzo = 'Route du Circuit 55, 4970 Stavelot (Francorchamps), Belgio',
                capienza = 130000,
                storia = 'Il circuito nasce a metà degli anni ''20 da un''idea di un gruppo di appassionati locali, tra cui un giornalista e un politico della zona, che decisero di tracciare un percorso di gara sfruttando le strade statali già esistenti tra i villaggi di Francorchamps, Malmedy e Stavelot, nelle colline delle Ardenne belghe. Il risultato fu un tracciato triangolare lunghissimo, quasi 14 chilometri, con pochissime curve lente e lunghi tratti percorsi a velocità altissime. Proprio questa combinazione di velocità sostenuta, dislivelli marcati e un microclima estremamente instabile, capace di far piovere su un tratto di pista e restare asciutto su un altro a pochi chilometri di distanza, rese il circuito uno dei più spettacolari ma anche più temuti d''Europa. Diversi grandi piloti dell''epoca lo descrissero come un banco di prova durissimo, dove l''abilità contava quanto il coraggio puro. Nel 1950 la Spa-Francorchamps entrò nella storia ospitando una delle prime gare del neonato Campionato del Mondo di Formula 1, disputata sulla lunga configurazione stradale. Il tracciato rimase sostanzialmente invariato per decenni, continuando però a mietere vittime tra piloti e commissari di gara, tanto da spingere i piloti stessi a boicottarlo alla fine degli anni ''60. Le crescenti preoccupazioni per la sicurezza portarono infine, sul finire degli anni ''70, a un drastico accorciamento del percorso, che abbandonò gran parte del vecchio anello stradale attorno a Malmedy per adottare una configurazione permanente più corta e moderna, quella che, con ulteriori modifiche, è sostanzialmente ancora in uso oggi.',
                google_maps_url = 'https://www.google.com/maps/search/?api=1&query=Circuit+de+Spa-Francorchamps,+Route+du+Circuit+55,+4970+Stavelot,+Belgio',
                fonti = 'https://en.wikipedia.org/wiki/Circuit_de_Spa-Francorchamps
https://en.wikipedia.org/wiki/1950_Belgian_Grand_Prix
https://www.spa-francorchamps.be/en/the-circuit
https://gpdestinations.com/resources/formula-1-circuit-capacity-ranking/',
                lunghezza_km = COALESCE(lunghezza_km, 14.12)
            WHERE codice_riferimento = 'spa';

INSERT INTO circuiti_configurazioni (circuito_id, anno_da, anno_a, lunghezza_km, descrizione)
                SELECT id, 1925, 1978, 14.12, 'Vecchia configurazione stradale a forma triangolare, tracciata su strade pubbliche tra i villaggi di Francorchamps, Malmedy e Stavelot: era quella utilizzata nel Gran Premio del Belgio 1950, caratterizzata da tratti fortissimi ad alta velocità e pochissime curve lente.'
                FROM circuiti WHERE codice_riferimento = 'spa'
                ON CONFLICT (circuito_id, anno_da) DO UPDATE SET
                    anno_a = EXCLUDED.anno_a,
                    lunghezza_km = EXCLUDED.lunghezza_km,
                    descrizione = EXCLUDED.descrizione;

INSERT INTO circuiti_configurazioni (circuito_id, anno_da, anno_a, lunghezza_km, descrizione)
                SELECT id, 1979, NULL, 7.0, 'Configurazione moderna, accorciata a circa 7 km eliminando gran parte dell''anello verso Malmedy e trasformando il circuito da tracciato su strade pubbliche a impianto permanente dedicato, con ulteriori affinamenti di sicurezza nei decenni successivi.'
                FROM circuiti WHERE codice_riferimento = 'spa'
                ON CONFLICT (circuito_id, anno_da) DO UPDATE SET
                    anno_a = EXCLUDED.anno_a,
                    lunghezza_km = EXCLUDED.lunghezza_km,
                    descrizione = EXCLUDED.descrizione;

INSERT INTO circuiti_curve (circuito_id, ordine, tipo, nome_moderno, nome_1950, anno_intitolazione, nota)
                SELECT id, 1, 'curva', 'La Source', 'La Source', NULL, 'Stretta curva a gomito in salita subito dopo il traguardo, presente fin dalle origini del circuito e ancora oggi punto di partenza del giro.'
                FROM circuiti WHERE codice_riferimento = 'spa'
                ON CONFLICT (circuito_id, ordine) DO UPDATE SET
                    tipo = EXCLUDED.tipo,
                    nome_moderno = EXCLUDED.nome_moderno,
                    nome_1950 = EXCLUDED.nome_1950,
                    anno_intitolazione = EXCLUDED.anno_intitolazione,
                    nota = EXCLUDED.nota;

INSERT INTO circuiti_curve (circuito_id, ordine, tipo, nome_moderno, nome_1950, anno_intitolazione, nota)
                SELECT id, 2, 'curva', 'Eau Rouge', 'Eau Rouge', NULL, 'Prende il nome dal piccolo corso d''acqua che attraversa; già presente nel 1950, anche se in una forma leggermente diversa rispetto a quella attuale.'
                FROM circuiti WHERE codice_riferimento = 'spa'
                ON CONFLICT (circuito_id, ordine) DO UPDATE SET
                    tipo = EXCLUDED.tipo,
                    nome_moderno = EXCLUDED.nome_moderno,
                    nome_1950 = EXCLUDED.nome_1950,
                    anno_intitolazione = EXCLUDED.anno_intitolazione,
                    nota = EXCLUDED.nota;

INSERT INTO circuiti_curve (circuito_id, ordine, tipo, nome_moderno, nome_1950, anno_intitolazione, nota)
                SELECT id, 3, 'curva', 'Raidillon', 'Raidillon', 1939, 'Serie di curve in forte salita subito dopo Eau Rouge, ricavata nel 1939 trasformando quello che in origine era un tornante lento in un rapido saliscendi.'
                FROM circuiti WHERE codice_riferimento = 'spa'
                ON CONFLICT (circuito_id, ordine) DO UPDATE SET
                    tipo = EXCLUDED.tipo,
                    nome_moderno = EXCLUDED.nome_moderno,
                    nome_1950 = EXCLUDED.nome_1950,
                    anno_intitolazione = EXCLUDED.anno_intitolazione,
                    nota = EXCLUDED.nota;

INSERT INTO circuiti_curve (circuito_id, ordine, tipo, nome_moderno, nome_1950, anno_intitolazione, nota)
                SELECT id, 4, 'rettilineo', 'Rettilineo di Kemmel', NULL, NULL, 'Lungo rettilineo in salita presente già nella vecchia configurazione, oggi seguito dalle curve moderne di Les Combes.'
                FROM circuiti WHERE codice_riferimento = 'spa'
                ON CONFLICT (circuito_id, ordine) DO UPDATE SET
                    tipo = EXCLUDED.tipo,
                    nome_moderno = EXCLUDED.nome_moderno,
                    nome_1950 = EXCLUDED.nome_1950,
                    anno_intitolazione = EXCLUDED.anno_intitolazione,
                    nota = EXCLUDED.nota;

INSERT INTO circuiti_curve (circuito_id, ordine, tipo, nome_moderno, nome_1950, anno_intitolazione, nota)
                SELECT id, 5, 'curva', 'Les Combes', NULL, NULL, 'Complesso di curve introdotto con l''accorciamento del tracciato alla fine degli anni ''70: non esisteva nella configurazione del 1950, quando il percorso proseguiva dritto verso Burnenville.'
                FROM circuiti WHERE codice_riferimento = 'spa'
                ON CONFLICT (circuito_id, ordine) DO UPDATE SET
                    tipo = EXCLUDED.tipo,
                    nome_moderno = EXCLUDED.nome_moderno,
                    nome_1950 = EXCLUDED.nome_1950,
                    anno_intitolazione = EXCLUDED.anno_intitolazione,
                    nota = EXCLUDED.nota;

INSERT INTO circuiti_curve (circuito_id, ordine, tipo, nome_moderno, nome_1950, anno_intitolazione, nota)
                SELECT id, 6, 'curva', NULL, 'Burnenville', NULL, 'Lunga curva destrorsa percorsa a velocità altissima attraverso l''omonimo villaggio; faceva parte della vecchia configurazione ed è stata esclusa dal tracciato dopo l''accorciamento del circuito.'
                FROM circuiti WHERE codice_riferimento = 'spa'
                ON CONFLICT (circuito_id, ordine) DO UPDATE SET
                    tipo = EXCLUDED.tipo,
                    nome_moderno = EXCLUDED.nome_moderno,
                    nome_1950 = EXCLUDED.nome_1950,
                    anno_intitolazione = EXCLUDED.anno_intitolazione,
                    nota = EXCLUDED.nota;

INSERT INTO circuiti_curve (circuito_id, ordine, tipo, nome_moderno, nome_1950, anno_intitolazione, nota)
                SELECT id, 7, 'curva', NULL, 'Malmedy', NULL, 'Tratto di strada pubblica in prossimità della cittadina di Malmedy, parte del vecchio anello del 1950 non più utilizzato nella configurazione moderna.'
                FROM circuiti WHERE codice_riferimento = 'spa'
                ON CONFLICT (circuito_id, ordine) DO UPDATE SET
                    tipo = EXCLUDED.tipo,
                    nome_moderno = EXCLUDED.nome_moderno,
                    nome_1950 = EXCLUDED.nome_1950,
                    anno_intitolazione = EXCLUDED.anno_intitolazione,
                    nota = EXCLUDED.nota;

INSERT INTO circuiti_curve (circuito_id, ordine, tipo, nome_moderno, nome_1950, anno_intitolazione, nota)
                SELECT id, 8, 'curva', NULL, 'Masta Kink', NULL, 'Rapida doppia curva sinistra-destra tra due lunghi rettilinei, considerata uno dei punti più impegnativi al mondo; presente nel 1950 e rimasta in uso fino all''inizio degli anni ''70.'
                FROM circuiti WHERE codice_riferimento = 'spa'
                ON CONFLICT (circuito_id, ordine) DO UPDATE SET
                    tipo = EXCLUDED.tipo,
                    nome_moderno = EXCLUDED.nome_moderno,
                    nome_1950 = EXCLUDED.nome_1950,
                    anno_intitolazione = EXCLUDED.anno_intitolazione,
                    nota = EXCLUDED.nota;

INSERT INTO circuiti_curve (circuito_id, ordine, tipo, nome_moderno, nome_1950, anno_intitolazione, nota)
                SELECT id, 9, 'curva', 'Pouhon', NULL, NULL, 'Doppia curva sinistra ad alta velocità della configurazione moderna, non presente nel tracciato del 1950.'
                FROM circuiti WHERE codice_riferimento = 'spa'
                ON CONFLICT (circuito_id, ordine) DO UPDATE SET
                    tipo = EXCLUDED.tipo,
                    nome_moderno = EXCLUDED.nome_moderno,
                    nome_1950 = EXCLUDED.nome_1950,
                    anno_intitolazione = EXCLUDED.anno_intitolazione,
                    nota = EXCLUDED.nota;

INSERT INTO circuiti_curve (circuito_id, ordine, tipo, nome_moderno, nome_1950, anno_intitolazione, nota)
                SELECT id, 10, 'curva', 'Stavelot', 'Stavelot', NULL, 'Curva presso l''omonimo villaggio, in origine un angolo secco tra le case del paese; nelle versioni successive del tracciato fu sostituita da un ampio raccordo più scorrevole.'
                FROM circuiti WHERE codice_riferimento = 'spa'
                ON CONFLICT (circuito_id, ordine) DO UPDATE SET
                    tipo = EXCLUDED.tipo,
                    nome_moderno = EXCLUDED.nome_moderno,
                    nome_1950 = EXCLUDED.nome_1950,
                    anno_intitolazione = EXCLUDED.anno_intitolazione,
                    nota = EXCLUDED.nota;

INSERT INTO circuiti_curve (circuito_id, ordine, tipo, nome_moderno, nome_1950, anno_intitolazione, nota)
                SELECT id, 11, 'curva', 'Blanchimont', 'Blanchimont', NULL, 'Veloce curva sinistrorsa sul tratto di ritorno verso il traguardo, comune sia alla vecchia configurazione del 1950 sia a quella moderna.'
                FROM circuiti WHERE codice_riferimento = 'spa'
                ON CONFLICT (circuito_id, ordine) DO UPDATE SET
                    tipo = EXCLUDED.tipo,
                    nome_moderno = EXCLUDED.nome_moderno,
                    nome_1950 = EXCLUDED.nome_1950,
                    anno_intitolazione = EXCLUDED.anno_intitolazione,
                    nota = EXCLUDED.nota;

INSERT INTO circuiti_curve (circuito_id, ordine, tipo, nome_moderno, nome_1950, anno_intitolazione, nota)
                SELECT id, 12, 'curva', 'Bus Stop', NULL, 1979, 'Chicane introdotta con l''accorciamento del circuito alla fine degli anni ''70 poco prima del traguardo; non esisteva nella configurazione stradale del 1950.'
                FROM circuiti WHERE codice_riferimento = 'spa'
                ON CONFLICT (circuito_id, ordine) DO UPDATE SET
                    tipo = EXCLUDED.tipo,
                    nome_moderno = EXCLUDED.nome_moderno,
                    nome_1950 = EXCLUDED.nome_1950,
                    anno_intitolazione = EXCLUDED.anno_intitolazione,
                    nota = EXCLUDED.nota;

UPDATE piloti SET
                    data_nascita = '1912-12-15',
                    data_morte = '1982-11-25',
                    url_wikipedia = 'https://en.wikipedia.org/wiki/Walt_Ader',
                    biografia = NULL,
                    curiosita = 'Dopo il ritiro dalle corse si dedicò al volontariato come vigile del fuoco nella sua città, Bernardsville, nel New Jersey.',
                    fonti_biografia = 'https://en.wikipedia.org/wiki/Walt_Ader',
                    fonti_sufficienti = true
                WHERE codice_riferimento = 'walt-ader';

UPDATE piloti SET
                    data_nascita = '1913-08-21',
                    data_morte = '1989-10-13',
                    url_wikipedia = 'https://en.wikipedia.org/wiki/Fred_Agabashian',
                    biografia = 'Pilota californiano di origini armene, Fred Agabashian si fece le ossa nei campionati sprint e midget della costa occidentale prima di debuttare alla 500 Miglia di Indianapolis nel 1947, dove corse per dodici edizioni consecutive. Il suo momento di gloria arrivò nel 1952, quando conquistò la pole position al volante della Cummins Diesel Special, la prima vettura con motore turbocompresso a correre a Indianapolis, salvo poi ritirarsi dopo 71 giri per un guasto meccanico. Il suo miglior risultato in gara fu un quarto posto nel 1953. Terminata la carriera agonistica nel 1958, divenne una voce nota ai microfoni della radio della Indianapolis Motor Speedway.',
                    curiosita = 'La pole del 1952 con un propulsore diesel turbocompresso, tecnologia mai vista prima sull''ovale di Indianapolis, resta uno degli episodi più curiosi nella storia della corsa.',
                    fonti_biografia = 'https://en.wikipedia.org/wiki/Fred_Agabashian',
                    fonti_sufficienti = true
                WHERE codice_riferimento = 'fred-agabashian';

UPDATE piloti SET
                    data_nascita = '1913-06-14',
                    data_morte = '1994-12-18',
                    url_wikipedia = 'https://en.wikipedia.org/wiki/Henry_Banks',
                    biografia = 'Nato in Inghilterra ma emigrato giovanissimo negli Stati Uniti, Henry Banks costruì la propria fama nei campionati midget prima di affacciarsi alla 500 Miglia di Indianapolis, dove nel 1936 fu il primo pilota a superare il test per debuttanti introdotto quell''anno. Nel 1950 vinse il titolo AAA National Champion al termine di una lotta a tre decisa solo nell''ultima gara stagionale. Dopo il ritiro divenne direttore delle competizioni USAC, contribuendo per anni a plasmare le regole delle corse americane.',
                    curiosita = 'Fu insignito nel corso degli anni di ben sei diverse hall of fame motoristiche.',
                    fonti_biografia = 'https://en.wikipedia.org/wiki/Henry_Banks',
                    fonti_sufficienti = true
                WHERE codice_riferimento = 'henry-banks';

UPDATE piloti SET
                    data_nascita = '1898-10-18',
                    data_morte = '1955-02-24',
                    url_wikipedia = 'https://en.wikipedia.org/wiki/Clemente_Biondetti',
                    biografia = 'Sardo di Buddusò, Clemente Biondetti fu uno dei più grandi interpreti delle corse di durata italiane, tanto da guadagnarsi il soprannome di ''Lupo della Toscana''. Vinse la Mille Miglia per ben quattro volte, nel 1938, 1947, 1948 e 1949, un record che nessun altro pilota ha mai eguagliato, e si aggiudicò anche due edizioni della Targa Florio. La sua unica presenza nel neonato Campionato del Mondo di F1 fu al Gran Premio d''Italia 1950, dove fu costretto al ritiro per un guasto al motore. Morì di tumore a Firenze nel 1955, a cinquantasei anni.',
                    curiosita = 'La sua morte per cause naturali nel 1955 lo rende, secondo le classifiche storiche, il primo pilota ad aver corso nel Campionato del Mondo di F1 a scomparire non per un incidente.',
                    fonti_biografia = 'https://en.wikipedia.org/wiki/Clemente_Biondetti',
                    fonti_sufficienti = true
                WHERE codice_riferimento = 'clemente-biondetti';

UPDATE piloti SET
                    data_nascita = '1916-09-15',
                    data_morte = '1985-05-10',
                    url_wikipedia = 'https://en.wikipedia.org/wiki/Toni_Branca',
                    biografia = NULL,
                    curiosita = 'Secondo alcune fonti la sua carriera automobilistica fu finanziata da un''ammiratrice, la viscontessa belga de Walkiers.',
                    fonti_biografia = 'https://en.wikipedia.org/wiki/Toni_Branca',
                    fonti_sufficienti = true
                WHERE codice_riferimento = 'toni-branca';

UPDATE piloti SET
                    data_nascita = '1910-12-30',
                    data_morte = '1951-07-29',
                    url_wikipedia = 'https://en.wikipedia.org/wiki/Walt_Brown_(racing_driver)',
                    biografia = NULL,
                    curiosita = 'Morì il 29 luglio 1951 a Williams Grove in quella che passò alla storia come ''Black Sunday'': lo stesso giorno persero la vita altri due piloti su un''altra pista.',
                    fonti_biografia = 'https://en.wikipedia.org/wiki/Walt_Brown_(racing_driver)',
                    fonti_sufficienti = true
                WHERE codice_riferimento = 'walt-brown';

UPDATE piloti SET
                    data_nascita = '1908-01-31',
                    data_morte = '1996-01-22',
                    url_wikipedia = 'https://en.wikipedia.org/wiki/William_Cantrell',
                    biografia = NULL,
                    curiosita = 'Oltre che su ruote, fu anche un campione di motonautica: nel 1949 vinse la prestigiosa Gold Cup degli idroplani a Detroit.',
                    fonti_biografia = 'https://en.wikipedia.org/wiki/William_Cantrell',
                    fonti_sufficienti = true
                WHERE codice_riferimento = 'bill-cantrell';

UPDATE piloti SET
                    data_nascita = '1913-05-05',
                    data_morte = '1993-03-07',
                    url_wikipedia = 'https://en.wikipedia.org/wiki/Duane_Carter',
                    biografia = NULL,
                    curiosita = 'Nel 1937, prima di affermarsi nei campionati AAA/USAC americani, vinse la primissima gara di midget car mai disputata sulla pista neozelandese di Western Springs, ad Auckland.',
                    fonti_biografia = 'https://en.wikipedia.org/wiki/Duane_Carter',
                    fonti_sufficienti = true
                WHERE codice_riferimento = 'duane-carter';

UPDATE piloti SET
                    data_nascita = '1907-04-12',
                    data_morte = '1983-12-28',
                    url_wikipedia = 'https://en.wikipedia.org/wiki/Eug%C3%A8ne_Chaboud',
                    biografia = 'Il francese Eugène Chaboud si costruì una solida reputazione nelle corse di durata ben prima che nascesse il Campionato del Mondo di F1: nel 1938 vinse la 24 Ore di Le Mans in coppia con il suo mentore Jean Trémoulet al volante di una Delahaye. Nel dopoguerra si aggiudicò anche il Gran Premio del Belgio 1946. Con l''avvento della F1 nel 1950 corse alcune stagioni su Talbot-Lago, ottenendo il suo unico punto iridato con un quinto posto al Gran Premio di Francia. La sua carriera si chiuse bruscamente nel 1952, quando rimase intrappolato sotto la propria vettura dopo un incidente proprio a Le Mans.',
                    curiosita = 'L''incidente di Le Mans del 1952, che lo lasciò intrappolato sotto l''auto, pose fine alla carriera di uno dei vincitori più esperti della grande corsa francese.',
                    fonti_biografia = 'https://en.wikipedia.org/wiki/Eug%C3%A8ne_Chaboud',
                    fonti_sufficienti = true
                WHERE codice_riferimento = 'eugene-chaboud';

UPDATE piloti SET
                    data_nascita = '1912-04-14',
                    data_morte = '1988-01-03',
                    url_wikipedia = 'https://en.wikipedia.org/wiki/Joie_Chitwood',
                    biografia = 'Prima di diventare una leggenda dello spettacolo motoristico americano, Joie Chitwood fu un pilota di tutto rispetto: corse sette volte alla 500 Miglia di Indianapolis tra il 1940 e il 1950, chiudendo quinto in tre occasioni, e nel 1941 fu il primo a correre indossando le cinture di sicurezza. Ritiratosi dalle corse nel 1950, rilevò lo stesso anno il Joie Chitwood Thrill Show, uno spettacolo itinerante di acrobazie automobilistiche che portò avanti per oltre quarant''anni. Lavorò anche come stuntman e coordinatore per il cinema, compreso il film di James Bond ''Vivi e lascia morire'' (1973).',
                    curiosita = 'Il suo spettacolo itinerante di ''incidenti'' automobilistici controllati è considerato una delle dirette ispirazioni della carriera di Evel Knievel.',
                    fonti_biografia = 'https://en.wikipedia.org/wiki/Joie_Chitwood',
                    fonti_sufficienti = true
                WHERE codice_riferimento = 'joie-chitwood';

UPDATE piloti SET
                    data_nascita = '1906-07-24',
                    data_morte = '1963-05-10',
                    url_wikipedia = 'https://en.wikipedia.org/wiki/Franco_Comotti',
                    biografia = NULL,
                    curiosita = 'Pilota ufficiale Ferrari tra il 1932 e il 1935 e vincitore della RAC Tourist Trophy nel 1937, nel 1962 contribuì a fondare uno dei primi club internazionali di ex piloti di Gran Premio.',
                    fonti_biografia = 'https://en.wikipedia.org/wiki/Franco_Comotti',
                    fonti_sufficienti = true
                WHERE codice_riferimento = 'franco-comotti';

UPDATE piloti SET
                    data_nascita = '1906-08-16',
                    data_morte = '2001-03-28',
                    url_wikipedia = 'https://en.wikipedia.org/wiki/George_Connor_(racing_driver)',
                    biografia = NULL,
                    curiosita = 'Alla sua morte, nel 2001, era l''ultimo pilota ancora in vita ad aver preso parte a una gara di campionato prima della Seconda Guerra Mondiale.',
                    fonti_biografia = 'https://en.wikipedia.org/wiki/George_Connor_(racing_driver)',
                    fonti_sufficienti = true
                WHERE codice_riferimento = 'george-connor';

UPDATE piloti SET
                    data_nascita = '1921-05-11',
                    data_morte = '2002-01-07',
                    url_wikipedia = 'https://en.wikipedia.org/wiki/Geoffrey_Crossley',
                    biografia = NULL,
                    curiosita = 'Pilota dilettante e fabbricante di mobili di professione, corse in F1 con un''Alta GP acquistata di tasca propria nel 1949, per poi ritirarsi già a fine 1950 per ragioni economiche.',
                    fonti_biografia = 'https://en.wikipedia.org/wiki/Geoffrey_Crossley',
                    fonti_sufficienti = true
                WHERE codice_riferimento = 'geoff-crossley';

UPDATE piloti SET
                    data_nascita = '1929-08-08',
                    data_morte = '1966-06-11',
                    url_wikipedia = 'https://en.wikipedia.org/wiki/Jimmy_Davies_(racing_driver)',
                    biografia = NULL,
                    curiosita = 'Nel 1949, a vent''anni appena compiuti, stabilì il record di pilota più giovane a vincere una gara di un grande campionato americano di monoposto a ruote scoperte, primato caduto solo nel 2006 con Marco Andretti; morì nel 1966 in un incidente con una midget car.',
                    fonti_biografia = 'https://en.wikipedia.org/wiki/Jimmy_Davies_(racing_driver)',
                    fonti_sufficienti = true
                WHERE codice_riferimento = 'jimmy-davies';

UPDATE piloti SET
                    data_nascita = '1918-02-06',
                    data_morte = '1956-04-22',
                    url_wikipedia = 'https://en.wikipedia.org/wiki/Walt_Faulkner',
                    biografia = NULL,
                    curiosita = 'Nel 1950 fu il primo esordiente nella storia a conquistare la pole position alla 500 Miglia di Indianapolis.',
                    fonti_biografia = 'https://en.wikipedia.org/wiki/Walt_Faulkner',
                    fonti_sufficienti = true
                WHERE codice_riferimento = 'walt-faulkner';

UPDATE piloti SET
                    data_nascita = '1926-01-06',
                    data_morte = '2002-04-09',
                    url_wikipedia = 'https://en.wikipedia.org/wiki/Pat_Flaherty_(racing_driver)',
                    biografia = 'Pilota americano specializzato nelle gare su ovale, prese parte alla 500 Miglia di Indianapolis del 1950, gara che quell''anno era valida anche per il Campionato del Mondo di Formula 1. Sei anni dopo, nel 1956, colse il suo maggior successo conquistando la pole position e vincendo la stessa corsa. Nella sua carriera in Champ Car ottenne anche due vittorie a Milwaukee, nel 1955 e nel 1956.',
                    curiosita = 'Dopo il ritiro dalle corse si dedicò per oltre vent''anni all''allevamento e alle gare di piccioni viaggiatori.',
                    fonti_biografia = 'https://en.wikipedia.org/wiki/Pat_Flaherty_(racing_driver)',
                    fonti_sufficienti = true
                WHERE codice_riferimento = 'pat-flaherty';

UPDATE piloti SET
                    data_nascita = '1912-06-17',
                    data_morte = '1994-01-14',
                    url_wikipedia = 'https://en.wikipedia.org/wiki/Myron_Fohr',
                    biografia = 'Pilota statunitense attivo tra la fine degli anni Quaranta e l''inizio degli anni Cinquanta, si distinse soprattutto nelle corse su ovale del campionato AAA, chiudendo secondo nella classifica nazionale sia nel 1948 sia nel 1949. Partecipò due volte alla 500 Miglia di Indianapolis, tra cui l''edizione del 1950 valida per il Mondiale di Formula 1, senza però conquistare punti iridati.',
                    curiosita = 'Vinse anche la primissima edizione della AAA Stock Car National Championship, disputata nel luglio 1950.',
                    fonti_biografia = 'https://en.wikipedia.org/wiki/Myron_Fohr',
                    fonti_sufficienti = true
                WHERE codice_riferimento = 'myron-fohr';

UPDATE piloti SET
                    data_nascita = '1922-10-05',
                    data_morte = '2013-06-15',
                    url_wikipedia = 'https://en.wikipedia.org/wiki/Jos%C3%A9_Froil%C3%A1n_Gonz%C3%A1lez',
                    biografia = 'José Froilán González, soprannominato ''El Cabezón'' in Argentina e ''the Pampas Bull'' nel mondo anglosassone per la corporatura robusta e lo stile di guida aggressivo, nacque il 5 ottobre 1922. Esordì in Formula 1 nel 1950 al Gran Premio di Monaco al volante di una Maserati della Scuderia Achille Varzi, per poi passare alla Ferrari. Il 14 luglio 1951, sul circuito di Silverstone, regalò alla Scuderia di Maranello la sua primissima vittoria iridata in Formula 1, un risultato che lo consacrò come uno dei protagonisti dell''epoca. Nel 1954 sfiorò il titolo mondiale, chiudendo la stagione al secondo posto sempre con la Ferrari, e nello stesso anno vinse la 24 Ore di Le Mans in coppia con Maurice Trintignant. In carriera collezionò due vittorie, tre pole position e sei giri veloci in ventisei Gran Premi disputati tra il 1950 e il 1960. Si spense a Buenos Aires il 15 giugno 2013 all''età di novant''anni.',
                    curiosita = 'Il soprannome ''El Cabezón'' derivava semplicemente dalla sua testa particolarmente grande, tratto fisico che i tifosi argentini trasformarono presto in un marchio d''affetto.',
                    fonti_biografia = 'https://en.wikipedia.org/wiki/Jos%C3%A9_Froil%C3%A1n_Gonz%C3%A1lez',
                    fonti_sufficienti = true
                WHERE codice_riferimento = 'jose-froilan-gonzalez';

UPDATE piloti SET
                    data_nascita = '1915-10-26',
                    data_morte = '1950-07-29',
                    url_wikipedia = 'https://en.wikipedia.org/wiki/Joe_Fry',
                    biografia = 'Pilota inglese proveniente dal mondo delle cronoscalate, dove si era fatto notare al volante della Freikaiserwagen costruita dal cugino David Fry, stabilendo record ufficiosi a Prescott e primati di categoria a Shelsley Walsh. Nel 1950 tentò l''unica esperienza in Formula 1, condividendo una Maserati 4CL con Brian Shawe-Taylor al Gran Premio di Gran Bretagna a Silverstone, senza ottenere punti. Perse la vita poche settimane dopo, il 29 luglio 1950, in un incidente durante una gara sul circuito di Blandford.',
                    curiosita = 'Nel 1949 aveva sfiorato il titolo britannico di cronoscalata, chiudendo la stagione al quarto posto dopo essere stato a lungo in testa alla classifica.',
                    fonti_biografia = 'https://en.wikipedia.org/wiki/Joe_Fry',
                    fonti_sufficienti = true
                WHERE codice_riferimento = 'joe-fry';

UPDATE piloti SET
                    data_nascita = '1914-01-19',
                    data_morte = '1990-01-26',
                    url_wikipedia = 'https://en.wikipedia.org/wiki/Bob_Gerard',
                    biografia = 'Pilota e imprenditore inglese di Leicester, si affermò nel dopoguerra al volante di una ERA con cui conquistò tre Empire Trophy consecutive e due vittorie alla Jersey Road Race tra il 1947 e il 1949. Prese parte al primo Campionato del Mondo di Formula 1 nel 1950 proprio con la sua ERA, arrivando a disputare in totale otto Gran Premi iridati senza però segnare punti. Il suo miglior piazzamento al Gran Premio di Gran Bretagna fu un terzo posto nel 1948, seguito da un secondo posto l''anno successivo, risultato che gli valse il prestigioso Gold Star del British Racing Drivers'' Club per il 1949.',
                    curiosita = 'Una delle curve più celebri del circuito di Mallory Park, la ''Gerard''s'', porta ancora oggi il suo nome in suo onore.',
                    fonti_biografia = 'https://en.wikipedia.org/wiki/Bob_Gerard',
                    fonti_sufficienti = true
                WHERE codice_riferimento = 'bob-gerard';

UPDATE piloti SET
                    data_nascita = '1917-12-29',
                    data_morte = '1990-08-25',
                    url_wikipedia = 'https://en.wikipedia.org/wiki/David_Hampshire',
                    biografia = 'Pilota inglese originario del Derbyshire, aveva debuttato già nel 1939 al Nuffield Trophy di Donington Park prima di riprendere l''attività agonistica nel dopoguerra. Nel 1950, alla guida di una Maserati 4CLT della Scuderia Ambrosiana, vinse il Nottingham Trophy a Gamston e partecipò a due gare del primo Campionato del Mondo di Formula 1. L''anno seguente, in coppia con Reg Parnell su una Aston Martin DB2, chiuse al settimo posto assoluto la 24 Ore di Le Mans.',
                    curiosita = NULL,
                    fonti_biografia = 'https://en.wikipedia.org/wiki/David_Hampshire',
                    fonti_sufficienti = true
                WHERE codice_riferimento = 'david-hampshire';

UPDATE piloti SET
                    data_nascita = '1906-07-06',
                    data_morte = '1981-01-21',
                    url_wikipedia = 'https://en.wikipedia.org/wiki/Cuth_Harrison',
                    biografia = 'Pilota inglese di Sheffield, città dove in seguito fondò anche una concessionaria Ford che portava il suo nome. Debuttò nel primo Campionato del Mondo di Formula 1 il 13 maggio 1950, disputando in totale tre Gran Premi iridati senza riuscire a conquistare punti.',
                    curiosita = NULL,
                    fonti_biografia = 'https://en.wikipedia.org/wiki/Cuth_Harrison',
                    fonti_sufficienti = true
                WHERE codice_riferimento = 'cuth-harrison';

UPDATE piloti SET
                    data_nascita = '1926-01-28',
                    data_morte = '1993-03-13',
                    url_wikipedia = 'https://en.wikipedia.org/wiki/Gene_Hartley',
                    biografia = 'Pilota statunitense originario di Roanoke, in Indiana, corse per oltre un decennio nel campionato AAA/USAC prendendo parte a dieci edizioni della 500 Miglia di Indianapolis, con un decimo posto nel 1957 come miglior risultato. Fu anche un vincitore seriale nelle gare di midget car, conquistando il titolo USAC di categoria nel 1959 e totalizzando 33 vittorie in carriera, che nel 1985 gli valsero l''ingresso nella National Midget Auto Racing Hall of Fame.',
                    curiosita = 'Dopo il ritiro rimase legato al mondo delle corse organizzando gare di midget car all''Indianapolis Speedrome.',
                    fonti_biografia = 'https://en.wikipedia.org/wiki/Gene_Hartley',
                    fonti_sufficienti = true
                WHERE codice_riferimento = 'gene-hartley';

UPDATE piloti SET
                    data_nascita = '1915-09-14',
                    data_morte = '1951-11-11',
                    url_wikipedia = 'https://en.wikipedia.org/wiki/Mack_Hellings',
                    biografia = 'Pilota statunitense di Fort Dodge, Iowa, attivo tra il 1950 e il 1951 principalmente nelle corse su ovale americane. Partecipò a quattro edizioni della 500 Miglia di Indianapolis tra il 1948 e il 1951, due delle quali valide per il Campionato del Mondo di Formula 1, senza mai arrivare a punti né conquistare vittorie. Morì l''11 novembre 1951 in un incidente aereo nella contea di Kern, in California.',
                    curiosita = NULL,
                    fonti_biografia = 'https://en.wikipedia.org/wiki/Mack_Hellings',
                    fonti_sufficienti = true
                WHERE codice_riferimento = 'mack-hellings';

UPDATE piloti SET
                    data_nascita = '1920-09-04',
                    data_morte = '1995-03-01',
                    url_wikipedia = 'https://en.wikipedia.org/wiki/Jackie_Holmes',
                    biografia = 'Pilota statunitense nato a Indianapolis, esordì alla 500 Miglia cittadina nel 1949 come rookie, qualificandosi a oltre 128 miglia orarie prima di un ritiro per un guasto meccanico. Lo stesso anno si era fatto notare al volante della curiosa Pat Clancy Special a sei ruote nelle gare di Milwaukee. Disputò due edizioni della 500 Miglia di Indianapolis valide per il Mondiale di Formula 1 senza conquistare punti iridati.',
                    curiosita = 'Il suo vero nome di battesimo era Marion Holmes.',
                    fonti_biografia = 'https://en.wikipedia.org/wiki/Jackie_Holmes',
                    fonti_sufficienti = true
                WHERE codice_riferimento = 'jackie-holmes';

UPDATE piloti SET
                    data_nascita = '1929-01-29',
                    data_morte = '1955-07-11',
                    url_wikipedia = 'https://en.wikipedia.org/wiki/Jerry_Hoyt',
                    biografia = 'Pilota statunitense di Chicago, si mise in luce conquistando la pole position alla 500 Miglia di Indianapolis del 1955 con una velocità di qualifica di 140,045 miglia orarie, diventando all''epoca il più giovane poleman nella storia del Mondiale di Formula 1. Nonostante quel risultato non riuscì mai a completare l''intera distanza di gara né a conquistare punti iridati nelle quattro edizioni disputate. Morì l''11 luglio 1955, appena due mesi dopo il trionfo in qualifica, per le conseguenze di un incidente in una gara di sprint car a Oklahoma City.',
                    curiosita = NULL,
                    fonti_biografia = 'https://en.wikipedia.org/wiki/Jerry_Hoyt',
                    fonti_sufficienti = true
                WHERE codice_riferimento = 'jerry-hoyt';

UPDATE piloti SET
                    data_nascita = '1912-03-22',
                    data_morte = '1959-06-08',
                    url_wikipedia = 'https://en.wikipedia.org/wiki/Leslie_Johnson_(racing_driver)',
                    biografia = 'Imprenditore e pilota inglese di Londra, utilizzò i proventi dell''azienda di famiglia nel settore dei mobili per finanziare una carriera sportiva a tutto campo tra rally, cronoscalate e corse su circuito. Fu tra i protagonisti del lancio della Jaguar XK120, con cui ottenne le prime vittorie del modello sia in Europa nel 1949 sia in America nel 1950, e vinse la 24 Ore di Spa del 1948 alla guida di una Aston Martin. In Formula 1 prese parte a cinque Gran Premi tra il 1947 e il 1950 senza risultati di rilievo, mentre problemi di salute lo costrinsero al ritiro definitivo dopo un malore durante il Rally di Monte Carlo del 1954.',
                    curiosita = 'Stabilì diversi record di velocità a Montlhéry, tra cui quello di prima vettura di serie a mantenere una media superiore alle 100 miglia orarie per 24 ore consecutive.',
                    fonti_biografia = 'https://en.wikipedia.org/wiki/Leslie_Johnson_(racing_driver)',
                    fonti_sufficienti = true
                WHERE codice_riferimento = 'leslie-johnson';

UPDATE piloti SET
                    data_nascita = '1913-03-13',
                    data_morte = '1993-11-28',
                    url_wikipedia = 'https://en.wikipedia.org/wiki/Joe_Kelly_(racing_driver)',
                    biografia = 'Pilota irlandese, commerciante di automobili a Dublino, reinvestì i proventi della sua attività nella passione per le corse. Partecipò al Gran Premio di Gran Bretagna nelle edizioni 1950 e 1951 al volante di una Alta da privato, l''ultimo esemplare costruito dalla casa inglese, senza mai conquistare punti iridati. Proseguì l''attività agonistica con vetture Maserati e Ferrari fino a un grave incidente a Oulton Park nel 1955 che pose fine alla sua carriera.',
                    curiosita = NULL,
                    fonti_biografia = 'https://en.wikipedia.org/wiki/Joe_Kelly_(racing_driver)',
                    fonti_sufficienti = true
                WHERE codice_riferimento = 'joe-kelly';

UPDATE piloti SET
                    data_nascita = '1905-12-22',
                    data_morte = '1955-06-11',
                    url_wikipedia = 'https://en.wikipedia.org/wiki/Pierre_Levegh',
                    biografia = 'Pierre Levegh, pseudonimo scelto in omaggio allo zio Alfred Velghe, pioniere dell''automobilismo scomparso nel 1904, nacque a Parigi il 22 dicembre 1905 con il vero nome di Pierre Eugène Alfred Bouillin. Corse in Formula 1 con la Talbot-Lago nelle stagioni 1950 e 1951, senza mai conquistare punti iridati, ma la sua fama resta legata soprattutto alla 24 Ore di Le Mans. Nell''edizione del 1952 sfiorò una clamorosa vittoria in solitaria, guidando quasi ininterrottamente e rifiutando il cambio con il compagno di squadra, salvo essere tradito da un guasto al motore nell''ultima ora di gara quando era in testa con quattro giri di vantaggio. Tornò a Le Mans nel 1955 al volante di una Mercedes-Benz 300 SLR e rimase coinvolto, nella terza ora di gara, nel più grave incidente della storia del motorsport: dopo una manovra d''emergenza di Mike Hawthorn e Lance Macklin, la sua vettura decollò e si disintegrò contro un terrapieno, causando la morte dello stesso Levegh e di circa ottanta spettatori. La tragedia impresse una svolta decisiva alle norme di sicurezza dei circuiti di tutto il mondo.',
                    curiosita = 'Secondo diverse ricostruzioni, negli istanti prima dello schianto Levegh alzò un braccio per avvertire Juan Manuel Fangio del pericolo alle sue spalle, un gesto che potrebbe avergli salvato la vita.',
                    fonti_biografia = 'https://en.wikipedia.org/wiki/Pierre_Levegh',
                    fonti_sufficienti = true
                WHERE codice_riferimento = 'pierre-levegh';

UPDATE piloti SET
                    data_nascita = '1914-02-14',
                    data_morte = '2002-03-13',
                    url_wikipedia = 'https://en.wikipedia.org/wiki/Bayliss_Levrett',
                    biografia = 'Pilota statunitense di Jacksonville, in Florida, cresciuto nelle corse di sprint car sulla costa occidentale prima di approdare alla 500 Miglia di Indianapolis. Vi partecipò nelle edizioni 1949 e 1950, quest''ultima valida per il Campionato del Mondo di Formula 1, ritirandosi in entrambe per problemi meccanici. Un grave incidente nelle prove del 1952 lo convinse a ritirarsi dalle corse.',
                    curiosita = 'Nel 2007 fu introdotto nella National Sprint Car Hall of Fame in riconoscimento della sua carriera nelle corse di sprint car.',
                    fonti_biografia = 'https://en.wikipedia.org/wiki/Bayliss_Levrett',
                    fonti_sufficienti = true
                WHERE codice_riferimento = 'bayliss-levrett';

UPDATE piloti SET
                    data_nascita = '1910-01-25',
                    data_morte = '1991-01-07',
                    url_wikipedia = 'https://en.wikipedia.org/wiki/Henri_Louveau',
                    biografia = 'Pilota francese, arrivò secondo alla 24 Ore di Le Mans 1949 su Delage D6S. Partecipò a due Gran Premi del Mondiale di Formula 1 nel 1950 e 1951 al volante di una Talbot-Lago, senza mai arrivare al traguardo. Dopo un incidente al GP di Svizzera 1951 lasciò le corse e si dedicò al commercio di automobili a Parigi.',
                    curiosita = NULL,
                    fonti_biografia = 'https://en.wikipedia.org/wiki/Henri_Louveau',
                    fonti_sufficienti = true
                WHERE codice_riferimento = 'henri-louveau';

UPDATE piloti SET
                    data_nascita = '1910-08-10',
                    data_morte = '1954-04-24',
                    url_wikipedia = 'https://en.wikipedia.org/wiki/Guy_Mairesse',
                    biografia = 'Pilota francese che disputò tre Gran Premi del Mondiale di Formula 1 a partire dal debutto del 3 settembre 1950, senza mai conquistare punti. In precedenza si era distinto in altre categorie, arrivando secondo alla 24 Ore di Le Mans 1950 e vincendo il Rally Lione-Charbonnières nel 1947. Ridusse l''attività agonistica per impegni professionali, vendendo le proprie vetture nel 1952, e morì in un incidente durante le prove a Montlhéry nel 1954.',
                    curiosita = NULL,
                    fonti_biografia = 'https://en.wikipedia.org/wiki/Guy_Mairesse',
                    fonti_sufficienti = true
                WHERE codice_riferimento = 'guy-mairesse';

UPDATE piloti SET
                    data_nascita = '1915-03-24',
                    data_morte = '2006-10-12',
                    url_wikipedia = 'https://en.wikipedia.org/wiki/Eug%C3%A8ne_Martin',
                    biografia = 'Pilota francese, disputò due gare del Mondiale di Formula 1 nel 1950: al debutto sul Gran Premio di Gran Bretagna si qualificò settimo ma dovette ritirarsi per un problema di pressione dell''olio, mentre al Gran Premio di Svizzera subì un grave incidente che gli causò la frattura di una gamba. Tentò anche la strada della costruzione automobilistica con la vettura Martin-Spéciale, senza però arrivare alla produzione in serie. Tornò a correre saltuariamente con la Veritas nei primi anni ''50, ritirandosi definitivamente dalle corse nel 1958.',
                    curiosita = NULL,
                    fonti_biografia = 'https://en.wikipedia.org/wiki/Eug%C3%A8ne_Martin',
                    fonti_sufficienti = true
                WHERE codice_riferimento = 'eugene-martin';

UPDATE piloti SET
                    data_nascita = '1915-01-29',
                    data_morte = '1952-06-08',
                    url_wikipedia = 'https://en.wikipedia.org/wiki/Johnny_McDowell',
                    biografia = 'Pilota statunitense specializzato nelle midget car, con tredici vittorie di tappa al Gilmore Stadium e il titolo del Turkey Night Grand Prix nel 1947. Partecipò a quattro edizioni consecutive della 500 Miglia di Indianapolis tra il 1949 e il 1952, gare che all''epoca assegnavano punti validi per il Mondiale piloti. Fu introdotto nella National Midget Auto Racing Hall of Fame nel 2003.',
                    curiosita = NULL,
                    fonti_biografia = 'https://en.wikipedia.org/wiki/Johnny_McDowell',
                    fonti_sufficienti = true
                WHERE codice_riferimento = 'johnny-mcdowell';

UPDATE piloti SET
                    data_nascita = '1919-10-08',
                    data_morte = '1955-11-06',
                    url_wikipedia = 'https://en.wikipedia.org/wiki/Jack_McGrath_(racing_driver)',
                    biografia = 'Pilota statunitense soprannominato ''King of the Hot Rods'', vinse il primo campionato CRA nel 1946 contribuendo ad affermare i roadster come vetture da competizione al Gilmore Speedway di Los Angeles. Fu tra i protagonisti della 500 Miglia di Indianapolis, guidando le prime 44 tornate dell''edizione 1954, e si piazzò secondo nel campionato AAA sia nel 1952 sia nel 1953. Morì nel 1955 in un incidente durante le qualifiche per la 500 Miglia di Indianapolis.',
                    curiosita = NULL,
                    fonti_biografia = 'https://en.wikipedia.org/wiki/Jack_McGrath_(racing_driver)',
                    fonti_sufficienti = true
                WHERE codice_riferimento = 'jack-mcgrath';

UPDATE piloti SET
                    data_nascita = '1909-12-28',
                    data_morte = '1973-04-05',
                    url_wikipedia = 'https://en.wikipedia.org/wiki/David_Murray_(racing_driver)',
                    biografia = 'Pilota scozzese che tra il 1950 e il 1952 disputò cinque Gran Premi del Mondiale di Formula 1 su Maserati e Cooper, senza mai ottenere punti. Nel 1952 fondò la scuderia Ecurie Ecosse, con cui abbandonò l''attività di pilota per dedicarsi alla gestione del team. Sotto la sua guida la scuderia vinse la 24 Ore di Le Mans nel 1956 e nel 1957, entrambe le volte con una Jaguar D-Type.',
                    curiosita = NULL,
                    fonti_biografia = 'https://en.wikipedia.org/wiki/David_Murray_(racing_driver)',
                    fonti_sufficienti = true
                WHERE codice_riferimento = 'david-murray';

UPDATE piloti SET
                    data_nascita = '1911-10-11',
                    data_morte = '2003-10-19',
                    url_wikipedia = 'https://en.wikipedia.org/wiki/Nello_Pagani',
                    biografia = 'Pilota italiano passato alla storia come primo campione del mondo della classe 125cc nel 1949, anno in cui sfiorò anche il titolo assoluto in 500cc pur avendo totalizzato più punti nel computo generale. Vinse il Gran Premio di Pau con le quattro ruote nel 1947 e nel 1948, e nel 1950 corse al Gran Premio di Svizzera valido per il neonato Mondiale di Formula 1, chiudendo settimo senza punti. La sua carriera agonistica, iniziata nel 1928, proseguì fino al 1955, dopo la quale divenne direttore sportivo del team motociclistico MV Agusta.',
                    curiosita = 'Come Dorino Serafini, Pagani è un raro esempio di pilota capace di eccellere prima nel motociclismo iridato e poi nelle corse automobilistiche.',
                    fonti_biografia = 'https://en.wikipedia.org/wiki/Nello_Pagani',
                    fonti_sufficienti = true
                WHERE codice_riferimento = 'nello-pagani';

UPDATE piloti SET
                    data_nascita = '1916-08-11',
                    data_morte = '1956-02-03',
                    url_wikipedia = 'https://en.wikipedia.org/wiki/Johnny_Claes',
                    biografia = 'Pilota nato in Gran Bretagna da madre scozzese e padre belga, corse sotto i colori del Belgio a partire dal debutto del 1948 su Talbot-Lago, senza mai conquistare punti nel Mondiale di Formula 1 ma distinguendosi in gare non titolate. Vinse il Grand Prix des Frontières nel 1950 e il rally Liegi-Roma-Liegi nel 1953, e arrivò terzo alla 24 Ore di Le Mans del 1955. Si ritirò dalle corse nel 1955 a causa della tubercolosi e morì l''anno seguente.',
                    curiosita = 'Prima di darsi alle corse, Claes era un trombettista jazz e bandleader affermato nel Regno Unito: guidò un proprio gruppo, i Claepigeons, incidendo un disco nel 1942 e suonando accanto a musicisti come Coleman Hawkins, prima di abbandonare la musica per l''automobilismo professionistico verso la fine degli anni ''40.',
                    fonti_biografia = 'https://en.wikipedia.org/wiki/Johnny_Claes',
                    fonti_sufficienti = true
                WHERE codice_riferimento = 'johnny-claes';

UPDATE piloti SET
                    data_nascita = '1911-06-20',
                    data_morte = '2012-05-31',
                    url_wikipedia = 'https://en.wikipedia.org/wiki/Paul_Pietsch',
                    biografia = 'Pilota tedesco attivo già nelle corse Grand Prix degli anni ''30 con Auto Union e Maserati, nel 1939 fu a lungo al comando del Gran Premio di Germania prima che un guasto all''accensione lo relegasse al terzo posto alle spalle delle dominanti Freccia d''Argento. Nel 1950 divenne il primo pilota tedesco a prendere parte a un Gran Premio del Mondiale di Formula 1 nel dopoguerra. Fu per anni il più anziano pilota di Formula 1 ancora in vita e l''ultimo superstite dell''era Grand Prix anteguerra, arrivando come primo pilota di Grand Prix a raggiungere i cento anni di età.',
                    curiosita = NULL,
                    fonti_biografia = 'https://en.wikipedia.org/wiki/Paul_Pietsch',
                    fonti_sufficienti = true
                WHERE codice_riferimento = 'paul-pietsch';

UPDATE piloti SET
                    data_nascita = '1912-10-21',
                    data_morte = '1990-07-25',
                    url_wikipedia = 'https://en.wikipedia.org/wiki/Alfredo_Pi%C3%A1n',
                    biografia = 'Pilota argentino, prese parte al Gran Premio di Monaco 1950 al volante di una Maserati 4CLT per la Scuderia Achille Varzi. Durante le prove del sabato scivolò su una chiazza d''olio e si schiantò contro il guard-rail, venendo sbalzato fuori dall''abitacolo e riportando gravi lesioni alle gambe. L''infortunio gli impedì di prendere parte alla gara e pose fine, di fatto, alla sua brevissima carriera agonistica.',
                    curiosita = NULL,
                    fonti_biografia = 'https://en.wikipedia.org/wiki/Alfredo_Pi%C3%A1n',
                    fonti_sufficienti = true
                WHERE codice_riferimento = 'alfredo-pian';

UPDATE piloti SET
                    data_nascita = '1909-08-27',
                    data_morte = '2001-02-28',
                    url_wikipedia = 'https://en.wikipedia.org/wiki/Charles_Pozzi',
                    biografia = 'Pilota francese che iniziò a correre relativamente tardi, a 37 anni, mentre lavorava come intermediario nel commercio di automobili, gareggiando prevalentemente su Delahaye nella seconda metà degli anni ''40 e vincendo il Gran Premio sport di Comminges nel 1949. Nel 1950 disputò la sua unica gara nel Mondiale di Formula 1, ottenendo poi diversi piazzamenti a podio in gare di durata come le 12 Ore di Hyères e le 12 Ore di Casablanca. Ritiratosi dalle corse, fondò la Charles Pozzi S.A., divenuta l''importatore ufficiale di Ferrari e Maserati in Francia, tanto che una tonalità di blu Ferrari fu battezzata ''Blu Pozzi'' in suo onore.',
                    curiosita = NULL,
                    fonti_biografia = 'https://en.wikipedia.org/wiki/Charles_Pozzi',
                    fonti_sufficienti = true
                WHERE codice_riferimento = 'charles-pozzi';

UPDATE piloti SET
                    data_nascita = '1928-07-16',
                    data_morte = '2011-11-23',
                    url_wikipedia = 'https://en.wikipedia.org/wiki/Jim_Rathmann',
                    biografia = 'Pilota statunitense che disputò 38 gare del campionato Championship Car in quattordici anni di carriera, tra il 1949 e il 1963. Vinse il Gran Premio delle Due Mondi a Monza nel 1958 e si aggiudicò la 500 Miglia di Indianapolis nel 1960 dopo un duello durato l''intera gara con Rodger Ward, corsa votata nel 2023 come una delle più belle di sempre. Grazie ai punti Mondiale assegnati storicamente all''Indy 500, resta il pilota che ha totalizzato il maggior numero di punti in Formula 1 gareggiando esclusivamente in quella gara.',
                    curiosita = NULL,
                    fonti_biografia = 'https://en.wikipedia.org/wiki/Jim_Rathmann',
                    fonti_sufficienti = true
                WHERE codice_riferimento = 'jim-rathmann';

UPDATE piloti SET
                    data_nascita = '1908-06-05',
                    data_morte = '1977-06-18',
                    url_wikipedia = 'https://en.wikipedia.org/wiki/Franco_Rol',
                    biografia = 'Pilota italiano che disputò cinque Gran Premi del Mondiale di Formula 1 a partire dal debutto del 21 maggio 1950, senza mai conquistare punti iridati. Prese parte anche a numerose gare di Formula 1 non valide per il campionato del mondo nel corso della sua carriera.',
                    curiosita = NULL,
                    fonti_biografia = 'https://en.wikipedia.org/wiki/Franco_Rol',
                    fonti_sufficienti = true
                WHERE codice_riferimento = 'franco-rol';

UPDATE piloti SET
                    data_nascita = '1918-10-16',
                    data_morte = '2008-02-06',
                    url_wikipedia = 'https://en.wikipedia.org/wiki/Tony_Rolt',
                    biografia = 'Anthony Peter Roylance Rolt nacque a Bordon, nell''Hampshire, e crebbe in Galles studiando a Eton; appena sedicenne debuttò nelle competizioni motoristiche su una Morgan a tre ruote e nel 1939, a vent''anni, vinse il British Empire Trophy a Donington Park su una ERA. Allo scoppio della guerra fu arruolato nella Rifle Brigade e nel 1940 comandò un plotone di ricognizione durante la difesa di Calais, venendo catturato e insignito della Military Cross per il coraggio dimostrato in combattimento. Da prigioniero tentò la fuga per ben sette volte da diversi campi, finché nel luglio 1943 fu trasferito nella fortezza di massima sicurezza di Colditz, dove divenne una delle menti dietro l''audace progetto di fuga con un aliante, mai realizzato perché l''esercito americano liberò il castello nella primavera del 1945; per questi tentativi ricevette una barretta alla Military Cross. Tornato alle corse nel dopoguerra, ottenne il suo successo più celebre vincendo la 24 Ore di Le Mans del 1953 insieme a Duncan Hamilton su Jaguar C-Type, bissando l''anno seguente con un secondo posto su Jaguar D-Type; in Formula 1 disputò tre gare iridate (1950, 1953 e 1955, tutte al Gran Premio di Gran Bretagna) ritirandosi sempre per problemi meccanici. Lasciate le corse attive verso il 1956, si dedicò all''ingegneria fondando con il meccanico Freddie Dixon la Rolt Dixon Research per lo sviluppo della trazione integrale, un lavoro che, con il sostegno del magnate dei trattori Harry Ferguson, portò alla Ferguson P99: rimane l''unica vettura a trazione integrale ad aver vinto una gara di Formula 1, con Stirling Moss al volante nella Gold Cup di Oulton Park del 1961. Morì a Warwick nel 2008.',
                    curiosita = 'Uomo riservato, Rolt evitò per tutta la vita di vantarsi delle proprie imprese belliche, arrivando a dire che ''evadere non era un gioco, né un divertimento, ma un dovere''.',
                    fonti_biografia = 'https://en.wikipedia.org/wiki/Tony_Rolt',
                    fonti_sufficienti = true
                WHERE codice_riferimento = 'tony-rolt';

UPDATE piloti SET
                    data_nascita = '1914-04-10',
                    data_morte = '1976-02-13',
                    url_wikipedia = 'https://en.wikipedia.org/wiki/Paul_Russo',
                    biografia = 'Pilota statunitense specializzato nelle corse su ovale del campionato AAA/USAC, con vittorie a Springfield (1950) e Detroit (1951). Partecipò quasi ininterrottamente alla Indianapolis 500 tra il 1940 e il 1962, gara che all''epoca faceva parte del Mondiale di Formula 1, ottenendo il miglior risultato con un quarto posto nel 1957 su Novi Special.',
                    curiosita = 'Nel 1955 fu secondo alla Indianapolis 500 dividendo la vettura con Tony Bettenhausen, uno dei rari casi di equipaggio a due in quella gara.',
                    fonti_biografia = 'https://en.wikipedia.org/wiki/Paul_Russo',
                    fonti_sufficienti = true
                WHERE codice_riferimento = 'paul-russo';

UPDATE piloti SET
                    data_nascita = '1930-03-11',
                    data_morte = '1997-05-19',
                    url_wikipedia = 'https://en.wikipedia.org/wiki/Troy_Ruttman',
                    biografia = 'Pilota statunitense di ovali, esordì giovanissimo nelle corse regionali californiane. Nel 1952, a soli 22 anni, vinse la Indianapolis 500 diventando il più giovane vincitore nella storia della manifestazione.',
                    curiosita = 'Essendo la Indy 500 all''epoca valida per il Mondiale F1, il suo record di pilota più giovane a vincere una gara iridata resistette fino al successo di Fernando Alonso in Ungheria nel 2003.',
                    fonti_biografia = 'https://en.wikipedia.org/wiki/Troy_Ruttman',
                    fonti_sufficienti = true
                WHERE codice_riferimento = 'troy-ruttman';

UPDATE piloti SET
                    data_nascita = '1911-03-28',
                    data_morte = '1998-07-28',
                    url_wikipedia = 'https://en.wikipedia.org/wiki/Consalvo_Sanesi',
                    biografia = 'Pilota italiano noto soprattutto come collaudatore ufficiale dell''Alfa Romeo nel dopoguerra. Esordì nel Mondiale F1 il 3 settembre 1950 e in cinque gran premi iridati raccolse 3 punti, senza riuscire a tradurre in risultati la sua profonda conoscenza delle Alfetta. Trovò maggiori soddisfazioni nelle corse su strada, con una vittoria di classe alla Carrera Panamericana 1954, prima di ritirarsi dalle corse dopo un grave incidente alla 12 Ore di Sebring del 1964.',
                    curiosita = NULL,
                    fonti_biografia = 'https://en.wikipedia.org/wiki/Consalvo_Sanesi',
                    fonti_sufficienti = true
                WHERE codice_riferimento = 'consalvo-sanesi';

UPDATE piloti SET
                    data_nascita = '1921-06-29',
                    data_morte = '1960-05-13',
                    url_wikipedia = 'https://en.wikipedia.org/wiki/Harry_Schell',
                    biografia = 'Pilota statunitense nato a Parigi da genitori americani appassionati di corse, corse sempre con licenza e squadre europee. Fu il primo pilota statunitense a prendere il via in un Gran Premio di Formula 1, a Monaco nel 1950. Gareggiò per Maserati, Vanwall, BRM e Ferrari senza mai vincere un GP iridato, con il secondo posto in Olanda nel 1958 come miglior risultato. Morì nel 1960 durante le prove del BRDC International Trophy a Silverstone.',
                    curiosita = 'Negli ultimi tempi si era battuto pubblicamente per l''introduzione dei roll-bar di sicurezza sulle vetture europee.',
                    fonti_biografia = 'https://en.wikipedia.org/wiki/Harry_Schell',
                    fonti_sufficienti = true
                WHERE codice_riferimento = 'harry-schell';

UPDATE piloti SET
                    data_nascita = '1909-03-06',
                    data_morte = '1952-09-20',
                    url_wikipedia = 'https://en.wikipedia.org/wiki/Bill_Schindler',
                    biografia = 'Pilota statunitense specializzato in midget e sprint car, tra i pochissimi ad aver gareggiato con una gamba artificiale dopo aver perso l''arto in un incidente del 1936. Corse tre volte alla Indianapolis 500 (1950-1952) senza mai entrare a punti. Morì nel 1952 in un incidente in sprint car ad Allentown, in Pennsylvania.',
                    curiosita = 'Fu tra i fondatori dell''American Racing Drivers Club, di cui fu presidente per i primi sei anni di vita.',
                    fonti_biografia = 'https://en.wikipedia.org/wiki/Bill_Schindler',
                    fonti_sufficienti = true
                WHERE codice_riferimento = 'bill-schindler';

UPDATE piloti SET
                    data_nascita = '1915-01-28',
                    data_morte = '1999-05-01',
                    url_wikipedia = 'https://en.wikipedia.org/wiki/Brian_Shawe-Taylor',
                    biografia = 'Pilota britannico, nato a Dublino, disputò tre gran premi iridati senza conquistare punti. Al GP di Gran Bretagna 1950 condivise la Maserati di Joe Fry dopo che la sua ERA fu giudicata troppo datata; l''anno seguente chiuse ottavo nello stesso GP su ERA, miglior privato in gara. Corse anche alla 24 Ore di Le Mans 1951, arrivando quinto su Aston Martin DB2 insieme a George Abecassis. La carriera si concluse dopo un grave incidente a Goodwood.',
                    curiosita = NULL,
                    fonti_biografia = 'https://en.wikipedia.org/wiki/Brian_Shawe-Taylor',
                    fonti_sufficienti = true
                WHERE codice_riferimento = 'brian-shawe-taylor';

UPDATE piloti SET
                    data_nascita = '1912-10-07',
                    data_morte = '1984-03-01',
                    url_wikipedia = 'https://en.wikipedia.org/wiki/Peter_Walker_(racing_driver)',
                    biografia = 'Pilota inglese, ricordato soprattutto per la vittoria alla 24 Ore di Le Mans 1951 insieme a Peter Whitehead su Jaguar C-Type, primo successo assoluto della casa di Coventry nella classica francese. Sfiorò il bis nel 1953, arrivando secondo con Stirling Moss. Prese parte anche ad alcuni Gran Premi di F1 nel 1950, 1951 e 1955, e la sua carriera si chiuse dopo un incidente a Le Mans nel 1956.',
                    curiosita = 'Dopo il ritiro dalle corse si dedicò, senza fortuna, all''allevamento di conigli e cincillà.',
                    fonti_biografia = 'https://en.wikipedia.org/wiki/Peter_Walker_(racing_driver)',
                    fonti_sufficienti = true
                WHERE codice_riferimento = 'peter-walker';

UPDATE piloti SET
                    data_nascita = '1910-09-07',
                    data_morte = '1963-11-29',
                    url_wikipedia = 'https://en.wikipedia.org/wiki/Lee_Wallard',
                    biografia = 'Pilota statunitense, vinse a sorpresa la Indianapolis 500 del 1951 a 40 anni su Belanger Special, dominando la gara e diventando il primo a completarla in meno di quattro ore. Una settimana dopo il trionfo rimase gravemente ustionato in un incidente durante un evento promozionale e non si riprese mai del tutto, pur tentando un rientro alle corse nel 1954.',
                    curiosita = 'Fu inserito nella Auto Racing Hall of Fame nel 1955.',
                    fonti_biografia = 'https://en.wikipedia.org/wiki/Lee_Wallard',
                    fonti_sufficienti = true
                WHERE codice_riferimento = 'lee-wallard';

UPDATE piloti SET
                    data_nascita = '1910-10-08',
                    data_morte = '1990-01-27',
                    url_wikipedia = 'https://en.wikipedia.org/wiki/Travis_Webb',
                    biografia = 'Pilota statunitense soprannominato "Spider", specialista di sprint car e campione AAA Midwest Sprint Car nel 1948. Corse sei volte alla Indianapolis 500 tra il 1948 e il 1955, con un ventesimo posto nel 1950 come miglior risultato, e prese parte a quattro gare del Mondiale F1 disputate a Indianapolis senza mai entrare a punti.',
                    curiosita = NULL,
                    fonti_biografia = 'https://en.wikipedia.org/wiki/Travis_Webb',
                    fonti_sufficienti = true
                WHERE codice_riferimento = 'travis-webb';

UPDATE piloti SET
                    data_nascita = '1914-05-18',
                    data_morte = '2007-01-22',
                    url_wikipedia = 'https://en.wikipedia.org/wiki/Toulo_de_Graffenried',
                    biografia = 'Pilota svizzero di famiglia baronale, nato a Parigi, vinse il GP di Gran Bretagna 1949, un anno prima dell''inizio del Mondiale. Prese parte a 23 gare iridate a partire dal GP inaugurale del 1950, ottenendo come miglior risultato un quarto posto al GP del Belgio 1953 e totalizzando 9 punti in carriera. Fu l''ultimo pilota ancora in vita ad aver corso nella primissima gara del Mondiale di Formula 1.',
                    curiosita = 'Dopo il ritiro fece da controfigura per l''attore Kirk Douglas e, tra gli anni ''70 e ''80, fu ambasciatore della Marlboro nel paddock di Formula 1.',
                    fonti_biografia = 'https://en.wikipedia.org/wiki/Toulo_de_Graffenried',
                    fonti_sufficienti = true
                WHERE codice_riferimento = 'toulo-de-graffenried';

UPDATE piloti SET
                    data_nascita = '1906-10-12',
                    data_morte = '1988-01-12',
                    url_wikipedia = 'https://en.wikipedia.org/wiki/Piero_Taruffi',
                    biografia = 'Nato a Roma il 12 ottobre 1906, Piero Taruffi fu una figura più unica che rara nel motorsport italiano: prima ancora che pilota fu ingegnere, laureato al Politecnico di Roma, e portò questo approccio metodico alla guida, guadagnandosi il soprannome di ''Volpe Argentata'' per la freddezza calcolatrice con cui affrontava le gare. Cominciò in moto, vincendo il titolo europeo classe 500 nel 1932 con una Norton e stabilendo nel 1937 un record di velocità su due ruote a bordo di una Gilera, oltre i 270 km/h. Passato alle quattro ruote, corse nel Mondiale di Formula 1 dal 1950 al 1956 per Alfa Romeo, Ferrari, Mercedes, Maserati e Vanwall, con il punto più alto nel GP di Svizzera 1952 su Ferrari e un terzo posto nel campionato piloti di quella stagione, alle spalle di Farina e Ascari. Fu però una classica su strada a regalargli la vittoria più celebrata: nel 1957, a cinquant''anni compiuti, vinse la Mille Miglia su Ferrari 315 S, edizione tragicamente segnata dall''incidente mortale di Alfonso de Portago, dopo il quale la corsa fu cancellata dal calendario; colse l''occasione per ritirarsi al culmine di quel successo. Negli anni successivi si dedicò alla scrittura tecnica, pubblicando il trattato ''The Technique of Motor Racing'' (1959), diventato un riferimento per piloti e ingegneri.',
                    curiosita = 'Oltre alle corse in pista, Taruffi fu un instancabile cacciatore di record di velocità su lunga distanza, tentativi che gli valsero una fama internazionale per certi versi superiore ai risultati ottenuti in Formula 1.',
                    fonti_biografia = 'https://en.wikipedia.org/wiki/Piero_Taruffi',
                    fonti_sufficienti = true
                WHERE codice_riferimento = 'piero-taruffi';

UPDATE piloti SET
                    data_nascita = '1917-10-30',
                    data_morte = '2005-02-13',
                    url_wikipedia = 'https://en.wikipedia.org/wiki/Maurice_Trintignant',
                    biografia = 'Nato il 30 ottobre 1917, Maurice Trintignant fu uno dei piloti francesi più longevi e versatili della prima Formula 1, con una carriera che dal 1950 arrivò fino al 1964 al volante di vetture di undici costruttori diversi, un record. Il soprannome ''Le Pétoulet'' gli venne affibbiato da Jean-Pierre Wimille dopo un episodio del 1945, quando in gara si accorse che il filtro della benzina della sua Bugatti era ostruito da escrementi di topo. Nel 1948 fu vittima di un gravissimo incidente che lo tenne per giorni in coma, con il cuore fermo per oltre un minuto e mesi di amnesia e difficoltà motorie; da allora portò sempre con sé, per scaramanzia, l''orsacchiotto di peluche regalatogli dalla moglie durante la convalescenza. Corse per la Scuderia Ferrari, chiudendo quarto nel Mondiale piloti nel 1954 e nel 1955, e conquistò le sue due uniche vittorie iridate a Monaco, nel 1955 e nel 1958, entrambe partendo lontano dalla prima fila. Vinse anche la 24 Ore di Le Mans 1954 in coppia con José Froilán González su Ferrari 375 Plus. Fu inoltre sindaco del suo paese, Vergèze, dal 1958 al 1964, e ricevette la Legion d''Onore nel 1960.',
                    curiosita = 'È zio dell''attore Jean-Louis Trintignant; nel 2000, a 82 anni, tornò a correre al Gran Premio Storico di Monaco al volante della stessa Cooper T45 con cui aveva vinto nel 1958.',
                    fonti_biografia = 'https://en.wikipedia.org/wiki/Maurice_Trintignant',
                    fonti_sufficienti = true
                WHERE codice_riferimento = 'maurice-trintignant';

UPDATE piloti SET
                    data_nascita = '1909-05-16',
                    data_morte = '1997-08-24',
                    url_wikipedia = 'https://en.wikipedia.org/wiki/Luigi_Villoresi',
                    biografia = 'Nato a Milano il 16 maggio 1909, Luigi ''Gigi'' Villoresi cominciò a correre insieme al fratello maggiore Emilio, anche lui pilota di razza, ma la sua carriera fu segnata per sempre dalla morte di Emilio nel 1939 durante un collaudo Alfa Romeo a Monza; appena due settimane dopo, Luigi tornò comunque in pista vincendo il Gran Premio Adriatico, quasi a voler onorare la memoria del fratello. Dopo una serie di successi nell''immediato dopoguerra, con cinque vittorie nel 1949, prese parte al neonato Mondiale di Formula 1 dal 1950 al 1956, correndo per Ferrari, Maserati, Lancia e la scuderia privata Centro Sud, con otto podi e un quinto posto in classifica generale nel 1951 e nel 1953, senza mai vincere un Gran Premio iridato; vinse invece su strada la Mille Miglia 1951 su Ferrari. All''interno del team divenne punto di riferimento e mentore del più giovane Alberto Ascari, con cui strinse un profondo legame di amicizia culminato nel passaggio comune alla Lancia nel 1954; la morte di Ascari nel 1955 lo colpì duramente e ne segnò il progressivo declino agonistico. Si spense a Modena il 24 agosto 1997, a 88 anni.',
                    curiosita = 'Allontanatosi dalla Formula 1, si dedicò con successo ai rally, vincendo nel 1958 l''Acropoli e completando lo stesso anno il durissimo Rally di Monte Carlo, di quasi 3.000 km, senza penalità.',
                    fonti_biografia = 'https://en.wikipedia.org/wiki/Luigi_Villoresi',
                    fonti_sufficienti = true
                WHERE codice_riferimento = 'luigi-villoresi';

UPDATE piloti SET
                    data_nascita = '1906-10-30',
                    data_morte = '1966-06-30',
                    url_wikipedia = 'https://it.wikipedia.org/wiki/Nino_Farina',
                    biografia = 'Nato a Torino nel 1906 in una famiglia legata alla carrozzeria automobilistica (suo zio era Battista «Pinin» Farina, fondatore della Pininfarina), iniziò a guidare da ragazzino e corse già negli anni Trenta, prima di interrompere l''attività sportiva per prestare servizio come ufficiale di cavalleria durante la Seconda Guerra Mondiale. Tornato alle corse nel dopoguerra, nel 1950 fu ingaggiato dall''Alfa Romeo per disputare il primo Campionato del Mondo di Formula 1 della storia al volante della «Alfetta» 158. Vinse la gara inaugurale in Inghilterra a Silverstone davanti a un pubblico enorme, bissò il successo in Svizzera e a Monza, e chiuse la stagione davanti al compagno di squadra Fangio conquistando il primo titolo iridato mai assegnato. Pilota elegante ma spregiudicato, era riconoscibile per una tecnica di guida particolare, con le braccia quasi distese sul volante, e per un carattere spigoloso che gli procurò più di un attrito con i colleghi in pista. Rimase competitivo fino alla seconda metà degli anni Cinquanta, ritirandosi dalle corse nel 1957, e morì nel 1966 in un incidente stradale sulle Alpi francesi mentre si recava ad assistere al Gran Premio di Francia.',
                    curiosita = 'Farina è passato alla storia come il primo pilota a vincere una gara valida per il Campionato del Mondo di F1 (il GP di Gran Bretagna 1950) e, nella stessa stagione, il primo a laurearsi campione del mondo al debutto. Il soprannome con cui è ricordato, «Nino», accompagna un personaggio spesso descritto come freddo e calcolatore in pista, agli antipodi dello stile più istintivo di rivali come Fangio.',
                    fonti_biografia = 'https://en.wikipedia.org/wiki/Nino_Farina
https://it.wikipedia.org/wiki/Nino_Farina',
                    fonti_sufficienti = true
                WHERE codice_riferimento = 'nino-farina';

UPDATE piloti SET
                    data_nascita = '1898-06-09',
                    data_morte = '1952-06-20',
                    url_wikipedia = 'https://en.wikipedia.org/wiki/Luigi_Fagioli',
                    biografia = 'Nato nel 1898, Fagioli era uno dei piloti più esperti a prendere parte al primo Campionato del Mondo di Formula 1, avendo già corso nei Gran Premi europei fin dagli anni Venti e avendo vestito i colori di scuderie prestigiose come Maserati, Alfa Romeo, Mercedes-Benz e Auto Union nel corso degli anni Trenta. Nel 1950, ormai cinquantaduenne, fu comunque tra i protagonisti della stagione inaugurale al volante dell''Alfa Romeo 158, conquistando più podi consecutivi e restando in lotta per il titolo fino all''ultima gara, prima di chiudere il campionato al terzo posto alle spalle di Farina e Fangio. L''anno seguente, nel 1951, ottenne l''ultima vittoria della sua carriera in F1 condividendo la vettura nel Gran Premio di Francia, diventando così il pilota più anziano ad aver mai vinto una gara del Mondiale, record tuttora imbattuto. La sua carriera si chiuse tragicamente nel giugno 1952: rimase coinvolto in un grave incidente al volante di una Lancia Aurelia sport durante le prove libere del Gran Premio di Monaco (gara riservata alle vetture sport, non di Formula 1); le lesioni, sembrate lievi in un primo momento, si aggravarono nei giorni successivi fino a causarne la morte.',
                    curiosita = 'Fagioli è l''unico vincitore nella storia della F1 ad essere nato nel diciannovesimo secolo, e resta tuttora il pilota più anziano ad aver conquistato un Gran Premio valido per il Campionato del Mondo.',
                    fonti_biografia = 'https://en.wikipedia.org/wiki/Luigi_Fagioli',
                    fonti_sufficienti = true
                WHERE codice_riferimento = 'luigi-fagioli';

UPDATE piloti SET
                    data_nascita = '1911-06-24',
                    data_morte = '1995-07-17',
                    url_wikipedia = 'https://en.wikipedia.org/wiki/Juan_Manuel_Fangio',
                    biografia = 'Nato nel 1911 a Balcarce, in Argentina, Fangio si formò nelle durissime corse su strada sudamericane della Turismo Carretera, diventando campione nazionale argentino nel 1940 e nel 1941 e affrontando manifestazioni epiche come il Gran Premio del Nord, migliaia di chilometri attraverso il continente. Trasferitosi in Europa alla fine degli anni Quaranta, debuttò nel neonato Campionato del Mondo di Formula 1 nel 1950 al volante dell''Alfa Romeo, vincendo tre gare (Monaco, Belgio e Francia) e chiudendo la stagione al secondo posto dietro al compagno di squadra Farina. Quella prima annata fu solo l''inizio di una carriera straordinaria: negli anni successivi conquistò altri cinque titoli mondiali, nel 1951, 1954, 1955, 1956 e 1957, correndo con quattro scuderie diverse (Alfa Romeo, Maserati, Mercedes-Benz e Ferrari) e stabilendo un record di titoli che sarebbe rimasto imbattuto per quasi mezzo secolo. È unanimemente considerato uno dei più grandi piloti di sempre, capace di vincere una percentuale altissima delle gare a cui prese parte.',
                    curiosita = 'Nel febbraio 1958, alla vigilia del Gran Premio di Cuba, Fangio fu rapito all''Avana da un commando rivoluzionario legato a Fidel Castro e tenuto prigioniero per circa 29 ore prima di essere liberato illeso; lo stesso pilota raccontò poi l''episodio con distacco, definendolo semplicemente «un''altra avventura».',
                    fonti_biografia = 'https://en.wikipedia.org/wiki/Juan_Manuel_Fangio',
                    fonti_sufficienti = true
                WHERE codice_riferimento = 'juan-manuel-fangio';

UPDATE piloti SET
                    data_nascita = '1918-07-13',
                    data_morte = '1955-05-26',
                    url_wikipedia = 'https://it.wikipedia.org/wiki/Alberto_Ascari',
                    biografia = 'Nato a Milano nel 1918, Ascari crebbe nell''ombra ingombrante del padre Antonio, pilota Alfa Romeo morto in un incidente al Gran Premio di Francia del 1925 quando Alberto aveva appena sette anni. Dopo un esordio nel motociclismo, passò alle quattro ruote nei primi anni Quaranta, correndo con Maserati e poi soprattutto con la Ferrari, di cui divenne uno dei piloti simbolo. Nel 1950, anno di debutto della Ferrari nel Campionato del Mondo di Formula 1, colse subito un secondo posto al Gran Premio di Monaco e chiuse la sua prima stagione iridata al quinto posto in classifica, con la squadra ancora in fase di sviluppo. Nelle due stagioni successive, 1952 e 1953, dominò il campionato conquistando due titoli mondiali consecutivi — il primo vincendo sei delle otto gare disputate — diventando così il primo pilota della storia a laurearsi campione del mondo per due anni di fila. Morì il 26 maggio 1955 sull''autodromo di Monza, vittima di un incidente durante una sessione di prove non ufficiale al volante di una vettura sport non sua, pochi giorni dopo essere uscito quasi illeso da un altro grave incidente al Gran Premio di Monaco.',
                    curiosita = 'Profondamente scaramantico dopo la morte del padre, Ascari amava correre con il numero 26 e con un casco blu considerato portafortuna: il giorno dell''incidente mortale a Monza guidava però una vettura non sua indossando un casco preso in prestito, ed era proprio il 26 del mese. Per una coincidenza impressionante morì alla stessa età del padre (36 anni) e, come lui, aveva vinto in carriera esattamente 13 Gran Premi.',
                    fonti_biografia = 'https://en.wikipedia.org/wiki/Alberto_Ascari
https://it.wikipedia.org/wiki/Alberto_Ascari',
                    fonti_sufficienti = true
                WHERE codice_riferimento = 'alberto-ascari';

UPDATE piloti SET
                    data_nascita = '1905-11-05',
                    data_morte = '1956-10-29',
                    url_wikipedia = 'https://en.wikipedia.org/wiki/Louis_Rosier',
                    biografia = 'Nato nel 1905 a Chapdes-Beaufort, nel cuore della Francia, Rosier fu una figura particolare del primo automobilismo mondiale: non solo pilota, ma anche fondatore e responsabile della propria scuderia privata, l''Écurie Rosier, con cui affrontò l''intera carriera in Formula 1. Prese parte alla stagione inaugurale del Campionato del Mondo nel 1950 al volante di una Talbot-Lago, ottenendo podi ai Gran Premi di Svizzera e del Belgio e chiudendo l''annata al quarto posto in classifica generale. Proprio nel 1950 arrivò anche il risultato più celebre della sua carriera fuori dal Mondiale F1: la vittoria alla 24 Ore di Le Mans, corsa quasi interamente da solo, con il figlio Jean-Louis al volante per appena un paio di giri, un''impresa che resta ancora oggi l''unica vittoria padre-figlio nella storia della manifestazione. Continuò a correre in Formula 1 fino alla metà degli anni Cinquanta, restando legato al marchio Talbot-Lago più a lungo di quasi ogni altro pilota del suo tempo. Morì nell''ottobre 1956 in seguito alle ferite riportate pochi giorni prima in un incidente al volante di una Ferrari sport sulla pista di Montlhéry.',
                    curiosita = 'La vittoria a Le Mans 1950, ottenuta guidando per la quasi totalità delle 24 ore mentre il figlio Jean-Louis si limitava a pochi giri di sollievo, è ricordata come una delle imprese di resistenza fisica più straordinarie nella storia della corsa francese.',
                    fonti_biografia = 'https://en.wikipedia.org/wiki/Louis_Rosier',
                    fonti_sufficienti = true
                WHERE codice_riferimento = 'louis-rosier';

UPDATE piloti SET
                    data_nascita = '1918-07-04',
                    data_morte = '1984-09-08',
                    url_wikipedia = 'https://en.wikipedia.org/wiki/Johnnie_Parsons',
                    biografia = 'Nato a Los Angeles il 4 luglio 1918, Johnnie Parsons si fece le ossa sui circuiti sterrati delle midget car americane negli anni Quaranta, imponendosi come uno dei piloti più aggressivi della categoria e conquistando il titolo UMA nel 1942 con diciotto vittorie stagionali. Passato alle vetture da campionato AAA, sfiorò il successo a Indianapolis nel 1949 chiudendo secondo e conquistando comunque il titolo nazionale di quell''anno. L''anno seguente centrò il bersaglio grosso vincendo la 500 Miglia di Indianapolis 1950, gara che quella stagione valeva anche come prova del neonato Campionato del Mondo di Formula 1: Parsons entrò così nella ristretta cerchia dei piloti capaci di vincere alla propria prima uscita iridata. Nel corso degli anni Cinquanta tornò più volte a Indianapolis nell''ambito del Mondiale, totalizzando complessivamente dodici punti in nove partecipazioni. Morì a Van Nuys, in California, l''8 settembre 1984, a 66 anni.',
                    curiosita = 'Sul trofeo Borg-Warner, che riporta il nome di tutti i vincitori della 500 Miglia, il suo nome venne inciso erroneamente come "Johnny" anziché "Johnnie": l''errore non fu mai corretto e resta visibile ancora oggi.',
                    fonti_biografia = 'https://en.wikipedia.org/wiki/Johnnie_Parsons
https://imsmuseum.org/fame_inductee/johnnie-parsons/',
                    fonti_sufficienti = true
                WHERE codice_riferimento = 'johnnie-parsons';

UPDATE piloti SET
                    data_nascita = '1909-07-22',
                    data_morte = '2000-07-05',
                    url_wikipedia = 'https://it.wikipedia.org/wiki/Dorino_Serafini',
                    biografia = 'Nato a Pesaro il 22 luglio 1909, Teodoro "Dorino" Serafini iniziò a correre in moto già negli anni Venti e negli anni Trenta si affermò come uno dei migliori piloti italiani su due ruote, vincendo titoli nazionali nella 175 e nella 500 e, nel 1939, il Campionato Europeo della classe 500cc su Gilera — il riconoscimento di più alto livello disponibile per la categoria in quell''epoca, spesso ricordato per questo come l''equivalente pre-bellico di un titolo mondiale (il vero Mondiale Motociclistico FIM sarebbe nato solo dieci anni dopo). Dopo la guerra si dedicò alle quattro ruote, sopravvivendo a un grave incidente nel 1947 al Gran Premio di Comminges causato da un cedimento dello sterzo. Rientrato in attività a fine 1948, nel 1950 entrò nella Scuderia Ferrari correndo in Formula 2, nel Campionato Sport e in Formula 1, oltre a chiudere secondo alla Mille Miglia di quell''anno. Il momento più celebre della sua carriera arrivò al Gran Premio d''Italia 1950 a Monza, dove condivise la vettura con Alberto Ascari a metà gara e tagliò il traguardo al secondo posto, ottenendo mezzo punto iridato per il piazzamento in coabitazione: fu la sua unica presenza in un Gran Premio del Mondiale. Morì a Pesaro il 5 luglio 2000.',
                    curiosita = 'Avendo corso una sola gara di Formula 1 in tutta la carriera e avendola conclusa sul podio, Serafini vanta statisticamente una percentuale di podi pari al 100% delle proprie presenze iridate, un caso più unico che raro nella storia del campionato.',
                    fonti_biografia = 'https://it.wikipedia.org/wiki/Dorino_Serafini
https://en.wikipedia.org/wiki/Dorino_Serafini',
                    fonti_sufficienti = true
                WHERE codice_riferimento = 'dorino-serafini';

UPDATE piloti SET
                    data_nascita = '1907-12-18',
                    data_morte = '1984-05-20',
                    url_wikipedia = 'https://en.wikipedia.org/wiki/Bill_Holland',
                    biografia = 'Nato il 18 dicembre 1907 a Filadelfia, figlio di un pompiere ed ex giocatore di baseball professionista, Bill Holland si costruì una solida reputazione nelle corse di "big car" a partire dalla fine degli anni Trenta, conquistando il titolo AAA Eastern Big Car nel 1941. Esordì a Indianapolis nel 1947 chiudendo secondo al debutto. Nel 1949 conquistò la vittoria alla 500 Miglia, favorito da un guasto meccanico che fermò il compagno di scuderia Mauri Rose a pochi giri dal traguardo, mentre nel 1948 e nel 1950 chiuse ancora secondo. Con l''inclusione della 500 Miglia nel calendario del Mondiale F1 a partire dal 1950, Holland vi partecipò in due occasioni ottenendo un podio e sei punti in classifica. Nel 1951 fu sospeso per un anno dalla federazione AAA per aver preso parte a una gara NASCAR, in violazione delle rigide regole di esclusiva dell''epoca. Lontano dalle piste gestì, insieme alla moglie, alcune piste di pattinaggio su ghiaccio nel Connecticut. Morì il 20 maggio 1984.',
                    curiosita = 'Prima di dedicarsi alle corse fu un pattinatore su ghiaccio di ottimo livello e tentò persino di qualificarsi per le Olimpiadi invernali del 1932.',
                    fonti_biografia = 'https://en.wikipedia.org/wiki/Bill_Holland
https://imsmuseum.org/fame_inductee/bill-holland/',
                    fonti_sufficienti = true
                WHERE codice_riferimento = 'bill-holland';

UPDATE piloti SET
                    data_nascita = '1914-07-15',
                    data_morte = '1985-12-23',
                    url_wikipedia = 'https://en.wikipedia.org/wiki/Birabongse_Bhanudej',
                    biografia = 'Nato il 15 luglio 1914 nel Grand Palace di Bangkok, il principe Birabongse Bhanudej — meglio noto nelle corse come "Prince Bira" — discendeva dalla famiglia reale siamese. Rimasto orfano di padre in giovane età, fu affidato alle cure del cugino, il principe Chula Chakrabongse, che lo portò con sé in Europa negli anni Venti per completare gli studi a Eton e, in seguito, a Cambridge. Nel 1935 debuttò nelle corse automobilistiche con la scuderia White Mouse fondata dallo stesso Chula, correndo su una Riley Imp e adottando i colori azzurro pallido e giallo che divennero il primo emblema motoristico thailandese in Europa. Durante la Seconda Guerra Mondiale, con le competizioni sospese, addestrò piloti della Royal Air Force. Tornato alle corse nel dopoguerra, prese parte al primo Campionato del Mondo di Formula 1 nel 1950, chiudendo la stagione ottavo con cinque punti, e restò attivo fino alla metà degli anni Cinquanta, vincendo il Gran Premio di Nuova Zelanda del 1955 prima di ritirarsi. Fu uno dei primi piloti di origine asiatica ad affermarsi ai vertici delle corse europee. Morì a Londra il 23 dicembre 1985, colto da un infarto.',
                    curiosita = 'Al momento del malore nella metropolitana di Londra non aveva con sé documenti d''identità: fu riconosciuto solo grazie a un biglietto scritto in lingua thailandese trovato nelle sue tasche.',
                    fonti_biografia = 'https://en.wikipedia.org/wiki/Birabongse_Bhanudej
https://www.motorsportmagazine.com/articles/single-seaters/f1/the-lonely-death-of-b-bira-thai-racing-prince-adventurer-and-olympian/',
                    fonti_sufficienti = true
                WHERE codice_riferimento = 'prince-bira';

UPDATE piloti SET
                    data_nascita = '1906-05-26',
                    data_morte = '1981-01-01',
                    url_wikipedia = 'https://en.wikipedia.org/wiki/Mauri_Rose',
                    biografia = 'Nato a Columbus, in Ohio, il 26 maggio 1906, Maurice "Mauri" Rose fu uno dei piloti più vincenti della storia della 500 Miglia di Indianapolis, alla quale prese parte per quindici edizioni tra il 1933 e il 1951. Ingegnere di formazione, conquistò il titolo nazionale AAA nel 1936 e si impose a Indianapolis per tre volte, nel 1941, nel 1947 e nel 1948. Il successo del 1947 fu segnato da un episodio controverso: in testa alla corsa davanti al compagno di squadra Bill Holland, ignorò il segnale dei box che gli imponeva di rallentare e lo sorpassò, lasciando Holland convinto di avere ancora un vantaggio di un giro intero. Con l''ingresso della 500 Miglia nel calendario del neonato Mondiale di Formula 1 nel 1950, Rose vi partecipò in due occasioni, ottenendo un piazzamento a podio e quattro punti in classifica. Lasciate le corse, lavorò per General Motors contribuendo allo sviluppo della Chevrolet Corvette come vettura da competizione. Morì il 1° gennaio 1981, all''età di 74 anni.',
                    curiosita = 'Da ingegnere, Rose progettò un dispositivo che consentiva a persone prive dell''uso delle gambe di guidare un''automobile: un''invenzione che egli stesso considerava il traguardo più importante della propria vita.',
                    fonti_biografia = 'https://en.wikipedia.org/wiki/Mauri_Rose
https://michigansportshof.org/inductee/mauri-rose/',
                    fonti_sufficienti = true
                WHERE codice_riferimento = 'mauri-rose';

UPDATE piloti SET
                    data_nascita = '1899-08-03',
                    data_morte = '1979-06-22',
                    url_wikipedia = 'https://it.wikipedia.org/wiki/Louis_Chiron',
                    biografia = 'Louis Chiron nasce a Monte Carlo nel 1899, figlio di un maître d''albergo, e prima di dedicarsi alle corse lavora come ballerino professionista. Debutta al volante negli anni Venti e trova il primo grande sostegno in Alfred Hoffmann, un facoltoso appassionato che gli mette a disposizione una Bugatti Tipo 35, vettura con cui arrivano i primi successi internazionali. Negli anni Trenta si impone al Gran Premio del Belgio (1930) e a quello di Monaco (1931), guidando anche per marchi come Alfa Romeo, Mercedes-Benz e Talbot, e nel 1933 fonda con Rudolf Caracciola una propria scuderia. Dopo la Seconda Guerra Mondiale torna a vincere in patria, aggiudicandosi il Gran Premio di Francia nel 1947 e nel 1949. Quando nel 1950 nasce il Campionato del Mondo di Formula 1, Chiron ha già superato i cinquant''anni ma continua a correre saltuariamente fino al 1958, salendo sul podio a Monaco nella stagione inaugurale. Resta tuttora il pilota più anziano ad aver preso parte a un Gran Premio iridato di Formula 1, e per anni dopo il ritiro ricopre il ruolo di direttore di gara proprio al GP di Monaco, l''unica corsa di casa per un monegasco nella storia del campionato.',
                    curiosita = 'Prima di diventare pilota fu ballerino professionista, e la sua carriera automobilistica prese il via grazie al sostegno economico del suo primo mecenate, Alfred Hoffmann.',
                    fonti_biografia = 'https://it.wikipedia.org/wiki/Louis_Chiron',
                    fonti_sufficienti = true
                WHERE codice_riferimento = 'louis-chiron';

UPDATE piloti SET
                    data_nascita = '1896-12-28',
                    data_morte = '1981-10-13',
                    url_wikipedia = 'https://en.wikipedia.org/wiki/Philippe_%C3%89tancelin',
                    biografia = 'Philippe Étancelin nasce a Rouen nel 1896 e comincia a correre nel 1926 al volante di una Bugatti privata, conquistando la prima vittoria l''anno seguente al Gran Premio della Marna a Reims. Negli anni Trenta si conferma tra i protagonisti del motorsport francese, con successi ripetuti al Gran Premio della Marna, al Gran Premio di Pau e a Reims, oltre a un''affermazione, nel 1934, alla 24 Ore di Le Mans in coppia con Luigi Chinetti. Quando nel 1950 prende avvio il Campionato del Mondo di Formula 1, Étancelin ha già superato i cinquant''anni ma partecipa lo stesso, correndo complessivamente dodici Gran Premi iridati fino al 1952 e raccogliendo tre punti in classifica. Il quinto posto ottenuto al Gran Premio d''Italia 1950 lo consacra come il pilota più anziano ad aver mai conquistato punti in un campionato mondiale di Formula 1, primato che resiste ancora oggi. Per il suo lungo impegno nell''automobilismo, durato oltre quattro decenni, riceve dalla Francia la Legion d''Onore.',
                    curiosita = 'Durante le gare la moglie Suzanne svolgeva per lui il ruolo di capo meccanico ai box, e i due si scambiavano informazioni con un linguaggio di segni concordato.',
                    fonti_biografia = 'https://en.wikipedia.org/wiki/Philippe_%C3%89tancelin',
                    fonti_sufficienti = true
                WHERE codice_riferimento = 'philippe-etancelin';

UPDATE piloti SET
                    data_nascita = '1911-07-02',
                    data_morte = '1964-01-07',
                    url_wikipedia = 'https://it.wikipedia.org/wiki/Reg_Parnell',
                    biografia = 'Reg Parnell nasce a Derby nel 1911 e comincia a gareggiare nel 1935, ma un grave incidente in prova a Brooklands nel 1937 gli costa il ritiro della patente per due anni. Ripresa l''attività dopo la Seconda Guerra Mondiale, nel 1947 si aggiudica il Gran Premio Invernale di Svezia modificando la propria vettura con un doppio treno di ruote posteriori per migliorare la tenuta sul ghiaccio. Quando nel 1950 nasce il Campionato del Mondo di Formula 1, Parnell corre come pilota di punta dell''Alfa Romeo e coglie un terzo posto nel Gran Premio di casa a Silverstone, chiudendo la stagione al nono posto; negli anni successivi corre anche per BRM e su vetture Ferrari e Maserati non ufficiali. Terminata la carriera agonistica nei primi anni Cinquanta, si reinventa come team manager, guidando il programma sportivo Aston Martin e fondando nel 1961 la Yeoman Credit Racing Team, con cui lancia piloti come John Surtees e Roy Salvadori. Muore improvvisamente nel gennaio 1964, a 52 anni, per una peritonite insorta dopo un intervento chirurgico.',
                    curiosita = 'Nel 1947 fu tra i primi ad applicare una soluzione tecnica ingegnosa — un doppio treno di ruote posteriori per migliorare l''aderenza sul ghiaccio — per vincere sul circuito innevato del Gran Premio Invernale di Svezia.',
                    fonti_biografia = 'https://it.wikipedia.org/wiki/Reg_Parnell
https://en.wikipedia.org/wiki/Reg_Parnell',
                    fonti_sufficienti = true
                WHERE codice_riferimento = 'reg-parnell';

UPDATE piloti SET
                    data_nascita = '1914-11-12',
                    data_morte = '1958-09-21',
                    url_wikipedia = 'https://it.wikipedia.org/wiki/Peter_Whitehead_(pilota_automobilistico)',
                    biografia = 'Peter Whitehead nasce nel 1914 in una famiglia benestante dello Yorkshire, arricchitasi con l''industria della lana, e questo gli permette di dedicarsi alle corse fin da giovanissimo: debutta nel 1935 a bordo di una Riley e nel 1938 coglie una vittoria di prestigio al Gran Premio d''Australia a Bathurst. Nel 1949, insieme a Dudley Folland, diventa uno dei primissimi clienti privati a ricevere una monoposto di Formula 1 direttamente da Enzo Ferrari, la 125. Con l''avvio del Campionato del Mondo nel 1950 corre come pilota privato, disputando undici Gran Premi fino al 1954 e ottenendo il suo unico podio con un terzo posto al Gran Premio di Francia 1950. Il suo risultato più prestigioso arriva però nel mondiale sport-prototipi: nel 1951 vince la 24 Ore di Le Mans su una Jaguar C-Type in coppia con Peter Walker. Muore nel 1958, poche settimane dopo un podio a Le Mans, in un incidente durante il Tour de France automobilistico: la vettura che condivide con il fratello Graham esce di strada precipitando in un burrone, e mentre il fratello sopravvive gravemente ferito, Peter muore sul colpo.',
                    curiosita = 'Nel 1948 era scampato a un incidente aereo nei pressi dell''aeroporto di Croydon mentre viaggiava verso Milano per acquistare una nuova Ferrari.',
                    fonti_biografia = 'https://it.wikipedia.org/wiki/Peter_Whitehead_(pilota_automobilistico)
https://en.wikipedia.org/wiki/Peter_Whitehead_(racing_driver)',
                    fonti_sufficienti = true
                WHERE codice_riferimento = 'peter-whitehead';

UPDATE piloti SET
                    data_nascita = '1917-04-12',
                    data_morte = '2015-01-19',
                    url_wikipedia = 'https://it.wikipedia.org/wiki/Robert_Manzon',
                    biografia = 'Robert Manzon nasce a Marsiglia nel 1917 e comincia a lavorare come meccanico prima di dedicarsi alle corse nel dopoguerra, firmando nel 1948 un contratto con la giovane scuderia Gordini. Esordisce nel neonato Campionato del Mondo di Formula 1 al Gran Premio di Monaco 1950, seconda prova della storia iridata, e nel corso della carriera arriva a disputare complessivamente ventinove Gran Premi. Raccoglie due podi in carriera, tra cui un terzo posto al Gran Premio del Belgio 1952, stagione che chiude al sesto posto in classifica piloti. Ritiratosi dalle corse, si reinventa imprenditore nel sud della Francia. Muore nel gennaio 2015 all''età di 97 anni, essendo da tempo l''ultimo pilota ancora in vita ad aver preso parte a quella storica stagione inaugurale del 1950.',
                    curiosita = 'Dal 2013, con la scomparsa di José Froilán González, Manzon diventa l''ultimo pilota ancora in vita ad aver preso parte alla stagione 1950, primato che conserva fino alla propria morte nel 2015.',
                    fonti_biografia = 'https://it.wikipedia.org/wiki/Robert_Manzon
https://en.wikipedia.org/wiki/Robert_Manzon',
                    fonti_sufficienti = true
                WHERE codice_riferimento = 'robert-manzon';

UPDATE piloti SET
                    data_nascita = '1906-08-31',
                    data_morte = '1950-09-10',
                    url_wikipedia = 'https://it.wikipedia.org/wiki/Raymond_Sommer',
                    biografia = 'Raymond Sommer nacque a Mouzon, nelle Ardenne, figlio di un pioniere dell''aviazione e imprenditore nel settore automobilistico. Costruì la sua fama soprattutto nelle gare di durata, imponendosi due volte alla 24 Ore di Le Mans, nel 1932 e nel 1933, e distinguendosi per una resistenza fisica fuori dal comune: nella vittoria del 1932 rimase al volante per circa ventuno delle ventiquattro ore di gara dopo il forfait del compagno. Durante l''occupazione tedesca prese parte alla Resistenza francese. Con l''avvento della Formula 1 nel 1950 vi partecipò saltuariamente, spesso al volante di vetture private non competitive, senza mai poter mostrare appieno il suo talento per mancanza di mezzi adeguati. Il 10 settembre 1950, poche settimane dopo la conclusione della prima stagione del Mondiale piloti, perse la vita sul circuito di Cadours mentre guidava una Cooper in una gara di Formula 3: un cedimento meccanico lo fece uscire di strada e l''auto si ribaltò contro un albero, provocandogli una frattura cranica fatale.',
                    curiosita = 'Era soprannominato ''il Cinghiale delle Ardenne'' per il temperamento combattivo con cui affrontava le gare, ma tra i colleghi godeva anche fama di pilota corretto e leale.',
                    fonti_biografia = 'https://it.wikipedia.org/wiki/Raymond_Sommer
https://en.wikipedia.org/wiki/Raymond_Sommer',
                    fonti_sufficienti = true
                WHERE codice_riferimento = 'raymond-sommer';

UPDATE piloti SET
                    data_nascita = '1904-10-08',
                    data_morte = '1973-03-30',
                    url_wikipedia = 'https://it.wikipedia.org/wiki/Yves_Giraud-Cabantous',
                    biografia = 'Yves Giraud-Cabantous, conosciuto nell''ambiente sportivo semplicemente come Cabantous, nacque a Parigi e costruì la propria carriera automobilistica a partire dagli anni ''30, imponendosi nel 1930 nella massacrante Bol d''Or. Rimase per lungo tempo legato al mondo dell''endurance, arrivando secondo alla 24 Ore di Le Mans nel 1938, prima che la Seconda Guerra Mondiale interrompesse le competizioni motoristiche in Europa. Con la nascita del Campionato del Mondo di Formula 1 nel 1950, già quasi quarantacinquenne, si presentò al volante di una Talbot-Lago, ottenendo il miglior risultato della sua avventura iridata con un quarto posto al Gran Premio di Gran Bretagna a Silverstone. Continuò a correre in gare di campionato fino al 1953, totalizzando cinque punti mondiali in tredici presenze.',
                    curiosita = NULL,
                    fonti_biografia = 'https://it.wikipedia.org/wiki/Yves_Giraud-Cabantous
https://en.wikipedia.org/wiki/Yves_Giraud-Cabantous',
                    fonti_sufficienti = true
                WHERE codice_riferimento = 'yves-cabantous';

UPDATE piloti SET
                    data_nascita = '1919-09-30',
                    data_morte = '1951-07-29',
                    url_wikipedia = 'https://it.wikipedia.org/wiki/Cecil_Green',
                    biografia = 'Cecil Green, nato con il nome Judge Cecil Holt vicino a Dallas, in Texas, iniziò a correre giovanissimo su moto e vetture improvvisate prima di dedicarsi ai midget car, la disciplina che lo rese celebre nel circuito AAA del sud-ovest statunitense tra gli anni ''40. La Seconda Guerra Mondiale interruppe la sua carriera: prestò servizio nell''esercito, per poi tornare alle corse nel dopoguerra e collezionare decine di vittorie nelle gare di midget tra il 1948 e il 1950. Grazie a questi risultati ottenne un posto alla 500 Miglia di Indianapolis: nel 1950, alla sua prima partecipazione, si qualificò tra i più veloci e chiuse al quarto posto, ottenendo punti iridati. Tornò a Indianapolis anche nel 1951, ma la sua corsa si concluse anzitempo per un guasto meccanico. Morì poche settimane dopo, il 29 luglio 1951, in un incidente durante le prove di una gara sprint car nell''Indiana, nella giornata che passò alla storia delle corse americane come ''Black Sunday'' per le tre vittime causate da altrettanti incidenti.',
                    curiosita = 'Prima di affermarsi come pilota era conosciuto con il soprannome ''Speedy Little Guy'' per la sua corporatura minuta unita a uno stile di guida aggressivo e veloce.',
                    fonti_biografia = 'https://it.wikipedia.org/wiki/Cecil_Green
https://en.wikipedia.org/wiki/Cecil_Green',
                    fonti_sufficienti = true
                WHERE codice_riferimento = 'cecil-green';

UPDATE piloti SET
                    data_nascita = '1903-06-09',
                    data_morte = '1953-11-21',
                    url_wikipedia = 'https://it.wikipedia.org/wiki/Felice_Bonetto',
                    biografia = 'Felice Bonetto nacque a Manerbio, in provincia di Brescia, e mosse i primi passi nel motorsport come motociclista prima di passare alle quattro ruote in età già adulta. Debuttò in Formula 1 nel 1950, a quasi quarantasette anni, correndo fino al 1953 con diverse scuderie milanesi e raccogliendo nel Mondiale piloti due terzi posti a pari merito, nel Gran Premio d''Italia del 1951 e in quello d''Olanda del 1953. Ottenne i suoi risultati più prestigiosi però nelle corse su strada aperte al traffico, vincendo la Targa Florio nel 1952 su Lancia e conquistando due secondi posti alla Mille Miglia. Il 21 novembre 1953 stava dominando la Carrera Panamericana quando, nei pressi di Silao, perse il controllo della sua vettura affrontando una curva a velocità molto superiore a quella raccomandata, schiantandosi contro un edificio: morì sul colpo, a due giorni dal traguardo finale della gara che stava per vincere.',
                    curiosita = 'Era conosciuto tra gli appassionati con il soprannome ''il Pirata'', guadagnato per lo stile di guida audace e senza timori con cui affrontava anche i tracciati più pericolosi.',
                    fonti_biografia = 'https://it.wikipedia.org/wiki/Felice_Bonetto
https://en.wikipedia.org/wiki/Felice_Bonetto',
                    fonti_sufficienti = true
                WHERE codice_riferimento = 'felice-bonetto';

UPDATE piloti SET
                    data_nascita = '1916-09-12',
                    data_morte = '1961-05-12',
                    url_wikipedia = 'https://it.wikipedia.org/wiki/Tony_Bettenhausen',
                    biografia = 'Tony Bettenhausen, all''anagrafe Melvin Eugene Bettenhausen, nacque a Tinley Park, in Illinois, e si fece conoscere correndo con i midget car insieme a un gruppo di piloti del Midwest passato alla storia come ''Chicago Gang''. Divenne uno dei protagonisti del campionato nazionale americano Champ Car, che vinse due volte, nel 1951 e nel 1958. Partecipò per quattordici edizioni alla 500 Miglia di Indianapolis tra il 1946 e il 1960, gara che in quel periodo assegnava anche punti validi per il Campionato del Mondo di Formula 1: il suo miglior risultato fu un secondo posto nel 1955. Fu anche capostipite di una famiglia di piloti, dato che tutti e tre i suoi figli corsero a loro volta a Indianapolis. Morì il 12 maggio 1961 mentre collaudava una vettura per conto di un altro pilota: un componente della sospensione anteriore cedette in frenata, mandando l''auto a sbattere contro il muro esterno della pista di Indianapolis.',
                    curiosita = 'Il soprannome con cui era noto, ''Tinley Park Express'', omaggiava la sua città natale.',
                    fonti_biografia = 'https://it.wikipedia.org/wiki/Tony_Bettenhausen
https://en.wikipedia.org/wiki/Tony_Bettenhausen
https://imsmuseum.org/fame_inductee/tony-bettenhausen/',
                    fonti_sufficienti = true
                WHERE codice_riferimento = 'tony-bettenhausen';


COMMIT;

-- Verifica: quanti piloti/circuiti sono stati arricchiti.
SELECT COUNT(*) AS piloti_con_bio_o_curiosita FROM piloti WHERE biografia IS NOT NULL OR curiosita IS NOT NULL;
SELECT COUNT(*) AS piloti_con_date FROM piloti WHERE data_nascita IS NOT NULL;
SELECT COUNT(*) AS circuiti_con_storia FROM circuiti WHERE storia IS NOT NULL;
SELECT COUNT(*) AS righe_curve FROM circuiti_curve;
SELECT COUNT(*) AS righe_configurazioni FROM circuiti_configurazioni;
