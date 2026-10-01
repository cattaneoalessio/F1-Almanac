import DOMPurify from 'dompurify';

/** HTML dell'articolo ripulito prima di inserirlo nella pagina: anche se lo
 * scrive solo l'amministratore, un copia-incolla da un altro sito potrebbe
 * portarsi dietro script o attributi pericolosi. I link esterni si aprono in
 * una nuova scheda. */
export function htmlSicuro(html) {
  const pulito = DOMPurify.sanitize(html || '', {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'b', 'em', 'i', 'u', 's', 'a', 'h2', 'h3', 'ul', 'ol', 'li', 'blockquote', 'hr', 'code'],
    ALLOWED_ATTR: ['href'],
  });
  const contenitore = document.createElement('div');
  contenitore.innerHTML = pulito;
  contenitore.querySelectorAll('a[href]').forEach((a) => {
    if (/^https?:\/\//i.test(a.getAttribute('href'))) {
      a.setAttribute('target', '_blank');
      a.setAttribute('rel', 'noopener noreferrer');
    }
  });
  return contenitore.innerHTML;
}

const FORMATO_DATA = new Intl.DateTimeFormat('it-IT', { day: 'numeric', month: 'long', year: 'numeric' });
export function dataLeggibile(iso) {
  const d = iso ? new Date(iso) : null;
  return d && !Number.isNaN(d.getTime()) ? FORMATO_DATA.format(d) : '';
}
