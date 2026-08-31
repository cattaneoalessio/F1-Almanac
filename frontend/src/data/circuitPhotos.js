/**
 * circuitPhotos.js — foto storiche/mappe di dominio pubblico o Creative
 * Commons per le schede circuito, con l'attribuzione già pronta.
 *
 * Ogni voce è stata verificata dall'utente su Wikimedia Commons (autore,
 * pagina del file, link diretto, licenza) e non è stata controllata di
 * nuovo da Claude in questa sessione: i domini Wikimedia risultano
 * bloccati per il fetch da questo ambiente di lavoro (verificato, non solo
 * ipotizzato). "src" punta a un indirizzo Special:Redirect/file/... su
 * commons.wikimedia.org, che a sua volta reindirizza al file vero e
 * proprio: funziona come hotlink diretto in un tag <img>, senza bisogno di
 * scaricare o rihostare l'immagine sul nostro server.
 *
 * SLUG: i 7 circuiti della stagione 1950 (bremgarten, indianapolis,
 * monaco, monza, reims, silverstone, spa) hanno uno slug verificato
 * direttamente contro il database reale (vedi
 * db/patch_contenuti_piloti_circuiti_1950.sql). Tutti gli altri sono
 * stati confrontati — PRIMA di lanciare l'import delle stagioni
 * 1951-1970, non dopo — con l'elenco reale e completo dei 78 circuiti di
 * Jolpica (GET /ergast/f1/circuits.json): 76 su 78 combaciano già con lo
 * slug che verrà creato dall'import (vedi
 * backend/import_stagioni_jolpica.py, MAPPA_CIRCUITI, e
 * confronto_slug_circuiti.md per il dettaglio). Le uniche 2 eccezioni
 * (lemans, losail) sono state aggiunte dopo, con foto fornite
 * dall'utente apposta per coprire il buco. Le foto per circuiti
 * pre-1950/non-campionato che Jolpica non traccia (Albi, Bugatti Circuit
 * "generico", Hanoi, Igora Drive, Monza anello alta velocità,
 * Ospedaletti, Pergusa, Siracusa) sono state rimosse su richiesta
 * esplicita dell'utente: non serviranno.
 */
