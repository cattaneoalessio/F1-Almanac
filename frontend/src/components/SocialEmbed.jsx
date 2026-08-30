import './SocialEmbed.css';

/**
 * <SocialEmbed> — wrapper responsive per un embed di terzi (iframe di
 * YouTube/X/Instagram, o il <blockquote> che quelle piattaforme
 * generano per i loro embed ufficiali).
 *
 * Esempi d'uso:
 *
 *   // YouTube (un vero iframe, va sempre 16:9)
 *   <SocialEmbed variant="video">
 *     <iframe
 *       src="https://www.youtube.com/embed/VIDEO_ID"
 *       title="Titolo del video"
 *       allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
 *       allowFullScreen
 *     />
 *   </SocialEmbed>
 *
 *   // Instagram (usa l'<blockquote class="instagram-media"> generato da
 *   // instagram.com/embed.js, che gestisce da solo l'altezza reale)
 *   <SocialEmbed>
 *     <blockquote className="instagram-media" data-instgrm-permalink={url} />
 *   </SocialEmbed>
 *
 *   // X/Twitter (blockquote generato da platform.twitter.com/widgets.js)
 *   <SocialEmbed>
 *     <blockquote className="twitter-tweet"><a href={url}>{url}</a></blockquote>
 *   </SocialEmbed>
 *
 * Nota: per Instagram e X serve comunque caricare UNA VOLTA per pagina
 * lo script ufficiale della piattaforma (embed.js / widgets.js) perché
 * trasformi il <blockquote> nell'embed vero e proprio: questo componente
 * si occupa solo del contenitore responsive, non dello script esterno.
 */
export default function SocialEmbed({ variant, children }) {
  const classi = ['social-embed-container', variant === 'video' ? 'social-embed-container--video' : '']
    .filter(Boolean)
    .join(' ');

  return <div className={classi}>{children}</div>;
}
