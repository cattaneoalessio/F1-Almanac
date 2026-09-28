/**
 * stagione.js — logica pura (senza React) per la home: distacchi in
 * classifica, ordine del calendario, scelta della prossima gara e
 * programma del weekend. Separata dalla vista per poterla provare da sola.
 */

const MS_GIORNO = 24 * 60 * 60 * 1000;

/** "2026-10-11" -> mezzanotte LOCALE di quel giorno (new Date("2026-10-11")
 * sarebbe mezzanotte UTC e, nei fusi a est di Greenwich, cadrebbe già "oggi"). */
function dataLocale(iso) {
  const [anno, mese, giorno] = String(iso).slice(0, 10).split('-').map(Number);
  return new Date(anno, mese - 1, giorno);
}

/** Giorni da oggi alla data indicata: 0 = oggi, 3 = tra tre giorni,
 * negativo = già passata. null se manca la data. */
export function giorniAllaGara(dataIso, adesso = new Date()) {
  if (!dataIso) return null;
  const oggi = new Date(adesso.getFullYear(), adesso.getMonth(), adesso.getDate());
  return Math.round((dataLocale(dataIso) - oggi) / MS_GIORNO);
}

export function testoQuandoGara(giorni) {
  if (giorni === null) return '';
  if (giorni === 0) return 'Oggi';
  if (giorni === 1) return 'Domani';
  if (giorni > 1) return `Tra ${giorni} giorni`;
  return '';
}

const FORMATO_DATA_LUNGA = new Intl.DateTimeFormat('it-IT', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});
const FORMATO_DATA_BREVE = new Intl.DateTimeFormat('it-IT', { day: 'numeric', month: 'short' });

export function formattaDataLunga(dataIso) {
  return dataIso ? FORMATO_DATA_LUNGA.format(dataLocale(dataIso)) : '';
}
export function formattaDataBreve(dataIso) {
  return dataIso ? FORMATO_DATA_BREVE.format(dataLocale(dataIso)) : '';
}

/** Punti come nell'archivio: 25 -> "25", 12.5 -> "12.5". */
export function formattaPunti(punti) {
  return String(Number(punti));
}

/**
 * Per ogni riga della classifica, i punti di vantaggio sul classificato
 * SUBITO DOPO (null per l'ultimo, che non ha un successivo). Rispetta
 * l'ordine restituito dal backend (che applica già i suoi spareggi).
 */
export function vantaggiSulSuccessivo(righe) {
  return righe.map((riga, i) => {
    const successivo = righe[i + 1];
    return successivo ? Math.max(0, riga.punti_totali - successivo.punti_totali) : null;
  });
}

/**
 * Calendario della stagione: numera i round per data e lo divide in
 * "prossime" (da oggi in avanti, la più vicina per prima) e "disputate"
 * (dalla più recente alla più vecchia, così le più vecchie stanno in fondo).
 */
export function ordinaCalendario(gare, adesso = new Date()) {
  const perData = [...gare].sort((a, b) => {
    if (!a.data_gara) return 1;
    if (!b.data_gara) return -1;
    return a.data_gara.localeCompare(b.data_gara);
  });
  const conRound = perData.map((gara, i) => ({
    ...gara,
    round: i + 1,
    giorni: giorniAllaGara(gara.data_gara, adesso),
  }));
  return {
    prossime: conRound.filter((g) => g.giorni !== null && g.giorni >= 0),
    disputate: conRound.filter((g) => g.giorni !== null && g.giorni < 0).reverse(),
  };
}

// ---- programma del weekend (da OpenF1) ----

const NOMI_SESSIONI = {
  'Practice 1': 'Prove libere 1',
  'Practice 2': 'Prove libere 2',
  'Practice 3': 'Prove libere 3',
  'Sprint Qualifying': 'Qualifiche Sprint',
  'Sprint Shootout': 'Qualifiche Sprint',
  Sprint: 'Sprint',
  Qualifying: 'Qualifiche',
  Race: 'Gara',
};

/** Il "meeting" OpenF1 (weekend di gara) che contiene la data della gara.
 * ±1 giorno di tolleranza: la data del calendario è locale, quelle OpenF1 UTC. */
export function trovaMeeting(meetings, dataGaraIso) {
  const gara = dataLocale(dataGaraIso).getTime() + 12 * 60 * 60 * 1000;
  const candidati = (meetings || []).filter((m) => {
    if (m.is_cancelled || !m.date_start || !m.date_end) return false;
    return gara >= Date.parse(m.date_start) - MS_GIORNO && gara <= Date.parse(m.date_end) + MS_GIORNO;
  });
  return candidati[0] || null;
}

/** Sessioni in ordine cronologico, con nome italiano e istante di inizio. */
export function ordinaSessioni(sessioni) {
  return (sessioni || [])
    .filter((s) => s.date_start && !s.is_cancelled)
    .map((s) => ({
      chiave: s.session_key,
      nome: NOMI_SESSIONI[s.session_name] || s.session_name,
      inizio: new Date(s.date_start),
    }))
    .sort((a, b) => a.inizio - b.inizio);
}

/**
 * Fatti sul circuito ricavati dalla scheda del database: solo ciò che c'è
 * davvero (edizioni con un vincitore registrato, albo d'oro, lunghezza).
 */
export function riepilogoCircuito(scheda) {
  const disputate = (scheda.gare || []).filter((g) => g.vincitore);
  const ultima =
    [...disputate].sort((a, b) => (b.data_gara || '').localeCompare(a.data_gara || '') || b.anno - a.anno)[0] || null;
  const configurazioneAttuale = (scheda.configurazioni || []).find((c) => c.anno_a === null || c.anno_a === undefined);
  const curve = (scheda.curve || []).filter((c) => c.tipo === 'curva').length;
  const record = [...(scheda.albo_oro || [])].sort((a, b) => b.vittorie - a.vittorie)[0] || null;
  return {
    edizioni: disputate.length,
    primaEdizione: disputate.length ? Math.min(...disputate.map((g) => g.anno)) : null,
    ultima,
    lunghezzaKm: scheda.lunghezza_km ?? configurazioneAttuale?.lunghezza_km ?? null,
    curve: curve || null,
    record,
  };
}
