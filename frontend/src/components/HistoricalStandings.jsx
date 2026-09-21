import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import './HistoricalStandings.css';
import GlassPanel from './GlassPanel.jsx';
import TeamBadge from './TeamBadge.jsx';
import { getClassificaPiloti, getClassificaScuderie, getGareStagione } from '../api/backend.js';
import { FlagIcon } from '../utils/flags.jsx';
import { statoGara, formattaDataGara } from '../utils/statoGara.js';

// Anno minimo/massimo selezionabili: coprono l'intera storia del
// campionato mondiale di F1 (dal 1950 a oggi). Il database può contenere
// meno anni di quelli elencati qui (l'MVP parte con poche gare di test):
// per questo il componente gestisce esplicitamente il caso "nessun dato
// per questo anno" invece di dare per scontato che risponda.
const ANNO_MINIMO = 1950;
const ANNO_MASSIMO = 2026;

function generaElencoAnni() {
  const anni = [];
  for (let anno = ANNO_MASSIMO; anno >= ANNO_MINIMO; anno -= 1) {
    anni.push(anno);
  }
  return anni;
}

const ANNI_DISPONIBILI = generaElencoAnni();

/**
 * Contenuto della pagina "stagione": selettore anno + elenco gare +
 * classifica piloti. L'anno è controllato dall'esterno (la vista che la
 * usa lo legge dall'URL, /archivio/:anno) così ogni stagione ha un
 * proprio indirizzo condivisibile e indicizzabile, non solo uno stato
 * interno del componente.
 */
