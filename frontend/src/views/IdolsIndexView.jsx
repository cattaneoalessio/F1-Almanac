import { Link } from 'react-router-dom';
import './IdolsIndexView.css';

/**
 * IdolsIndexView (/idols) — vetrina editoriale dei piloti leggendari,
 * distinta dall'archivio storico dati (/piloti): qui l'obiettivo è
 * impatto visivo ed evocazione, non statistiche di carriera.
 *
 * PRIMO BLOCCO: Senna, Schumacher, Hamilton — nessuno dei tre è ancora
 * nel database (oggi importata solo la stagione 1950): le pagine
 * pilota esistenti (/piloti/:slug) andrebbero in errore per loro, per
 * questo Idols ha un routing proprio (/idols/:slug), indipendente
 * dall'archivio.
 *
 * FOTO: `immagine: null` per tutti e tre — PLACEHOLDER intenzionale.
 * Il progetto ha già un processo di verifica licenza file-per-file per
 * le immagini dei piloti (vedi il prompt "giro caschi": solo Wikimedia
 * Commons, licenza CC/pubblico dominio controllata singolarmente,
 * "meglio nessuna immagine che un'immagine sbagliata") — non va
 * bypassato prendendo foto a caso dal web. La card usa nel frattempo
 * un gradiente nei colori associati al pilota (`accentoDa`/`accentoA`,
 * variabili CSS): quando una foto verificata sarà disponibile, basta
 * valorizzare `immagine` con l'URL — il CSS la userà automaticamente
 * al posto del gradiente (vedi IdolsIndexView.css, .idols-card__sfondo).
 */
const IDOLI = [
  {
    slug: 'senna',
    nome: 'Ayrton Senna',
    payoff: 'Il misticismo della velocit\u00e0.',
    immagine: null,
    accentoDa: '#f6c90e',
    accentoA: '#1a1a1a',
  },
  {
    slug: 'schumacher',
    nome: 'Michael Schumacher',
    payoff: 'L\u2019algoritmo della vittoria.',
    immagine: null,
    accentoDa: '#8b0000',
    accentoA: '#1a1a1a',
  },
  {
    slug: 'hamilton',
    nome: 'Lewis Hamilton',
    payoff: 'L\u2019arte di riscrivere la storia.',
    immagine: null,
    accentoDa: '#00d2be',
    accentoA: '#1a1a1a',
  },
];

export default function IdolsIndexView() {
  return (
    <main className="main idols-view">
      <header className="idols-view__header">
        <h1 className="idols-view__titolo">
          I nostri <span className="idols-view__titolo-accento">Idols</span>
        </h1>
        <p className="idols-view__sottotitolo">
          I piloti che hanno ridefinito cosa significa essere veloci. Scegli una leggenda.
        </p>
      </header>

      <section className="idols-view__griglia" aria-label="Piloti leggendari">
        {IDOLI.map((idolo) => (
          <Link
            key={idolo.slug}
            to={`/idols/${idolo.slug}`}
            className="idols-card"
            style={{
              '--idolo-da': idolo.accentoDa,
              '--idolo-a': idolo.accentoA,
              ...(idolo.immagine ? { '--idolo-immagine': `url(${idolo.immagine})` } : {}),
            }}
          >
            <span className="idols-card__sfondo" aria-hidden="true" />
            <span className="idols-card__velo" aria-hidden="true" />
            <span className="idols-card__contenuto">
              <span className="idols-card__nome">{idolo.nome}</span>
              <span className="idols-card__payoff">{idolo.payoff}</span>
            </span>
          </Link>
        ))}
      </section>
    </main>
  );
}
