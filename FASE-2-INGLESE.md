# Fase 2 — versione inglese (promemoria, NON ancora avviata)

Stato: **rimandata**. Non iniziare prima che il sito sia pubblicato in italiano.
Redatto il 28 settembre 2026, dopo la valutazione di fattibilità.

## Decisioni già prese

- **Ambito:** tutto, compresi i dati storici e le descrizioni dei circuiti.
- **Obiettivo:** più traffico e più ricavi dalla pubblicità internazionale.
- **Metodo:** traduzione automatica (AI) con revisione del gestore.
- **Capacità di revisione:** circa **2 ore a settimana da novembre 2026**.

## Decisioni rimandate (da prendere all'avvio della fase 2)

- Pubblico di riferimento: Regno Unito e Stati Uniti, o tutto il mondo anglofono.
- Sistema di consenso certificato da Google per UK/UE (necessario per gli annunci
  personalizzati a quel pubblico): vedi `PRE-PUBBLICAZIONE.md`, sezione 4.
- Ore di revisione: ricalibrare dopo i primi mesi.
- **Variante di inglese: da decidere PRIMA di iniziare a rivedere testi**, altrimenti la
  revisione va rifatta. Suggerimento: inglese britannico (è lo standard dei media di F1:
  "tyres", "colour", "kerb"), leggibile senza problemi anche dal pubblico americano.

## Cosa si può rivedere con 2 ore a settimana (stima, da verificare sul campo)

Revisionare una traduzione automatica buona richiede circa 2-4 minuti per una scheda
breve (una biografia): 15-30 testi all'ora, quindi **30-60 a settimana, 130-260 al mese**.

| Contenuto | Tempo di revisione stimato |
|---|---|
| Interfaccia (circa 420 righe in 41 file) | 1-1,5 ore |
| 3 articoli Idols | circa 1 ora in tutto |
| Informativa privacy e banner | 1 ora tua + controllo legale professionale |
| Schede pilota (numero da contare nel database) | 130-260 al mese, in ordine di importanza |
| Descrizioni dei circuiti, note sulle curve | poche ore (pochi testi scritti) |

Le pagine di soli dati (classifiche, risultati, stagioni, Analisi) non richiedono revisione
dei testi: servono solo l'interfaccia, i nomi dei GP inglesi (li ha già Jolpica) e i nomi
dei paesi (li fornisce il browser).

## Piano a fasi

1. **Fase 1 (ora):** lancio in italiano, approvazione AdSense, misura con Search Console.
2. **Fase 2a:** struttura multilingua (`/en/`), interfaccia e pagine di dati in inglese.
3. **Fase 2b:** testi lunghi per priorità (Idols, piloti e circuiti più cercati).
4. **Fase 2c:** il resto, man mano che si riesce a rivederlo.

**Regola di sicurezza:** ogni testo tradotto ha un flag "revisionato". Le pagine inglesi con
testi non revisionati restano `noindex` e fuori dalla sitemap. Motivo: Google considera spam
la traduzione automatica di massa senza cura umana.

**Idea per non perdere tempo:** la revisione si può fare prima che il sito supporti l'inglese.
Le traduzioni si generano in una tabella (italiano | inglese | stato) da rivedere in un foglio di
calcolo, poi si importano nel sito. Così le ore di novembre servono già.

## Regole da rispettare nel frattempo (costano poco, evitano rifacimenti)

- Non scrivere frasi in italiano nel backend (messaggi, modelli di testo): tenerle nel frontend
  o in dati traducibili. Oggi le domande di ChronoQuiz sono costruite dal backend con modelli
  italiani: da ricordare.
- Formattare date e numeri sempre da un'unica funzione (oggi "it-IT" è scritto in 10 punti).
- Nome, dominio e lingua del sito solo da `frontend/src/config/sito.js`.
- Non usare `/en` come indirizzo per altro. Le pagine italiane restano senza prefisso.
- I nuovi testi lunghi vanno scritti pensando a come verranno tradotti (niente giochi di parole,
  riferimenti locali senza spiegazione).

## Critiche da non dimenticare

- Il traffico internazionale non arriva da solo: le statistiche di F1 in inglese sono un mercato
  affollato e il dominio è nuovo. I contenuti che gli altri non hanno (Analisi con telemetria,
  Idols, quiz) sono la leva; l'inglese da solo non lo è.
- Ricavi proporzionali ai volumi: con poche visite restano piccoli.
- Mantenere due lingue raddoppia il lavoro di ogni contenuto nuovo (le automazioni possono
  tradurre in ingresso, ma la revisione resta).

## Quando riprenderlo

Dopo l'approvazione di AdSense e almeno 4-6 settimane di dati di Search Console sul sito in
italiano, e dopo aver deciso la variante di inglese.
