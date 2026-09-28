import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import GlassPanel from '../components/GlassPanel.jsx';
import GestisciConsenso from '../components/GestisciConsenso.jsx';
import { CONSENSO } from '../config/consenso.js';
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
  // Il collegamento «Informativa» del banner punta a /privacy#pubblicita: in una
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
        <h2>Quali dati trattiamo e perché</h2>
        <h3>Navigazione</h3>
        <p>
          Come ogni sito, quando lo visiti i fornitori tecnici che lo ospitano (vedi «Sistemi e fornitori che usiamo»)
          registrano dati come indirizzo IP, browser e orario delle richieste. Servono a farlo funzionare e a
          proteggerlo da abusi (legittimo interesse). Noi non li usiamo per profilarti.
        </p>
        <h3>Account e giochi Arcade (facoltativi)</h3>
        <p>
          Puoi registrarti per giocare e salvare i punteggi. L'accesso è gestito da Netlify Identity: l'indirizzo email
          e la password restano presso Netlify. Nel nostro database salviamo un identificativo tecnico, il nome utente,
          l'eventuale immagine profilo, il livello, la data di registrazione, i tuoi punteggi e i tempi di gioco (con i
          punti di passaggio della tua guida). Base giuridica: esecuzione del servizio che richiedi.
        </p>
        <p>
          <strong>Attenzione al nome utente:</strong> è quello che indichi in fase di registrazione oppure, in mancanza,
          la parte dell'indirizzo email prima della «@». Il nome utente e i punteggi compaiono nelle classifiche
          pubbliche dei giochi. Se non vuoi che sia visibile una parte della tua email, indica un nome di fantasia.
        </p>
        <h3>Dati nel tuo browser</h3>
        <p>
          Il sito salva nella memoria locale del tuo browser (non in cookie) due cose: il token della sessione di login,
          se accedi, che sparisce quando esci; e la scelta che fai nel banner dei cookie (vedi sotto). Il sito non
          installa cookie di profilazione propri.
        </p>
      </GlassPanel>

      <GlassPanel className="privacy-view__pannello" id="pubblicita">
        <h2>Pubblicità, cookie e consenso</h2>
        <p>
          Il sito usa Google AdSense per mostrare pubblicità. Google e i suoi partner possono usare cookie e
          identificatori sul tuo dispositivo per mostrare annunci, anche personalizzati in base ai tuoi interessi,
          misurarne l'efficacia e prevenire frodi.
        </p>
        <h3>Come chiediamo il consenso</h3>
        <p>
          Alla prima visita compare una finestra al centro dello schermo in cui scegli. Prima della tua scelta non
          vengono richiesti annunci.
        </p>
        <ul>
          <li>
            <strong>Europa e resto del mondo</strong> (modello «consenso preventivo»): puoi accettare, rifiutare o
            personalizzare. Gli annunci partono solo se accetti la pubblicità. <strong>Rifiutando puoi comunque usare
            tutto il sito</strong>: semplicemente non vedrai annunci.
          </li>
          <li>
            <strong>Stati Uniti</strong> (modello «opt-out»): puoi accettare oppure rifiutare la «vendita» o
            «condivisione» dei tuoi dati personali per la pubblicità mirata (California e altri stati con leggi
            analoghe). Se rifiuti vedrai annunci non personalizzati. Rispettiamo il segnale Global Privacy Control del
            browser come rifiuto.
          </li>
        </ul>
        <p>
          La regione è dedotta dal fuso orario impostato sul tuo dispositivo, non dalla tua posizione; nel dubbio
          applichiamo la regola più protettiva, quella europea. La tua scelta è salvata nel browser (voce «
          {CONSENSO.CHIAVE}») per {CONSENSO.DURATA_MESI} mesi, poi te la chiederemo di nuovo. Non viene inviata a
          server nostri.
        </p>
        <p>Puoi cambiare o revocare la scelta quando vuoi, con la stessa facilità con cui l'hai data:</p>
        <p>
          <GestisciConsenso />
        </p>
        <p>
          Puoi anche gestire gli annunci personalizzati da{' '}
          <a href="https://adssettings.google.com" target="_blank" rel="noreferrer noopener">
            adssettings.google.com
          </a>
          , leggere come Google usa i dati dei siti che usano i suoi servizi su{' '}
          <a href="https://policies.google.com/technologies/partner-sites" target="_blank" rel="noreferrer noopener">
            policies.google.com/technologies/partner-sites
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
          <Fornitore nome="Render">ospita le API del sito, che leggono e scrivono nel database.</Fornitore>
          <Fornitore nome="Neon">ospita il database (risultati storici, account, punteggi, tempi di gioco).</Fornitore>
        </ul>
        <h3>Pubblicità e servizi che il tuo browser contatta direttamente</h3>
        <p>
          Mentre navighi il tuo browser contatta questi servizi e il tuo indirizzo IP è visibile a loro. Ciascuno li
          tratta come titolare autonomo, secondo la propria informativa.
        </p>
        <ul>
          <Fornitore nome="Google AdSense">pubblicità (vedi sopra).</Fornitore>
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
            custodisce il codice del sito ed esegue gli aggiornamenti automatici dei dati (GitHub Actions), che usano
            come fonti Jolpica-F1, OpenF1 e il feed stampa di Pirelli.
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
          cancellazione in qualsiasi momento. I dati tecnici di navigazione sono conservati dai fornitori per i tempi
          previsti dalle loro politiche.
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
