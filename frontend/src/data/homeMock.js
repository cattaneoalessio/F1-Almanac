/**
 * homeMock.js — dati di ESEMPIO rimasti per la home: solo la sezione News,
 * la cui fonte non è ancora stata scelta (il thread Pirelli è in pausa per un
 * problema di accesso separato). Classifiche, calendario e prossima gara ora
 * usano dati veri (vedi hooks/useStagioneCorrente.js).
 *
 * Le card sono segnaposto dichiarati come tali (<PreviewBadge> in HomeView):
 * nessun titolo o notizia inventata viene presentata come reale.
 */

export const MOCK_NEWS = [
  {
    id: 'mock-1',
    titolo: 'Titolo di esempio: anteprima del weekend di gara',
    estratto:
      'Testo segnaposto: qui comparirà un estratto reale una volta scelta la fonte per la sezione News (da decidere insieme).',
    fonteLabel: 'Fonte da definire',
  },
  {
    id: 'mock-2',
    titolo: 'Titolo di esempio: aggiornamento tecnico',
    estratto: 'Testo segnaposto: seconda card di esempio per mostrare come si comporta la griglia con più notizie.',
    fonteLabel: 'Fonte da definire',
  },
  {
    id: 'mock-3',
    titolo: 'Titolo di esempio: analisi post-gara',
    estratto: 'Testo segnaposto: terza card di esempio, utile per verificare che il layout regga anche con testi di lunghezza diversa tra loro.',
    fonteLabel: 'Fonte da definire',
  },
];
