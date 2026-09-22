import { useEffect, useState } from 'react';
import GlassPanel from '../components/GlassPanel.jsx';
import { chiudiGp, getElencoCircuiti } from '../api/backend.js';
import './AdminGpView.css';

const CHIAVE_SESSIONE = 'monoposto_admin_key_sessione';

/**
 * AdminGpView — chiude il GP di un circuito (assegna i punti del
 * Campionato Mondiale Virtuale) senza dover usare curl/Postman a mano.
 *
 * Pagina volutamente NON collegata dalla barra di navigazione: non c'è
 * un sistema di ruoli in questo progetto (vedi GAME_ADMIN_KEY lato
 * backend), quindi il vero cancello è la chiave admin stessa, non la
 * scopribilità della pagina — ma non ha senso nemmeno metterla in
 * vetrina. Raggiungibile solo digitando /admin/chiudi-gp.
 *
 * La chiave non viene MAI salvata in modo permanente: solo, se lo
 * spunti tu, in sessionStorage (sparisce chiudendo la scheda/il
 * browser) — mai in localStorage, mai inviata altrove se non
 * nell'header X-Admin-Key della singola chiamata a /game/close-gp.
 */
export default function AdminGpView() {
  const [chiaveAdmin, setChiaveAdmin] = useState('');
  const [ricordaChiave, setRicordaChiave] = useState(false);

  const [circuiti, setCircuiti] = useState([]);
  const [statoCircuiti, setStatoCircuiti] = useState('caricamento');
  const [circuitoSlug, setCircuitoSlug] = useState('');

  const [statoInvio, setStatoInvio] = useState('inattivo'); // inattivo | invio | ok | errore
  const [risultato, setRisultato] = useState(null);
  const [messaggioErrore, setMessaggioErrore] = useState(null);

  useEffect(() => {
    const chiaveSalvata = window.sessionStorage.getItem(CHIAVE_SESSIONE);
    if (chiaveSalvata) {
      setChiaveAdmin(chiaveSalvata);
      setRicordaChiave(true);
    }
  }, []);

  useEffect(() => {
    getElencoCircuiti()
      .then((dati) => {
        setCircuiti(dati || []);
        setStatoCircuiti('pronto');
      })
      .catch((errore) => {
        console.error('Errore nel caricare l\u2019elenco circuiti:', errore);
        setStatoCircuiti('errore');
      });
  }, []);

  function suCambioRicorda(evento) {
    const spuntato = evento.target.checked;
    setRicordaChiave(spuntato);
    if (spuntato && chiaveAdmin) {
      window.sessionStorage.setItem(CHIAVE_SESSIONE, chiaveAdmin);
    } else {
      window.sessionStorage.removeItem(CHIAVE_SESSIONE);
    }
  }

  function suCambioChiave(evento) {
    const valore = evento.target.value;
    setChiaveAdmin(valore);
    if (ricordaChiave) {
      window.sessionStorage.setItem(CHIAVE_SESSIONE, valore);
    }
  }

  async function suInvio(evento) {
    evento.preventDefault();
    if (!circuitoSlug || !chiaveAdmin) return;

    setStatoInvio('invio');
    setRisultato(null);
    setMessaggioErrore(null);

    try {
      const esito = await chiudiGp(circuitoSlug, chiaveAdmin);
      if (esito.ok) {
        setRisultato(esito.corpo);
        setStatoInvio('ok');
      } else {
        setStatoInvio('errore');
        if (esito.status === 403) {
          setMessaggioErrore('Chiave admin mancante o sbagliata (controlla anche GAME_ADMIN_KEY su Render).');
        } else if (esito.status === 404) {
          setMessaggioErrore('Circuito non trovato.');
        } else if (esito.status === 409) {
          setMessaggioErrore('Il GP per questo circuito è già stato chiuso in precedenza: i punti non vengono mai assegnati due volte.');
        } else {
          setMessaggioErrore(esito.corpo?.detail || `Errore ${esito.status}.`);
        }
      }
    } catch (errore) {
      console.error('Errore chiudendo il GP:', errore);
      setStatoInvio('errore');
      setMessaggioErrore('Errore di rete: non sono riuscito a raggiungere il backend.');
    }
  }

  return (
    <main className="main admin-gp-view">
      <header className="admin-gp-view__header">
        <h1 className="admin-gp-view__titolo">Chiudi GP</h1>
        <p className="admin-gp-view__sottotitolo">
          Assegna i punti del Campionato Mondiale Virtuale (25-18-15-&hellip;-1) in base alla classifica Gara di
          Time Attack per un circuito. Operazione idempotente: chiuderlo due volte non assegna i punti due volte.
        </p>
      </header>

      <GlassPanel className="admin-gp-view__panel">
        <form onSubmit={suInvio}>
          <label className="admin-gp-view__campo">
            <span>Chiave admin (GAME_ADMIN_KEY)</span>
            <input
              type="password"
              className="admin-gp-view__input"
              value={chiaveAdmin}
              onChange={suCambioChiave}
              autoComplete="off"
              placeholder="Incolla qui la chiave"
            />
          </label>
          <label className="admin-gp-view__checkbox">
            <input type="checkbox" checked={ricordaChiave} onChange={suCambioRicorda} />
            <span>Ricorda per questa sessione del browser (mai salvata in modo permanente)</span>
          </label>

          <label className="admin-gp-view__campo">
            <span>Circuito</span>
            {statoCircuiti === 'caricamento' && <p className="admin-gp-view__stato">Carico i circuiti...</p>}
            {statoCircuiti === 'errore' && <p className="admin-gp-view__stato">Non riesco a caricare l&rsquo;elenco dei circuiti.</p>}
            {statoCircuiti === 'pronto' && (
              <select className="admin-gp-view__input" value={circuitoSlug} onChange={(e) => setCircuitoSlug(e.target.value)}>
                <option value="">Scegli un circuito&hellip;</option>
                {circuiti.map((c) => (
                  <option key={c.slug} value={c.slug}>
                    {c.nome}
                  </option>
                ))}
              </select>
            )}
          </label>

          <button
            type="submit"
            className="admin-gp-view__bottone"
            disabled={!circuitoSlug || !chiaveAdmin || statoInvio === 'invio'}
          >
            {statoInvio === 'invio' ? 'Chiudo il GP...' : 'Chiudi GP'}
          </button>
        </form>
      </GlassPanel>

      {statoInvio === 'errore' && (
        <GlassPanel className="admin-gp-view__panel admin-gp-view__esito admin-gp-view__esito--errore">
          {messaggioErrore}
        </GlassPanel>
      )}

      {statoInvio === 'ok' && risultato && (
        <GlassPanel className="admin-gp-view__panel admin-gp-view__esito admin-gp-view__esito--ok">
          <p>
            GP di <strong>{risultato.circuito}</strong> chiuso: {risultato.piloti_classificati} pilota/i classificato/i.
          </p>
          {Object.keys(risultato.punti_assegnati).length > 0 ? (
            <ul className="admin-gp-view__punti-lista">
              {Object.entries(risultato.punti_assegnati).map(([nome, punti]) => (
                <li key={nome}>
                  {nome} <span className="tab-num">+{punti} pt</span>
                </li>
              ))}
            </ul>
          ) : (
            <p>Nessun pilota in zona punti (nessuno tra 1&deg; e 10&deg;, o nessuna Gara registrata).</p>
          )}
        </GlassPanel>
      )}
    </main>
  );
}
