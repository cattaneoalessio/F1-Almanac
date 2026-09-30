import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import GlassPanel from '../components/GlassPanel.jsx';
import DriverAvatar from '../components/DriverAvatar.jsx';
import { FlagIcon } from '../utils/flags.jsx';
import { paragrafareBiografia } from '../utils/paragrafare.js';
import { getElencoPiloti, getDatiGiornoDriverle, inviaTentativoDriverle } from '../api/backend.js';
import { useAuth } from '../auth/AuthContext.jsx';
import './DriverleView.css';

const COLONNE = [
  { chiave: 'nazione', etichetta: 'Nazione' },
  { chiave: 'scuderia', etichetta: 'Scuderia' },
  { chiave: 'eta', etichetta: 'Età' },
  { chiave: 'numero_gara', etichetta: 'N. Gara' },
  { chiave: 'debutto', etichetta: 'Debutto' },
  { chiave: 'titoli_mondiali', etichetta: 'Titoli' },
];

/** Millisecondi alla prossima mezzanotte UTC (nuovo pilota misterioso). */
function msAlProssimoGiorno() {
  const ora = new Date();
  const domaniUtc = Date.UTC(ora.getUTCFullYear(), ora.getUTCMonth(), ora.getUTCDate() + 1);
  return Math.max(0, domaniUtc - ora.getTime());
}

function formattaConteggio(ms) {
  const totale = Math.floor(ms / 1000);
  const ore = String(Math.floor(totale / 3600)).padStart(2, '0');
  const minuti = String(Math.floor((totale % 3600) / 60)).padStart(2, '0');
  const secondi = String(totale % 60).padStart(2, '0');
  return `${ore}:${minuti}:${secondi}`;
}

/** Una cella di feedback: verde ciano se match, rosso altrimenti, con
 * freccia su/giù per i campi numerici quando non è match e la direzione
 * è nota — mai una freccia quando il dato non è disponibile (N/D). */
function CellaFeedback({ tipo, feedback }) {
  if (tipo === 'nazione') {
    return (
      <div className={`driverle-cella ${feedback.match ? 'driverle-cella--match' : 'driverle-cella--no'}`}>
        {feedback.codice_iso2 ? <FlagIcon codiceIso2={feedback.codice_iso2} /> : <span>—</span>}
      </div>
    );
  }
  if (tipo === 'scuderia') {
    const classe = feedback.stato === 'match' ? 'driverle-cella--match' : feedback.stato === 'passato' ? 'driverle-cella--parziale' : 'driverle-cella--no';
    return (
      <div className={`driverle-cella ${classe}`} title={feedback.nome || ''}>
        <span className="driverle-cella__testo">{feedback.nome || '—'}</span>
      </div>
    );
  }
  // campi numerici: eta, numero_gara, debutto, titoli_mondiali
  if (feedback.valore === null || feedback.valore === undefined) {
    return <div className="driverle-cella driverle-cella--nd"><span>N/D</span></div>;
  }
  return (
    <div className={`driverle-cella ${feedback.match ? 'driverle-cella--match' : 'driverle-cella--no'}`}>
      <span className="driverle-cella__testo">{feedback.valore}</span>
      {!feedback.match && feedback.direzione && (
        <span className="driverle-cella__freccia" aria-hidden="true">{feedback.direzione === 'su' ? '↑' : '↓'}</span>
      )}
    </div>
  );
}

function RigaTentativo({ tentativo }) {
  return (
    <div className="driverle-riga" role="row">
      <div className="driverle-riga__pilota" role="cell">
        <DriverAvatar size={30} team={tentativo.scuderia.nome} />
        <span>{tentativo.pilota_nome}</span>
        {tentativo.deceduto && (
          <span className="driverle-riga__deceduto" title="Deceduto: l'età mostrata è quella alla scomparsa, non l'età attuale">
            †
          </span>
        )}
      </div>
      {COLONNE.map((c) => (
        <div key={c.chiave} role="cell">
          <CellaFeedback tipo={c.chiave} feedback={tentativo[c.chiave]} />
        </div>
      ))}
    </div>
  );
}

