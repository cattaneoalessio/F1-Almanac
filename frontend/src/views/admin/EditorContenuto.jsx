import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { EditorContent, useEditor, useEditorState } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import '../ArticoloView.css';
import GlassPanel from '../../components/GlassPanel.jsx';
import { adminAggiorna, adminCaricaImmagine, adminCrea, adminDettaglio, adminElimina } from '../../api/contenuti.js';

const LATO_MASSIMO = 1920; // px: abbastanza per uno schermo grande, leggero da scaricare

/** Comprime un file immagine nel browser: WebP se disponibile, altrimenti JPEG. */
async function comprimi(file) {
  const bitmap = await createImageBitmap(file);
  const scala = Math.min(1, LATO_MASSIMO / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * scala);
  canvas.height = Math.round(bitmap.height * scala);
  canvas.getContext('2d').drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  const blob = (formato, qualita) => new Promise((ok) => canvas.toBlob(ok, formato, qualita));
  let risultato = await blob('image/webp', 0.82);
  if (!risultato || risultato.type !== 'image/webp') risultato = await blob('image/jpeg', 0.85);
  return risultato;
}

function inBase64(blob) {
  return new Promise((ok, ko) => {
    const lettore = new FileReader();
    lettore.onload = () => ok(String(lettore.result).split(',')[1]);
    lettore.onerror = ko;
    lettore.readAsDataURL(blob);
  });
}

/** "2026-10-01T14:30" (ora locale) <-> ISO */
function perInput(iso) {
  const d = iso ? new Date(iso) : new Date();
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}

const VUOTO = {
  tipo: 'news',
  titolo: '',
  sottotitolo: '',
  slug: '',
  immagine: null,
  galleria: [],
  corpo_html: '',
  stato: 'bozza',
  data_pubblicazione: null,
};