export const CIRCUIT_PHOTOS = {
  "adelaide": [
    {
      src: "https://commons.wikimedia.org/wiki/Special:Redirect/file/Adelaide_(long_route).svg",
      alt: "Mappa del tracciato: Circuito di Adelaide",
      autore: "Will Pittenger",
      fonteUrl: "https://commons.wikimedia.org/wiki/File:Adelaide_(long_route).svg",
      fonteLabel: "Wikimedia Commons",
      licenzaUrl: "https://creativecommons.org/licenses/by-sa/3.0/deed.it",
      licenzaLabel: "CC BY-SA 3.0",
    },
  ],
  "ain-diab": [
    {
      src: "https://commons.wikimedia.org/wiki/Special:Redirect/file/Ain-Diab.svg",
      alt: "Mappa del tracciato: Circuito di Ain-Diab",
      autore: "Will Pittenger",
      fonteUrl: "https://commons.wikimedia.org/wiki/File:Ain-Diab.svg",
      fonteLabel: "Wikimedia Commons",
      licenzaUrl: "https://creativecommons.org/licenses/by-sa/3.0/deed.it",
      licenzaLabel: "CC BY-SA 3.0",
    },
  ],
  "aintree": [
    {
      src: "https://commons.wikimedia.org/wiki/Special:Redirect/file/Circuit_Aintree.svg",
      alt: "Mappa del tracciato: Circuito di Aintree",
      autore: "Ch1902",
      fonteUrl: "https://commons.wikimedia.org/wiki/File:Circuit_Aintree.svg",
      fonteLabel: "Wikimedia Commons",
      licenzaUrl: "https://en.wikipedia.org/wiki/Public_domain",
      licenzaLabel: "Dominio pubblico",
    },
  ],
  "albert-park": [
    {
      src: "https://commons.wikimedia.org/wiki/Special:Redirect/file/Circuit_Albert_Park.svg",
      alt: "Mappa del tracciato: Circuito Albert Park",
      autore: "Rumbin",
      fonteUrl: "https://commons.wikimedia.org/wiki/File:Circuit_Albert_Park.svg",
      fonteLabel: "Wikimedia Commons",
      licenzaUrl: "https://en.wikipedia.org/wiki/Public_domain",
      licenzaLabel: "Dominio pubblico",
    },
  ],
  "anderstorp": [
    {
      src: "https://commons.wikimedia.org/wiki/Special:Redirect/file/Scandinavian_Raceway_1978.svg",
      alt: "Mappa del tracciato: Circuito di Anderstorp",
      autore: "Will Pittenger",
      fonteUrl: "https://commons.wikimedia.org/wiki/File:Scandinavian_Raceway_1978.svg",
      fonteLabel: "Wikimedia Commons",
      licenzaUrl: "https://creativecommons.org/licenses/by-sa/3.0/deed.it",
      licenzaLabel: "CC BY-SA 3.0",
    },
  ],
  "austin": [
    {
      src: "https://commons.wikimedia.org/wiki/Special:Redirect/file/Austin_Formula_One_circuit.svg",
      alt: "Mappa del tracciato: Circuito delle Americhe",
      autore: "Francesco Betti Sorbelli",
      fonteUrl: "https://commons.wikimedia.org/wiki/File:Austin_Formula_One_circuit.svg",
      fonteLabel: "Wikimedia Commons",
      licenzaUrl: "https://creativecommons.org/licenses/by-sa/3.0/deed.it",
      licenzaLabel: "CC BY-SA 3.0",
    },
  ],
  "avus": [
    {
      src: "https://commons.wikimedia.org/wiki/Special:Redirect/file/Circuit_AVUS.svg",
      alt: "Mappa del tracciato: AVUS",
      autore: "Rumbin",
      fonteUrl: "https://commons.wikimedia.org/wiki/File:Circuit_AVUS.svg",
      fonteLabel: "Wikimedia Commons",
      licenzaUrl: "https://en.wikipedia.org/wiki/Public_domain",
      licenzaLabel: "Dominio pubblico",
    },
  ],
  "bahrain": [
    {
      src: "https://commons.wikimedia.org/wiki/Special:Redirect/file/Circuit_Bahrain.svg",
      alt: "Mappa del tracciato: Bahrain International Circuit",
      autore: "Rumbin",
      fonteUrl: "https://commons.wikimedia.org/wiki/File:Circuit_Bahrain.svg",
      fonteLabel: "Wikimedia Commons",
      licenzaUrl: "https://en.wikipedia.org/wiki/Public_domain",
      licenzaLabel: "Dominio pubblico",
    },
  ],
  "baku": [
    {
      src: "https://commons.wikimedia.org/wiki/Special:Redirect/file/Baku_Formula_One_circuit_map.svg",
      alt: "Mappa del tracciato: Circuito di Baku",
      autore: "HumanBodyPiloter5",
      fonteUrl: "https://commons.wikimedia.org/wiki/File:Baku_Formula_One_circuit_map.svg",
      fonteLabel: "Wikimedia Commons",
      licenzaUrl: "https://creativecommons.org/publicdomain/zero/1.0/deed.it",
      licenzaLabel: "CC0 1.0 (dominio pubblico)",
    },
  ],
  "boavista": [
    {
      src: "https://commons.wikimedia.org/wiki/Special:Redirect/file/Circuit_Boavista.png",
      alt: "Mappa del tracciato: Circuito da Boavista",
      autore: "Arz",
      fonteUrl: "https://commons.wikimedia.org/wiki/File:Circuit_Boavista.png",
      fonteLabel: "Wikimedia Commons",
      licenzaUrl: "https://en.wikipedia.org/wiki/Public_domain",
      licenzaLabel: "Dominio pubblico",
    },
  ],
  "brands-hatch": [
    {
      src: "https://commons.wikimedia.org/wiki/Special:Redirect/file/Brands_Hatch_2003.svg",
      alt: "Mappa del tracciato: Circuito di Brands Hatch",
      autore: "Will Pittenger",
      fonteUrl: "https://commons.wikimedia.org/wiki/File:Brands_Hatch_2003.svg",
      fonteLabel: "Wikimedia Commons",
      licenzaUrl: "https://creativecommons.org/licenses/by-sa/3.0/deed.it",
      licenzaLabel: "CC BY-SA 3.0",
    },
  ],
  "bremgarten": [
    {
      src: "https://commons.wikimedia.org/wiki/Special:Redirect/file/Circuit_Bremgarten.svg",
      alt: "Mappa del tracciato: Circuito di Bremgarten",
      autore: "Lispir",
      fonteUrl: "https://commons.wikimedia.org/wiki/File:Circuit_Bremgarten.svg",
      fonteLabel: "Wikimedia Commons",
      licenzaUrl: "https://creativecommons.org/licenses/by-sa/3.0/deed.it",
      licenzaLabel: "CC BY-SA 3.0",
    },
  ],
  "buddh": [
    {
      src: "https://commons.wikimedia.org/wiki/Special:Redirect/file/Jaypee_International_Circuit_2011.svg",
      alt: "Mappa del tracciato: Buddh International Circuit",
      autore: "Pyrope",
      fonteUrl: "https://commons.wikimedia.org/wiki/File:Jaypee_International_Circuit_2011.svg",
      fonteLabel: "Wikimedia Commons",
      licenzaUrl: "https://creativecommons.org/licenses/by-sa/3.0/deed.it",
      licenzaLabel: "CC BY-SA 3.0",
    },
  ],
  "buenos-aires": [
    {
      src: "https://commons.wikimedia.org/wiki/Special:Redirect/file/Autódromo_Oscar_y_Juan_Gálvez_Detalles.svg",
      alt: "Mappa del tracciato: Circuito di Buenos Aires",
      autore: "Will Pittenger",
      fonteUrl: "https://commons.wikimedia.org/wiki/File:Autódromo_Oscar_y_Juan_Gálvez_Detalles.svg",
      fonteLabel: "Wikimedia Commons",
      licenzaUrl: "https://creativecommons.org/licenses/by-sa/3.0/deed.it",
      licenzaLabel: "CC BY-SA 3.0",
    },
  ],
  "caesars-palace": [
    {
      src: "https://commons.wikimedia.org/wiki/Special:Redirect/file/Circuit_Caesars_Palace.png",
      alt: "Mappa del tracciato: Circuito del Caesars Palace",
      autore: "Arz",
      fonteUrl: "https://commons.wikimedia.org/wiki/File:Circuit_Caesars_Palace.png",
      fonteLabel: "Wikimedia Commons",
      licenzaUrl: "https://en.wikipedia.org/wiki/Public_domain",
      licenzaLabel: "Dominio pubblico",
    },
  ],
  "catalunya": [
    {
      src: "https://commons.wikimedia.org/wiki/Special:Redirect/file/Formula1_Circuit_Catalunya.svg",
      alt: "Mappa del tracciato: Circuito di Barcellona-Catalogna",
      autore: "Will Pittenger",
      fonteUrl: "https://commons.wikimedia.org/wiki/File:Formula1_Circuit_Catalunya.svg",
      fonteLabel: "Wikimedia Commons",
      licenzaUrl: "https://creativecommons.org/licenses/by-sa/3.0/deed.it",
      licenzaLabel: "CC BY-SA 3.0",
    },
  ],
  "clermont-ferrand": [
    {
      src: "https://commons.wikimedia.org/wiki/Special:Redirect/file/Circuit_Clermont_Ferrand.png",
      alt: "Mappa del tracciato: Circuito di Clermont-Ferrand",
      autore: "Arz",
      fonteUrl: "https://commons.wikimedia.org/wiki/File:Circuit_Clermont_Ferrand.png",
      fonteLabel: "Wikimedia Commons",
      licenzaUrl: "https://en.wikipedia.org/wiki/Public_domain",
      licenzaLabel: "Dominio pubblico",
    },
  ],
  "corea": [
    {
      src: "https://commons.wikimedia.org/wiki/Special:Redirect/file/Korea_international_circuit_v2.svg",
      alt: "Mappa del tracciato: Circuito internazionale di Corea",
      autore: "Will Pittenger",
      fonteUrl: "https://commons.wikimedia.org/wiki/File:Korea_international_circuit_v2.svg",
      fonteLabel: "Wikimedia Commons",
      licenzaUrl: "https://creativecommons.org/licenses/by-sa/3.0/deed.it",
      licenzaLabel: "CC BY-SA 3.0",
    },
  ],
  "dallas": [
    {
      src: "https://commons.wikimedia.org/wiki/Special:Redirect/file/Circuit_Fair_Park_Dallas.svg",
      alt: "Mappa del tracciato: Circuito di Dallas",
      autore: "Will Pittenger",
      fonteUrl: "https://commons.wikimedia.org/wiki/File:Circuit_Fair_Park_Dallas.svg",
      fonteLabel: "Wikimedia Commons",
      licenzaUrl: "https://creativecommons.org/licenses/by-sa/3.0/deed.it",
      licenzaLabel: "CC BY-SA 3.0",
    },
  ],
  "detroit": [
    {
      src: "https://commons.wikimedia.org/wiki/Special:Redirect/file/Circuit_Detroit_F1_1983-1988.png",
      alt: "Mappa del tracciato: Circuito di Detroit",
      autore: "Arz",
      fonteUrl: "https://commons.wikimedia.org/wiki/File:Circuit_Detroit_F1_1983-1988.png",
      fonteLabel: "Wikimedia Commons",
      licenzaUrl: "https://en.wikipedia.org/wiki/Public_domain",
      licenzaLabel: "Dominio pubblico",
    },
  ],
  "dijon": [
    {
      src: "https://commons.wikimedia.org/wiki/Special:Redirect/file/Circuit_de_Dijon-Prenois-1975.svg",
      alt: "Mappa del tracciato: Circuito di Digione",
      autore: "Will Pittenger",
      fonteUrl: "https://commons.wikimedia.org/wiki/File:Circuit_de_Dijon-Prenois-1975.svg",
      fonteLabel: "Wikimedia Commons",
      licenzaUrl: "https://creativecommons.org/licenses/by-sa/3.0/deed.it",
      licenzaLabel: "CC BY-SA 3.0",
    },
  ],
  "donington": [
    {
      src: "https://commons.wikimedia.org/wiki/Special:Redirect/file/Donington_circuit.svg",
      alt: "Mappa del tracciato: Circuito di Donington Park",
      autore: "Will Pittenger",
      fonteUrl: "https://commons.wikimedia.org/wiki/File:Donington_circuit.svg",
      fonteLabel: "Wikimedia Commons",
      licenzaUrl: "https://creativecommons.org/licenses/by-sa/3.0/deed.it",
      licenzaLabel: "CC BY-SA 3.0",
    },
  ],
  "east-london": [
    {
      src: "https://commons.wikimedia.org/wiki/Special:Redirect/file/Circuit_East_London.png",
      alt: "Mappa del tracciato: Circuito di East London",
      autore: "Arz",
      fonteUrl: "https://commons.wikimedia.org/wiki/File:Circuit_East_London.png",
      fonteLabel: "Wikimedia Commons",
      licenzaUrl: "https://en.wikipedia.org/wiki/Public_domain",
      licenzaLabel: "Dominio pubblico",
    },
  ],
  "estoril": [
    {
      src: "https://commons.wikimedia.org/wiki/Special:Redirect/file/Estoril_track_map.svg",
      alt: "Mappa del tracciato: Circuito di Estoril",
      autore: "Will Pittenger",
      fonteUrl: "https://commons.wikimedia.org/wiki/File:Estoril_track_map.svg",
      fonteLabel: "Wikimedia Commons",
      licenzaUrl: "https://creativecommons.org/licenses/by-sa/3.0/deed.it",
      licenzaLabel: "CC BY-SA 3.0",
    },
  ],
  "fuji": [
    {
      src: "https://commons.wikimedia.org/wiki/Special:Redirect/file/Circuit_Fuji.svg",
      alt: "Mappa del tracciato: Circuito del Fuji",
      autore: "Rumbin",
      fonteUrl: "https://commons.wikimedia.org/wiki/File:Circuit_Fuji.svg",
      fonteLabel: "Wikimedia Commons",
      licenzaUrl: "https://en.wikipedia.org/wiki/Public_domain",
      licenzaLabel: "Dominio pubblico",
    },
  ],
  "hockenheim": [
    {
      src: "https://commons.wikimedia.org/wiki/Special:Redirect/file/Hockenheim2012.svg",
      alt: "Mappa del tracciato: Hockenheimring",
      autore: "Will Pittenger",
      fonteUrl: "https://commons.wikimedia.org/wiki/File:Hockenheim2012.svg",
      fonteLabel: "Wikimedia Commons",
      licenzaUrl: "https://creativecommons.org/licenses/by-sa/3.0/deed.it",
      licenzaLabel: "CC BY-SA 3.0",
    },
  ],
  "hungaroring": [
    {
      src: "https://commons.wikimedia.org/wiki/Special:Redirect/file/Hungaroring.svg",
      alt: "Mappa del tracciato: Hungaroring",
      autore: "Will Pittenger",
      fonteUrl: "https://commons.wikimedia.org/wiki/File:Hungaroring.svg",
      fonteLabel: "Wikimedia Commons",
      licenzaUrl: "https://creativecommons.org/licenses/by-sa/3.0/deed.it",
      licenzaLabel: "CC BY-SA 3.0",
    },
  ],
  "imola": [
    {
      src: "https://commons.wikimedia.org/wiki/Special:Redirect/file/2022_F1_CourseLayout_Imola.svg",
      alt: "Mappa del tracciato: Autodromo Enzo e Dino Ferrari",
      autore: "ごひょううべこ",
      fonteUrl: "https://commons.wikimedia.org/wiki/File:2022_F1_CourseLayout_Imola.svg",
      fonteLabel: "Wikimedia Commons",
      licenzaUrl: "https://creativecommons.org/licenses/by-sa/4.0/deed.it",
      licenzaLabel: "CC BY-SA 4.0",
    },
  ],
  "indianapolis": [
    {
      src: "https://commons.wikimedia.org/wiki/Special:Redirect/file/Indianapolis_Motor_Speedway_-_road_course.svg",
      alt: "Mappa del tracciato: Indianapolis Motor Speedway",
      autore: "Will Pittenger",
      fonteUrl: "https://commons.wikimedia.org/wiki/File:Indianapolis_Motor_Speedway_-_road_course.svg",
      fonteLabel: "Wikimedia Commons",
      licenzaUrl: "https://creativecommons.org/licenses/by-sa/3.0/deed.it",
      licenzaLabel: "CC BY-SA 3.0",
    },
  ],
  "interlagos": [
    {
      src: "https://commons.wikimedia.org/wiki/Special:Redirect/file/Circuit_Interlagos.svg",
      alt: "Mappa del tracciato: Circuito di Interlagos",
      autore: "Ch1902",
      fonteUrl: "https://commons.wikimedia.org/wiki/File:Circuit_Interlagos.svg",
      fonteLabel: "Wikimedia Commons",
      licenzaUrl: "https://en.wikipedia.org/wiki/Public_domain",
      licenzaLabel: "Dominio pubblico",
    },
  ],
  "istanbul": [
    {
      src: "https://commons.wikimedia.org/wiki/Special:Redirect/file/Istanbul_park.svg",
      alt: "Mappa del tracciato: Circuito di Istanbul",
      autore: "Will Pittenger",
      fonteUrl: "https://commons.wikimedia.org/wiki/File:Istanbul_park.svg",
      fonteLabel: "Wikimedia Commons",
      licenzaUrl: "https://creativecommons.org/licenses/by-sa/3.0/deed.it",
      licenzaLabel: "CC BY-SA 3.0",
    },
  ],
  "jacarepagua": [
    {
      src: "https://commons.wikimedia.org/wiki/Special:Redirect/file/Jacarepaguá.svg",
      alt: "Mappa del tracciato: Circuito di Jacarepaguá",
      autore: "Will Pittenger",
      fonteUrl: "https://commons.wikimedia.org/wiki/File:Jacarepaguá.svg",
      fonteLabel: "Wikimedia Commons",
      licenzaUrl: "https://creativecommons.org/licenses/by-sa/3.0/deed.it",
      licenzaLabel: "CC BY-SA 3.0",
    },
  ],
  "jarama": [
    {
      src: "https://commons.wikimedia.org/wiki/Special:Redirect/file/Circuit_Jarama.png",
      alt: "Mappa del tracciato: Circuito permanente del Jarama",
      autore: "Arz",
      fonteUrl: "https://commons.wikimedia.org/wiki/File:Circuit_Jarama.png",
      fonteLabel: "Wikimedia Commons",
      licenzaUrl: "https://en.wikipedia.org/wiki/Public_domain",
      licenzaLabel: "Dominio pubblico",
    },
  ],
  "jeddah": [
    {
      src: "https://commons.wikimedia.org/wiki/Special:Redirect/file/Jeddah_Street_Circuit_2021.svg",
      alt: "Mappa del tracciato: Circuito di Gedda",
      autore: "GabrielStella",
      fonteUrl: "https://commons.wikimedia.org/wiki/File:Jeddah_Street_Circuit_2021.svg",
      fonteLabel: "Wikimedia Commons",
      licenzaUrl: "https://creativecommons.org/licenses/by-sa/3.0/deed.it",
      licenzaLabel: "CC BY-SA 3.0",
    },
  ],
  "jerez": [
    {
      src: "https://commons.wikimedia.org/wiki/Special:Redirect/file/Circuito_de_Jerez.svg",
      alt: "Mappa del tracciato: Circuito di Jerez de la Frontera",
      autore: "Will Pittenger",
      fonteUrl: "https://commons.wikimedia.org/wiki/File:Circuito_de_Jerez.svg",
      fonteLabel: "Wikimedia Commons",
      licenzaUrl: "https://creativecommons.org/licenses/by-sa/3.0/deed.it",
      licenzaLabel: "CC BY-SA 3.0",
    },
  ],
  "kyalami": [
    {
      src: "https://commons.wikimedia.org/wiki/Special:Redirect/file/Kyalami.svg",
      alt: "Mappa del tracciato: Circuito di Kyalami",
      autore: "Will Pittenger",
      fonteUrl: "https://commons.wikimedia.org/wiki/File:Kyalami.svg",
      fonteLabel: "Wikimedia Commons",
      licenzaUrl: "https://creativecommons.org/licenses/by-sa/3.0/deed.it",
      licenzaLabel: "CC BY-SA 3.0",
    },
  ],
  "las-vegas": [
    {
      src: "https://commons.wikimedia.org/wiki/Special:Redirect/file/2023_Las_Vegas_street_circuit.svg",
      alt: "Mappa del tracciato: Las Vegas Strip Circuit",
      autore: "Valentin JJ.",
      fonteUrl: "https://commons.wikimedia.org/wiki/File:2023_Las_Vegas_street_circuit.svg",
      fonteLabel: "Wikimedia Commons",
      licenzaUrl: "https://creativecommons.org/licenses/by-sa/4.0/deed.it",
      licenzaLabel: "CC BY-SA 4.0",
    },
  ],
  "lemans": [
    {
      src: "https://commons.wikimedia.org/wiki/Special:Redirect/file/Bugatti_Circuit_Updated-4.png",
      alt: "Mappa del tracciato: Circuito Bugatti (Le Mans)",
      autore: "Netanel Frija",
      fonteUrl: "https://commons.wikimedia.org/wiki/File:Bugatti_Circuit_Updated-4.png",
      fonteLabel: "Wikimedia Commons",
      licenzaUrl: "https://creativecommons.org/licenses/by-sa/4.0/deed.it",
      licenzaLabel: "CC BY-SA 4.0",
    },
  ],
  "long-beach": [
    {
      src: "https://commons.wikimedia.org/wiki/Special:Redirect/file/Long_Beach_Formula_One_version.svg",
      alt: "Mappa del tracciato: Circuito di Long Beach",
      autore: "Will Pittenger",
      fonteUrl: "https://commons.wikimedia.org/wiki/File:Long_Beach_Formula_One_version.svg",
      fonteLabel: "Wikimedia Commons",
      licenzaUrl: "https://creativecommons.org/licenses/by-sa/3.0/deed.it",
      licenzaLabel: "CC BY-SA 3.0",
    },
  ],
  "losail": [
    {
      src: "https://commons.wikimedia.org/wiki/Special:Redirect/file/Losail.svg",
      alt: "Mappa del tracciato: Losail International Circuit",
      autore: "Will Pittenger",
      fonteUrl: "https://commons.wikimedia.org/wiki/File:Losail.svg",
      fonteLabel: "Wikimedia Commons",
      licenzaUrl: "https://creativecommons.org/licenses/by-sa/3.0/deed.it",
      licenzaLabel: "CC BY-SA 3.0",
    },
  ],
  "madring": [
    {
      src: "https://commons.wikimedia.org/wiki/Special:Redirect/file/Madring_(2026).svg",
      alt: "Mappa del tracciato: Madring",
      autore: "GabrielStella",
      fonteUrl: "https://commons.wikimedia.org/wiki/File:Madring_(2026).svg",
      fonteLabel: "Wikimedia Commons",
      licenzaUrl: "https://creativecommons.org/licenses/by-sa/3.0/deed.it",
      licenzaLabel: "CC BY-SA 3.0",
    },
  ],
  "magny-cours": [
    {
      src: "https://commons.wikimedia.org/wiki/Special:Redirect/file/Circuit_de_Nevers_Magny-Cours.svg",
      alt: "Mappa del tracciato: Circuito di Nevers Magny-Cours",
      autore: "Will Pittenger",
      fonteUrl: "https://commons.wikimedia.org/wiki/File:Circuit_de_Nevers_Magny-Cours.svg",
      fonteLabel: "Wikimedia Commons",
      licenzaUrl: "https://creativecommons.org/licenses/by-sa/3.0/deed.it",
      licenzaLabel: "CC BY-SA 3.0",
    },
  ],
  "mexico": [
    {
      src: "https://commons.wikimedia.org/wiki/Special:Redirect/file/Autódromo_Hermanos_Rodríguez.svg",
      alt: "Mappa del tracciato: Autodromo Hermanos Rodríguez",
      autore: "Will Pittenger",
      fonteUrl: "https://commons.wikimedia.org/wiki/File:Autódromo_Hermanos_Rodríguez.svg",
      fonteLabel: "Wikimedia Commons",
      licenzaUrl: "https://creativecommons.org/licenses/by-sa/3.0/deed.it",
      licenzaLabel: "CC BY-SA 3.0",
    },
  ],
  "miami": [
    {
      src: "https://commons.wikimedia.org/wiki/Special:Redirect/file/Miami_International_Autodrome.png",
      alt: "Mappa del tracciato: Miami International Autodrome",
      autore: "Anthony Alessio Tralongo",
      fonteUrl: "https://commons.wikimedia.org/wiki/File:Miami_International_Autodrome.png",
      fonteLabel: "Wikimedia Commons",
      licenzaUrl: "https://creativecommons.org/licenses/by-sa/4.0/deed.it",
      licenzaLabel: "CC BY-SA 4.0",
    },
  ],
  "monaco": [
    {
      src: "https://commons.wikimedia.org/wiki/Special:Redirect/file/Circuit_Monaco.svg",
      alt: "Mappa del tracciato: Circuito di Monte Carlo",
      autore: "Rumbin",
      fonteUrl: "https://commons.wikimedia.org/wiki/File:Circuit_Monaco.svg",
      fonteLabel: "Wikimedia Commons",
      licenzaUrl: "https://en.wikipedia.org/wiki/Public_domain",
      licenzaLabel: "Dominio pubblico",
    },
  ],
  "monsanto": [
    {
      src: "https://commons.wikimedia.org/wiki/Special:Redirect/file/Circuit_Monsanto.png",
      alt: "Mappa del tracciato: Circuito di Monsanto",
      autore: "Arz",
      fonteUrl: "https://commons.wikimedia.org/wiki/File:Circuit_Monsanto.png",
      fonteLabel: "Wikimedia Commons",
      licenzaUrl: "https://en.wikipedia.org/wiki/Public_domain",
      licenzaLabel: "Dominio pubblico",
    },
  ],
  "mont-tremblant": [
    {
      src: "https://commons.wikimedia.org/wiki/Special:Redirect/file/Circuit_Mont-Tremblant.png",
      alt: "Mappa del tracciato: Circuito di Mont-Tremblant",
      autore: "Arz",
      fonteUrl: "https://commons.wikimedia.org/wiki/File:Circuit_Mont-Tremblant.png",
      fonteLabel: "Wikimedia Commons",
      licenzaUrl: "https://en.wikipedia.org/wiki/Public_domain",
      licenzaLabel: "Dominio pubblico",
    },
  ],
  "montjuic": [
    {
      src: "https://commons.wikimedia.org/wiki/Special:Redirect/file/Circuit_Montjuich.png",
      alt: "Mappa del tracciato: Circuito del Montjuïc",
      autore: "Arz",
      fonteUrl: "https://commons.wikimedia.org/wiki/File:Circuit_Montjuich.png",
      fonteLabel: "Wikimedia Commons",
      licenzaUrl: "https://en.wikipedia.org/wiki/Public_domain",
      licenzaLabel: "Dominio pubblico",
    },
  ],
  "montreal": [
    {
      src: "https://commons.wikimedia.org/wiki/Special:Redirect/file/Circuit_Gilles_Villeneuve.svg",
      alt: "Mappa del tracciato: Circuito di Montréal",
      autore: "Will Pittenger / cBuckley",
      fonteUrl: "https://commons.wikimedia.org/wiki/File:Circuit_Gilles_Villeneuve.svg",
      fonteLabel: "Wikimedia Commons",
      licenzaUrl: "https://creativecommons.org/licenses/by-sa/3.0/deed.it",
      licenzaLabel: "CC BY-SA 3.0",
    },
  ],
  "monza": [
    {
      src: "https://upload.wikimedia.org/wikipedia/commons/5/55/Monza_1950.jpg",
      alt: "Immagine storica dell'Autodromo di Monza, 1950",
      autore: "Jiří Žemlička",
      autoreUrl: "https://cs.wikipedia.org/wiki/User:Ji%C5%99%C3%AD_%C5%BDemli%C4%8Dka",
      fonteUrl: "https://commons.wikimedia.org/wiki/File:Monza_1950.jpg",
      fonteLabel: "Wikimedia Commons",
      licenzaUrl: "https://en.wikipedia.org/wiki/Public_domain",
      licenzaLabel: "Dominio pubblico",
    },
    {
      src: "https://commons.wikimedia.org/wiki/Special:Redirect/file/Circuit_Monza.svg",
      alt: "Mappa del tracciato: Autodromo Nazionale di Monza",
      autore: "Rumbin",
      fonteUrl: "https://commons.wikimedia.org/wiki/File:Circuit_Monza.svg",
      fonteLabel: "Wikimedia Commons",
      licenzaUrl: "https://en.wikipedia.org/wiki/Public_domain",
      licenzaLabel: "Dominio pubblico",
    },
  ],
  "mosport": [
    {
      src: "https://commons.wikimedia.org/wiki/Special:Redirect/file/Mosport.svg",
      alt: "Mappa del tracciato: Mosport Park",
      autore: "Will Pittenger",
      fonteUrl: "https://commons.wikimedia.org/wiki/File:Mosport.svg",
      fonteLabel: "Wikimedia Commons",
      licenzaUrl: "https://creativecommons.org/licenses/by-sa/3.0/deed.it",
      licenzaLabel: "CC BY-SA 3.0",
    },
  ],
  "mugello": [
    {
      src: "https://commons.wikimedia.org/wiki/Special:Redirect/file/Mugello_Racing_Circuit_track_map_15_turns.svg",
      alt: "Mappa del tracciato: Autodromo internazionale del Mugello",
      autore: "Will Pittenger",
      fonteUrl: "https://commons.wikimedia.org/wiki/File:Mugello_Racing_Circuit_track_map_15_turns.svg",
      fonteLabel: "Wikimedia Commons",
      licenzaUrl: "https://creativecommons.org/licenses/by-sa/3.0/deed.it",
      licenzaLabel: "CC BY-SA 3.0",
    },
  ],
  "nivelles": [
    {
      src: "https://commons.wikimedia.org/wiki/Special:Redirect/file/Circuit_Nivelles-Baulers.png",
      alt: "Mappa del tracciato: Circuito di Nivelles",
      autore: "Arz",
      fonteUrl: "https://commons.wikimedia.org/wiki/File:Circuit_Nivelles-Baulers.png",
      fonteLabel: "Wikimedia Commons",
      licenzaUrl: "https://en.wikipedia.org/wiki/Public_domain",
      licenzaLabel: "Dominio pubblico",
    },
  ],
  // NOTA: fino a poco fa esistevano tre chiavi separate ("nurburgring",
  // "nurburgring-gp-strecke", "nurburgring-nordschleife"). Consolidate qui
  // sotto un'unica chiave "nurburgring": Jolpica modella tutte le
  // configurazioni del Nürburgring (Gp-Strecke, Nordschleife, ecc.) come
  // un solo circuito con circuitId "nurburgring" — con tre chiavi separate,
  // le due varianti sarebbero rimaste orfane (mai collegate a nessuna gara
  // importata). La mappa del Gp-Strecke resta l'immagine principale, quella
  // del Nordschleife diventa una miniatura nella stessa galleria.
  "nurburgring": [
    {
      src: "https://commons.wikimedia.org/wiki/Special:Redirect/file/Nürburgring_-_Grand-Prix-Strecke.svg",
      alt: "Mappa del tracciato: Nürburgring Grand-Prix-Strecke",
      autore: "Will Pittenger",
      fonteUrl: "https://commons.wikimedia.org/wiki/File:Nürburgring_-_Grand-Prix-Strecke.svg",
      fonteLabel: "Wikimedia Commons",
      licenzaUrl: "https://creativecommons.org/licenses/by-sa/3.0/deed.it",
      licenzaLabel: "CC BY-SA 3.0",
    },
    {
      src: "https://commons.wikimedia.org/wiki/Special:Redirect/file/Nürburgring_-_Nordschleife.svg",
      alt: "Mappa del tracciato: Nürburgring Nordschleife",
      autore: "Will Pittenger",
      fonteUrl: "https://commons.wikimedia.org/wiki/File:Nürburgring_-_Nordschleife.svg",
      fonteLabel: "Wikimedia Commons",
      licenzaUrl: "https://creativecommons.org/licenses/by-sa/3.0/deed.it",
      licenzaLabel: "CC BY-SA 3.0",
    },
  ],
  "okayama": [
    {
      src: "https://commons.wikimedia.org/wiki/Special:Redirect/file/Okayama_International_Circuit.svg",
      alt: "Mappa del tracciato: Circuito internazionale di Okayama",
      autore: "Will Pittenger",
      fonteUrl: "https://commons.wikimedia.org/wiki/File:Okayama_International_Circuit.svg",
      fonteLabel: "Wikimedia Commons",
      licenzaUrl: "https://creativecommons.org/licenses/by-sa/3.0/deed.it",
      licenzaLabel: "CC BY-SA 3.0",
    },
  ],
  "paul-ricard": [
    {
      src: "https://commons.wikimedia.org/wiki/Special:Redirect/file/Paul_Ricard_2020_layout_map.svg",
      alt: "Mappa del tracciato: Circuito Paul Ricard",
      autore: "Will Pittenger",
      fonteUrl: "https://commons.wikimedia.org/wiki/File:Paul_Ricard_2020_layout_map.svg",
      fonteLabel: "Wikimedia Commons",
      licenzaUrl: "https://creativecommons.org/licenses/by-sa/3.0/deed.it",
      licenzaLabel: "CC BY-SA 3.0",
    },
  ],
  "pedralbes": [
    {
      src: "https://commons.wikimedia.org/wiki/Special:Redirect/file/Circuit_Pedralbes.png",
      alt: "Mappa del tracciato: Circuito di Pedralbes",
      autore: "Arz",
      fonteUrl: "https://commons.wikimedia.org/wiki/File:Circuit_Pedralbes.png",
      fonteLabel: "Wikimedia Commons",
      licenzaUrl: "https://en.wikipedia.org/wiki/Public_domain",
      licenzaLabel: "Dominio pubblico",
    },
  ],
  "pescara": [
    {
      src: "https://commons.wikimedia.org/wiki/Special:Redirect/file/Pescara_Circuit.svg",
      alt: "Mappa del tracciato: Circuito di Pescara",
      autore: "Will Pittenger",
      fonteUrl: "https://commons.wikimedia.org/wiki/File:Pescara_Circuit.svg",
      fonteLabel: "Wikimedia Commons",
      licenzaUrl: "https://creativecommons.org/licenses/by-sa/3.0/deed.it",
      licenzaLabel: "CC BY-SA 3.0",
    },
  ],
  "phoenix": [
    {
      src: "https://commons.wikimedia.org/wiki/Special:Redirect/file/Phoenix_Grand_Prix_Route_-_1989_1990.svg",
      alt: "Mappa del tracciato: Circuito di Phoenix",
      autore: "Will Pittenger",
      fonteUrl: "https://commons.wikimedia.org/wiki/File:Phoenix_Grand_Prix_Route_-_1989_1990.svg",
      fonteLabel: "Wikimedia Commons",
      licenzaUrl: "https://creativecommons.org/licenses/by-sa/3.0/deed.it",
      licenzaLabel: "CC BY-SA 3.0",
    },
  ],
  "portimao": [
    {
      src: "https://commons.wikimedia.org/wiki/Special:Redirect/file/Autódromo_do_Algarve_F1_Sectors.svg",
      alt: "Mappa del tracciato: Autódromo Internacional do Algarve",
      autore: "GabrielStella",
      fonteUrl: "https://commons.wikimedia.org/wiki/File:Autódromo_do_Algarve_F1_Sectors.svg",
      fonteLabel: "Wikimedia Commons",
      licenzaUrl: "https://creativecommons.org/licenses/by-sa/4.0/deed.it",
      licenzaLabel: "CC BY-SA 4.0",
    },
  ],
  "red-bull-ring": [
    {
      src: "https://commons.wikimedia.org/wiki/Special:Redirect/file/Circuit_Red_Bull_Ring.svg",
      alt: "Mappa del tracciato: Red Bull Ring",
      autore: "Pitlane02",
      fonteUrl: "https://commons.wikimedia.org/wiki/File:Circuit_Red_Bull_Ring.svg",
      fonteLabel: "Wikimedia Commons",
      licenzaUrl: "https://creativecommons.org/licenses/by-sa/3.0/deed.it",
      licenzaLabel: "CC BY-SA 3.0",
    },
  ],
  "reims": [
    {
      src: "https://commons.wikimedia.org/wiki/Special:Redirect/file/Circuit_Reims-Gueux.png",
      alt: "Mappa del tracciato: Circuito di Reims-Gueux",
      autore: "Arz",
      fonteUrl: "https://commons.wikimedia.org/wiki/File:Circuit_Reims-Gueux.png",
      fonteLabel: "Wikimedia Commons",
      licenzaUrl: "https://en.wikipedia.org/wiki/Public_domain",
      licenzaLabel: "Dominio pubblico",
    },
  ],
  "riverside": [
    {
      src: "https://commons.wikimedia.org/wiki/Special:Redirect/file/Riverside_International_Raceway_-_1969_-_1971.svg",
      alt: "Mappa del tracciato: Circuito di Riverside",
      autore: "Will Pittenger",
      fonteUrl: "https://commons.wikimedia.org/wiki/File:Riverside_International_Raceway_-_1969_-_1971.svg",
      fonteLabel: "Wikimedia Commons",
      licenzaUrl: "https://creativecommons.org/licenses/by-sa/3.0/deed.it",
      licenzaLabel: "CC BY-SA 3.0",
    },
  ],
  "rouen-les-essarts": [
    {
      src: "https://commons.wikimedia.org/wiki/Special:Redirect/file/Circuit_Rouen-Les-Essarts.png",
      alt: "Mappa del tracciato: Circuito di Rouen-Les Essarts",
      autore: "Arz",
      fonteUrl: "https://commons.wikimedia.org/wiki/File:Circuit_Rouen-Les-Essarts.png",
      fonteLabel: "Wikimedia Commons",
      licenzaUrl: "https://en.wikipedia.org/wiki/Public_domain",
      licenzaLabel: "Dominio pubblico",
    },
  ],
  "sebring": [
    {
      src: "https://commons.wikimedia.org/wiki/Special:Redirect/file/Circuit_Sebring.png",
      alt: "Mappa del tracciato: Circuito di Sebring",
      autore: "Arz",
      fonteUrl: "https://commons.wikimedia.org/wiki/File:Circuit_Sebring.png",
      fonteLabel: "Wikimedia Commons",
      licenzaUrl: "https://en.wikipedia.org/wiki/Public_domain",
      licenzaLabel: "Dominio pubblico",
    },
  ],
  "sepang": [
    {
      src: "https://commons.wikimedia.org/wiki/Special:Redirect/file/Sepang.svg",
      alt: "Mappa del tracciato: Circuito di Sepang",
      autore: "Will Pittenger",
      fonteUrl: "https://commons.wikimedia.org/wiki/File:Sepang.svg",
      fonteLabel: "Wikimedia Commons",
      licenzaUrl: "https://creativecommons.org/licenses/by-sa/3.0/deed.it",
      licenzaLabel: "CC BY-SA 3.0",
    },
  ],
  "shanghai": [
    {
      src: "https://commons.wikimedia.org/wiki/Special:Redirect/file/Shanghai_International_Racing_Circuit_track_map.svg",
      alt: "Mappa del tracciato: Circuito di Shanghai",
      autore: "Will Pittenger",
      fonteUrl: "https://commons.wikimedia.org/wiki/File:Shanghai_International_Racing_Circuit_track_map.svg",
      fonteLabel: "Wikimedia Commons",
      licenzaUrl: "https://creativecommons.org/licenses/by-sa/3.0/deed.it",
      licenzaLabel: "CC BY-SA 3.0",
    },
  ],
  "silverstone": [
    {
      src: "https://commons.wikimedia.org/wiki/Special:Redirect/file/Circuit_Silverstone_2011.svg",
      alt: "Mappa del tracciato: Circuito di Silverstone",
      autore: "AlexJ",
      fonteUrl: "https://commons.wikimedia.org/wiki/File:Circuit_Silverstone_2011.svg",
      fonteLabel: "Wikimedia Commons",
      licenzaUrl: "https://creativecommons.org/publicdomain/zero/1.0/deed.it",
      licenzaLabel: "CC0 1.0 (dominio pubblico)",
    },
  ],
  "singapore": [
    {
      src: "https://commons.wikimedia.org/wiki/Special:Redirect/file/Marina_bay_circuit.svg",
      alt: "Mappa del tracciato: Singapore Street Circuit",
      autore: "Sentoan",
      fonteUrl: "https://commons.wikimedia.org/wiki/File:Marina_bay_circuit.svg",
      fonteLabel: "Wikimedia Commons",
      licenzaUrl: "https://creativecommons.org/licenses/by/3.0/deed.it",
      licenzaLabel: "CC BY 3.0",
    },
  ],
  "sochi": [
    {
      src: "https://commons.wikimedia.org/wiki/Special:Redirect/file/Sochi_Autodrom.svg",
      alt: "Mappa del tracciato: Autodromo di Soči",
      autore: "Will Pittenger",
      fonteUrl: "https://commons.wikimedia.org/wiki/File:Sochi_Autodrom.svg",
      fonteLabel: "Wikimedia Commons",
      licenzaUrl: "https://creativecommons.org/licenses/by-sa/3.0/deed.it",
      licenzaLabel: "CC BY-SA 3.0",
    },
  ],
  "spa": [
    {
      src: "https://commons.wikimedia.org/wiki/Special:Redirect/file/Spa-Francorchamps_of_Belgium.svg",
      alt: "Mappa del tracciato: Circuito di Spa-Francorchamps",
      autore: "Will Pittenger",
      fonteUrl: "https://commons.wikimedia.org/wiki/File:Spa-Francorchamps_of_Belgium.svg",
      fonteLabel: "Wikimedia Commons",
      licenzaUrl: "https://creativecommons.org/licenses/by-sa/3.0/deed.it",
      licenzaLabel: "CC BY-SA 3.0",
    },
  ],
  "suzuka": [
    {
      src: "https://commons.wikimedia.org/wiki/Special:Redirect/file/Suzuka_Circuit_2013_001.svg",
      alt: "Mappa del tracciato: Circuito di Suzuka",
      autore: "Ocdp",
      fonteUrl: "https://commons.wikimedia.org/wiki/File:Suzuka_Circuit_2013_001.svg",
      fonteLabel: "Wikimedia Commons",
      licenzaUrl: "https://creativecommons.org/publicdomain/zero/1.0/deed.it",
      licenzaLabel: "CC0 1.0 (dominio pubblico)",
    },
  ],
  "valencia": [
    {
      src: "https://commons.wikimedia.org/wiki/Special:Redirect/file/Valencia_Street_Circuit.svg",
      alt: "Mappa del tracciato: Circuito urbano di Valencia",
      autore: "Will Pittenger",
      fonteUrl: "https://commons.wikimedia.org/wiki/File:Valencia_Street_Circuit.svg",
      fonteLabel: "Wikimedia Commons",
      licenzaUrl: "https://creativecommons.org/licenses/by-sa/3.0/deed.it",
      licenzaLabel: "CC BY-SA 3.0",
    },
  ],
  "watkins-glen": [
    {
      src: "https://commons.wikimedia.org/wiki/Special:Redirect/file/Watkins_Glen_International.svg",
      alt: "Mappa del tracciato: Watkins Glen International",
      autore: "Will Pittenger",
      fonteUrl: "https://commons.wikimedia.org/wiki/File:Watkins_Glen_International.svg",
      fonteLabel: "Wikimedia Commons",
      licenzaUrl: "https://creativecommons.org/licenses/by-sa/3.0/deed.it",
      licenzaLabel: "CC BY-SA 3.0",
    },
  ],
  "yas-marina": [
    {
      src: "https://commons.wikimedia.org/wiki/Special:Redirect/file/Yas_Marina_Circuit.png",
      alt: "Mappa del tracciato: Circuito di Yas Marina",
      autore: "Anthony Alessio Tralongo",
      fonteUrl: "https://commons.wikimedia.org/wiki/File:Yas_Marina_Circuit.png",
      fonteLabel: "Wikimedia Commons",
      licenzaUrl: "https://creativecommons.org/licenses/by-sa/4.0/deed.it",
      licenzaLabel: "CC BY-SA 4.0",
    },
  ],
  "zandvoort": [
    {
      src: "https://commons.wikimedia.org/wiki/Special:Redirect/file/Zandvoort.svg",
      alt: "Mappa del tracciato: Circuito di Zandvoort",
      autore: "Will Pittenger",
      fonteUrl: "https://commons.wikimedia.org/wiki/File:Zandvoort.svg",
      fonteLabel: "Wikimedia Commons",
      licenzaUrl: "https://en.wikipedia.org/wiki/Public_domain",
      licenzaLabel: "Dominio pubblico",
    },
  ],
  "zeltweg": [
    {
      src: "https://commons.wikimedia.org/wiki/Special:Redirect/file/Zeltweg_Airfield.svg",
      alt: "Mappa del tracciato: Aerodromo Hinterstoisser-Zeltweg",
      autore: "Will Pittenger",
      fonteUrl: "https://commons.wikimedia.org/wiki/File:Zeltweg_Airfield.svg",
      fonteLabel: "Wikimedia Commons",
      licenzaUrl: "https://creativecommons.org/licenses/by-sa/3.0/deed.it",
      licenzaLabel: "CC BY-SA 3.0",
    },
  ],
  "zolder": [
    {
      src: "https://commons.wikimedia.org/wiki/Special:Redirect/file/Zolder.svg",
      alt: "Mappa del tracciato: Circuito di Zolder",
      autore: "Will Pittenger",
      fonteUrl: "https://commons.wikimedia.org/wiki/File:Zolder.svg",
      fonteLabel: "Wikimedia Commons",
      licenzaUrl: "https://creativecommons.org/licenses/by-sa/3.0/deed.it",
      licenzaLabel: "CC BY-SA 3.0",
    },
  ],
};
