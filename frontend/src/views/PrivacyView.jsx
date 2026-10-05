import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import GlassPanel from '../components/GlassPanel.jsx';
import GestisciConsenso from '../components/GestisciConsenso.jsx';
import { SITO } from '../config/sito.js';
import { TITOLARE, PRIVACY_AGGIORNATA_IL } from '../data/titolare.js';
import './PrivacyView.css';

/** Valore da compilare in data/titolare.js: se manca, si vede subito. */
function Dato({ valore, cosa }) {
  return valore ? (
    <strong>{valore}</strong>
  ) : (
    <mark className="privacy-view__mancante">[DA COMPLETARE: {cosa}]</mark>
  );
}

function Fornitore({ nome, children }) {
  return (
    <li>
      <strong>{nome}</strong> — {children}
    </li>
  );
}

/**
 * Pagina Privacy e cookie (/privacy). Il testo descrive i trattamenti che il
 * sito compie DAVVERO (ricavati dal codice: login, database, servizi esterni
 * contattati dal browser, banner di consenso) e gli strumenti di gestione usati
 * dal gestore. Se si aggiunge un servizio o cambia un trattamento, va
 * aggiornata qui e in data/titolare.js (data di revisione).
 */
export default function PrivacyView() {
  const { hash } = useLocation();
  // I collegamenti interni puntano a /privacy#consenso o #pubblicita: in una
  // single-page app il browser non scorre da solo fino all'ancora.
  useEffect(() => {
    if (hash) document.getElementById(hash.slice(1))?.scrollIntoView();
  }, [hash]);

  return (
    <main className="main main--historical privacy-view">
      <h1 className="privacy-view__titolo">Privacy e cookie</h1>
      <p className="privacy-view__aggiornata">Ultimo aggiornamento: {PRIVACY_AGGIORNATA_IL}</p>

      <GlassPanel className="privacy-view__pannello">
        <h2>Chi tratta i tuoi dati</h2>
        <p>
          Il titolare del trattamento è <Dato valore={TITOLARE.nome} cosa="nome e cognome o denominazione" />, gestore
          del sito {SITO.nome} (blog amatoriale indipendente sulla Formula 1). Per qualsiasi richiesta sui tuoi dati
          scrivi a <Dato valore={TITOLARE.email} cosa="indirizzo email di contatto" />.
        </p>
      </GlassPanel>

      <GlassPanel className="privacy-view__pannello">
        <h2>In breve</h2>
        <ul>
          <li>Puoi leggere tutto il sito senza account e senza accettare cookie.</li>
          <li>
            Statistiche (Google Analytics) e pubblicità personalizzata (Google AdSense) usano cookie <strong>solo se
            acconsenti</strong> nella finestra di consenso di Google.
          </li>
          <li>L&rsquo;account serve solo per i giochi: nome utente, punteggi e tempi compaiono nelle classifiche pubbliche.</li>
          <li>Non vendiamo dati e non installiamo cookie di profilazione nostri.</li>
        </ul>
      </GlassPanel>

      <GlassPanel className="privacy-view__pannello">
        <h2>Quali dati trattiamo e perché</h2>
        <h3>Navigazione</h3>
        <p>
          Come ogni sito, quando lo visiti i fornitori tecnici che lo ospitano (vedi «Sistemi e fornitori che usiamo»)
          registrano dati come indirizzo IP, browser e orario delle richieste. Servono a farlo funzionare e a
          proteggerlo da abusi (legittimo interesse). Noi non li usiamo per profilarti.
        </p>
        <h3>Account e giochi dell&rsquo;Arcade (facoltativi)</h3>
        <p>
          Puoi registrarti per giocare e salvare i punteggi. L&rsquo;accesso è gestito da Netlify Identity: indirizzo
          email e password restano presso Netlify. Nel nostro database salviamo un identificativo tecnico, il nome
          utente, l&rsquo;eventuale immagine profilo, il livello, la data di registrazione, i tuoi punteggi e i tempi
          di gioco, con i tempi di passaggio ai punti intermedi del circuito. Base giuridica: esecuzione del servizio che
          richiedi.
        </p>
        <p>
          <strong>Attenzione al nome utente:</strong> è quello che indichi in fase di registrazione oppure, in mancanza,
          la parte dell&rsquo;indirizzo email prima della «@». Nome utente, punteggi e tempi compaiono nelle classifiche
          pubbliche; le tue gare migliori possono essere usate come avversarie nelle gare di altri utenti, con il tuo
          nome sopra l&rsquo;auto. Se non vuoi che sia visibile una parte della tua email, indica un nome di fantasia.
        </p>
        <h3>Gare tra utenti in tempo reale</h3>
        <p>
          Se scegli una gara contro altri utenti collegati, durante la gara il nostro server riceve e inoltra agli altri
          partecipanti il tuo nome utente (o «Ospite» se non hai fatto l&rsquo;accesso), la livrea scelta e la tua
          posizione in pista. Questi dati restano solo nella memoria del server per la durata della gara e non vengono
          salvati; si salva soltanto il tuo tempo finale, come in ogni gara.
        </p>
        <h3>Dati nel tuo browser</h3>
        <p>
          Il sito salva nella memoria locale del tuo browser (non in cookie): il token della sessione di login, se
          accedi, che sparisce quando esci; la livrea scelta nel gioco. I cookie di Google Analytics e quelli
          pubblicitari si aggiungono solo con il tuo consenso (vedi sotto); la tua scelta sul consenso la conserva il
          sistema di Google.
        </p>
      </GlassPanel>

      <GlassPanel className="privacy-view__pannello" id="consenso">
        <h2>Come chiediamo il consenso</h2>
        <p>
          Per il consenso usiamo il sistema certificato di Google («Privacy e messaggi»), conforme allo standard europeo
          IAB TCF. Se ti colleghi dallo Spazio Economico Europeo o dal Regno Unito, alla prima visita compare la sua
          finestra: puoi <strong>accettare</strong>, <strong>rifiutare</strong> o scegliere finalità e fornitori uno per
          uno. Rifiutando puoi usare tutto il sito normalmente.
        </p>
        <ul>
          <li>
            <strong>Statistiche:</strong> senza consenso Google Analytics non viene nemmeno caricato.
          </li>
          <li>
            <strong>Pubblicità:</strong> senza consenso non vengono usati cookie né identificatori per la pubblicità; Google
            può comunque mostrare annunci limitati, non personalizzati.
          </li>
        </ul>
        <p>Puoi cambiare o ritirare la tua scelta quando vuoi, con la stessa facilità con cui l&rsquo;hai data:</p>
        <p>
          <GestisciConsenso />
        </p>
        <p>
          Fuori da Spazio Economico Europeo e Regno Unito al momento non mostriamo la finestra di consenso: le statistiche
          sono attive e gli annunci possono essere personalizzati. Puoi comunque gestire gli annunci personalizzati da{' '}
          <a href="https://adssettings.google.com" target="_blank" rel="noreferrer noopener">
            adssettings.google.com
          </a>{' '}
          e bloccare Google Analytics con il{' '}
          <a href="https://tools.google.com/dlpage/gaoptout" target="_blank" rel="noreferrer noopener">
            componente aggiuntivo di Google
          </a>
          .
        </p>
      </GlassPanel>

      <GlassPanel className="privacy-view__pannello" id="statistiche">
        <h2>Statistiche di visita (Google Analytics)</h2>
        <p>
          Con il tuo consenso usiamo Google Analytics 4 per capire come viene usato il sito: quali pagine si leggono,
          da che tipo di dispositivo, da quale paese o città approssimativa, e come si usano i giochi dell&rsquo;Arcade
          (per esempio sessioni iniziate, giri completati, gare concluse, ricerche di avversari). Servono a migliorare
          il sito, non a mostrarti pubblicità. Base giuridica: il tuo consenso.
        </p>
        <p>
          Google Analytics usa cookie propri (per esempio «_ga»), non conserva l&rsquo;indirizzo IP completo e tratta i
          dati per nostro conto secondo i suoi termini. Conserviamo i dati delle statistiche per 14 mesi. Maggiori
          informazioni su{' '}
          <a href="https://policies.google.com/technologies/partner-sites" target="_blank" rel="noreferrer noopener">
            policies.google.com/technologies/partner-sites
          </a>
          .
        </p>
      </GlassPanel>

      <GlassPanel className="privacy-view__pannello" id="pubblicita">
        <h2>Pubblicità (Google AdSense)</h2>
        <p>
          Il sito si sostiene con la pubblicità di Google AdSense. Con il tuo consenso, Google e i suoi partner possono
          usare cookie e identificatori sul tuo dispositivo per mostrare annunci, anche personalizzati in base ai tuoi
          interessi, misurarne l&rsquo;efficacia e prevenire frodi. L&rsquo;elenco dei partner e le finalità si vedono
          nella finestra di consenso.
        </p>
        <p>
          Puoi anche gestire gli annunci personalizzati da{' '}
          <a href="https://adssettings.google.com" target="_blank" rel="noreferrer noopener">
            adssettings.google.com
          </a>{' '}
          o scegliere i fornitori di pubblicità su{' '}
          <a href="https://www.youronlinechoices.com" target="_blank" rel="noreferrer noopener">
            youronlinechoices.com
          </a>
          .
        </p>
      </GlassPanel>

      <GlassPanel className="privacy-view__pannello">
        <h2>Sistemi e fornitori che usiamo</h2>
        <h3>Servizi che ricevono dati dei visitatori</h3>
        <ul>
          <Fornitore nome="Netlify">ospita il sito e gestisce il login (Netlify Identity).</Fornitore>
          <Fornitore nome="Render">ospita le API del sito, che leggono e scrivono nel database, e il server delle gare tra utenti.</Fornitore>
          <Fornitore nome="Neon">ospita il database (risultati storici, account, punteggi, tempi di gioco).</Fornitore>
        </ul>
        <h3>Pubblicità e servizi che il tuo browser contatta direttamente</h3>
        <p>
          Mentre navighi il tuo browser contatta questi servizi e il tuo indirizzo IP è visibile a loro. Ciascuno li
          tratta come titolare autonomo, secondo la propria informativa.
        </p>
        <ul>
          <Fornitore nome="Google AdSense">pubblicità e finestra di consenso (vedi sopra).</Fornitore>
          <Fornitore nome="Google Analytics">statistiche di visita, nell&rsquo;Unione Europea solo con il tuo consenso (vedi sopra).</Fornitore>
          <Fornitore nome="Google Fonts">caratteri grafici del sito.</Fornitore>
          <Fornitore nome="Wikimedia Commons">immagini di piloti e circuiti.</Fornitore>
          <Fornitore nome="OpenF1">programma dei weekend di gara.</Fornitore>
        </ul>
        <h3>Collegamenti a servizi esterni</h3>
        <ul>
          <Fornitore nome="Instagram (Meta)">
            il sito può rimandare al profilo Instagram del progetto tramite un semplice collegamento: cliccandolo
            lasci il sito e si applicano le regole di Meta. Il sito non incorpora contenuti di Instagram né strumenti di
            tracciamento di Meta.
          </Fornitore>
        </ul>
        <h3>Strumenti di gestione del sito</h3>
        <p>Servono al gestore per pubblicare e aggiornare il sito; non ricevono i dati di navigazione dei visitatori.</p>
        <ul>
          <Fornitore nome="GitHub">
            custodisce il codice del sito e le immagini degli articoli, ed esegue gli aggiornamenti automatici dei dati
            (GitHub Actions), che usano come fonti Jolpica-F1 e OpenF1.
          </Fornitore>
          <Fornitore nome="n8n">piattaforma di automazione dei flussi di lavoro usata dal gestore per attività del sito.</Fornitore>
        </ul>
        <p>
          Alcuni di questi fornitori hanno sede fuori dallo Spazio Economico Europeo (in particolare negli Stati Uniti)
          e trattano dati con le garanzie previste dal GDPR (ad esempio clausole contrattuali standard o decisioni di
          adeguatezza).
        </p>
      </GlassPanel>

      <GlassPanel className="privacy-view__pannello">
        <h2>Per quanto tempo e i tuoi diritti</h2>
        <p>
          I dati dell'account, i punteggi e i tempi di gioco restano finché mantieni l'account; puoi chiederne la
          cancellazione in qualsiasi momento. Le statistiche di Google Analytics si conservano per 14 mesi. I dati
          tecnici di navigazione sono conservati dai fornitori per i tempi previsti dalle loro politiche.
        </p>
        <p>
          Hai diritto di accedere ai tuoi dati, correggerli, cancellarli, limitarne il trattamento, riceverli in
          formato portabile, opporti al trattamento e revocare in ogni momento un consenso già dato (senza effetto sui
          trattamenti precedenti). Scrivi a <Dato valore={TITOLARE.email} cosa="indirizzo email di contatto" />. Se
          ritieni che i tuoi diritti non siano rispettati puoi presentare reclamo al{' '}
          <a href="https://www.garanteprivacy.it" target="_blank" rel="noreferrer noopener">
            Garante per la protezione dei dati personali
          </a>
          .
        </p>
        <p>Il sito non è rivolto ai minori di 14 anni.</p>
      </GlassPanel>
    </main>
  );
}