export default function EditorContenuto({ onScaduta, immaginiAttive }) {
  const { id } = useParams();
  const nuovo = !id;
  const naviga = useNavigate();
  const [dati, setDati] = useState(nuovo ? VUOTO : null);
  const [dataInput, setDataInput] = useState(perInput(null));
  const [anteprime, setAnteprime] = useState({}); // src pubblico -> URL locale, finché Netlify non ha pubblicato
  const [messaggio, setMessaggio] = useState(null);
  const [errore, setErrore] = useState(null);
  const [lavoro, setLavoro] = useState(null); // testo dell'operazione in corso
  const caricato = useRef(false);

  const editor = useEditor({
    extensions: [StarterKit.configure({ heading: { levels: [2, 3] }, link: { openOnClick: false, autolink: true }, code: false, codeBlock: false })],
    content: '',
    onUpdate: ({ editor: e }) => setDati((d) => (d ? { ...d, corpo_html: e.getHTML() } : d)),
  });

  useEffect(() => {
    if (nuovo || !editor) return;
    adminDettaglio(id)
      .then((d) => {
        if (!d) {
          setErrore('Articolo non trovato.');
          return;
        }
        setDati({ ...d, sottotitolo: d.sottotitolo || '' });
        setDataInput(perInput(d.data_pubblicazione));
        if (!caricato.current) {
          editor.commands.setContent(d.corpo_html || '', { emitUpdate: false });
          caricato.current = true;
        }
      })
      .catch((err) => (err.status === 401 ? onScaduta() : setErrore(err.message)));
  }, [id, nuovo, editor, onScaduta]);

  const imposta = (campo, valore) => setDati((d) => ({ ...d, [campo]: valore }));
  const vedi = (src) => anteprime[src] || src;

  async function carica(file) {
    const blob = await comprimi(file);
    const risposta = await adminCaricaImmagine(file.name, await inBase64(blob));
    setAnteprime((a) => ({ ...a, [risposta.src]: URL.createObjectURL(blob) }));
    return { src: risposta.src, alt: '', credito: '' };
  }

  async function caricaPrincipale(e) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setErrore(null);
    setLavoro('Compressione e caricamento immagine…');
    try {
      const img = await carica(file);
      imposta('immagine', { ...img, alt: dati.immagine?.alt || '', credito: dati.immagine?.credito || '' });
    } catch (err) {
      if (err.status === 401) onScaduta();
      else setErrore(err.message);
    } finally {
      setLavoro(null);
    }
  }

  async function caricaGalleria(e) {
    const files = Array.from(e.target.files || []);
    e.target.value = '';
    setErrore(null);
    for (const [i, file] of files.entries()) {
      setLavoro(`Caricamento foto ${i + 1} di ${files.length}…`);
      try {
        const img = await carica(file);
        setDati((d) => ({ ...d, galleria: [...d.galleria, img] }));
      } catch (err) {
        if (err.status === 401) {
          onScaduta();
          return;
        }
        setErrore(`${file.name}: ${err.message}`);
      }
    }
    setLavoro(null);
  }

  const aggiornaFoto = (i, campo, valore) =>
    setDati((d) => ({ ...d, galleria: d.galleria.map((f, j) => (j === i ? { ...f, [campo]: valore } : f)) }));
  const spostaFoto = (i, verso) =>
    setDati((d) => {
      const g = [...d.galleria];
      const j = i + verso;
      if (j < 0 || j >= g.length) return d;
      [g[i], g[j]] = [g[j], g[i]];
      return { ...d, galleria: g };
    });
  const togliFoto = (i) => setDati((d) => ({ ...d, galleria: d.galleria.filter((_, j) => j !== i) }));

  function controlla(statoFinale) {
    if (!dati.titolo.trim()) return 'Manca il titolo.';
    if (statoFinale !== 'pubblicato') return null;
    if (dati.tipo === 'primo_piano' && !dati.immagine) return "Il Primo Piano ha bisogno dell'immagine principale.";
    const immagini = [dati.immagine, ...dati.galleria].filter(Boolean);
    if (immagini.some((f) => !f.credito.trim()))
      return 'Ogni immagine pubblicata deve avere il credito (autore o fonte): serve a usarla in regola.';
    if (immagini.some((f) => !f.alt.trim())) return 'Ogni immagine deve avere una breve descrizione (testo alternativo).';
    return null;
  }

  async function salva(statoFinale) {
    const problema = controlla(statoFinale);
    if (problema) {
      setErrore(problema);
      return;
    }
    setErrore(null);
    setMessaggio(null);
    setLavoro('Salvataggio…');
    const corpo = {
      ...dati,
      stato: statoFinale,
      slug: dati.slug?.trim() || null,
      sottotitolo: dati.sottotitolo || null,
      data_pubblicazione: new Date(dataInput).toISOString(),
    };
    try {
      const r = nuovo ? await adminCrea(corpo) : await adminAggiorna(id, corpo);
      setDati({ ...r, sottotitolo: r.sottotitolo || '' });
      const futura = new Date(r.data_pubblicazione) > new Date();
      setMessaggio(
        statoFinale === 'bozza'
          ? 'Bozza salvata: non è visibile sul sito.'
          : futura
            ? `Programmato: comparirà sul sito il ${new Date(r.data_pubblicazione).toLocaleString('it-IT')}.`
            : 'Pubblicato. Le immagini appena caricate compaiono sul sito dopo 1–2 minuti (il tempo di aggiornare Netlify).',
      );
      if (nuovo) naviga(`/admin/contenuti/${r.id}`, { replace: true });
    } catch (err) {
      if (err.status === 401) onScaduta();
      else setErrore(err.message);
    } finally {
      setLavoro(null);
    }
  }

  async function elimina() {
    if (!window.confirm(`Eliminare definitivamente "${dati.titolo}"? Le immagini restano nel repository.`)) return;
    try {
      await adminElimina(id);
      naviga('/admin/contenuti');
    } catch (err) {
      if (err.status === 401) onScaduta();
      else setErrore(err.message);
    }
  }

  if (!dati) return <p className="historical-standings__stato">{errore || 'Caricamento…'}</p>;

  return (
    <div className="admin-c__editor">
      <p><Link to="/admin/contenuti">← Tutti gli articoli</Link></p>

      <GlassPanel className="admin-c__box">
        <div className="admin-c__griglia">
          <label>
            Dove compare
            <select value={dati.tipo} onChange={(e) => imposta('tipo', e.target.value)}>
              <option value="primo_piano">In Primo Piano (home) — poi passa alle News</option>
              <option value="news">News</option>
            </select>
          </label>
          <label>
            Data di pubblicazione
            <input type="datetime-local" value={dataInput} onChange={(e) => setDataInput(e.target.value)} />
            <small>Una data futura programma l'uscita.</small>
          </label>
        </div>
        <label>
          Titolo
          <input value={dati.titolo} maxLength={250} onChange={(e) => imposta('titolo', e.target.value)} />
        </label>
        <label>
          Sottotitolo
          <textarea rows={2} value={dati.sottotitolo} maxLength={600} onChange={(e) => imposta('sottotitolo', e.target.value)} />
        </label>
        <label>
          Indirizzo della pagina (facoltativo)
          <span className="admin-c__slug">monoposto.io/news/<input value={dati.slug || ''} placeholder="si ricava dal titolo" onChange={(e) => imposta('slug', e.target.value)} /></span>
          <small>Dopo la pubblicazione meglio non cambiarlo: i link già condivisi smetterebbero di funzionare.</small>
        </label>
      </GlassPanel>

      <GlassPanel className="admin-c__box">
        <h2 className="section-title">Immagine principale</h2>
        {dati.immagine ? (
          <SchedaFoto
            foto={dati.immagine}
            vedi={vedi}
            onCambia={(campo, v) => imposta('immagine', { ...dati.immagine, [campo]: v })}
            onTogli={() => imposta('immagine', null)}
          />
        ) : (
          <p className="admin-c__nota">Nessuna immagine.</p>
        )}
        <label className={`admin-c__btn admin-c__file ${immaginiAttive ? '' : 'admin-c__file--off'}`}>
          {dati.immagine ? 'Sostituisci immagine' : 'Scegli immagine'}
          <input type="file" accept="image/*" disabled={!immaginiAttive || Boolean(lavoro)} onChange={caricaPrincipale} />
        </label>
      </GlassPanel>

      <GlassPanel className="admin-c__box">
        <h2 className="section-title">Testo</h2>
        <BarraEditor editor={editor} />
        <EditorContent editor={editor} className="admin-c__testo articolo__corpo" />
      </GlassPanel>

      <GlassPanel className="admin-c__box">
        <h2 className="section-title">Galleria ({dati.galleria.length})</h2>
        {dati.galleria.map((foto, i) => (
          <SchedaFoto
            key={foto.src}
            foto={foto}
            vedi={vedi}
            onCambia={(campo, v) => aggiornaFoto(i, campo, v)}
            onTogli={() => togliFoto(i)}
            onSu={i > 0 ? () => spostaFoto(i, -1) : null}
            onGiu={i < dati.galleria.length - 1 ? () => spostaFoto(i, 1) : null}
          />
        ))}
        <label className={`admin-c__btn admin-c__file ${immaginiAttive ? '' : 'admin-c__file--off'}`}>
          Aggiungi foto (anche più di una)
          <input type="file" accept="image/*" multiple disabled={!immaginiAttive || Boolean(lavoro)} onChange={caricaGalleria} />
        </label>
      </GlassPanel>

      <div className="admin-c__barra-salva">
        {lavoro && <span className="admin-c__lavoro">{lavoro}</span>}
        {errore && <span className="admin-c__errore" role="alert">{errore}</span>}
        {messaggio && <span className="admin-c__ok" role="status">{messaggio}</span>}
        <div className="admin-c__bottoni">
          {!nuovo && <button type="button" className="admin-c__btn admin-c__btn--pericolo" onClick={elimina}>Elimina</button>}
          {!nuovo && dati.stato === 'pubblicato' && (
            <a className="admin-c__btn" href={`/news/${dati.slug}`} target="_blank" rel="noreferrer">Vedi sul sito ↗</a>
          )}
          <button type="button" className="admin-c__btn" disabled={Boolean(lavoro)} onClick={() => salva('bozza')}>
            {dati.stato === 'pubblicato' ? 'Riporta in bozza' : 'Salva bozza'}
          </button>
          <button type="button" className="admin-c__btn admin-c__btn--primario" disabled={Boolean(lavoro)} onClick={() => salva('pubblicato')}>
            {dati.stato === 'pubblicato' ? 'Aggiorna' : 'Pubblica'}
          </button>
        </div>
      </div>
    </div>
  );
}