/**
 * Driverle (/arcade/driverle) — indovina il pilota misterioso del giorno,
 * alla Wordle. Un solo pilota al giorno, scelto dal backend in modo
 * deterministico: tutti gli utenti nello stesso giorno UTC hanno lo
 * stesso pilota, e il confronto avviene sempre lato server (il frontend
 * non riceve mai un dato sul misterioso prima che la partita finisca).
 *
 * Per chi è loggato la partita di oggi è salvata lato server: ricaricare
 * la pagina ritrova i tentativi già fatti. Per chi non è loggato non c'è
 * persistenza: il conteggio dei tentativi resta solo in questo componente.
 */
export default function DriverleView() {
  const { utente, ottieniToken, apriLogin } = useAuth();

  const [elencoPiloti, setElencoPiloti] = useState([]);
  const [statoElenco, setStatoElenco] = useState('caricamento'); // caricamento | pronto | errore

  const [statoPartita, setStatoPartita] = useState('caricamento'); // caricamento | nuova | in_corso | vinta | persa | errore
  const [tentativi, setTentativi] = useState([]);
  const [numeroTentativiMassimo, setNumeroTentativiMassimo] = useState(6);
  const [puntiAssegnati, setPuntiAssegnati] = useState(0);
  const [pilotaRivelato, setPilotaRivelato] = useState(null);

  const [query, setQuery] = useState('');
  const [suggerimentoAttivo, setSuggerimentoAttivo] = useState(-1);
  const [invioInCorso, setInvioInCorso] = useState(false);
  const [erroreInvio, setErroreInvio] = useState(null);
  const campoRicercaRef = useRef(null);

  const [conteggio, setConteggio] = useState(msAlProssimoGiorno());

  // Elenco piloti per l'autocompletamento: stesso endpoint già usato da /piloti.
  useEffect(() => {
    let annullato = false;
    getElencoPiloti()
      .then((elenco) => {
        if (!annullato) { setElencoPiloti(elenco || []); setStatoElenco('pronto'); }
      })
      .catch(() => { if (!annullato) setStatoElenco('errore'); });
    return () => { annullato = true; };
  }, []);

  // Stato della partita di oggi: ricostruisce i tentativi già fatti per
  // chi è loggato (utente cambia -> si ricarica: es. login effettuato
  // mentre la pagina era già aperta).
  useEffect(() => {
    let annullato = false;
    setStatoPartita('caricamento');
    ottieniToken()
      .then((token) => getDatiGiornoDriverle(token))
      .then((dati) => {
        if (annullato) return;
        setNumeroTentativiMassimo(dati.numero_tentativi_massimo);
        setTentativi(dati.tentativi_gia_fatti || []);
        setPuntiAssegnati(dati.punti_assegnati || 0);
        setPilotaRivelato(dati.pilota_misterioso || null);
        setStatoPartita(dati.stato);
      })
      .catch(() => { if (!annullato) setStatoPartita('errore'); });
    return () => { annullato = true; };
  }, [utente, ottieniToken]);

  // Conto alla rovescia per il prossimo pilota, mostrato nel riepilogo finale.
  useEffect(() => {
    const timer = setInterval(() => setConteggio(msAlProssimoGiorno()), 1000);
    return () => clearInterval(timer);
  }, []);

  const partitaConclusa = statoPartita === 'vinta' || statoPartita === 'persa';
  const tentativiRimasti = Math.max(0, numeroTentativiMassimo - tentativi.length);

  const suggerimenti = useMemo(() => {
    const testo = query.trim().toLowerCase();
    if (testo.length < 2 || partitaConclusa) return [];
    const giaTentati = new Set(tentativi.map((t) => t.pilota_slug));
    return elencoPiloti
      .filter((p) => !giaTentati.has(p.slug) && p.pilota.toLowerCase().includes(testo))
      .slice(0, 8);
  }, [query, elencoPiloti, tentativi, partitaConclusa]);

  async function selezionaPilota(pilota) {
    if (invioInCorso || partitaConclusa) return;
    setInvioInCorso(true);
    setErroreInvio(null);
    try {
      const token = await ottieniToken();
      const risposta = await inviaTentativoDriverle(pilota.slug, tentativi.length + 1, token);

      if (risposta.status === 409) {
        // Solo per chi è loggato: la partita di oggi risultava già
        // conclusa lato server (es. un'altra scheda aperta). Ricarico lo
        // stato reale invece di fidarmi di quello che questo componente
        // pensava di sapere.
        const dati = await getDatiGiornoDriverle(token);
        setTentativi(dati.tentativi_gia_fatti || []);
        setPuntiAssegnati(dati.punti_assegnati || 0);
        setPilotaRivelato(dati.pilota_misterioso || null);
        setStatoPartita(dati.stato);
        return;
      }
      if (!risposta.ok || !risposta.corpo) {
        setErroreInvio('Non sono riuscito a inviare il tentativo. Riprova.');
        return;
      }

      const corpo = risposta.corpo;
      setTentativi((prima) => [...prima, corpo.tentativo]);
      setStatoPartita(corpo.stato);
      setPuntiAssegnati(corpo.punti_assegnati || 0);
      setPilotaRivelato(corpo.pilota_misterioso || null);
      setQuery('');
      setSuggerimentoAttivo(-1);
    } catch {
      setErroreInvio('Non sono riuscito a inviare il tentativo. Controlla la connessione e riprova.');
    } finally {
      setInvioInCorso(false);
      campoRicercaRef.current?.focus();
    }
  }

  function gestisciTastiera(evento) {
    if (suggerimenti.length === 0) return;
    if (evento.key === 'ArrowDown') { evento.preventDefault(); setSuggerimentoAttivo((i) => (i + 1) % suggerimenti.length); }
    else if (evento.key === 'ArrowUp') { evento.preventDefault(); setSuggerimentoAttivo((i) => (i <= 0 ? suggerimenti.length - 1 : i - 1)); }
    else if (evento.key === 'Enter' && suggerimentoAttivo >= 0) { evento.preventDefault(); selezionaPilota(suggerimenti[suggerimentoAttivo]); }
  }

  const biografiaParagrafata = pilotaRivelato?.fonti_sufficienti ? paragrafareBiografia(pilotaRivelato.biografia) : [];

  return (
    <main className="main driverle-view">
      <header className="driverle-view__testata">
        <h1>Driverle</h1>
        <p>Indovina il pilota misterioso del giorno in {numeroTentativiMassimo} tentativi. Un indizio nuovo a ogni prova.</p>
      </header>

      <GlassPanel className="driverle-view__regole">
        <p>
          Digita il nome di un pilota: ogni tentativo confronta nazione, scuderia, età, numero di gara, anno di
          debutto e titoli mondiali con il pilota misterioso.{' '}
          <span className="driverle-legenda__voce driverle-legenda__voce--match">Ciano</span> = corrisponde,{' '}
          <span className="driverle-legenda__voce driverle-legenda__voce--parziale">giallo</span> = scuderia condivisa
          in passato, <span className="driverle-legenda__voce driverle-legenda__voce--no">rosso</span> = diverso.
          Le frecce ↑/↓ indicano se il misterioso è rispettivamente maggiore o minore. Il simbolo{' '}
          <strong>†</strong> accanto a un pilota indica che è deceduto: l'età mostrata è quella alla
          scomparsa, non un'età attuale.
        </p>
        {!utente && (
          <p className="driverle-view__nota-login">
            <button type="button" className="driverle-link-bottone" onClick={apriLogin}>Accedi</button> per salvare i
            punti nel tuo Livello Pilota e ritrovare la partita se ricarichi la pagina.
          </p>
        )}
      </GlassPanel>

      {statoPartita === 'caricamento' && <p className="driverle-view__stato">Carico la partita di oggi…</p>}
      {statoPartita === 'errore' && <p className="driverle-view__stato driverle-view__stato--errore">Non riesco a caricare Driverle in questo momento. Riprova tra poco.</p>}

      {statoPartita !== 'caricamento' && statoPartita !== 'errore' && (
        <>
          {!partitaConclusa && (
            <div className="driverle-ricerca">
              <label htmlFor="driverle-input" className="driverle-ricerca__etichetta">
                Tentativo {tentativi.length + 1} di {numeroTentativiMassimo} — {tentativiRimasti} rimasti
              </label>
              <input
                id="driverle-input"
                ref={campoRicercaRef}
                type="text"
                autoComplete="off"
                placeholder={statoElenco === 'errore' ? 'Elenco piloti non disponibile' : 'Cerca un pilota per nome…'}
                value={query}
                disabled={invioInCorso || statoElenco === 'errore'}
                onChange={(e) => { setQuery(e.target.value); setSuggerimentoAttivo(-1); }}
                onKeyDown={gestisciTastiera}
              />
              {suggerimenti.length > 0 && (
                <ul className="driverle-suggerimenti" role="listbox">
                  {suggerimenti.map((p, i) => (
                    <li key={p.slug}>
                      <button
                        type="button"
                        className={`driverle-suggerimenti__voce ${i === suggerimentoAttivo ? 'driverle-suggerimenti__voce--attiva' : ''}`}
                        onClick={() => selezionaPilota(p)}
                        disabled={invioInCorso}
                      >
                        <DriverAvatar size={24} team={p.ultima_scuderia} />
                        <span>{p.pilota}</span>
                        {p.nazione_codice && <FlagIcon codiceIso2={p.nazione_codice} />}
                        {p.ultima_scuderia && <span className="driverle-suggerimenti__scuderia">{p.ultima_scuderia}</span>}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              {erroreInvio && <p className="driverle-view__stato driverle-view__stato--errore">{erroreInvio}</p>}
            </div>
          )}

          {tentativi.length > 0 && (
            <GlassPanel className="driverle-griglia-pannello">
              <div className="driverle-griglia" role="table" aria-label="Tentativi">
                <div className="driverle-riga driverle-riga--intestazione" role="row">
                  <div role="columnheader">Pilota</div>
                  {COLONNE.map((c) => <div key={c.chiave} role="columnheader">{c.etichetta}</div>)}
                </div>
                {tentativi.map((t, i) => <RigaTentativo key={`${t.pilota_slug}-${i}`} tentativo={t} />)}
              </div>
            </GlassPanel>
          )}
        </>
      )}

      {partitaConclusa && pilotaRivelato && (
        <div className="driverle-modale__sfondo">
          <GlassPanel className="driverle-modale">
            <h2>{statoPartita === 'vinta' ? `Indovinato in ${tentativi.length}!` : 'Tentativi esauriti'}</h2>
            <div className="driverle-modale__pilota">
              <DriverAvatar size={56} team={tentativi[tentativi.length - 1]?.scuderia?.nome} />
              <div>
                <p className="driverle-modale__nome">
                  {pilotaRivelato.nazione_codice && <FlagIcon codiceIso2={pilotaRivelato.nazione_codice} />} {pilotaRivelato.nome}
                </p>
                {pilotaRivelato.url_wikipedia && (
                  <a href={pilotaRivelato.url_wikipedia} target="_blank" rel="noreferrer noopener">Wikipedia ↗</a>
                )}
              </div>
            </div>

            {biografiaParagrafata.length > 0 ? (
              biografiaParagrafata.map((paragrafo, i) => <p key={i} className="driverle-modale__bio">{paragrafo}</p>)
            ) : (
              <p className="driverle-modale__bio driverle-modale__bio--assente">
                Biografia non ancora disponibile per questo pilota.
              </p>
            )}

            {utente ? (
              statoPartita === 'vinta' ? (
                <p className="driverle-modale__punti">+{puntiAssegnati} punti Livello Pilota</p>
              ) : (
                <p className="driverle-modale__punti driverle-modale__punti--zero">Nessun punto questa volta — ritenta domani.</p>
              )
            ) : (
              <p className="driverle-view__nota-login">
                <button type="button" className="driverle-link-bottone" onClick={apriLogin}>Accedi</button> per far
                contare le prossime vittorie nel tuo Livello Pilota.
              </p>
            )}

            <p className="driverle-modale__conteggio">Prossimo pilota tra {formattaConteggio(conteggio)}</p>
            <Link to="/piloti" className="driverle-modale__link">Esplora l'archivio piloti →</Link>
          </GlassPanel>
        </div>
      )}
    </main>
  );
}
