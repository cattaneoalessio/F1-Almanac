import { useCallback, useEffect, useState } from 'react';
import { Link, Route, Routes, useNavigate } from 'react-router-dom';
import QRCode from 'qrcode';
import GlassPanel from '../../components/GlassPanel.jsx';
import { useMetaPagina } from '../../hooks/useMetaPagina.js';
import { useAuth } from '../../auth/AuthContext.jsx';
import { accediAdmin, adminElenco, cancellaSessione, getStatoAdmin, sessioneSalvata } from '../../api/contenuti.js';
import { dataLeggibile } from '../../utils/htmlSicuro.js';
import EditorContenuto from './EditorContenuto.jsx';
import './AdminContenuti.css';

/**
 * /admin/contenuti — gestione di "In Primo Piano" e News.
 * Accesso in due passaggi: login col proprio account del sito, poi codice
 * a 6 cifre dell'app di autenticazione (vedi backend/api/contenuti.py).
 */
export default function AdminContenutiView() {
  useMetaPagina({ titolo: 'Gestione contenuti', descrizione: 'Area riservata al gestore del sito.', robots: 'noindex' });
  const { utente, apriLogin, ottieniToken } = useAuth();
  const [stato, setStato] = useState(null);
  const [errore, setErrore] = useState(null);
  const [sessione, setSessione] = useState(() => sessioneSalvata());

  useEffect(() => {
    let attivo = true;
    setStato(null);
    setErrore(null);
    (async () => {
      try {
        // Mai un'attesa infinita: se il login o il server non rispondono entro
        // 20 s, si mostra un messaggio invece di "Verifica…" per sempre.
        const entro = (promessa) =>
          Promise.race([promessa, new Promise((_, ko) => setTimeout(() => ko(new Error('timeout')), 20000))]);
        const token = utente ? await entro(ottieniToken()) : null;
        const s = await entro(getStatoAdmin(token));
        if (!attivo) return;
        if (!s) setErrore('Il server non conosce ancora il pannello: la nuova versione del backend non è stata pubblicata su Render.');
        else setStato(s);
      } catch {
        if (attivo) setErrore('Il server non risponde. Se è rimasto inattivo a lungo si sta "svegliando": riprova tra un minuto.');
      }
    })();
    return () => {
      attivo = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [utente?.id]);

  const sessioneScaduta = useCallback(() => {
    cancellaSessione();
    setSessione(null);
  }, []);

  let contenuto;
  if (errore) contenuto = <p className="historical-standings__stato">{errore}</p>;
  else if (!utente)
    contenuto = (
      <GlassPanel className="admin-c__box">
        <p>Area riservata. Accedi con il tuo account del sito.</p>
        <button type="button" className="admin-c__btn admin-c__btn--primario" onClick={apriLogin}>Accedi</button>
      </GlassPanel>
    );
  else if (!stato) contenuto = <p className="historical-standings__stato">Verifica dell'account…</p>;
  else if (!stato.configurato) contenuto = <Configurazione stato={stato} />;
  else if (!stato.e_admin)
    contenuto = (
      <GlassPanel className="admin-c__box">
        <p>Questo account non è abilitato alla gestione dei contenuti.</p>
      </GlassPanel>
    );
  else if (!sessione) contenuto = <SecondoFattore onAccesso={() => setSessione(sessioneSalvata())} />;
  else
    contenuto = (
      <Routes>
        <Route index element={<Elenco onScaduta={sessioneScaduta} immaginiAttive={stato.immagini_attive} />} />
        <Route path="nuovo" element={<EditorContenuto onScaduta={sessioneScaduta} immaginiAttive={stato.immagini_attive} />} />
        <Route path=":id" element={<EditorContenuto onScaduta={sessioneScaduta} immaginiAttive={stato.immagini_attive} />} />
      </Routes>
    );

  return (
    <main className="main main--historical admin-c">
      <div className="topbar">
        <div className="topbar__title">
          <h1 style={{ fontSize: '1.4rem' }}>Gestione contenuti</h1>
        </div>
        {sessione && stato?.e_admin && (
          <button type="button" className="admin-c__btn" onClick={sessioneScaduta}>Chiudi sessione</button>
        )}
      </div>
      {contenuto}
    </main>
  );
}

// ---------------------------------------------------------------------------
function SecondoFattore({ onAccesso }) {
  const { ottieniToken } = useAuth();
  const [codice, setCodice] = useState('');
  const [errore, setErrore] = useState(null);
  const [invio, setInvio] = useState(false);

  async function invia(e) {
    e.preventDefault();
    setInvio(true);
    setErrore(null);
    try {
      const token = await ottieniToken();
      await accediAdmin(token, codice);
      onAccesso();
    } catch (err) {
      setErrore(err.message);
      setCodice('');
    } finally {
      setInvio(false);
    }
  }

  return (
    <GlassPanel className="admin-c__box">
      <form onSubmit={invia} className="admin-c__2fa">
        <label htmlFor="codice-2fa">Codice a 6 cifre dell'app di autenticazione (Microsoft Authenticator)</label>
        <input
          id="codice-2fa"
          inputMode="numeric"
          autoComplete="one-time-code"
          pattern="[0-9 ]{6,7}"
          maxLength={7}
          value={codice}
          onChange={(e) => setCodice(e.target.value)}
          autoFocus
          required
        />
        <button type="submit" className="admin-c__btn admin-c__btn--primario" disabled={invio}>
          {invio ? 'Verifica…' : 'Entra'}
        </button>
        {errore && <p className="admin-c__errore" role="alert">{errore}</p>}
      </form>
    </GlassPanel>
  );
}

// ---------------------------------------------------------------------------
// Primo avvio: genera nel browser il segreto per l'app di autenticazione.
// Il segreto NON viene inviato a nessuno: lo copi tu su Render.
const ALFABETO_B32 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
function segretoCasuale() {
  const byte = crypto.getRandomValues(new Uint8Array(20));
  let bit = '';
  byte.forEach((b) => (bit += b.toString(2).padStart(8, '0')));
  let out = '';
  for (let i = 0; i + 5 <= bit.length; i += 5) out += ALFABETO_B32[parseInt(bit.slice(i, i + 5), 2)];
  return out;
}

function Configurazione({ stato }) {
  const { utente } = useAuth();
  const [segreto] = useState(segretoCasuale);
  const [qr, setQr] = useState(null);
  const uri = `otpauth://totp/${encodeURIComponent(`Monoposto.io:${utente?.email || 'admin'}`)}?secret=${segreto}&issuer=${encodeURIComponent('Monoposto.io')}`;

  useEffect(() => {
    if (!stato.totp_impostato) QRCode.toDataURL(uri, { width: 220, margin: 1 }).then(setQr).catch(() => setQr(null));
  }, [uri, stato.totp_impostato]);

  return (
    <GlassPanel className="admin-c__box admin-c__config">
      <h2 className="section-title">Configurazione iniziale (una volta sola)</h2>
      <p>Il pannello è pronto, mancano le impostazioni sul server. Su Render: servizio del backend → <em>Environment</em> → aggiungi le variabili qui sotto → <em>Save changes</em> (Render riavvia da solo).</p>
      <ol>
        {!stato.email_impostata && (
          <li><code>ADMIN_EMAIL</code> = l'email del tuo account del sito (l'unico abilitato).</li>
        )}
        {!stato.totp_impostato && (
          <li>
            Apri <strong>Microsoft Authenticator</strong> → <em>+</em> → <em>Altro account</em> e inquadra questo codice QR
            (oppure scegli "Immetti codice manualmente" e scrivi il segreto):
            {qr && <img className="admin-c__qr" src={qr} alt="Codice QR per l'app di autenticazione" />}
            <code className="admin-c__segreto">{segreto}</code>
            <span className="admin-c__azioni-segreto">
              <button type="button" className="admin-c__btn" onClick={() => navigator.clipboard?.writeText(segreto)}>Copia segreto</button>
              <a className="admin-c__btn" href={uri}>Apri nell'app di autenticazione</a>
            </span>
            <small>Dal telefono: tocca "Apri nell'app"; se non si apre, in Authenticator scegli "Immetti codice manualmente", nome account "Monoposto.io" e incolla il segreto.</small>
            <br />
            Poi su Render: <code>ADMIN_TOTP_SECRET</code> = lo stesso segreto qui sopra.
            <br />
            <small>Il segreto è generato in questo browser e non viene salvato da nessuna parte: se ricarichi la pagina prima di averlo copiato su Render ne esce uno nuovo (rifai l'inquadratura).</small>
          </li>
        )}
        {!stato.immagini_attive && (
          <li><code>GITHUB_TOKEN_CONTENUTI</code> = token GitHub per salvare le immagini (facoltativo per iniziare: senza, si scrivono articoli ma non si caricano foto).</li>
        )}
      </ol>
      <p>Fatto il riavvio, ricarica questa pagina.</p>
    </GlassPanel>
  );
}

// ---------------------------------------------------------------------------
function Elenco({ onScaduta, immaginiAttive }) {
  const [voci, setVoci] = useState(null);
  const [errore, setErrore] = useState(null);
  const naviga = useNavigate();

  useEffect(() => {
    adminElenco()
      .then(setVoci)
      .catch((err) => (err.status === 401 ? onScaduta() : setErrore(err.message)));
  }, [onScaduta]);

  return (
    <>
      <div className="admin-c__azioni">
        <button type="button" className="admin-c__btn admin-c__btn--primario" onClick={() => naviga('/admin/contenuti/nuovo')}>
          + Nuovo articolo
        </button>
      </div>
      {!immaginiAttive && (
        <p className="admin-c__avviso">Caricamento immagini non ancora attivo: manca <code>GITHUB_TOKEN_CONTENUTI</code> su Render.</p>
      )}
      {errore && <p className="admin-c__errore">{errore}</p>}
      {voci === null && !errore && <p className="historical-standings__stato">Caricamento…</p>}
      {voci?.length === 0 && <p className="historical-standings__stato">Nessun articolo, per ora. Crea il primo.</p>}
      {voci?.length > 0 && (
        <div className="admin-c__tabella">
          {voci.map((v) => {
            const futura = v.stato === 'pubblicato' && new Date(v.data_pubblicazione) > new Date();
            return (
              <Link key={v.id} to={`/admin/contenuti/${v.id}`} className="admin-c__riga">
                <span className={`admin-c__tipo admin-c__tipo--${v.tipo}`}>{v.tipo === 'primo_piano' ? 'Primo Piano' : 'News'}</span>
                <span className="admin-c__titolo">{v.titolo}</span>
                <span className="admin-c__meta">
                  {v.in_vetrina && <strong className="admin-c__vetrina">In home ora</strong>}
                  <span className={`admin-c__stato admin-c__stato--${futura ? 'programmato' : v.stato}`}>
                    {futura ? 'Programmato' : v.stato === 'bozza' ? 'Bozza' : 'Pubblicato'}
                  </span>
                  {dataLeggibile(v.data_pubblicazione)}
                </span>
              </Link>
            );
          })}
        </div>
      )}
    </>
  );
}
