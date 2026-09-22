import { createContext, useContext, useEffect, useState } from 'react';
import netlifyIdentity from 'netlify-identity-widget';

const AuthContext = createContext(null);

// netlifyIdentity.init() va chiamato una volta sola per pagina: con
// StrictMode (attivo in main.jsx) gli effect vengono eseguiti due volte
// in sviluppo, questo flag a livello di modulo evita un doppio init
// (che altrimenti rischierebbe di creare due volte il contenitore del
// modale). Non è legato al ciclo di vita del componente apposta.
let widgetInizializzato = false;

/**
 * Wrapper su netlify-identity-widget (API verificata leggendo il README
 * del pacchetto installato, non a memoria). Login SEMPRE facoltativo in
 * questo progetto — nessuna pagina lo richiede, serve solo per salvare
 * i punteggi Arcade in classifica (vedi ChronoQuizView.jsx).
 *
 * Non passiamo APIUrl a init(): il frontend è ospitato sullo stesso
 * sito Netlify che fornisce Identity, quindi il rilevamento automatico
 * per stesso dominio basta in produzione (il README sconsiglia di
 * impostare APIUrl fuori dai casi in cui l'app gira su un dominio
 * diverso, es. Cordova/Electron — non il nostro caso). In sviluppo
 * locale (Vite su localhost) il widget chiede da solo l'URL del sito
 * alla prima apertura del modale: comportamento suo, documentato, non
 * c'è nulla da configurare qui per quel caso.
 */
export function AuthProvider({ children }) {
  const [utente, setUtente] = useState(null);

  useEffect(() => {
    const suInit = (u) => setUtente(u);
    const suLogin = (u) => {
      setUtente(u);
      netlifyIdentity.close();
    };
    const suLogout = () => setUtente(null);

    // 'init' va registrato PRIMA di chiamare init(): è l'evento che il
    // widget spara quando ha finito di recuperare la sessione persistita
    // (localStorage), che può essere un'operazione asincrona — la sola
    // chiamata sincrona a currentUser() subito dopo init() rischia di
    // arrivare troppo presto e restituire null anche con una sessione
    // valida salvata. Qui teniamo entrambe: la chiamata sincrona per un
    // primo render immediato se il valore è già pronto, l'evento come
    // fonte di verità successiva che corregge lo stato se necessario.
    netlifyIdentity.on('init', suInit);
    netlifyIdentity.on('login', suLogin);
    netlifyIdentity.on('logout', suLogout);

    if (!widgetInizializzato) {
      netlifyIdentity.init({ locale: 'it' });
      widgetInizializzato = true;
    }
    setUtente(netlifyIdentity.currentUser());

    return () => {
      netlifyIdentity.off('init', suInit);
      netlifyIdentity.off('login', suLogin);
      netlifyIdentity.off('logout', suLogout);
    };
  }, []);

  async function ottieniToken() {
    if (!utente) return null;
    try {
      // netlifyIdentity.refresh() rinnova il JWT se serve e restituisce
      // sempre un token fresco: più affidabile di leggere il token
      // statico salvato al login, che potrebbe essere scaduto se la
      // sessione di gioco è aperta da un po'.
      return await netlifyIdentity.refresh();
    } catch {
      // Sessione scaduta/non rinnovabile: trattarlo come "non loggato"
      // invece di far fallire chi chiama questa funzione.
      return null;
    }
  }

  const valore = {
    utente,
    ottieniToken,
    apriLogin: () => netlifyIdentity.open('login'),
    apriRegistrazione: () => netlifyIdentity.open('signup'),
    logout: () => netlifyIdentity.logout(),
  };

  return <AuthContext.Provider value={valore}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const contesto = useContext(AuthContext);
  if (!contesto) {
    throw new Error('useAuth deve essere usato dentro <AuthProvider>');
  }
  return contesto;
}

/** Nome da mostrare per un utente Netlify Identity: preferisce il nome
 * completo impostato in fase di registrazione, altrimenti la parte
 * locale dell'email. */
export function nomeUtente(utente) {
  if (!utente) return '';
  const nomeCompleto = utente.user_metadata?.full_name;
  if (nomeCompleto) return nomeCompleto;
  const email = utente.email || '';
  return email.split('@')[0] || 'Pilota';
}
