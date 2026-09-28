import GlassPanel from '../components/GlassPanel.jsx';
import GestisciConsenso from '../components/GestisciConsenso.jsx';
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

/**
 * Pagina Privacy e cookie (/privacy). Il testo descrive i trattamenti che il
 * sito compie DAVVERO (ricavati dal codice: login, database, servizi esterni
 * contattati dal browser). Se si aggiunge un servizio o cambia un trattamento,
 * va aggiornata qui e in data/titolare.js (data di revisione).
 */
export default function PrivacyView() {
  return (
    <main className="main main--historical privacy-view">
      <h1 className="privacy-view__titolo">Privacy e cookie</h1>
      <p className="privacy-view__aggiornata">Ultimo aggiornamento: {PRIVACY_AGGIORNATA_IL}</p>

      <GlassPanel className="privacy-view__pannello">
        <h2>Chi tratta i tuoi dati</h2>
        <p>
          Il titolare del trattamento è <Dato valore={TITOLARE.nome} cosa="nome e cognome o denominazione" />, gestore
          del sito Monoposto.ai (blog amatoriale indipendente sulla Formula 1). Per qualsiasi richiesta sui tuoi dati
          scrivi a <Dato valore={TITOLARE.email} cosa="indirizzo email di contatto" />.
        </p>
      </GlassPanel>

      <GlassPanel className="privacy-view__pannello">
        <h2>Quali dati trattiamo e perché</h2>
        <h3>Navigazione</h3>
        <p>
          Come ogni sito, quando lo visiti i fornitori tecnici che lo ospitano (vedi «Con chi condividiamo i dati»)
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
          Se accedi, il browser conserva il token della sessione di login (nella memoria locale del browser, non in un
          cookie): serve solo a mantenerti collegato e sparisce quando esci. Il sito non installa cookie di
          profilazione propri.
        </p>
      </GlassPanel>

      <GlassPanel className="privacy-view__pannello" id="pubblicita">
        <h2>Pubblicità e cookie di terze parti</h2>
        <p>
          Il sito usa Google AdSense per mostrare pubblicità. Google e i suoi partner possono usare cookie e
          identificatori sul tuo dispositivo per mostrare annunci, anche personalizzati in base ai tuoi interessi,
          misurarne l'efficacia e prevenire frodi. Per gli utenti nello Spazio Economico Europeo, nel Regno Unito e in
          Svizzera, questo avviene solo dopo il tuo consenso, che puoi dare, rifiutare o cambiare in qualsiasi momento:
        </p>
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
        <h2>Con chi condividiamo i dati</h2>
        <ul>
          <li>
            <strong>Netlify</strong> — ospita il sito e gestisce il login (Netlify Identity).
          </li>
          <li>
            <strong>Render</strong> — ospita le API del sito, che leggono e scrivono nel database.
          </li>
          <li>
            <strong>Neon</strong> — ospita il database (risultati storici, account, punteggi).
          </li>
          <li>
            <strong>Google</strong> — pubblicità (AdSense) e caricamento dei caratteri grafici (Google Fonts).
          </li>
        </ul>
        <p>
          Inoltre, mentre navighi, il tuo browser contatta direttamente altri servizi e il tuo indirizzo IP è
          visibile a loro: <strong>Wikimedia Commons</strong> (immagini di piloti e circuiti),{' '}
          <strong>OpenF1</strong> (dati e programma delle gare) e <strong>Google Fonts</strong>. Ciascuno li tratta
          come titolare autonomo secondo la propria informativa.
        </p>
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
