import { useEffect, useMemo, useState } from 'react';
import GlassPanel from '../components/GlassPanel.jsx';
import PhotoBand from '../components/PhotoBand.jsx';
import CircuitArt from '../components/CircuitArt.jsx';
import PlotlyChart from '../components/PlotlyChart.jsx';
import fotoTopband from '../assets/topbands/gara.jpg';
import { costruisciTelemetria, costruisciStint, costruisciTempiGiro } from '../utils/analisiGrafici.js';
import './AnalisiView.css';
import { SpazioAdv } from '../components/AdSlot.jsx';

// I JSON vengono preparati da analisi-gp/scripts/update_data.py (eseguito
// da GitHub Actions dopo ogni GP) e stanno in public/, quindi sono file
// statici serviti dal sito stesso: nessun server da interrogare.
const CARTELLA_DATI = '/analisi-gp/data';

async function caricaJson(percorso) {
  const risposta = await fetch(`${CARTELLA_DATI}/${percorso}`);
  if (!risposta.ok) throw new Error(`Errore ${risposta.status} su ${percorso}`);
  // Se il file non esiste, Netlify risponde 200 con la pagina HTML del sito
  // (regola "tutto a index.html"): il parsing JSON fallisce e cade nel catch
  // di chi chiama, come un normale "dato non disponibile".
  return risposta.json();
}

const FORMATO_DATA = new Intl.DateTimeFormat('it-IT', { day: 'numeric', month: 'long', year: 'numeric' });

function pilotaDaCodice(meta, codice) {
  const p =
    meta.piloti_gara.find((x) => x.codice === codice) ||
    meta.piloti_qualifica.find((x) => x.codice === codice);
  return { codice, colore: p?.colore_scuderia || '#cccccc', nome: p?.nome || codice };
}

/**
 * Pagina Analisi (/analisi): telemetria comparativa tra due piloti, strategie
 * gomme e tempi sul giro, per ogni Gran Premio dal 2023. I dati arrivano da
 * OpenF1 e Jolpica-F1 tramite l'aggiornamento automatico (vedi
 * analisi-gp/README.md).
 */
