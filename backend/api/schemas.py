"""
schemas.py — le forme dei dati che l'API restituisce (Pydantic).

Definirle qui invece che inline in main.py serve a due cose: FastAPI le
usa per generare la documentazione automatica (/docs), e chi consuma
l'API (il frontend React) sa esattamente cosa aspettarsi in risposta.
"""
from datetime import date
from typing import Optional

from pydantic import BaseModel


class RisultatoPilota(BaseModel):
    posizione: Optional[int] = None
    posizione_testo: Optional[str] = None  # es. "Rit.", usato quando `posizione` è nullo
    pilota: str
    pilota_slug: str
    costruttore: str
    giri_completati: Optional[int] = None
    tempo: Optional[str] = None  # tempo totale (solo il vincitore) o distacco, già pronto da mostrare
    stato: Optional[str] = None  # codice: FINISHED, RETIRED, ACCIDENT, ENGINE, DSQ, NOT_CLASSIFIED
    motivo_ritiro: Optional[str] = None
    punti: float = 0


class RisultatiGara(BaseModel):
    anno: int
    circuito: str
    nome_gp: str
    data_gara: Optional[date] = None
    commento: Optional[str] = None  # breve commento editoriale, None finché non scritto a mano
    risultati: list[RisultatoPilota]
    risultati_sprint: list[RisultatoPilota] = []  # vuoto per i GP senza Sprint Race (la maggioranza)


class VoceClassificaPiloti(BaseModel):
    pilota: str
    pilota_slug: str
    nazione_codice: Optional[str] = None  # ISO2, es. "IT" — per la bandierina nel frontend
    punti_totali: float
    vittorie: int
    gare_disputate: int


class VoceClassificaScuderie(BaseModel):
    """Riga della classifica scuderie di una stagione (/classifica/scuderie).

    Punteggio "a somma": si sommano i punti di TUTTI i piloti schierati
    dalla scuderia in ogni gara, non solo il migliore. Nel 1950 non
    esisteva ancora un Mondiale Costruttori ufficiale (introdotto nel
    1958): questo è quindi un criterio nostro, scelto per coerenza con
    lo stesso criterio "a somma" già usato in /classifica/piloti, non
    una classifica storica realmente esistita."""
    scuderia: str
    scuderia_slug: str
    nazione_codice: Optional[str] = None
    punti_totali: float
    vittorie: int
    gare_disputate: int


class RisultatoStoricoPilota(BaseModel):
    anno: int
    nome_gp: str
    circuito: str  # codice_riferimento del circuito, per linkare alla pagina della gara
    costruttore: str
    posizione: Optional[int] = None
    posizione_testo: Optional[str] = None
    punti: float = 0


class GaraStagione(BaseModel):
    nome_gp: str
    circuito: str  # codice_riferimento, da usare nell'URL della pagina gara
    data_gara: Optional[date] = None
    ha_sprint: bool = False  # True se questo weekend ha avuto/avrà anche una Sprint Race


class SchedaPilota(BaseModel):
    pilota: str
    pilota_slug: str
    nazione_codice: Optional[str] = None
    data_nascita: Optional[date] = None
    data_morte: Optional[date] = None
    url_wikipedia: Optional[str] = None
    biografia: Optional[str] = None
    curiosita: Optional[str] = None
    fonti_sufficienti: bool = False
    ultima_scuderia: Optional[str] = None  # per colorare l'avatar/casco con l'ultima scuderia
    punti_totali_carriera: float
    vittorie_totali: int
    gare_totali: int
    risultati: list[RisultatoStoricoPilota]


class VoceCircuito(BaseModel):
    """Riga dell'indice /circuiti (elenco, non il dettaglio)."""
    nome: str
    slug: str
    nazione_codice: Optional[str] = None
    nazione_nome: Optional[str] = None  # nome esteso della nazione, per la ricerca lato frontend
    localita: Optional[str] = None


class CurvaCircuito(BaseModel):
    """Una curva o un rettilineo del tracciato, in ordine. nome_moderno
    può essere nullo se il tratto esisteva SOLO nella configurazione
    storica ed è stato eliminato dal tracciato attuale; nome_1950 è
    valorizzato solo se il nome nel 1950 era diverso (o assente) rispetto
    a quello moderno."""
    ordine: int
    tipo: str  # 'curva' | 'rettilineo'
    nome_moderno: Optional[str] = None
    nome_1950: Optional[str] = None
    anno_intitolazione: Optional[int] = None  # anno del nome moderno, se assegnato dopo il 1950
    nota: Optional[str] = None


class ConfigurazioneCircuito(BaseModel):
    """Una versione del tracciato nel tempo (lunghezza/layout cambiati)."""
    anno_da: int
    anno_a: Optional[int] = None  # None = tuttora in uso (o ultima nota)
    lunghezza_km: Optional[float] = None
    descrizione: str


class GaraCircuito(BaseModel):
    anno: int
    nome_gp: str
    data_gara: Optional[date] = None
    vincitore: Optional[str] = None
    vincitore_slug: Optional[str] = None


class VoceAlboOro(BaseModel):
    pilota: str
    pilota_slug: str
    nazione_codice: Optional[str] = None
    vittorie: int


class SchedaCircuito(BaseModel):
    nome: str
    slug: str
    localita: Optional[str] = None
    nazione_codice: Optional[str] = None
    lunghezza_km: Optional[float] = None
    indirizzo: Optional[str] = None
    capienza: Optional[int] = None
    google_maps_url: Optional[str] = None
    storia: Optional[str] = None
    curve: list[CurvaCircuito] = []
    configurazioni: list[ConfigurazioneCircuito] = []
    gare: list[GaraCircuito]
    albo_oro: list[VoceAlboOro]


class VoceIndicePiloti(BaseModel):
    """Riga dell'indice /piloti (elenco di tutti i piloti presenti nel
    database, con i totali di carriera, non il dettaglio della scheda)."""
    pilota: str
    slug: str
    nazione_codice: Optional[str] = None
    ultima_scuderia: Optional[str] = None  # per colorare l'avatar/casco con l'ultima scuderia
    punti_totali_carriera: float
    vittorie_totali: int
    gare_totali: int


class VoceScuderia(BaseModel):
    """Riga dell'indice /scuderie (elenco, non il dettaglio)."""
    nome: str
    slug: str
    nazione_codice: Optional[str] = None


class GaraScuderia(BaseModel):
    """Una gara disputata da una scuderia, con il suo miglior risultato
    in quella gara (può avere più piloti: si mostra il migliore)."""
    anno: int
    nome_gp: str
    circuito: str  # codice_riferimento, per linkare alla pagina della gara
    data_gara: Optional[date] = None
    miglior_pilota: Optional[str] = None
    miglior_pilota_slug: Optional[str] = None
    miglior_posizione: Optional[int] = None
    miglior_posizione_testo: Optional[str] = None


class VocePilotaScuderia(BaseModel):
    """Un pilota che ha corso per questa scuderia, con i suoi totali
    (solo per il periodo passato in questa scuderia, non di carriera)."""
    pilota: str
    pilota_slug: str
    nazione_codice: Optional[str] = None
    gare: int
    vittorie: int
    punti: float


class SchedaScuderia(BaseModel):
    nome: str
    slug: str
    nazione_codice: Optional[str] = None
    punti_totali: float
    vittorie_totali: int
    gare_totali: int
    gare: list[GaraScuderia]
    piloti: list[VocePilotaScuderia]
