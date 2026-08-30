"""
db.py — connessione al database, in un unico posto.

Uso psycopg2 con RealDictCursor (righe come dizionari, comode da
trasformare in JSON) invece di un ORM: per un'API con poche query ben
definite come questa, un ORM aggiungerebbe complessità senza reali
vantaggi. Se in futuro le query diventano molte e più dinamiche, vale
la pena valutare SQLAlchemy.
"""
import os

import psycopg2
import psycopg2.extras
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.environ.get("DATABASE_URL")


def get_connection():
    if not DATABASE_URL:
        raise RuntimeError(
            "Variabile DATABASE_URL non impostata. Copia .env.example in .env "
            "e inserisci i dati di accesso al tuo database."
        )
    return psycopg2.connect(DATABASE_URL, cursor_factory=psycopg2.extras.RealDictCursor)