function SchedaFoto({ foto, vedi, onCambia, onTogli, onSu, onGiu }) {
  return (
    <div className="admin-c__foto">
      <img src={vedi(foto.src)} alt="" />
      <div className="admin-c__foto-campi">
        <input placeholder="Descrizione (cosa si vede)" value={foto.alt} maxLength={300} onChange={(e) => onCambia('alt', e.target.value)} />
        <input placeholder="Credito: autore o fonte, licenza (es. Foto di Mario Rossi, CC BY 4.0)" value={foto.credito} maxLength={300} onChange={(e) => onCambia('credito', e.target.value)} />
        <div className="admin-c__foto-azioni">
          {onSu && <button type="button" onClick={onSu} aria-label="Sposta su">↑</button>}
          {onGiu && <button type="button" onClick={onGiu} aria-label="Sposta giù">↓</button>}
          <button type="button" onClick={onTogli}>Togli</button>
        </div>
      </div>
    </div>
  );
}

function B({ attivo, onClick, children, titolo }) {
  // onMouseDown: evita che il clic tolga il cursore dal testo prima del comando.
  return (
    <button type="button" title={titolo} aria-label={titolo} className={attivo ? 'attivo' : ''} onMouseDown={(e) => e.preventDefault()} onClick={onClick}>
      {children}
    </button>
  );
}

