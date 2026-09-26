import './SiteFooter.css';

/**
 * <SiteFooter /> — disclaimer legale fisso in fondo a OGNI pagina.
 *
 * Va montato una sola volta, fuori da <Routes> (in App.jsx), così compare
 * su tutte le rotte senza doverlo ripetere in ogni vista. Il testo è
 * quello concordato, da non riformulare: chiarisce che il sito è un
 * blog amatoriale indipendente non affiliato a FOM/FIA/scuderie, a
 * tutela sia di chi lo pubblica sia dei marchi citati (piloti, scuderie,
 * loghi), usati solo a scopo descrittivo/informativo.
 */
export default function SiteFooter() {
  const anno = new Date().getFullYear();
  return (
    <footer className="site-footer">
      <p className="site-footer__disclaimer">
        <strong>Disclaimer:</strong> Questo sito è un blog amatoriale indipendente, non è affiliato,
        sponsorizzato o approvato dal gruppo Formula One Management (FOM), dalla FIA o da alcuna
        scuderia del campionato mondiale di Formula 1. Tutti i marchi, i nomi di scuderie, i loghi e i
        nomi dei piloti citati appartengono ai rispettivi proprietari e vengono utilizzati esclusivamente
        a scopo descrittivo e informativo.
      </p>
      <p className="site-footer__copyright">&copy; {anno} Monoposto.ai. Logo e contenuti del sito, tutti i diritti riservati.</p>
    </footer>
  );
}