export default function AnalisiView() {
  const [indice, setIndice] = useState(null); // null = in caricamento
  const [gpId, setGpId] = useState('');
  const [dati, setDati] = useState(null);
  const [statoDati, setStatoDati] = useState('carico');
  const [codice1, setCodice1] = useState('');
  const [codice2, setCodice2] = useState('');
  const [sessione, setSessione] = useState('gara');

  useEffect(() => {
    let annullato = false;
    caricaJson('index.json')
      .then((voci) => {
        if (annullato) return;
        const elenco = Array.isArray(voci) ? voci : [];
        setIndice(elenco);
        // L'indice è ordinato dal più recente: di default l'ultimo GP.
        if (elenco.length > 0) setGpId(elenco[0].id);
      })
      .catch(() => {
        if (!annullato) setIndice([]);
      });
    return () => {
      annullato = true;
    };
  }, []);

  useEffect(() => {
    if (!gpId) return undefined;
    let annullato = false;
    setStatoDati('carico');
    Promise.all([
      caricaJson(`${gpId}/meta.json`),
      caricaJson(`${gpId}/laps.json`),
      caricaJson(`${gpId}/telemetry.json`),
    ])
      .then(([meta, laps, telemetry]) => {
        if (annullato) return;
        const piloti = meta.piloti_gara;
        const codici = piloti.map((p) => p.codice);
        // Default: primo e secondo classificato. Cambiando GP restano i piloti
        // già scelti, se hanno corso anche in quel GP.
        const primo = piloti.find((p) => p.posizione === 1)?.codice ?? codici[0];
        const secondo = piloti.find((p) => p.posizione === 2)?.codice ?? codici[1];
        setCodice1((prima) => (codici.includes(prima) ? prima : primo));
        setCodice2((prima) => (codici.includes(prima) ? prima : secondo));
        setDati({ meta, laps, telemetry });
        setStatoDati('ok');
      })
      .catch(() => {
        if (!annullato) setStatoDati('errore');
      });
    return () => {
      annullato = true;
    };
  }, [gpId]);

  const telemetria = useMemo(() => {
    if (!dati || !codice1 || !codice2) return null;
    return costruisciTelemetria(
      dati.telemetry[sessione],
      pilotaDaCodice(dati.meta, codice1),
      pilotaDaCodice(dati.meta, codice2),
    );
  }, [dati, sessione, codice1, codice2]);

  const stint = useMemo(
    () => (dati ? costruisciStint(dati.laps.gara, dati.meta.piloti_gara) : null),
    [dati],
  );

  const tempiGiro = useMemo(() => {
    if (!dati || !codice1 || !codice2) return null;
    return costruisciTempiGiro(dati.laps.gara, pilotaDaCodice(dati.meta, codice1), pilotaDaCodice(dati.meta, codice2));
  }, [dati, codice1, codice2]);

  const meta = dati?.meta;
  const podio = meta ? meta.piloti_gara.filter((p) => p.posizione !== null && p.posizione <= 3) : [];

  return (
    <main className="main main--analisi">
      <PhotoBand src={fotoTopband} objectPosition="center 40%">
        <div className="topbar">
          <div className="topbar__title">
            <CircuitArt size={34} />
            <h1 style={{ fontSize: '1.4rem' }}>Analisi GP</h1>
          </div>
          <div className="topbar__meta">Telemetria, strategie gomme e ritmo gara, Gran Premio per Gran Premio</div>
        </div>
      </PhotoBand>

      {indice === null && <p className="analisi__stato">Carico i Gran Premi disponibili…</p>}

      {indice !== null && indice.length === 0 && (
        <GlassPanel className="analisi__vuoto">
          <h2 className="section-title">Nessun Gran Premio ancora disponibile</h2>
          <p>
            I dati di telemetria e strategia vengono caricati automaticamente dopo ogni Gran Premio, di solito entro
            un paio di giorni dalla gara. Torna a trovarci presto.
          </p>
        </GlassPanel>
      )}

      {indice !== null && indice.length > 0 && (
        <>
          <section className="analisi__selettori" aria-label="Selezione Gran Premio e piloti">
            <label className="analisi__campo">
              <span>Gran Premio</span>
              <select value={gpId} onChange={(e) => setGpId(e.target.value)}>
                {indice.map((gp) => (
                  <option key={gp.id} value={gp.id}>
                    {gp.nome_evento} ({FORMATO_DATA.format(new Date(gp.data))})
                  </option>
                ))}
              </select>
            </label>
            <label className="analisi__campo">
              <span>Pilota 1</span>
              <select value={codice1} onChange={(e) => setCodice1(e.target.value)} disabled={!meta}>
                {(meta?.piloti_gara ?? []).map((p) => (
                  <option key={p.codice} value={p.codice}>
                    {p.posizione !== null ? `P${p.posizione}` : p.classificato} — {p.nome}
                  </option>
                ))}
              </select>
            </label>
            <label className="analisi__campo">
              <span>Pilota 2</span>
              <select value={codice2} onChange={(e) => setCodice2(e.target.value)} disabled={!meta}>
                {(meta?.piloti_gara ?? []).map((p) => (
                  <option key={p.codice} value={p.codice}>
                    {p.posizione !== null ? `P${p.posizione}` : p.classificato} — {p.nome}
                  </option>
                ))}
              </select>
            </label>
          </section>

          {statoDati === 'carico' && <p className="analisi__stato">Carico i dati del Gran Premio…</p>}
          {statoDati === 'errore' && (
            <p className="analisi__stato analisi__stato--errore">
              Non riesco a caricare i dati di questo Gran Premio. Riprova più tardi.
            </p>
          )}

          {statoDati === 'ok' && meta && (
            <>
              <section className="analisi__riepilogo">
                <div>
                  <h2 className="analisi__gp">{meta.nome_evento}</h2>
                  <p className="analisi__gp-dettagli">
                    {[meta.localita, meta.paese].filter(Boolean).join(', ')} — {FORMATO_DATA.format(new Date(meta.data))}
                  </p>
                </div>
                <ol className="analisi__podio" aria-label="Podio">
                  {podio.map((p) => (
                    <li key={p.codice} style={{ borderLeftColor: p.colore_scuderia }}>
                      <span className="analisi__podio-pos">P{p.posizione}</span> {p.codice}
                    </li>
                  ))}
                </ol>
              </section>

              <GlassPanel className="analisi__pannello">
                <div className="analisi__pannello-testa">
                  <h2 className="section-title">Telemetria comparativa</h2>
                  <div className="analisi__sessioni" role="group" aria-label="Sessione">
                    {[
                      ['gara', 'Gara'],
                      ['qualifica', 'Qualifica'],
                    ].map(([valore, etichetta]) => (
                      <button
                        key={valore}
                        type="button"
                        aria-pressed={sessione === valore}
                        className={`analisi__sessione ${sessione === valore ? 'analisi__sessione--attiva' : ''}`}
                        onClick={() => setSessione(valore)}
                      >
                        {etichetta}
                      </button>
                    ))}
                  </div>
                </div>
                <p className="analisi__nota">
                  Il giro più veloce di ciascun pilota nella sessione scelta, sovrapposto per distanza percorsa (non
                  per tempo): mostra <em>dove</em> in pista un pilota guadagna o perde rispetto all'altro. Trascina per
                  zoomare, doppio clic per tornare alla vista intera. Se i due piloti sono compagni di squadra, il
                  secondo è tratteggiato.
                </p>
                {telemetria?.ok ? (
                  <PlotlyChart
                    dati={telemetria.dati}
                    layout={telemetria.layout}
                    altezza={640}
                    etichetta={`Telemetria di ${codice1} e ${codice2}`}
                  />
                ) : (
                  <p className="analisi__stato">
                    Telemetria non disponibile per {telemetria?.mancante ?? 'questi piloti'} in questa sessione.
                  </p>
                )}
              </GlassPanel>

              <SpazioAdv formato="leaderboard" />

              <GlassPanel className="analisi__pannello">
                <h2 className="section-title">Strategie gomme (tutti i piloti)</h2>
                <p className="analisi__nota">
                  Ogni barra è uno stint: la lunghezza è il numero di giri percorsi con quella mescola prima del
                  cambio gomme successivo.
                </p>
                {stint ? (
                  <PlotlyChart dati={stint.dati} layout={stint.layout} altezza={440} etichetta="Strategie gomme di tutti i piloti" />
                ) : (
                  <p className="analisi__stato">Dati sulle gomme non disponibili per questa gara.</p>
                )}
              </GlassPanel>

              <GlassPanel className="analisi__pannello">
                <h2 className="section-title">Confronto tempi sul giro — Gara</h2>
                <p className="analisi__nota">
                  Tempo di ogni giro di gara per i due piloti scelti: i picchi verso l'alto segnalano di solito un pit
                  stop o una fase di traffico o safety car.
                </p>
                {tempiGiro && (
                  <PlotlyChart
                    dati={tempiGiro.dati}
                    layout={tempiGiro.layout}
                    altezza={400}
                    etichetta={`Tempi sul giro di ${codice1} e ${codice2}`}
                  />
                )}
              </GlassPanel>
            </>
          )}
        </>
      )}

      <p className="analisi__crediti">
        Dati: <a href="https://openf1.org" target="_blank" rel="noreferrer noopener">OpenF1</a> (tempi, telemetria e
        gomme) e{' '}
        <a href="https://github.com/jolpica/jolpica-f1" target="_blank" rel="noreferrer noopener">Jolpica-F1</a>{' '}
        (calendario e classifiche), dal 2023. Progetto non ufficiale, non affiliato a Formula 1. Aggiornato
        automaticamente dopo ogni Gran Premio.
      </p>
    </main>
  );
}