export default function HistoricalStandings({ anno, onAnnoChange }) {
  const [righeClassifica, setRigheClassifica] = useState([]);
  const [statoClassifica, setStatoClassifica] = useState('caricamento'); // caricamento | pronto | vuoto | errore
  const [righeScuderie, setRigheScuderie] = useState([]);
  const [statoScuderie, setStatoScuderie] = useState('caricamento'); // caricamento | pronto | vuoto | errore
  const [gare, setGare] = useState([]);

  useEffect(() => {
    let annullato = false;
    setStatoClassifica('caricamento');
    setStatoScuderie('caricamento');

    getClassificaPiloti(anno)
      .then((dati) => {
        if (annullato) return;
        if (dati === null || dati.length === 0) {
          setRigheClassifica([]);
          setStatoClassifica('vuoto');
          return;
        }
        setRigheClassifica(dati);
        setStatoClassifica('pronto');
      })
      .catch((errore) => {
        if (annullato) return;
        console.error('Errore nel caricare la classifica storica:', errore);
        setRigheClassifica([]);
        setStatoClassifica('errore');
      });

    getClassificaScuderie(anno)
      .then((dati) => {
        if (annullato) return;
        if (dati === null || dati.length === 0) {
          setRigheScuderie([]);
          setStatoScuderie('vuoto');
          return;
        }
        setRigheScuderie(dati);
        setStatoScuderie('pronto');
      })
      .catch((errore) => {
        if (annullato) return;
        console.error('Errore nel caricare la classifica scuderie:', errore);
        setRigheScuderie([]);
        setStatoScuderie('errore');
      });

    getGareStagione(anno)
      .then((dati) => {
        if (!annullato) setGare(dati || []);
      })
      .catch(() => {
        if (!annullato) setGare([]);
      });

    return () => {
      annullato = true;
    };
  }, [anno]);

  return (
    <div className="historical-standings">
      <div className="historical-standings__header">
        <h2 className="section-title">Classifica piloti storica</h2>
        <label className="historical-standings__year-picker">
          <span>Stagione</span>
          <select value={anno} onChange={(evento) => onAnnoChange(Number(evento.target.value))}>
            {ANNI_DISPONIBILI.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </label>
      </div>

      {gare.length > 0 && (
        <GlassPanel className="historical-standings__races">
          <h3 className="historical-standings__races-title">Gare della stagione {anno}</h3>
          <ul className="historical-standings__races-list">
            {gare.map((gara) => {
              const stato = statoGara(gara.data_gara);
              const dataFormattata = formattaDataGara(gara.data_gara);
              return (
                <li key={gara.circuito}>
                  <Link to={`/archivio/${anno}/${gara.circuito}`}>{gara.nome_gp}</Link>
                  {gara.ha_sprint && (
                    <span
                      className="historical-standings__races-sprint-badge"
                      title="Weekend con Sprint Race"
                    >
                      S
                    </span>
                  )}
                  {stato && (
                    <span
                      className={`historical-standings__races-stato historical-standings__races-stato--${stato === 'Disputata' ? 'disputata' : 'prossima'}`}
                    >
                      {stato === 'Prossima' && dataFormattata ? `${stato} · ${dataFormattata}` : stato}
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
        </GlassPanel>
      )}

      <GlassPanel>
        {statoClassifica === 'caricamento' && (
          <p className="historical-standings__stato">Carico la classifica del {anno}…</p>
        )}

        {statoClassifica === 'errore' && (
          <p className="historical-standings__stato historical-standings__stato--errore">
            Non riesco a contattare il backend. Verifica che l'API sia avviata e riprova.
          </p>
        )}

        {statoClassifica === 'vuoto' && (
          <p className="historical-standings__stato">
            Nessun dato per la stagione {anno} nel database (l'MVP contiene solo alcune gare di test).
          </p>
        )}

        {statoClassifica === 'pronto' && (
          <div className="historical-standings__table-wrap">
            <table className="historical-standings__table">
              <thead>
                <tr>
                  <th scope="col">Pos.</th>
                  <th scope="col">Pilota</th>
                  <th scope="col">Punti</th>
                  <th scope="col">Vittorie</th>
                  <th scope="col">Gare</th>
                </tr>
              </thead>
              <tbody>
                {righeClassifica.map((riga, indice) => (
                  <tr key={riga.pilota_slug}>
                    <td className="tab-num">{indice + 1}</td>
                    <td>
                      <Link to={`/piloti/${riga.pilota_slug}`} className="historical-standings__pilota">
                        <FlagIcon codiceIso2={riga.nazione_codice} />
                        {riga.pilota}
                      </Link>
                    </td>
                    <td className="tab-num">{riga.punti_totali}</td>
                    <td className="tab-num">{riga.vittorie}</td>
                    <td className="tab-num">{riga.gare_disputate}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </GlassPanel>

      <GlassPanel style={{ marginTop: '1.2rem' }}>
        <h2 className="section-title" style={{ marginTop: 0 }}>
          Classifica scuderie storica
        </h2>
        <p className="historical-standings__nota">
          Nota: prima del 1958 non esisteva un Mondiale Costruttori ufficiale. Questa classifica è un
          criterio nostro (somma i punti di tutti i piloti schierati da ogni scuderia in stagione), non un
          titolo storico realmente assegnato all'epoca.
        </p>

        {statoScuderie === 'caricamento' && (
          <p className="historical-standings__stato">Carico la classifica scuderie del {anno}…</p>
        )}

        {statoScuderie === 'errore' && (
          <p className="historical-standings__stato historical-standings__stato--errore">
            Non riesco a contattare il backend. Verifica che l'API sia avviata e riprova.
          </p>
        )}

        {statoScuderie === 'vuoto' && (
          <p className="historical-standings__stato">
            Nessun dato per la stagione {anno} nel database (l'MVP contiene solo alcune gare di test).
          </p>
        )}

        {statoScuderie === 'pronto' && (
          <div className="historical-standings__table-wrap">
            <table className="historical-standings__table">
              <thead>
                <tr>
                  <th scope="col">Pos.</th>
                  <th scope="col">Scuderia</th>
                  <th scope="col">Punti</th>
                  <th scope="col">Vittorie</th>
                  <th scope="col">Gare</th>
                </tr>
              </thead>
              <tbody>
                {righeScuderie.map((riga, indice) => (
                  <tr key={riga.scuderia_slug}>
                    <td className="tab-num">{indice + 1}</td>
                    <td>
                      <Link to={`/scuderie/${riga.scuderia_slug}`} className="historical-standings__pilota">
                        <TeamBadge team={riga.scuderia} size="sm" />
                        <FlagIcon codiceIso2={riga.nazione_codice} />
                        {riga.scuderia}
                      </Link>
                    </td>
                    <td className="tab-num">{riga.punti_totali}</td>
                    <td className="tab-num">{riga.vittorie}</td>
                    <td className="tab-num">{riga.gare_disputate}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </GlassPanel>
    </div>
  );
}

export { ANNO_MASSIMO, ANNO_MINIMO };
