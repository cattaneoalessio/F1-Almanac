# Gestione contenuti: "In Primo Piano" e News

Pannello: **https://monoposto.io/admin/contenuti** (oppure: icona utente verde → "Gestione contenuti").

## Come funziona

- Ogni articolo ha: tipo (*In Primo Piano* o *News*), titolo, sottotitolo, immagine principale,
  galleria, testo con editor, stato (*bozza* / *pubblicato*) e data di pubblicazione.
- **In Primo Piano**: in home compare il più recente pubblicato. Quando ne pubblichi uno nuovo,
  il precedente passa **da solo** tra le News.
- **News**: pagina /news e box News in home, dalla più recente. Ogni articolo ha la sua pagina
  `monoposto.io/news/<indirizzo>`, inclusa automaticamente nella sitemap.
- **Data futura** = uscita programmata: l'articolo compare da solo a quell'ora.
- **Immagini**: compresse nel browser e salvate nel repository (`frontend/public/contenuti/`).
  Sono online dopo 1–2 minuti (il tempo dell'aggiornamento Netlify). Per pubblicare, ogni immagine
  deve avere descrizione e **credito** (autore/fonte e licenza): usa solo foto tue, generate da te
  con l'AI o con licenza libera. Mai foto prese da Google o da agenzie (F1, Getty, ecc.).

## Accesso: due passaggi

1. Login con il tuo account del sito (l'unico abilitato è l'email in `ADMIN_EMAIL`).
2. Codice a 6 cifre di Microsoft Authenticator. La sessione dura 8 ore (o finché chiudi il browser).
   Dopo 5 codici sbagliati il pannello si blocca per 15 minuti.

Se perdi il telefono: genera un nuovo segreto (vedi sotto, passo 2) e sostituisci `ADMIN_TOTP_SECRET`
su Render. Il vecchio smette subito di funzionare.

## Configurazione iniziale (una volta sola)

Render → servizio del backend → **Environment** → aggiungi:

1. `ADMIN_EMAIL` = l'email del tuo account del sito.
2. `ADMIN_TOTP_SECRET` = il segreto che la pagina /admin/contenuti mostra al primo accesso
   (insieme al codice QR da inquadrare con Microsoft Authenticator → + → Altro account).
3. `GITHUB_TOKEN_CONTENUTI` = token per salvare le immagini. Crealo su GitHub:
   Settings → Developer settings → Personal access tokens → **Fine-grained tokens** → Generate new token:
   - *Repository access*: **Only select repositories** → `F1-Almanac`;
   - *Permissions → Repository permissions → Contents*: **Read and write** (nient'altro);
   - *Expiration*: la più lunga che ti senti di gestire (es. 1 anno), e segnati la scadenza.
   Non incollarlo mai in chat: va solo su Render.

**Save changes**: Render riavvia il backend. Ricarica /admin/contenuti.

Il caricamento di un'immagine salva un commit con `[skip render]`: Netlify ripubblica il sito,
Render invece non riparte.
