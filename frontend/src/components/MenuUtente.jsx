import { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { nomeUtente, useAuth } from '../auth/AuthContext.jsx';
import { getStatoAdmin } from '../api/contenuti.js';
import './MenuUtente.css';

function IconaUtente() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false">
      <circle cx="12" cy="8" r="4" fill="currentColor" />
      <path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7" fill="currentColor" />
    </svg>
  );
}

/**
 * Icona utente nella barra: rossa per chi non è loggato (menu Accedi /
 * Registrati), verde per chi è loggato (nome, email, Esci). La voce
 * "Gestione contenuti" compare solo se il backend conferma che l'account
 * è quello dell'amministratore: l'email abilitata non è scritta nel sito.
 */
export default function MenuUtente() {
  const { utente, apriLogin, apriRegistrazione, logout, ottieniToken } = useAuth();
  const [aperto, setAperto] = useState(false);
  const [admin, setAdmin] = useState(false);
  const ref = useRef(null);
  const { pathname } = useLocation();

  useEffect(() => setAperto(false), [pathname]);

  useEffect(() => {
    let attivo = true;
    if (!utente) {
      setAdmin(false);
      return undefined;
    }
    ottieniToken()
      .then((token) => (token ? getStatoAdmin(token) : null))
      .then((stato) => attivo && setAdmin(Boolean(stato?.e_admin)))
      .catch(() => attivo && setAdmin(false));
    return () => {
      attivo = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [utente?.id]);

  useEffect(() => {
    if (!aperto) return undefined;
    const fuori = (e) => ref.current && !ref.current.contains(e.target) && setAperto(false);
    const esc = (e) => e.key === 'Escape' && setAperto(false);
    document.addEventListener('mousedown', fuori);
    document.addEventListener('keydown', esc);
    return () => {
      document.removeEventListener('mousedown', fuori);
      document.removeEventListener('keydown', esc);
    };
  }, [aperto]);

  const etichetta = utente ? `Account di ${nomeUtente(utente)}` : 'Accedi o registrati';

  return (
    <div className="menu-utente" ref={ref}>
      <button
        type="button"
        className={`menu-utente__icona ${utente ? 'menu-utente__icona--loggato' : ''}`}
        aria-haspopup="menu"
        aria-expanded={aperto}
        aria-label={etichetta}
        title={etichetta}
        onClick={() => setAperto((a) => !a)}
      >
        <IconaUtente />
        {utente && <span className="menu-utente__nome">{nomeUtente(utente)}</span>}
      </button>

      {aperto && (
        <div className="menu-utente__tendina" role="menu">
          {utente ? (
            <>
              <p className="menu-utente__chi">
                <strong>{nomeUtente(utente)}</strong>
                <span>{utente.email}</span>
              </p>
              {admin && (
                <Link to="/admin/contenuti" className="menu-utente__voce" role="menuitem">
                  Gestione contenuti
                </Link>
              )}
              <button type="button" className="menu-utente__voce" role="menuitem" onClick={() => { setAperto(false); logout(); }}>
                Esci
              </button>
            </>
          ) : (
            <>
              <button type="button" className="menu-utente__voce" role="menuitem" onClick={() => { setAperto(false); apriLogin(); }}>
                Accedi
              </button>
              <button type="button" className="menu-utente__voce" role="menuitem" onClick={() => { setAperto(false); apriRegistrazione(); }}>
                Registrati
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
