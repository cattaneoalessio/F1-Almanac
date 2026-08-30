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
    risultati: list[RisultatoPilota]


class VoceClassificaPiloti(BaseModel):
    pilota: str
    pilota_slug: str
    nazione_codice: Optional[str] = None  # ISO2, es. "IT" — per la bandierina nel frontend
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


class SchedaPilota(BaseModel):
    pilota: str
    pilota_slug: str
    nazione_codice: Optional[str] = None
    punti_totali_carriera: float
    vittorie_totali: int
    gare_totali: int
    risultati: list[RisultatoStoricoPilota]


class VoceCircuito(BaseModel):
    """Riga dell'indice /circuiti (elenco, non il dettaglio)."""
    nome: str
    slug: str
    nazione_codice: Optional[str] = None
    localita: Optional[str] = None


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
    gare: list[GaraCircuito]
    albo_oro: list[VoceAlboOro]


class VoceIndicePiloti(BaseModel):
    """Riga dell'indice /piloti (elenco di tutti i piloti presenti nel
    database, con i totali di carriera, non il dettaglio della scheda)."""
    pilota: str
    slug: str
    nazione_codice: Optional[str] = None
    punti_totali_carriera: float
    vittorie_totali: int
    gare_totali: int
