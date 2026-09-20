import './Pagination.css';

/**
 * <Pagination pagina={pagina} totalePagine={totalePagine} onCambiaPagina={setPagina} />
 *
 * Controllo di paginazione riutilizzato in tutte le tabelle del sito
 * (piazzamenti, vittorie, gare di un circuito, ...). Non si
 * autonasconde quando c'è una sola pagina: chi lo usa decide se
 * mostrarlo controllando `haRigheMultiplePagine` da usePagination,
 * per non appesantire il markup quando non serve.
 */
export default function Pagination({ pagina, totalePagine, onCambiaPagina }) {
  if (totalePagine <= 1) return null;

  return (
    <nav className="pagination" aria-label="Paginazione tabella">
      <button
        type="button"
        className="pagination__btn"
        onClick={() => onCambiaPagina(pagina - 1)}
        disabled={pagina <= 1}
      >
        ← Precedente
      </button>
      <span className="pagination__indicatore">
        Pagina {pagina} di {totalePagine}
      </span>
      <button
        type="button"
        className="pagination__btn"
        onClick={() => onCambiaPagina(pagina + 1)}
        disabled={pagina >= totalePagine}
      >
        Successiva →
      </button>
    </nav>
  );
}
