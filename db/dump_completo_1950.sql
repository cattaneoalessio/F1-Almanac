--
-- PostgreSQL database dump
--


-- Dumped from database version 16.13 (Ubuntu 16.13-0ubuntu0.24.04.1)
-- Dumped by pg_dump version 16.13 (Ubuntu 16.13-0ubuntu0.24.04.1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: circuiti; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.circuiti (
    id integer NOT NULL,
    codice_riferimento character varying(60) NOT NULL,
    nome character varying(120) NOT NULL,
    localita character varying(120),
    nazione_id smallint,
    lunghezza_km numeric(6,3),
    latitudine numeric(9,6),
    longitudine numeric(9,6),
    url_wikipedia text,
    creato_il timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: circuiti_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.circuiti_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: circuiti_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.circuiti_id_seq OWNED BY public.circuiti.id;


--
-- Name: costruttori; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.costruttori (
    id integer NOT NULL,
    codice_riferimento character varying(60) NOT NULL,
    nome character varying(100) NOT NULL,
    nazione_id smallint,
    anno_esordio smallint,
    anno_ritiro smallint,
    url_wikipedia text,
    creato_il timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: costruttori_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.costruttori_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: costruttori_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.costruttori_id_seq OWNED BY public.costruttori.id;


--
-- Name: gran_premi; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.gran_premi (
    id integer NOT NULL,
    stagione_id integer NOT NULL,
    circuito_id integer NOT NULL,
    nome_gp character varying(150) NOT NULL,
    round smallint,
    data_gara date,
    numero_giri smallint,
    distanza_km numeric(7,3),
    url_wikipedia text
);


--
-- Name: gran_premi_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.gran_premi_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: gran_premi_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.gran_premi_id_seq OWNED BY public.gran_premi.id;


--
-- Name: nazioni; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.nazioni (
    id smallint NOT NULL,
    codice_iso2 character(2) NOT NULL,
    nome character varying(80) NOT NULL,
    nome_gentilizio character varying(80)
);


--
-- Name: nazioni_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.nazioni_id_seq
    AS smallint
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: nazioni_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.nazioni_id_seq OWNED BY public.nazioni.id;


--
-- Name: piloti; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.piloti (
    id integer NOT NULL,
    codice_riferimento character varying(60) NOT NULL,
    sigla character(3),
    nome character varying(80) NOT NULL,
    cognome character varying(80) NOT NULL,
    data_nascita date,
    data_morte date,
    nazione_id smallint,
    url_wikipedia text,
    creato_il timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: piloti_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.piloti_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: piloti_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.piloti_id_seq OWNED BY public.piloti.id;


--
-- Name: punti_per_posizione; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.punti_per_posizione (
    id integer NOT NULL,
    sistema_punteggio_id integer NOT NULL,
    posizione smallint NOT NULL,
    punti numeric(5,2) NOT NULL
);


--
-- Name: punti_per_posizione_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.punti_per_posizione_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: punti_per_posizione_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.punti_per_posizione_id_seq OWNED BY public.punti_per_posizione.id;


--
-- Name: risultati_gara; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.risultati_gara (
    id bigint NOT NULL,
    gran_premio_id integer NOT NULL,
    pilota_id integer NOT NULL,
    pilota_secondario_id integer,
    costruttore_id integer NOT NULL,
    numero_vettura smallint,
    posizione_griglia smallint,
    posizione_finale smallint,
    posizione_finale_testo character varying(20),
    stato_id smallint,
    motivo_ritiro character varying(80),
    giri_completati smallint,
    tempo_totale interval,
    distacco_testo character varying(30),
    punti numeric(6,2) DEFAULT 0 NOT NULL,
    giro_veloce boolean DEFAULT false NOT NULL,
    tempo_giro_veloce interval,
    creato_il timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT chk_punti_non_negativi CHECK ((punti >= (0)::numeric))
);


--
-- Name: risultati_gara_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.risultati_gara_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: risultati_gara_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.risultati_gara_id_seq OWNED BY public.risultati_gara.id;


--
-- Name: sistemi_punteggio; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sistemi_punteggio (
    id integer NOT NULL,
    nome character varying(100) NOT NULL,
    anno_inizio smallint NOT NULL,
    anno_fine smallint,
    punto_giro_veloce boolean DEFAULT false NOT NULL,
    note text,
    CONSTRAINT sistemi_punteggio_check CHECK (((anno_fine IS NULL) OR (anno_fine >= anno_inizio)))
);


--
-- Name: sistemi_punteggio_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.sistemi_punteggio_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: sistemi_punteggio_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.sistemi_punteggio_id_seq OWNED BY public.sistemi_punteggio.id;


--
-- Name: stagioni; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.stagioni (
    id integer NOT NULL,
    anno smallint NOT NULL,
    sistema_punteggio_id integer,
    nome_campionato character varying(120) DEFAULT 'Campionato del Mondo di Formula 1'::character varying,
    note text
);


--
-- Name: stagioni_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.stagioni_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: stagioni_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.stagioni_id_seq OWNED BY public.stagioni.id;


--
-- Name: stati_risultato; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.stati_risultato (
    id smallint NOT NULL,
    codice character varying(20) NOT NULL,
    descrizione character varying(100) NOT NULL
);


--
-- Name: stati_risultato_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.stati_risultato_id_seq
    AS smallint
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: stati_risultato_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.stati_risultato_id_seq OWNED BY public.stati_risultato.id;


--
-- Name: circuiti id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.circuiti ALTER COLUMN id SET DEFAULT nextval('public.circuiti_id_seq'::regclass);


--
-- Name: costruttori id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.costruttori ALTER COLUMN id SET DEFAULT nextval('public.costruttori_id_seq'::regclass);


--
-- Name: gran_premi id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.gran_premi ALTER COLUMN id SET DEFAULT nextval('public.gran_premi_id_seq'::regclass);


--
-- Name: nazioni id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.nazioni ALTER COLUMN id SET DEFAULT nextval('public.nazioni_id_seq'::regclass);


--
-- Name: piloti id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.piloti ALTER COLUMN id SET DEFAULT nextval('public.piloti_id_seq'::regclass);


--
-- Name: punti_per_posizione id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.punti_per_posizione ALTER COLUMN id SET DEFAULT nextval('public.punti_per_posizione_id_seq'::regclass);


--
-- Name: risultati_gara id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.risultati_gara ALTER COLUMN id SET DEFAULT nextval('public.risultati_gara_id_seq'::regclass);


--
-- Name: sistemi_punteggio id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sistemi_punteggio ALTER COLUMN id SET DEFAULT nextval('public.sistemi_punteggio_id_seq'::regclass);


--
-- Name: stagioni id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stagioni ALTER COLUMN id SET DEFAULT nextval('public.stagioni_id_seq'::regclass);


--
-- Name: stati_risultato id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stati_risultato ALTER COLUMN id SET DEFAULT nextval('public.stati_risultato_id_seq'::regclass);


--
-- Data for Name: circuiti; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.circuiti VALUES (1, 'silverstone', 'Silverstone Circuit', 'Silverstone', 2, 5.891, NULL, NULL, 'https://it.wikipedia.org/wiki/Circuito_di_Silverstone', '2026-08-30 08:18:57.882039+00');
INSERT INTO public.circuiti VALUES (2, 'monza', 'Autodromo Nazionale Monza', 'Monza', 1, NULL, NULL, NULL, 'https://it.wikipedia.org/wiki/Autodromo_Nazionale_Monza', '2026-08-30 08:35:44.954905+00');
INSERT INTO public.circuiti VALUES (3, 'reims', 'Reims-Gueux', 'Reims', 3, NULL, NULL, NULL, 'https://it.wikipedia.org/wiki/Circuito_di_Reims-Gueux', '2026-08-30 08:35:44.954905+00');
INSERT INTO public.circuiti VALUES (4, 'spa', 'Spa-Francorchamps', 'Stavelot', 7, NULL, NULL, NULL, 'https://it.wikipedia.org/wiki/Circuito_di_Spa-Francorchamps', '2026-08-30 08:35:44.954905+00');
INSERT INTO public.circuiti VALUES (5, 'bremgarten', 'Circuit Bremgarten', 'Berna', 8, NULL, NULL, NULL, 'https://it.wikipedia.org/wiki/Circuito_di_Bremgarten', '2026-08-30 08:35:44.954905+00');
INSERT INTO public.circuiti VALUES (6, 'monaco', 'Circuit de Monaco', 'Monte Carlo', 10, NULL, NULL, NULL, 'https://it.wikipedia.org/wiki/Circuito_di_Monaco', '2026-08-30 08:35:44.954905+00');
INSERT INTO public.circuiti VALUES (7, 'indianapolis', 'Indianapolis Motor Speedway', 'Indianapolis', 13, NULL, NULL, NULL, 'https://it.wikipedia.org/wiki/Indianapolis_Motor_Speedway', '2026-08-30 08:35:44.954905+00');


--
-- Data for Name: costruttori; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.costruttori VALUES (1, 'alfa-romeo', 'Alfa Romeo', NULL, NULL, NULL, NULL, '2026-08-30 08:19:03.303982+00');
INSERT INTO public.costruttori VALUES (2, 'talbot-lago', 'Talbot-Lago', NULL, NULL, NULL, NULL, '2026-08-30 08:19:03.303982+00');
INSERT INTO public.costruttori VALUES (3, 'era', 'ERA', NULL, NULL, NULL, NULL, '2026-08-30 08:19:03.303982+00');
INSERT INTO public.costruttori VALUES (4, 'maserati', 'Maserati', NULL, NULL, NULL, NULL, '2026-08-30 08:19:03.303982+00');
INSERT INTO public.costruttori VALUES (5, 'alta', 'Alta', NULL, NULL, NULL, NULL, '2026-08-30 08:19:03.303982+00');
INSERT INTO public.costruttori VALUES (6, 'ferrari', 'Ferrari', NULL, NULL, NULL, NULL, '2026-08-30 08:35:49.415025+00');
INSERT INTO public.costruttori VALUES (7, 'simca', 'Simca', NULL, NULL, NULL, NULL, '2026-08-30 08:35:49.415025+00');
INSERT INTO public.costruttori VALUES (8, 'cooper', 'Cooper', NULL, NULL, NULL, NULL, '2026-08-30 08:35:49.415025+00');
INSERT INTO public.costruttori VALUES (9, 'kurtis-kraft', 'Kurtis Kraft', NULL, NULL, NULL, NULL, '2026-08-30 08:35:49.904015+00');
INSERT INTO public.costruttori VALUES (10, 'deidt', 'Deidt', NULL, NULL, NULL, NULL, '2026-08-30 08:35:49.904015+00');
INSERT INTO public.costruttori VALUES (11, 'moore', 'Moore', NULL, NULL, NULL, NULL, '2026-08-30 08:35:49.904015+00');
INSERT INTO public.costruttori VALUES (12, 'lesovsky', 'Lesovsky', NULL, NULL, NULL, NULL, '2026-08-30 08:35:49.904015+00');
INSERT INTO public.costruttori VALUES (13, 'nichels', 'Nichels', NULL, NULL, NULL, NULL, '2026-08-30 08:35:49.904015+00');
INSERT INTO public.costruttori VALUES (14, 'marchese', 'Marchese', NULL, NULL, NULL, NULL, '2026-08-30 08:35:49.904015+00');
INSERT INTO public.costruttori VALUES (15, 'stevens', 'Stevens', NULL, NULL, NULL, NULL, '2026-08-30 08:35:49.904015+00');
INSERT INTO public.costruttori VALUES (16, 'langley', 'Langley', NULL, NULL, NULL, NULL, '2026-08-30 08:35:49.904015+00');
INSERT INTO public.costruttori VALUES (17, 'ewing', 'Ewing', NULL, NULL, NULL, NULL, '2026-08-30 08:35:49.904015+00');
INSERT INTO public.costruttori VALUES (18, 'rae', 'Rae', NULL, NULL, NULL, NULL, '2026-08-30 08:35:49.904015+00');
INSERT INTO public.costruttori VALUES (19, 'olson', 'Olson', NULL, NULL, NULL, NULL, '2026-08-30 08:35:49.904015+00');
INSERT INTO public.costruttori VALUES (20, 'wetteroth', 'Wetteroth', NULL, NULL, NULL, NULL, '2026-08-30 08:35:49.904015+00');
INSERT INTO public.costruttori VALUES (21, 'snowberger', 'Snowberger', NULL, NULL, NULL, NULL, '2026-08-30 08:35:49.904015+00');
INSERT INTO public.costruttori VALUES (22, 'adams', 'Adams', NULL, NULL, NULL, NULL, '2026-08-30 08:35:49.904015+00');
INSERT INTO public.costruttori VALUES (23, 'milano', 'Milano', NULL, NULL, NULL, NULL, '2026-08-30 08:35:57.882507+00');


--
-- Data for Name: gran_premi; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.gran_premi VALUES (1, 1, 1, 'British Grand Prix', NULL, '1950-05-13', NULL, NULL, NULL);
INSERT INTO public.gran_premi VALUES (2, 1, 6, 'Monaco Grand Prix', NULL, '1950-05-21', NULL, NULL, NULL);
INSERT INTO public.gran_premi VALUES (3, 1, 7, 'Indianapolis 500', NULL, '1950-05-30', NULL, NULL, NULL);
INSERT INTO public.gran_premi VALUES (4, 1, 5, 'Swiss Grand Prix', NULL, '1950-06-04', NULL, NULL, NULL);
INSERT INTO public.gran_premi VALUES (5, 1, 4, 'Belgian Grand Prix', NULL, '1950-06-18', NULL, NULL, NULL);
INSERT INTO public.gran_premi VALUES (6, 1, 3, 'French Grand Prix', NULL, '1950-07-02', NULL, NULL, NULL);
INSERT INTO public.gran_premi VALUES (7, 1, 2, 'Italian Grand Prix', NULL, '1950-09-03', NULL, NULL, NULL);


--
-- Data for Name: nazioni; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.nazioni VALUES (1, 'IT', 'Italia', 'Italiano');
INSERT INTO public.nazioni VALUES (2, 'GB', 'Regno Unito', 'Britannico');
INSERT INTO public.nazioni VALUES (3, 'FR', 'Francia', 'Francese');
INSERT INTO public.nazioni VALUES (4, 'DE', 'Germania', 'Tedesco');
INSERT INTO public.nazioni VALUES (5, 'ES', 'Spagna', 'Spagnolo');
INSERT INTO public.nazioni VALUES (6, 'NL', 'Paesi Bassi', 'Olandese');
INSERT INTO public.nazioni VALUES (7, 'BE', 'Belgio', 'Belga');
INSERT INTO public.nazioni VALUES (8, 'CH', 'Svizzera', 'Svizzero');
INSERT INTO public.nazioni VALUES (9, 'AT', 'Austria', 'Austriaco');
INSERT INTO public.nazioni VALUES (10, 'MC', 'Monaco', 'Monegasco');
INSERT INTO public.nazioni VALUES (11, 'AR', 'Argentina', 'Argentino');
INSERT INTO public.nazioni VALUES (12, 'BR', 'Brasile', 'Brasiliano');
INSERT INTO public.nazioni VALUES (13, 'US', 'Stati Uniti', 'Statunitense');
INSERT INTO public.nazioni VALUES (14, 'MX', 'Messico', 'Messicano');
INSERT INTO public.nazioni VALUES (15, 'CA', 'Canada', 'Canadese');
INSERT INTO public.nazioni VALUES (16, 'AU', 'Australia', 'Australiano');
INSERT INTO public.nazioni VALUES (17, 'NZ', 'Nuova Zelanda', 'Neozelandese');
INSERT INTO public.nazioni VALUES (18, 'JP', 'Giappone', 'Giapponese');
INSERT INTO public.nazioni VALUES (19, 'TH', 'Thailandia', 'Thailandese');
INSERT INTO public.nazioni VALUES (20, 'ZA', 'Sudafrica', 'Sudafricano');
INSERT INTO public.nazioni VALUES (21, 'FI', 'Finlandia', 'Finlandese');
INSERT INTO public.nazioni VALUES (22, 'SE', 'Svezia', 'Svedese');
INSERT INTO public.nazioni VALUES (23, 'DK', 'Danimarca', 'Danese');
INSERT INTO public.nazioni VALUES (24, 'PL', 'Polonia', 'Polacco');
INSERT INTO public.nazioni VALUES (25, 'IE', 'Irlanda', 'Irlandese');


--
-- Data for Name: piloti; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.piloti VALUES (1, 'nino-farina', NULL, 'Nino', 'Farina', NULL, NULL, 1, NULL, '2026-08-30 08:19:03.303982+00');
INSERT INTO public.piloti VALUES (2, 'luigi-fagioli', NULL, 'Luigi', 'Fagioli', NULL, NULL, 1, NULL, '2026-08-30 08:19:03.303982+00');
INSERT INTO public.piloti VALUES (3, 'reg-parnell', NULL, 'Reg', 'Parnell', NULL, NULL, 2, NULL, '2026-08-30 08:19:03.303982+00');
INSERT INTO public.piloti VALUES (4, 'yves-cabantous', NULL, 'Yves', 'Cabantous', NULL, NULL, 3, NULL, '2026-08-30 08:19:03.303982+00');
INSERT INTO public.piloti VALUES (5, 'louis-rosier', NULL, 'Louis', 'Rosier', NULL, NULL, 3, NULL, '2026-08-30 08:19:03.303982+00');
INSERT INTO public.piloti VALUES (6, 'bob-gerard', NULL, 'Bob', 'Gerard', NULL, NULL, 2, NULL, '2026-08-30 08:19:03.303982+00');
INSERT INTO public.piloti VALUES (7, 'cuth-harrison', NULL, 'Cuth', 'Harrison', NULL, NULL, 2, NULL, '2026-08-30 08:19:03.303982+00');
INSERT INTO public.piloti VALUES (8, 'philippe-etancelin', NULL, 'Philippe', 'Etancelin', NULL, NULL, 3, NULL, '2026-08-30 08:19:03.303982+00');
INSERT INTO public.piloti VALUES (9, 'david-hampshire', NULL, 'David', 'Hampshire', NULL, NULL, 2, NULL, '2026-08-30 08:19:03.303982+00');
INSERT INTO public.piloti VALUES (10, 'joe-fry', NULL, 'Joe', 'Fry', NULL, NULL, 2, NULL, '2026-08-30 08:19:03.303982+00');
INSERT INTO public.piloti VALUES (11, 'brian-shawe-taylor', NULL, 'Brian', 'Shawe Taylor', NULL, NULL, 2, NULL, '2026-08-30 08:19:03.303982+00');
INSERT INTO public.piloti VALUES (12, 'johnny-claes', NULL, 'Johnny', 'Claes', NULL, NULL, 7, NULL, '2026-08-30 08:19:03.303982+00');
INSERT INTO public.piloti VALUES (13, 'juan-manuel-fangio', NULL, 'Juan', 'Manuel Fangio', NULL, NULL, 11, NULL, '2026-08-30 08:19:03.303982+00');
INSERT INTO public.piloti VALUES (14, 'joe-kelly', NULL, 'Joe', 'Kelly', NULL, NULL, 25, NULL, '2026-08-30 08:19:03.303982+00');
INSERT INTO public.piloti VALUES (15, 'prince-bira', NULL, 'Prince', 'Bira', NULL, NULL, 19, NULL, '2026-08-30 08:19:03.303982+00');
INSERT INTO public.piloti VALUES (16, 'david-murray', NULL, 'David', 'Murray', NULL, NULL, 2, NULL, '2026-08-30 08:19:03.303982+00');
INSERT INTO public.piloti VALUES (17, 'geoff-crossley', NULL, 'Geoff', 'Crossley', NULL, NULL, 2, NULL, '2026-08-30 08:19:03.303982+00');
INSERT INTO public.piloti VALUES (18, 'toulo-de-graffenried', NULL, 'Toulo', 'de Graffenried', NULL, NULL, 8, NULL, '2026-08-30 08:19:03.303982+00');
INSERT INTO public.piloti VALUES (19, 'louis-chiron', NULL, 'Louis', 'Chiron', NULL, NULL, 10, NULL, '2026-08-30 08:19:03.303982+00');
INSERT INTO public.piloti VALUES (20, 'eugene-martin', NULL, 'Eugene', 'Martin', NULL, NULL, 3, NULL, '2026-08-30 08:19:03.303982+00');
INSERT INTO public.piloti VALUES (21, 'tony-rolt', NULL, 'Tony', 'Rolt', NULL, NULL, 2, NULL, '2026-08-30 08:19:03.303982+00');
INSERT INTO public.piloti VALUES (22, 'peter-walker', NULL, 'Peter', 'Walker', NULL, NULL, 2, NULL, '2026-08-30 08:19:03.303982+00');
INSERT INTO public.piloti VALUES (23, 'leslie-johnson', NULL, 'Leslie', 'Johnson', NULL, NULL, 2, NULL, '2026-08-30 08:19:03.303982+00');
INSERT INTO public.piloti VALUES (24, 'alberto-ascari', NULL, 'Alberto', 'Ascari', NULL, NULL, 1, NULL, '2026-08-30 08:35:49.415025+00');
INSERT INTO public.piloti VALUES (25, 'raymond-sommer', NULL, 'Raymond', 'Sommer', NULL, NULL, 3, NULL, '2026-08-30 08:35:49.415025+00');
INSERT INTO public.piloti VALUES (26, 'luigi-villoresi', NULL, 'Luigi', 'Villoresi', NULL, NULL, 1, NULL, '2026-08-30 08:35:49.415025+00');
INSERT INTO public.piloti VALUES (27, 'jose-froilan-gonzalez', NULL, 'José', 'Froilán González', NULL, NULL, 11, NULL, '2026-08-30 08:35:49.415025+00');
INSERT INTO public.piloti VALUES (28, 'robert-manzon', NULL, 'Robert', 'Manzon', NULL, NULL, 3, NULL, '2026-08-30 08:35:49.415025+00');
INSERT INTO public.piloti VALUES (29, 'maurice-trintignant', NULL, 'Maurice', 'Trintignant', NULL, NULL, 3, NULL, '2026-08-30 08:35:49.415025+00');
INSERT INTO public.piloti VALUES (30, 'franco-rol', NULL, 'Franco', 'Rol', NULL, NULL, 1, NULL, '2026-08-30 08:35:49.415025+00');
INSERT INTO public.piloti VALUES (31, 'harry-schell', NULL, 'Harry', 'Schell', NULL, NULL, 13, NULL, '2026-08-30 08:35:49.415025+00');
INSERT INTO public.piloti VALUES (32, 'peter-whitehead', NULL, 'Peter', 'Whitehead', NULL, NULL, 2, NULL, '2026-08-30 08:35:49.415025+00');
INSERT INTO public.piloti VALUES (33, 'alfredo-pian', NULL, 'Alfredo', 'Pián', NULL, NULL, 11, NULL, '2026-08-30 08:35:49.415025+00');
INSERT INTO public.piloti VALUES (34, 'johnnie-parsons', NULL, 'Johnnie', 'Parsons', NULL, NULL, 13, NULL, '2026-08-30 08:35:49.904015+00');
INSERT INTO public.piloti VALUES (35, 'bill-holland', NULL, 'Bill', 'Holland', NULL, NULL, 13, NULL, '2026-08-30 08:35:49.904015+00');
INSERT INTO public.piloti VALUES (36, 'mauri-rose', NULL, 'Mauri', 'Rose', NULL, NULL, 13, NULL, '2026-08-30 08:35:49.904015+00');
INSERT INTO public.piloti VALUES (37, 'cecil-green', NULL, 'Cecil', 'Green', NULL, NULL, 13, NULL, '2026-08-30 08:35:49.904015+00');
INSERT INTO public.piloti VALUES (38, 'tony-bettenhausen', NULL, 'Tony', 'Bettenhausen', NULL, NULL, 13, NULL, '2026-08-30 08:35:49.904015+00');
INSERT INTO public.piloti VALUES (39, 'joie-chitwood', NULL, 'Joie', 'Chitwood', NULL, NULL, 13, NULL, '2026-08-30 08:35:49.904015+00');
INSERT INTO public.piloti VALUES (40, 'lee-wallard', NULL, 'Lee', 'Wallard', NULL, NULL, 13, NULL, '2026-08-30 08:35:49.904015+00');
INSERT INTO public.piloti VALUES (41, 'walt-faulkner', NULL, 'Walt', 'Faulkner', NULL, NULL, 13, NULL, '2026-08-30 08:35:49.904015+00');
INSERT INTO public.piloti VALUES (42, 'george-connor', NULL, 'George', 'Connor', NULL, NULL, 13, NULL, '2026-08-30 08:35:49.904015+00');
INSERT INTO public.piloti VALUES (43, 'paul-russo', NULL, 'Paul', 'Russo', NULL, NULL, 13, NULL, '2026-08-30 08:35:49.904015+00');
INSERT INTO public.piloti VALUES (44, 'pat-flaherty', NULL, 'Pat', 'Flaherty', NULL, NULL, 13, NULL, '2026-08-30 08:35:49.904015+00');
INSERT INTO public.piloti VALUES (45, 'myron-fohr', NULL, 'Myron', 'Fohr', NULL, NULL, 13, NULL, '2026-08-30 08:35:49.904015+00');
INSERT INTO public.piloti VALUES (46, 'duane-carter', NULL, 'Duane', 'Carter', NULL, NULL, 13, NULL, '2026-08-30 08:35:49.904015+00');
INSERT INTO public.piloti VALUES (47, 'mack-hellings', NULL, 'Mack', 'Hellings', NULL, NULL, 13, NULL, '2026-08-30 08:35:49.904015+00');
INSERT INTO public.piloti VALUES (48, 'jack-mcgrath', NULL, 'Jack', 'McGrath', NULL, NULL, 13, NULL, '2026-08-30 08:35:49.904015+00');
INSERT INTO public.piloti VALUES (49, 'troy-ruttman', NULL, 'Troy', 'Ruttman', NULL, NULL, 13, NULL, '2026-08-30 08:35:49.904015+00');
INSERT INTO public.piloti VALUES (50, 'gene-hartley', NULL, 'Gene', 'Hartley', NULL, NULL, 13, NULL, '2026-08-30 08:35:49.904015+00');
INSERT INTO public.piloti VALUES (51, 'jimmy-davies', NULL, 'Jimmy', 'Davies', NULL, NULL, 13, NULL, '2026-08-30 08:35:49.904015+00');
INSERT INTO public.piloti VALUES (52, 'johnny-mcdowell', NULL, 'Johnny', 'McDowell', NULL, NULL, 13, NULL, '2026-08-30 08:35:49.904015+00');
INSERT INTO public.piloti VALUES (53, 'walt-brown', NULL, 'Walt', 'Brown', NULL, NULL, 13, NULL, '2026-08-30 08:35:49.904015+00');
INSERT INTO public.piloti VALUES (54, 'travis-webb', NULL, 'Travis', 'Webb', NULL, NULL, 13, NULL, '2026-08-30 08:35:49.904015+00');
INSERT INTO public.piloti VALUES (55, 'jerry-hoyt', NULL, 'Jerry', 'Hoyt', NULL, NULL, 13, NULL, '2026-08-30 08:35:49.904015+00');
INSERT INTO public.piloti VALUES (56, 'walt-ader', NULL, 'Walt', 'Ader', NULL, NULL, 13, NULL, '2026-08-30 08:35:49.904015+00');
INSERT INTO public.piloti VALUES (57, 'jackie-holmes', NULL, 'Jackie', 'Holmes', NULL, NULL, 13, NULL, '2026-08-30 08:35:49.904015+00');
INSERT INTO public.piloti VALUES (58, 'jim-rathmann', NULL, 'Jim', 'Rathmann', NULL, NULL, 13, NULL, '2026-08-30 08:35:49.904015+00');
INSERT INTO public.piloti VALUES (59, 'henry-banks', NULL, 'Henry', 'Banks', NULL, NULL, 13, NULL, '2026-08-30 08:35:49.904015+00');
INSERT INTO public.piloti VALUES (60, 'bill-schindler', NULL, 'Bill', 'Schindler', NULL, NULL, 13, NULL, '2026-08-30 08:35:49.904015+00');
INSERT INTO public.piloti VALUES (61, 'bayliss-levrett', NULL, 'Bayliss', 'Levrett', NULL, NULL, 13, NULL, '2026-08-30 08:35:49.904015+00');
INSERT INTO public.piloti VALUES (62, 'bill-cantrell', NULL, 'Bill', 'Cantrell', NULL, NULL, 13, NULL, '2026-08-30 08:35:49.904015+00');
INSERT INTO public.piloti VALUES (63, 'fred-agabashian', NULL, 'Fred', 'Agabashian', NULL, NULL, 13, NULL, '2026-08-30 08:35:49.904015+00');
INSERT INTO public.piloti VALUES (64, 'felice-bonetto', NULL, 'Felice', 'Bonetto', NULL, NULL, 1, NULL, '2026-08-30 08:35:56.439046+00');
INSERT INTO public.piloti VALUES (65, 'nello-pagani', NULL, 'Nello', 'Pagani', NULL, NULL, 1, NULL, '2026-08-30 08:35:56.439046+00');
INSERT INTO public.piloti VALUES (66, 'toni-branca', NULL, 'Toni', 'Branca', NULL, NULL, 8, NULL, '2026-08-30 08:35:56.439046+00');
INSERT INTO public.piloti VALUES (67, 'pierre-levegh', NULL, 'Pierre', 'Levegh', NULL, NULL, 3, NULL, '2026-08-30 08:35:56.920848+00');
INSERT INTO public.piloti VALUES (68, 'eugene-chaboud', NULL, 'Eugène', 'Chaboud', NULL, NULL, 3, NULL, '2026-08-30 08:35:56.920848+00');
INSERT INTO public.piloti VALUES (69, 'charles-pozzi', NULL, 'Charles', 'Pozzi', NULL, NULL, 3, NULL, '2026-08-30 08:35:57.399876+00');
INSERT INTO public.piloti VALUES (70, 'dorino-serafini', NULL, 'Dorino', 'Serafini', NULL, NULL, 1, NULL, '2026-08-30 08:35:57.882507+00');
INSERT INTO public.piloti VALUES (71, 'guy-mairesse', NULL, 'Guy', 'Mairesse', NULL, NULL, 3, NULL, '2026-08-30 08:35:57.882507+00');
INSERT INTO public.piloti VALUES (72, 'piero-taruffi', NULL, 'Piero', 'Taruffi', NULL, NULL, 1, NULL, '2026-08-30 08:35:57.882507+00');
INSERT INTO public.piloti VALUES (73, 'clemente-biondetti', NULL, 'Clemente', 'Biondetti', NULL, NULL, 1, NULL, '2026-08-30 08:35:57.882507+00');
INSERT INTO public.piloti VALUES (74, 'henri-louveau', NULL, 'Henri', 'Louveau', NULL, NULL, 3, NULL, '2026-08-30 08:35:57.882507+00');
INSERT INTO public.piloti VALUES (75, 'franco-comotti', NULL, 'Franco', 'Comotti', NULL, NULL, 1, NULL, '2026-08-30 08:35:57.882507+00');
INSERT INTO public.piloti VALUES (76, 'consalvo-sanesi', NULL, 'Consalvo', 'Sanesi', NULL, NULL, 1, NULL, '2026-08-30 08:35:57.882507+00');
INSERT INTO public.piloti VALUES (77, 'paul-pietsch', NULL, 'Paul', 'Pietsch', NULL, NULL, 4, NULL, '2026-08-30 08:35:57.882507+00');


--
-- Data for Name: punti_per_posizione; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.punti_per_posizione VALUES (1, 1, 1, 25.00);
INSERT INTO public.punti_per_posizione VALUES (2, 1, 2, 18.00);
INSERT INTO public.punti_per_posizione VALUES (3, 1, 3, 15.00);
INSERT INTO public.punti_per_posizione VALUES (4, 1, 4, 12.00);
INSERT INTO public.punti_per_posizione VALUES (5, 1, 5, 10.00);
INSERT INTO public.punti_per_posizione VALUES (6, 1, 6, 8.00);
INSERT INTO public.punti_per_posizione VALUES (7, 1, 7, 6.00);
INSERT INTO public.punti_per_posizione VALUES (8, 1, 8, 4.00);
INSERT INTO public.punti_per_posizione VALUES (9, 1, 9, 2.00);
INSERT INTO public.punti_per_posizione VALUES (10, 1, 10, 1.00);
INSERT INTO public.punti_per_posizione VALUES (11, 2, 1, 8.00);
INSERT INTO public.punti_per_posizione VALUES (12, 2, 2, 6.00);
INSERT INTO public.punti_per_posizione VALUES (13, 2, 3, 4.00);
INSERT INTO public.punti_per_posizione VALUES (14, 2, 4, 3.00);
INSERT INTO public.punti_per_posizione VALUES (15, 2, 5, 2.00);


--
-- Data for Name: risultati_gara; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.risultati_gara VALUES (1, 1, 1, NULL, 1, NULL, NULL, 1, NULL, 1, NULL, 70, '02:13:23.6', NULL, 0.00, false, NULL, '2026-08-30 08:19:03.303982+00');
INSERT INTO public.risultati_gara VALUES (2, 1, 2, NULL, 1, NULL, NULL, 2, NULL, 1, NULL, 70, NULL, '+2.600', 0.00, false, NULL, '2026-08-30 08:19:03.303982+00');
INSERT INTO public.risultati_gara VALUES (3, 1, 3, NULL, 1, NULL, NULL, 3, NULL, 1, NULL, 70, NULL, '+52.000', 0.00, false, NULL, '2026-08-30 08:19:03.303982+00');
INSERT INTO public.risultati_gara VALUES (4, 1, 4, NULL, 2, NULL, NULL, 4, NULL, 1, NULL, 68, NULL, '+2 Laps', 0.00, false, NULL, '2026-08-30 08:19:03.303982+00');
INSERT INTO public.risultati_gara VALUES (5, 1, 5, NULL, 2, NULL, NULL, 5, NULL, 1, NULL, 68, NULL, '+2 Laps', 0.00, false, NULL, '2026-08-30 08:19:03.303982+00');
INSERT INTO public.risultati_gara VALUES (6, 1, 6, NULL, 3, NULL, NULL, 6, NULL, 1, NULL, 67, NULL, '+3 Laps', 0.00, false, NULL, '2026-08-30 08:19:03.303982+00');
INSERT INTO public.risultati_gara VALUES (7, 1, 7, NULL, 3, NULL, NULL, 7, NULL, 1, NULL, 67, NULL, '+3 Laps', 0.00, false, NULL, '2026-08-30 08:19:03.303982+00');
INSERT INTO public.risultati_gara VALUES (8, 1, 8, NULL, 2, NULL, NULL, 8, NULL, 1, NULL, 65, NULL, '+5 Laps', 0.00, false, NULL, '2026-08-30 08:19:03.303982+00');
INSERT INTO public.risultati_gara VALUES (9, 1, 9, NULL, 4, NULL, NULL, 9, NULL, 1, NULL, 64, NULL, '+6 Laps', 0.00, false, NULL, '2026-08-30 08:19:03.303982+00');
INSERT INTO public.risultati_gara VALUES (10, 1, 10, NULL, 4, NULL, NULL, 10, NULL, 1, NULL, 64, NULL, '+6 Laps', 0.00, false, NULL, '2026-08-30 08:19:03.303982+00');
INSERT INTO public.risultati_gara VALUES (11, 1, 11, NULL, 4, NULL, NULL, 10, NULL, 1, NULL, 64, NULL, '+6 Laps', 0.00, false, NULL, '2026-08-30 08:19:03.303982+00');
INSERT INTO public.risultati_gara VALUES (12, 1, 12, NULL, 2, NULL, NULL, 11, NULL, 1, NULL, 64, NULL, '+6 Laps', 0.00, false, NULL, '2026-08-30 08:19:03.303982+00');
INSERT INTO public.risultati_gara VALUES (13, 1, 13, NULL, 1, NULL, NULL, NULL, NULL, 2, 'Oil leak', 62, NULL, NULL, 0.00, false, NULL, '2026-08-30 08:19:03.303982+00');
INSERT INTO public.risultati_gara VALUES (14, 1, 14, NULL, 5, NULL, NULL, NULL, NULL, 6, 'Not classified', 57, NULL, NULL, 0.00, false, NULL, '2026-08-30 08:19:03.303982+00');
INSERT INTO public.risultati_gara VALUES (15, 1, 15, NULL, 4, NULL, NULL, NULL, NULL, 2, 'Out of fuel', 49, NULL, NULL, 0.00, false, NULL, '2026-08-30 08:19:03.303982+00');
INSERT INTO public.risultati_gara VALUES (16, 1, 16, NULL, 4, NULL, NULL, NULL, NULL, 4, 'Engine', 44, NULL, NULL, 0.00, false, NULL, '2026-08-30 08:19:03.303982+00');
INSERT INTO public.risultati_gara VALUES (17, 1, 17, NULL, 5, NULL, NULL, NULL, NULL, 2, 'Transmission', 43, NULL, NULL, 0.00, false, NULL, '2026-08-30 08:19:03.303982+00');
INSERT INTO public.risultati_gara VALUES (18, 1, 18, NULL, 4, NULL, NULL, NULL, NULL, 4, 'Engine', 36, NULL, NULL, 0.00, false, NULL, '2026-08-30 08:19:03.303982+00');
INSERT INTO public.risultati_gara VALUES (19, 1, 19, NULL, 4, NULL, NULL, NULL, NULL, 2, 'Clutch', 26, NULL, NULL, 0.00, false, NULL, '2026-08-30 08:19:03.303982+00');
INSERT INTO public.risultati_gara VALUES (20, 1, 20, NULL, 2, NULL, NULL, NULL, NULL, 2, 'Oil pressure', 8, NULL, NULL, 0.00, false, NULL, '2026-08-30 08:19:03.303982+00');
INSERT INTO public.risultati_gara VALUES (21, 1, 21, NULL, 3, NULL, NULL, NULL, NULL, 2, 'Gearbox', 5, NULL, NULL, 0.00, false, NULL, '2026-08-30 08:19:03.303982+00');
INSERT INTO public.risultati_gara VALUES (22, 1, 22, NULL, 3, NULL, NULL, NULL, NULL, 2, 'Gearbox', 5, NULL, NULL, 0.00, false, NULL, '2026-08-30 08:19:03.303982+00');
INSERT INTO public.risultati_gara VALUES (23, 1, 23, NULL, 3, NULL, NULL, NULL, NULL, 2, 'Supercharger', 2, NULL, NULL, 0.00, false, NULL, '2026-08-30 08:19:03.303982+00');
INSERT INTO public.risultati_gara VALUES (24, 2, 13, NULL, 1, NULL, NULL, 1, NULL, 1, NULL, 100, '03:13:18.7', NULL, 0.00, false, NULL, '2026-08-30 08:35:49.415025+00');
INSERT INTO public.risultati_gara VALUES (25, 2, 24, NULL, 6, NULL, NULL, 2, NULL, 1, NULL, 99, NULL, '+1 Lap', 0.00, false, NULL, '2026-08-30 08:35:49.415025+00');
INSERT INTO public.risultati_gara VALUES (26, 2, 19, NULL, 4, NULL, NULL, 3, NULL, 1, NULL, 98, NULL, '+2 Laps', 0.00, false, NULL, '2026-08-30 08:35:49.415025+00');
INSERT INTO public.risultati_gara VALUES (27, 2, 25, NULL, 6, NULL, NULL, 4, NULL, 1, NULL, 97, NULL, '+3 Laps', 0.00, false, NULL, '2026-08-30 08:35:49.415025+00');
INSERT INTO public.risultati_gara VALUES (28, 2, 15, NULL, 4, NULL, NULL, 5, NULL, 1, NULL, 95, NULL, '+5 Laps', 0.00, false, NULL, '2026-08-30 08:35:49.415025+00');
INSERT INTO public.risultati_gara VALUES (29, 2, 6, NULL, 3, NULL, NULL, 6, NULL, 1, NULL, 94, NULL, '+6 Laps', 0.00, false, NULL, '2026-08-30 08:35:49.415025+00');
INSERT INTO public.risultati_gara VALUES (30, 2, 12, NULL, 2, NULL, NULL, 7, NULL, 1, NULL, 94, NULL, '+6 Laps', 0.00, false, NULL, '2026-08-30 08:35:49.415025+00');
INSERT INTO public.risultati_gara VALUES (31, 2, 26, NULL, 6, NULL, NULL, NULL, NULL, 2, 'Axle', 63, NULL, NULL, 0.00, false, NULL, '2026-08-30 08:35:49.415025+00');
INSERT INTO public.risultati_gara VALUES (32, 2, 8, NULL, 2, NULL, NULL, NULL, NULL, 2, 'Oil leak', 38, NULL, NULL, 0.00, false, NULL, '2026-08-30 08:35:49.415025+00');
INSERT INTO public.risultati_gara VALUES (33, 2, 27, NULL, 4, NULL, NULL, NULL, NULL, 3, 'Accident', 1, NULL, NULL, 0.00, false, NULL, '2026-08-30 08:35:49.415025+00');
INSERT INTO public.risultati_gara VALUES (34, 2, 1, NULL, 1, NULL, NULL, NULL, NULL, 3, 'Accident', 0, NULL, NULL, 0.00, false, NULL, '2026-08-30 08:35:49.415025+00');
INSERT INTO public.risultati_gara VALUES (35, 2, 2, NULL, 1, NULL, NULL, NULL, NULL, 3, 'Accident', 0, NULL, NULL, 0.00, false, NULL, '2026-08-30 08:35:49.415025+00');
INSERT INTO public.risultati_gara VALUES (36, 2, 5, NULL, 2, NULL, NULL, NULL, NULL, 3, 'Accident', 0, NULL, NULL, 0.00, false, NULL, '2026-08-30 08:35:49.415025+00');
INSERT INTO public.risultati_gara VALUES (37, 2, 28, NULL, 7, NULL, NULL, NULL, NULL, 3, 'Accident', 0, NULL, NULL, 0.00, false, NULL, '2026-08-30 08:35:49.415025+00');
INSERT INTO public.risultati_gara VALUES (38, 2, 18, NULL, 4, NULL, NULL, NULL, NULL, 3, 'Accident', 0, NULL, NULL, 0.00, false, NULL, '2026-08-30 08:35:49.415025+00');
INSERT INTO public.risultati_gara VALUES (39, 2, 29, NULL, 7, NULL, NULL, NULL, NULL, 3, 'Accident', 0, NULL, NULL, 0.00, false, NULL, '2026-08-30 08:35:49.415025+00');
INSERT INTO public.risultati_gara VALUES (40, 2, 7, NULL, 3, NULL, NULL, NULL, NULL, 3, 'Accident', 0, NULL, NULL, 0.00, false, NULL, '2026-08-30 08:35:49.415025+00');
INSERT INTO public.risultati_gara VALUES (41, 2, 30, NULL, 4, NULL, NULL, NULL, NULL, 3, 'Accident', 0, NULL, NULL, 0.00, false, NULL, '2026-08-30 08:35:49.415025+00');
INSERT INTO public.risultati_gara VALUES (42, 2, 31, NULL, 8, NULL, NULL, NULL, NULL, 3, 'Collision', 0, NULL, NULL, 0.00, false, NULL, '2026-08-30 08:35:49.415025+00');
INSERT INTO public.risultati_gara VALUES (43, 2, 32, NULL, 6, NULL, NULL, NULL, NULL, 4, 'Engine', 0, NULL, NULL, 0.00, false, NULL, '2026-08-30 08:35:49.415025+00');
INSERT INTO public.risultati_gara VALUES (44, 2, 33, NULL, 4, NULL, NULL, NULL, NULL, 3, 'Accident', 0, NULL, NULL, 0.00, false, NULL, '2026-08-30 08:35:49.415025+00');
INSERT INTO public.risultati_gara VALUES (45, 3, 34, NULL, 9, NULL, NULL, 1, NULL, 1, NULL, 138, '02:46:55.97', NULL, 0.00, false, NULL, '2026-08-30 08:35:49.904015+00');
INSERT INTO public.risultati_gara VALUES (46, 3, 35, NULL, 10, NULL, NULL, 2, NULL, 1, NULL, 137, NULL, '+1 Lap', 0.00, false, NULL, '2026-08-30 08:35:49.904015+00');
INSERT INTO public.risultati_gara VALUES (47, 3, 36, NULL, 10, NULL, NULL, 3, NULL, 1, NULL, 137, NULL, '+1 Lap', 0.00, false, NULL, '2026-08-30 08:35:49.904015+00');
INSERT INTO public.risultati_gara VALUES (48, 3, 37, NULL, 9, NULL, NULL, 4, NULL, 1, NULL, 137, NULL, '+1 Lap', 0.00, false, NULL, '2026-08-30 08:35:49.904015+00');
INSERT INTO public.risultati_gara VALUES (49, 3, 38, NULL, 9, NULL, NULL, 5, NULL, 1, NULL, 136, NULL, '+2 Laps', 0.00, false, NULL, '2026-08-30 08:35:49.904015+00');
INSERT INTO public.risultati_gara VALUES (50, 3, 39, NULL, 9, NULL, NULL, 6, NULL, 1, NULL, 136, NULL, '+2 Laps', 0.00, false, NULL, '2026-08-30 08:35:49.904015+00');
INSERT INTO public.risultati_gara VALUES (51, 3, 40, NULL, 11, NULL, NULL, 7, NULL, 1, NULL, 136, NULL, '+2 Laps', 0.00, false, NULL, '2026-08-30 08:35:49.904015+00');
INSERT INTO public.risultati_gara VALUES (52, 3, 41, NULL, 9, NULL, NULL, 8, NULL, 1, NULL, 135, NULL, '+3 Laps', 0.00, false, NULL, '2026-08-30 08:35:49.904015+00');
INSERT INTO public.risultati_gara VALUES (53, 3, 42, NULL, 12, NULL, NULL, 9, NULL, 1, NULL, 135, NULL, '+3 Laps', 0.00, false, NULL, '2026-08-30 08:35:49.904015+00');
INSERT INTO public.risultati_gara VALUES (54, 3, 43, NULL, 13, NULL, NULL, 10, NULL, 1, NULL, 135, NULL, '+3 Laps', 0.00, false, NULL, '2026-08-30 08:35:49.904015+00');
INSERT INTO public.risultati_gara VALUES (55, 3, 44, NULL, 9, NULL, NULL, 11, NULL, 1, NULL, 135, NULL, '+3 Laps', 0.00, false, NULL, '2026-08-30 08:35:49.904015+00');
INSERT INTO public.risultati_gara VALUES (56, 3, 45, NULL, 14, NULL, NULL, 12, NULL, 1, NULL, 133, NULL, '+5 Laps', 0.00, false, NULL, '2026-08-30 08:35:49.904015+00');
INSERT INTO public.risultati_gara VALUES (57, 3, 46, NULL, 15, NULL, NULL, 13, NULL, 1, NULL, 133, NULL, '+5 Laps', 0.00, false, NULL, '2026-08-30 08:35:49.904015+00');
INSERT INTO public.risultati_gara VALUES (58, 3, 47, NULL, 9, NULL, NULL, 14, NULL, 1, NULL, 132, NULL, '+6 Laps', 0.00, false, NULL, '2026-08-30 08:35:49.904015+00');
INSERT INTO public.risultati_gara VALUES (59, 3, 48, NULL, 9, NULL, NULL, 15, NULL, 1, 'Spun off', 131, NULL, NULL, 0.00, false, NULL, '2026-08-30 08:35:49.904015+00');
INSERT INTO public.risultati_gara VALUES (60, 3, 49, NULL, 12, NULL, NULL, 16, NULL, 1, NULL, 130, NULL, '+8 Laps', 0.00, false, NULL, '2026-08-30 08:35:49.904015+00');
INSERT INTO public.risultati_gara VALUES (61, 3, 50, NULL, 16, NULL, NULL, 17, NULL, 1, NULL, 128, NULL, '+10 Laps', 0.00, false, NULL, '2026-08-30 08:35:49.904015+00');
INSERT INTO public.risultati_gara VALUES (62, 3, 51, NULL, 17, NULL, NULL, 18, NULL, 1, NULL, 128, NULL, '+10 Laps', 0.00, false, NULL, '2026-08-30 08:35:49.904015+00');
INSERT INTO public.risultati_gara VALUES (63, 3, 52, NULL, 9, NULL, NULL, 19, NULL, 1, NULL, 128, NULL, '+10 Laps', 0.00, false, NULL, '2026-08-30 08:35:49.904015+00');
INSERT INTO public.risultati_gara VALUES (64, 3, 53, NULL, 9, NULL, NULL, 20, NULL, 1, NULL, 127, NULL, '+11 Laps', 0.00, false, NULL, '2026-08-30 08:35:49.904015+00');
INSERT INTO public.risultati_gara VALUES (65, 3, 54, NULL, 4, NULL, NULL, 21, NULL, 1, NULL, 126, NULL, '+12 Laps', 0.00, false, NULL, '2026-08-30 08:35:49.904015+00');
INSERT INTO public.risultati_gara VALUES (66, 3, 55, NULL, 9, NULL, NULL, 22, NULL, 1, NULL, 125, NULL, '+13 Laps', 0.00, false, NULL, '2026-08-30 08:35:49.904015+00');
INSERT INTO public.risultati_gara VALUES (67, 3, 56, NULL, 18, NULL, NULL, 23, NULL, 1, NULL, 123, NULL, '+15 Laps', 0.00, false, NULL, '2026-08-30 08:35:49.904015+00');
INSERT INTO public.risultati_gara VALUES (68, 3, 57, NULL, 19, NULL, NULL, 24, NULL, 1, 'Spun off', 123, NULL, NULL, 0.00, false, NULL, '2026-08-30 08:35:49.904015+00');
INSERT INTO public.risultati_gara VALUES (69, 3, 58, NULL, 20, NULL, NULL, 25, NULL, 1, NULL, 122, NULL, '+16 Laps', 0.00, false, NULL, '2026-08-30 08:35:49.904015+00');
INSERT INTO public.risultati_gara VALUES (70, 3, 59, NULL, 4, NULL, NULL, NULL, NULL, 2, 'Oil line', 112, NULL, NULL, 0.00, false, NULL, '2026-08-30 08:35:49.904015+00');
INSERT INTO public.risultati_gara VALUES (71, 3, 60, NULL, 21, NULL, NULL, NULL, NULL, 2, 'Transmission', 111, NULL, NULL, 0.00, false, NULL, '2026-08-30 08:35:49.904015+00');
INSERT INTO public.risultati_gara VALUES (72, 3, 61, NULL, 22, NULL, NULL, NULL, NULL, 2, 'Oil pressure', 108, NULL, NULL, 0.00, false, NULL, '2026-08-30 08:35:49.904015+00');
INSERT INTO public.risultati_gara VALUES (73, 3, 62, NULL, 22, NULL, NULL, NULL, NULL, 2, 'Oil pressure', 108, NULL, NULL, 0.00, false, NULL, '2026-08-30 08:35:49.904015+00');
INSERT INTO public.risultati_gara VALUES (74, 3, 63, NULL, 9, NULL, NULL, NULL, NULL, 2, 'Oil leak', 64, NULL, NULL, 0.00, false, NULL, '2026-08-30 08:35:49.904015+00');
INSERT INTO public.risultati_gara VALUES (75, 4, 1, NULL, 1, NULL, NULL, 1, NULL, 1, NULL, 42, '02:02:53.7', NULL, 0.00, false, NULL, '2026-08-30 08:35:56.439046+00');
INSERT INTO public.risultati_gara VALUES (76, 4, 2, NULL, 1, NULL, NULL, 2, NULL, 1, NULL, 42, NULL, '+0.400', 0.00, false, NULL, '2026-08-30 08:35:56.439046+00');
INSERT INTO public.risultati_gara VALUES (77, 4, 5, NULL, 2, NULL, NULL, 3, NULL, 1, NULL, 41, NULL, '+1 Lap', 0.00, false, NULL, '2026-08-30 08:35:56.439046+00');
INSERT INTO public.risultati_gara VALUES (78, 4, 15, NULL, 4, NULL, NULL, 4, NULL, 1, NULL, 40, NULL, '+2 Laps', 0.00, false, NULL, '2026-08-30 08:35:56.439046+00');
INSERT INTO public.risultati_gara VALUES (79, 4, 64, NULL, 4, NULL, NULL, 5, NULL, 1, NULL, 40, NULL, '+2 Laps', 0.00, false, NULL, '2026-08-30 08:35:56.439046+00');
INSERT INTO public.risultati_gara VALUES (80, 4, 18, NULL, 4, NULL, NULL, 6, NULL, 1, NULL, 40, NULL, '+2 Laps', 0.00, false, NULL, '2026-08-30 08:35:56.439046+00');
INSERT INTO public.risultati_gara VALUES (81, 4, 65, NULL, 4, NULL, NULL, 7, NULL, 1, NULL, 39, NULL, '+3 Laps', 0.00, false, NULL, '2026-08-30 08:35:56.439046+00');
INSERT INTO public.risultati_gara VALUES (82, 4, 31, NULL, 2, NULL, NULL, 8, NULL, 1, NULL, 39, NULL, '+3 Laps', 0.00, false, NULL, '2026-08-30 08:35:56.439046+00');
INSERT INTO public.risultati_gara VALUES (83, 4, 19, NULL, 4, NULL, NULL, 9, NULL, 1, NULL, 39, NULL, '+3 Laps', 0.00, false, NULL, '2026-08-30 08:35:56.439046+00');
INSERT INTO public.risultati_gara VALUES (84, 4, 12, NULL, 2, NULL, NULL, 10, NULL, 1, NULL, 38, NULL, '+4 Laps', 0.00, false, NULL, '2026-08-30 08:35:56.439046+00');
INSERT INTO public.risultati_gara VALUES (85, 4, 66, NULL, 4, NULL, NULL, 11, NULL, 1, NULL, 35, NULL, '+7 Laps', 0.00, false, NULL, '2026-08-30 08:35:56.439046+00');
INSERT INTO public.risultati_gara VALUES (86, 4, 13, NULL, 1, NULL, NULL, NULL, NULL, 4, 'Engine', 32, NULL, NULL, 0.00, false, NULL, '2026-08-30 08:35:56.439046+00');
INSERT INTO public.risultati_gara VALUES (87, 4, 8, NULL, 2, NULL, NULL, NULL, NULL, 2, 'Gearbox', 25, NULL, NULL, 0.00, false, NULL, '2026-08-30 08:35:56.439046+00');
INSERT INTO public.risultati_gara VALUES (88, 4, 20, NULL, 2, NULL, NULL, NULL, NULL, 3, 'Accident', 19, NULL, NULL, 0.00, false, NULL, '2026-08-30 08:35:56.439046+00');
INSERT INTO public.risultati_gara VALUES (89, 4, 25, NULL, 6, NULL, NULL, NULL, NULL, 2, 'Suspension', 19, NULL, NULL, 0.00, false, NULL, '2026-08-30 08:35:56.439046+00');
INSERT INTO public.risultati_gara VALUES (90, 4, 26, NULL, 6, NULL, NULL, NULL, NULL, 4, 'Engine', 9, NULL, NULL, 0.00, false, NULL, '2026-08-30 08:35:56.439046+00');
INSERT INTO public.risultati_gara VALUES (91, 4, 24, NULL, 6, NULL, NULL, NULL, NULL, 2, 'Oil pump', 4, NULL, NULL, 0.00, false, NULL, '2026-08-30 08:35:56.439046+00');
INSERT INTO public.risultati_gara VALUES (92, 4, 4, NULL, 2, NULL, NULL, NULL, NULL, 3, 'Accident', 0, NULL, NULL, 0.00, false, NULL, '2026-08-30 08:35:56.439046+00');
INSERT INTO public.risultati_gara VALUES (93, 5, 13, NULL, 1, NULL, NULL, 1, NULL, 1, NULL, 35, '02:47:00', NULL, 0.00, false, NULL, '2026-08-30 08:35:56.920848+00');
INSERT INTO public.risultati_gara VALUES (94, 5, 2, NULL, 1, NULL, NULL, 2, NULL, 1, NULL, 35, NULL, '+14.000', 0.00, false, NULL, '2026-08-30 08:35:56.920848+00');
INSERT INTO public.risultati_gara VALUES (95, 5, 5, NULL, 2, NULL, NULL, 3, NULL, 1, NULL, 35, NULL, '+2:19.000', 0.00, false, NULL, '2026-08-30 08:35:56.920848+00');
INSERT INTO public.risultati_gara VALUES (96, 5, 1, NULL, 1, NULL, NULL, 4, NULL, 1, NULL, 35, NULL, '+4:05.000', 0.00, false, NULL, '2026-08-30 08:35:56.920848+00');
INSERT INTO public.risultati_gara VALUES (97, 5, 24, NULL, 6, NULL, NULL, 5, NULL, 1, NULL, 34, NULL, '+1 Lap', 0.00, false, NULL, '2026-08-30 08:35:56.920848+00');
INSERT INTO public.risultati_gara VALUES (98, 5, 26, NULL, 6, NULL, NULL, 6, NULL, 1, NULL, 33, NULL, '+2 Laps', 0.00, false, NULL, '2026-08-30 08:35:56.920848+00');
INSERT INTO public.risultati_gara VALUES (99, 5, 67, NULL, 2, NULL, NULL, 7, NULL, 1, NULL, 33, NULL, '+2 Laps', 0.00, false, NULL, '2026-08-30 08:35:56.920848+00');
INSERT INTO public.risultati_gara VALUES (100, 5, 12, NULL, 2, NULL, NULL, 8, NULL, 1, NULL, 22, NULL, '+3 Laps', 0.00, false, NULL, '2026-08-30 08:35:56.920848+00');
INSERT INTO public.risultati_gara VALUES (101, 5, 17, NULL, 5, NULL, NULL, 9, NULL, 1, NULL, 30, NULL, '+5 Laps', 0.00, false, NULL, '2026-08-30 08:35:56.920848+00');
INSERT INTO public.risultati_gara VALUES (102, 5, 66, NULL, 4, NULL, NULL, 10, NULL, 1, NULL, 29, NULL, '+6 Laps', 0.00, false, NULL, '2026-08-30 08:35:56.920848+00');
INSERT INTO public.risultati_gara VALUES (103, 5, 68, NULL, 2, NULL, NULL, NULL, NULL, 2, 'Oil pipe', 22, NULL, NULL, 0.00, false, NULL, '2026-08-30 08:35:56.920848+00');
INSERT INTO public.risultati_gara VALUES (104, 5, 25, NULL, 2, NULL, NULL, NULL, NULL, 2, 'Oil pressure', 20, NULL, NULL, 0.00, false, NULL, '2026-08-30 08:35:56.920848+00');
INSERT INTO public.risultati_gara VALUES (105, 5, 8, NULL, 2, NULL, NULL, NULL, NULL, 2, 'Overheating', 15, NULL, NULL, 0.00, false, NULL, '2026-08-30 08:35:56.920848+00');
INSERT INTO public.risultati_gara VALUES (106, 5, 4, NULL, 2, NULL, NULL, NULL, NULL, 2, 'Oil pipe', 2, NULL, NULL, 0.00, false, NULL, '2026-08-30 08:35:56.920848+00');
INSERT INTO public.risultati_gara VALUES (107, 6, 13, NULL, 1, NULL, NULL, 1, NULL, 1, NULL, 64, '02:57:52.8', NULL, 0.00, false, NULL, '2026-08-30 08:35:57.399876+00');
INSERT INTO public.risultati_gara VALUES (108, 6, 2, NULL, 1, NULL, NULL, 2, NULL, 1, NULL, 64, NULL, '+25.700', 0.00, false, NULL, '2026-08-30 08:35:57.399876+00');
INSERT INTO public.risultati_gara VALUES (109, 6, 32, NULL, 6, NULL, NULL, 3, NULL, 1, NULL, 61, NULL, '+3 Laps', 0.00, false, NULL, '2026-08-30 08:35:57.399876+00');
INSERT INTO public.risultati_gara VALUES (110, 6, 28, NULL, 7, NULL, NULL, 4, NULL, 1, NULL, 61, NULL, '+3 Laps', 0.00, false, NULL, '2026-08-30 08:35:57.399876+00');
INSERT INTO public.risultati_gara VALUES (111, 6, 8, NULL, 2, NULL, NULL, 5, NULL, 1, NULL, 59, NULL, '+5 Laps', 0.00, false, NULL, '2026-08-30 08:35:57.399876+00');
INSERT INTO public.risultati_gara VALUES (112, 6, 68, NULL, 2, NULL, NULL, 6, NULL, 1, NULL, 59, NULL, '+5 Laps', 0.00, false, NULL, '2026-08-30 08:35:57.399876+00');
INSERT INTO public.risultati_gara VALUES (113, 6, 5, NULL, 2, NULL, NULL, 7, NULL, 1, NULL, 56, NULL, '+8 Laps', 0.00, false, NULL, '2026-08-30 08:35:57.399876+00');
INSERT INTO public.risultati_gara VALUES (114, 6, 69, NULL, 2, NULL, NULL, 8, NULL, 1, NULL, 56, NULL, '+8 Laps', 0.00, false, NULL, '2026-08-30 08:35:57.399876+00');
INSERT INTO public.risultati_gara VALUES (115, 6, 1, NULL, 1, NULL, NULL, 9, NULL, 1, 'Fuel pump', 55, NULL, NULL, 0.00, false, NULL, '2026-08-30 08:35:57.399876+00');
INSERT INTO public.risultati_gara VALUES (116, 6, 4, NULL, 2, NULL, NULL, 10, NULL, 1, NULL, 52, NULL, '+12 Laps', 0.00, false, NULL, '2026-08-30 08:35:57.399876+00');
INSERT INTO public.risultati_gara VALUES (117, 6, 67, NULL, 2, NULL, NULL, NULL, NULL, 4, 'Engine', 36, NULL, NULL, 0.00, false, NULL, '2026-08-30 08:35:57.399876+00');
INSERT INTO public.risultati_gara VALUES (118, 6, 64, NULL, 4, NULL, NULL, NULL, NULL, 4, 'Engine', 14, NULL, NULL, 0.00, false, NULL, '2026-08-30 08:35:57.399876+00');
INSERT INTO public.risultati_gara VALUES (119, 6, 12, NULL, 2, NULL, NULL, NULL, NULL, 2, 'Overheating', 11, NULL, NULL, 0.00, false, NULL, '2026-08-30 08:35:57.399876+00');
INSERT INTO public.risultati_gara VALUES (121, 6, 3, NULL, 4, NULL, NULL, NULL, NULL, 4, 'Engine', 9, NULL, NULL, 0.00, false, NULL, '2026-08-30 08:35:57.399876+00');
INSERT INTO public.risultati_gara VALUES (122, 6, 30, NULL, 4, NULL, NULL, NULL, NULL, 4, 'Engine', 6, NULL, NULL, 0.00, false, NULL, '2026-08-30 08:35:57.399876+00');
INSERT INTO public.risultati_gara VALUES (123, 6, 19, NULL, 4, NULL, NULL, NULL, NULL, 4, 'Engine', 6, NULL, NULL, 0.00, false, NULL, '2026-08-30 08:35:57.399876+00');
INSERT INTO public.risultati_gara VALUES (124, 6, 9, NULL, 4, NULL, NULL, NULL, NULL, 4, 'Engine', 5, NULL, NULL, 0.00, false, NULL, '2026-08-30 08:35:57.399876+00');
INSERT INTO public.risultati_gara VALUES (125, 6, 25, NULL, 2, NULL, NULL, NULL, NULL, 2, 'Overheating', 4, NULL, NULL, 0.00, false, NULL, '2026-08-30 08:35:57.399876+00');
INSERT INTO public.risultati_gara VALUES (126, 6, 27, NULL, 4, NULL, NULL, NULL, NULL, 4, 'Engine', 3, NULL, NULL, 0.00, false, NULL, '2026-08-30 08:35:57.399876+00');
INSERT INTO public.risultati_gara VALUES (127, 7, 1, NULL, 1, NULL, NULL, 1, NULL, 1, NULL, 80, '02:51:17.4', NULL, 0.00, false, NULL, '2026-08-30 08:35:57.882507+00');
INSERT INTO public.risultati_gara VALUES (128, 7, 70, NULL, 6, NULL, NULL, 2, NULL, 1, NULL, 80, NULL, '+1:18.600', 0.00, false, NULL, '2026-08-30 08:35:57.882507+00');
INSERT INTO public.risultati_gara VALUES (129, 7, 24, NULL, 6, NULL, NULL, 2, NULL, 1, NULL, 80, NULL, NULL, 0.00, false, NULL, '2026-08-30 08:35:57.882507+00');
INSERT INTO public.risultati_gara VALUES (130, 7, 2, NULL, 1, NULL, NULL, 3, NULL, 1, NULL, 80, NULL, '+1:35.600', 0.00, false, NULL, '2026-08-30 08:35:57.882507+00');
INSERT INTO public.risultati_gara VALUES (131, 7, 5, NULL, 2, NULL, NULL, 4, NULL, 1, NULL, 75, NULL, '+5 Laps', 0.00, false, NULL, '2026-08-30 08:35:57.882507+00');
INSERT INTO public.risultati_gara VALUES (132, 7, 8, NULL, 2, NULL, NULL, 5, NULL, 1, NULL, 75, NULL, '+5 Laps', 0.00, false, NULL, '2026-08-30 08:35:57.882507+00');
INSERT INTO public.risultati_gara VALUES (133, 7, 18, NULL, 4, NULL, NULL, 6, NULL, 1, NULL, 72, NULL, '+8 Laps', 0.00, false, NULL, '2026-08-30 08:35:57.882507+00');
INSERT INTO public.risultati_gara VALUES (134, 7, 32, NULL, 6, NULL, NULL, 7, NULL, 1, NULL, 72, NULL, '+8 Laps', 0.00, false, NULL, '2026-08-30 08:35:57.882507+00');
INSERT INTO public.risultati_gara VALUES (135, 7, 16, NULL, 4, NULL, NULL, NULL, NULL, 2, 'Gearbox', 56, NULL, NULL, 0.00, false, NULL, '2026-08-30 08:35:57.882507+00');
INSERT INTO public.risultati_gara VALUES (136, 7, 7, NULL, 3, NULL, NULL, NULL, NULL, 2, 'Radiator', 51, NULL, NULL, 0.00, false, NULL, '2026-08-30 08:35:57.882507+00');
INSERT INTO public.risultati_gara VALUES (137, 7, 25, NULL, 2, NULL, NULL, NULL, NULL, 2, 'Gearbox', 48, NULL, NULL, 0.00, false, NULL, '2026-08-30 08:35:57.882507+00');
INSERT INTO public.risultati_gara VALUES (138, 7, 71, NULL, 2, NULL, NULL, NULL, NULL, 2, 'Oil pipe', 42, NULL, NULL, 0.00, false, NULL, '2026-08-30 08:35:57.882507+00');
INSERT INTO public.risultati_gara VALUES (139, 7, 30, NULL, 4, NULL, NULL, NULL, NULL, 2, 'Retired', 39, NULL, NULL, 0.00, false, NULL, '2026-08-30 08:35:57.882507+00');
INSERT INTO public.risultati_gara VALUES (140, 7, 13, NULL, 1, NULL, NULL, NULL, NULL, 4, 'Engine', 34, NULL, NULL, 0.00, false, NULL, '2026-08-30 08:35:57.882507+00');
INSERT INTO public.risultati_gara VALUES (141, 7, 72, NULL, 1, NULL, NULL, NULL, NULL, 4, 'Engine', 34, NULL, NULL, 0.00, false, NULL, '2026-08-30 08:35:57.882507+00');
INSERT INTO public.risultati_gara VALUES (142, 7, 67, NULL, 2, NULL, NULL, NULL, NULL, 2, 'Gearbox', 29, NULL, NULL, 0.00, false, NULL, '2026-08-30 08:35:57.882507+00');
INSERT INTO public.risultati_gara VALUES (144, 7, 12, NULL, 2, NULL, NULL, NULL, NULL, 2, 'Overheating', 22, NULL, NULL, 0.00, false, NULL, '2026-08-30 08:35:57.882507+00');
INSERT INTO public.risultati_gara VALUES (146, 7, 73, NULL, 6, NULL, NULL, NULL, NULL, 4, 'Engine', 17, NULL, NULL, 0.00, false, NULL, '2026-08-30 08:35:57.882507+00');
INSERT INTO public.risultati_gara VALUES (147, 7, 74, NULL, 2, NULL, NULL, NULL, NULL, 2, 'Brakes', 16, NULL, NULL, 0.00, false, NULL, '2026-08-30 08:35:57.882507+00');
INSERT INTO public.risultati_gara VALUES (148, 7, 75, NULL, 4, NULL, NULL, NULL, NULL, 2, 'Retired', 15, NULL, NULL, 0.00, false, NULL, '2026-08-30 08:35:57.882507+00');
INSERT INTO public.risultati_gara VALUES (149, 7, 29, NULL, 7, NULL, NULL, NULL, NULL, 2, 'Water pipe', 13, NULL, NULL, 0.00, false, NULL, '2026-08-30 08:35:57.882507+00');
INSERT INTO public.risultati_gara VALUES (150, 7, 19, NULL, 4, NULL, NULL, NULL, NULL, 2, 'Oil pressure', 13, NULL, NULL, 0.00, false, NULL, '2026-08-30 08:35:57.882507+00');
INSERT INTO public.risultati_gara VALUES (151, 7, 76, NULL, 1, NULL, NULL, NULL, NULL, 4, 'Engine', 11, NULL, NULL, 0.00, false, NULL, '2026-08-30 08:35:57.882507+00');
INSERT INTO public.risultati_gara VALUES (152, 7, 28, NULL, 7, NULL, NULL, NULL, NULL, 2, 'Transmission', 7, NULL, NULL, 0.00, false, NULL, '2026-08-30 08:35:57.882507+00');
INSERT INTO public.risultati_gara VALUES (153, 7, 15, NULL, 4, NULL, NULL, NULL, NULL, 4, 'Engine', 1, NULL, NULL, 0.00, false, NULL, '2026-08-30 08:35:57.882507+00');
INSERT INTO public.risultati_gara VALUES (154, 7, 77, NULL, 4, NULL, NULL, NULL, NULL, 4, 'Engine', 0, NULL, NULL, 0.00, false, NULL, '2026-08-30 08:35:57.882507+00');
INSERT INTO public.risultati_gara VALUES (155, 7, 64, NULL, 23, NULL, NULL, NULL, NULL, 2, 'Withdrew', 0, NULL, NULL, 0.00, false, NULL, '2026-08-30 08:35:57.882507+00');


--
-- Data for Name: sistemi_punteggio; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.sistemi_punteggio VALUES (1, 'Sistema 2019-oggi', 2019, NULL, true, 'Punto aggiuntivo per il giro più veloce se in top 10');
INSERT INTO public.sistemi_punteggio VALUES (2, 'Sistema 1950-1959', 1950, 1959, true, 'Punto aggiuntivo per il giro più veloce, indipendentemente dalla posizione');


--
-- Data for Name: stagioni; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.stagioni VALUES (1, 1950, 2, 'Campionato del Mondo di Formula 1', NULL);


--
-- Data for Name: stati_risultato; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.stati_risultato VALUES (1, 'FINISHED', 'Classificato al traguardo');
INSERT INTO public.stati_risultato VALUES (2, 'RETIRED', 'Ritirato');
INSERT INTO public.stati_risultato VALUES (3, 'ACCIDENT', 'Ritirato per incidente');
INSERT INTO public.stati_risultato VALUES (4, 'ENGINE', 'Ritirato per problema al motore');
INSERT INTO public.stati_risultato VALUES (5, 'DSQ', 'Squalificato');
INSERT INTO public.stati_risultato VALUES (6, 'NOT_CLASSIFIED', 'Non classificato');


--
-- Name: circuiti_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.circuiti_id_seq', 7, true);


--
-- Name: costruttori_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.costruttori_id_seq', 23, true);


--
-- Name: gran_premi_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.gran_premi_id_seq', 7, true);


--
-- Name: nazioni_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.nazioni_id_seq', 25, true);


--
-- Name: piloti_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.piloti_id_seq', 77, true);


--
-- Name: punti_per_posizione_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.punti_per_posizione_id_seq', 15, true);


--
-- Name: risultati_gara_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.risultati_gara_id_seq', 155, true);


--
-- Name: sistemi_punteggio_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.sistemi_punteggio_id_seq', 2, true);


--
-- Name: stagioni_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.stagioni_id_seq', 1, true);


--
-- Name: stati_risultato_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.stati_risultato_id_seq', 6, true);


--
-- Name: circuiti circuiti_codice_riferimento_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.circuiti
    ADD CONSTRAINT circuiti_codice_riferimento_key UNIQUE (codice_riferimento);


--
-- Name: circuiti circuiti_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.circuiti
    ADD CONSTRAINT circuiti_pkey PRIMARY KEY (id);


--
-- Name: costruttori costruttori_codice_riferimento_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.costruttori
    ADD CONSTRAINT costruttori_codice_riferimento_key UNIQUE (codice_riferimento);


--
-- Name: costruttori costruttori_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.costruttori
    ADD CONSTRAINT costruttori_pkey PRIMARY KEY (id);


--
-- Name: gran_premi gran_premi_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.gran_premi
    ADD CONSTRAINT gran_premi_pkey PRIMARY KEY (id);


--
-- Name: gran_premi gran_premi_stagione_id_circuito_id_data_gara_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.gran_premi
    ADD CONSTRAINT gran_premi_stagione_id_circuito_id_data_gara_key UNIQUE (stagione_id, circuito_id, data_gara);


--
-- Name: nazioni nazioni_codice_iso2_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.nazioni
    ADD CONSTRAINT nazioni_codice_iso2_key UNIQUE (codice_iso2);


--
-- Name: nazioni nazioni_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.nazioni
    ADD CONSTRAINT nazioni_pkey PRIMARY KEY (id);


--
-- Name: piloti piloti_codice_riferimento_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.piloti
    ADD CONSTRAINT piloti_codice_riferimento_key UNIQUE (codice_riferimento);


--
-- Name: piloti piloti_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.piloti
    ADD CONSTRAINT piloti_pkey PRIMARY KEY (id);


--
-- Name: punti_per_posizione punti_per_posizione_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.punti_per_posizione
    ADD CONSTRAINT punti_per_posizione_pkey PRIMARY KEY (id);


--
-- Name: punti_per_posizione punti_per_posizione_sistema_punteggio_id_posizione_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.punti_per_posizione
    ADD CONSTRAINT punti_per_posizione_sistema_punteggio_id_posizione_key UNIQUE (sistema_punteggio_id, posizione);


--
-- Name: risultati_gara risultati_gara_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.risultati_gara
    ADD CONSTRAINT risultati_gara_pkey PRIMARY KEY (id);


--
-- Name: sistemi_punteggio sistemi_punteggio_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sistemi_punteggio
    ADD CONSTRAINT sistemi_punteggio_pkey PRIMARY KEY (id);


--
-- Name: stagioni stagioni_anno_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stagioni
    ADD CONSTRAINT stagioni_anno_key UNIQUE (anno);


--
-- Name: stagioni stagioni_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stagioni
    ADD CONSTRAINT stagioni_pkey PRIMARY KEY (id);


--
-- Name: stati_risultato stati_risultato_codice_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stati_risultato
    ADD CONSTRAINT stati_risultato_codice_key UNIQUE (codice);


--
-- Name: stati_risultato stati_risultato_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stati_risultato
    ADD CONSTRAINT stati_risultato_pkey PRIMARY KEY (id);


--
-- Name: risultati_gara uq_risultato_gara_pilota; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.risultati_gara
    ADD CONSTRAINT uq_risultato_gara_pilota UNIQUE (gran_premio_id, pilota_id);


--
-- Name: idx_circuiti_nome; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_circuiti_nome ON public.circuiti USING btree (nome);


--
-- Name: idx_costruttori_nome; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_costruttori_nome ON public.costruttori USING btree (nome);


--
-- Name: idx_gp_stagione_circuito; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_gp_stagione_circuito ON public.gran_premi USING btree (stagione_id, circuito_id);


--
-- Name: idx_gran_premi_circuito; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_gran_premi_circuito ON public.gran_premi USING btree (circuito_id);


--
-- Name: idx_gran_premi_data; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_gran_premi_data ON public.gran_premi USING btree (data_gara);


--
-- Name: idx_gran_premi_stagione; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_gran_premi_stagione ON public.gran_premi USING btree (stagione_id);


--
-- Name: idx_piloti_cognome; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_piloti_cognome ON public.piloti USING btree (cognome);


--
-- Name: idx_risultati_costruttore; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_risultati_costruttore ON public.risultati_gara USING btree (costruttore_id);


--
-- Name: idx_risultati_gp; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_risultati_gp ON public.risultati_gara USING btree (gran_premio_id);


--
-- Name: idx_risultati_pilota; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_risultati_pilota ON public.risultati_gara USING btree (pilota_id);


--
-- Name: circuiti circuiti_nazione_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.circuiti
    ADD CONSTRAINT circuiti_nazione_id_fkey FOREIGN KEY (nazione_id) REFERENCES public.nazioni(id);


--
-- Name: costruttori costruttori_nazione_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.costruttori
    ADD CONSTRAINT costruttori_nazione_id_fkey FOREIGN KEY (nazione_id) REFERENCES public.nazioni(id);


--
-- Name: gran_premi gran_premi_circuito_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.gran_premi
    ADD CONSTRAINT gran_premi_circuito_id_fkey FOREIGN KEY (circuito_id) REFERENCES public.circuiti(id);


--
-- Name: gran_premi gran_premi_stagione_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.gran_premi
    ADD CONSTRAINT gran_premi_stagione_id_fkey FOREIGN KEY (stagione_id) REFERENCES public.stagioni(id) ON DELETE CASCADE;


--
-- Name: piloti piloti_nazione_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.piloti
    ADD CONSTRAINT piloti_nazione_id_fkey FOREIGN KEY (nazione_id) REFERENCES public.nazioni(id);


--
-- Name: punti_per_posizione punti_per_posizione_sistema_punteggio_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.punti_per_posizione
    ADD CONSTRAINT punti_per_posizione_sistema_punteggio_id_fkey FOREIGN KEY (sistema_punteggio_id) REFERENCES public.sistemi_punteggio(id) ON DELETE CASCADE;


--
-- Name: risultati_gara risultati_gara_costruttore_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.risultati_gara
    ADD CONSTRAINT risultati_gara_costruttore_id_fkey FOREIGN KEY (costruttore_id) REFERENCES public.costruttori(id);


--
-- Name: risultati_gara risultati_gara_gran_premio_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.risultati_gara
    ADD CONSTRAINT risultati_gara_gran_premio_id_fkey FOREIGN KEY (gran_premio_id) REFERENCES public.gran_premi(id) ON DELETE CASCADE;


--
-- Name: risultati_gara risultati_gara_pilota_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.risultati_gara
    ADD CONSTRAINT risultati_gara_pilota_id_fkey FOREIGN KEY (pilota_id) REFERENCES public.piloti(id);


--
-- Name: risultati_gara risultati_gara_pilota_secondario_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.risultati_gara
    ADD CONSTRAINT risultati_gara_pilota_secondario_id_fkey FOREIGN KEY (pilota_secondario_id) REFERENCES public.piloti(id);


--
-- Name: risultati_gara risultati_gara_stato_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.risultati_gara
    ADD CONSTRAINT risultati_gara_stato_id_fkey FOREIGN KEY (stato_id) REFERENCES public.stati_risultato(id);


--
-- Name: stagioni stagioni_sistema_punteggio_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stagioni
    ADD CONSTRAINT stagioni_sistema_punteggio_id_fkey FOREIGN KEY (sistema_punteggio_id) REFERENCES public.sistemi_punteggio(id);


--
-- PostgreSQL database dump complete
--