function BarraEditor({ editor }) {
  const s = useEditorState({
    editor,
    selector: ({ editor: e }) =>
      e
        ? {
            bold: e.isActive('bold'),
            italic: e.isActive('italic'),
            underline: e.isActive('underline'),
            h2: e.isActive('heading', { level: 2 }),
            h3: e.isActive('heading', { level: 3 }),
            ul: e.isActive('bulletList'),
            ol: e.isActive('orderedList'),
            quote: e.isActive('blockquote'),
            link: e.isActive('link'),
          }
        : {},
  });
  if (!editor) return null;
  const c = () => editor.chain().focus();
  function link() {
    const attuale = editor.getAttributes('link').href || '';
    const href = window.prompt('Indirizzo del link (vuoto per toglierlo)', attuale || 'https://');
    if (href === null) return;
    if (!href.trim() || href.trim() === 'https://') c().extendMarkRange('link').unsetLink().run();
    else c().extendMarkRange('link').setLink({ href: href.trim() }).run();
  }
  return (
    <div className="admin-c__barra-editor" role="toolbar" aria-label="Formattazione testo">
      <B titolo="Grassetto" attivo={s?.bold} onClick={() => c().toggleBold().run()}><strong>G</strong></B>
      <B titolo="Corsivo" attivo={s?.italic} onClick={() => c().toggleItalic().run()}><em>C</em></B>
      <B titolo="Sottolineato" attivo={s?.underline} onClick={() => c().toggleUnderline().run()}><u>S</u></B>
      <B titolo="Titoletto" attivo={s?.h2} onClick={() => c().toggleHeading({ level: 2 }).run()}>H2</B>
      <B titolo="Titoletto minore" attivo={s?.h3} onClick={() => c().toggleHeading({ level: 3 }).run()}>H3</B>
      <B titolo="Elenco puntato" attivo={s?.ul} onClick={() => c().toggleBulletList().run()}>• Elenco</B>
      <B titolo="Elenco numerato" attivo={s?.ol} onClick={() => c().toggleOrderedList().run()}>1. Elenco</B>
      <B titolo="Citazione" attivo={s?.quote} onClick={() => c().toggleBlockquote().run()}>“ Citazione</B>
      <B titolo="Link" attivo={s?.link} onClick={link}>Link</B>
      <B titolo="Linea divisoria" onClick={() => c().setHorizontalRule().run()}>―</B>
      <B titolo="Annulla" onClick={() => c().undo().run()}>↶</B>
      <B titolo="Ripeti" onClick={() => c().redo().run()}>↷</B>
    </div>
  );
}
