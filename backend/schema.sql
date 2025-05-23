--
-- PostgreSQL database dump
--

-- Dumped from database version 17.4
-- Dumped by pg_dump version 17.4

-- Started on 2025-05-23 10:13:50

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- TOC entry 881 (class 1247 OID 49254)
-- Name: tournament_format; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.tournament_format AS ENUM (
    'SINGLE_ELIMINATION',
    'DOUBLE_ELIMINATION',
    'ROUND_ROBIN'
);


--
-- TOC entry 875 (class 1247 OID 41319)
-- Name: tournament_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.tournament_status AS ENUM (
    'registration_open',
    'registration_closed',
    'check_in',
    'in_progress',
    'completed',
    'cancelled'
);


--
-- TOC entry 878 (class 1247 OID 41808)
-- Name: user_role; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.user_role AS ENUM (
    'user',
    'staff',
    'admin'
);


--
-- TOC entry 230 (class 1255 OID 24605)
-- Name: normalize_email(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.normalize_email() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.email = LOWER(NEW.email);
  RETURN NEW;
END;
$$;


--
-- TOC entry 231 (class 1255 OID 41795)
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 222 (class 1259 OID 32787)
-- Name: countries; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.countries (
    id integer NOT NULL,
    name text NOT NULL,
    code text NOT NULL
);


--
-- TOC entry 221 (class 1259 OID 32786)
-- Name: countries_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.countries_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 4893 (class 0 OID 0)
-- Dependencies: 221
-- Name: countries_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.countries_id_seq OWNED BY public.countries.id;


--
-- TOC entry 220 (class 1259 OID 24593)
-- Name: password_resets; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.password_resets (
    id integer NOT NULL,
    user_id integer,
    token character varying(100) NOT NULL,
    expires_at timestamp without time zone NOT NULL
);


--
-- TOC entry 219 (class 1259 OID 24592)
-- Name: password_resets_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.password_resets_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 4894 (class 0 OID 0)
-- Dependencies: 219
-- Name: password_resets_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.password_resets_id_seq OWNED BY public.password_resets.id;


--
-- TOC entry 229 (class 1259 OID 49266)
-- Name: tournament_matches; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tournament_matches (
    id integer NOT NULL,
    tournament_id integer NOT NULL,
    round integer NOT NULL,
    match_number integer NOT NULL,
    player1_id integer,
    player2_id integer,
    winner_id integer,
    player1_score integer,
    player2_score integer,
    bye_match boolean DEFAULT false,
    next_match_id integer,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- TOC entry 228 (class 1259 OID 49265)
-- Name: tournament_matches_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.tournament_matches_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 4895 (class 0 OID 0)
-- Dependencies: 228
-- Name: tournament_matches_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.tournament_matches_id_seq OWNED BY public.tournament_matches.id;


--
-- TOC entry 226 (class 1259 OID 41045)
-- Name: tournament_participants; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tournament_participants (
    id integer NOT NULL,
    tournament_id integer,
    user_id integer,
    seed integer,
    status character varying(50) DEFAULT 'registered'::character varying,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    checked_in_at timestamp without time zone
);


--
-- TOC entry 225 (class 1259 OID 41044)
-- Name: tournament_participants_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.tournament_participants_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 4896 (class 0 OID 0)
-- Dependencies: 225
-- Name: tournament_participants_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.tournament_participants_id_seq OWNED BY public.tournament_participants.id;


--
-- TOC entry 224 (class 1259 OID 40961)
-- Name: tournaments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tournaments (
    id bigint NOT NULL,
    name character varying(100) NOT NULL,
    description text,
    date timestamp without time zone NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    image text,
    format character varying(50) DEFAULT 'single_elimination'::character varying NOT NULL,
    max_participants integer DEFAULT 8 NOT NULL,
    registration_deadline timestamp without time zone,
    created_by integer,
    winner_id integer,
    status public.tournament_status DEFAULT 'registration_open'::public.tournament_status,
    rules text,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    checkin_deadline timestamp without time zone,
    CONSTRAINT checkin_after_registration CHECK ((checkin_deadline >= registration_deadline)),
    CONSTRAINT tournament_after_checkin CHECK ((date >= checkin_deadline))
);


--
-- TOC entry 223 (class 1259 OID 40960)
-- Name: tournaments_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.tournaments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 4897 (class 0 OID 0)
-- Dependencies: 223
-- Name: tournaments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.tournaments_id_seq OWNED BY public.tournaments.id;


--
-- TOC entry 227 (class 1259 OID 49261)
-- Name: upcoming_tournaments; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.upcoming_tournaments AS
 SELECT id,
    name,
    date,
    status,
    image,
    max_participants,
    ( SELECT count(*) AS count
           FROM public.tournament_participants tp
          WHERE (tp.tournament_id = t.id)) AS participant_count
   FROM public.tournaments t
  WHERE ((date > CURRENT_TIMESTAMP) AND (status <> 'cancelled'::public.tournament_status))
  ORDER BY date;


--
-- TOC entry 218 (class 1259 OID 24578)
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id integer NOT NULL,
    email character varying(100) NOT NULL,
    password_hash text NOT NULL,
    failed_attempts integer DEFAULT 0,
    locked_until timestamp without time zone,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    last_failed_attempt timestamp without time zone,
    reset_token text,
    reset_token_expiry timestamp with time zone,
    display_name character varying(16),
    country character varying(64),
    points integer DEFAULT 0,
    country_id integer,
    profile_picture text,
    role public.user_role DEFAULT 'user'::public.user_role NOT NULL
);


--
-- TOC entry 217 (class 1259 OID 24577)
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 4898 (class 0 OID 0)
-- Dependencies: 217
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- TOC entry 4687 (class 2604 OID 32790)
-- Name: countries id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.countries ALTER COLUMN id SET DEFAULT nextval('public.countries_id_seq'::regclass);


--
-- TOC entry 4686 (class 2604 OID 24596)
-- Name: password_resets id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.password_resets ALTER COLUMN id SET DEFAULT nextval('public.password_resets_id_seq'::regclass);


--
-- TOC entry 4697 (class 2604 OID 49269)
-- Name: tournament_matches id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tournament_matches ALTER COLUMN id SET DEFAULT nextval('public.tournament_matches_id_seq'::regclass);


--
-- TOC entry 4694 (class 2604 OID 41048)
-- Name: tournament_participants id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tournament_participants ALTER COLUMN id SET DEFAULT nextval('public.tournament_participants_id_seq'::regclass);


--
-- TOC entry 4688 (class 2604 OID 41823)
-- Name: tournaments id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tournaments ALTER COLUMN id SET DEFAULT nextval('public.tournaments_id_seq'::regclass);


--
-- TOC entry 4681 (class 2604 OID 24581)
-- Name: users id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- TOC entry 4710 (class 2606 OID 32796)
-- Name: countries countries_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.countries
    ADD CONSTRAINT countries_code_key UNIQUE (code);


--
-- TOC entry 4712 (class 2606 OID 32794)
-- Name: countries countries_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.countries
    ADD CONSTRAINT countries_pkey PRIMARY KEY (id);


--
-- TOC entry 4708 (class 2606 OID 24598)
-- Name: password_resets password_resets_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.password_resets
    ADD CONSTRAINT password_resets_pkey PRIMARY KEY (id);


--
-- TOC entry 4725 (class 2606 OID 49274)
-- Name: tournament_matches tournament_matches_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tournament_matches
    ADD CONSTRAINT tournament_matches_pkey PRIMARY KEY (id);


--
-- TOC entry 4727 (class 2606 OID 49276)
-- Name: tournament_matches tournament_matches_tournament_id_round_match_number_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tournament_matches
    ADD CONSTRAINT tournament_matches_tournament_id_round_match_number_key UNIQUE (tournament_id, round, match_number);


--
-- TOC entry 4719 (class 2606 OID 41052)
-- Name: tournament_participants tournament_participants_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tournament_participants
    ADD CONSTRAINT tournament_participants_pkey PRIMARY KEY (id);


--
-- TOC entry 4721 (class 2606 OID 41054)
-- Name: tournament_participants tournament_participants_tournament_id_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tournament_participants
    ADD CONSTRAINT tournament_participants_tournament_id_user_id_key UNIQUE (tournament_id, user_id);


--
-- TOC entry 4716 (class 2606 OID 41825)
-- Name: tournaments tournaments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tournaments
    ADD CONSTRAINT tournaments_pkey PRIMARY KEY (id);


--
-- TOC entry 4704 (class 2606 OID 24591)
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- TOC entry 4706 (class 2606 OID 24587)
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- TOC entry 4722 (class 1259 OID 49304)
-- Name: idx_tournament_matches_players; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_tournament_matches_players ON public.tournament_matches USING btree (player1_id, player2_id);


--
-- TOC entry 4723 (class 1259 OID 49303)
-- Name: idx_tournament_matches_tournament; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_tournament_matches_tournament ON public.tournament_matches USING btree (tournament_id);


--
-- TOC entry 4717 (class 1259 OID 41803)
-- Name: idx_tournament_participants_tournament; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_tournament_participants_tournament ON public.tournament_participants USING btree (tournament_id);


--
-- TOC entry 4713 (class 1259 OID 41719)
-- Name: idx_tournaments_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_tournaments_date ON public.tournaments USING btree (date);


--
-- TOC entry 4714 (class 1259 OID 41718)
-- Name: idx_tournaments_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_tournaments_status ON public.tournaments USING btree (status);


--
-- TOC entry 4739 (class 2620 OID 24606)
-- Name: users normalize_email_before_insert; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER normalize_email_before_insert BEFORE INSERT OR UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION public.normalize_email();


--
-- TOC entry 4741 (class 2620 OID 49302)
-- Name: tournament_matches update_tournament_matches_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_tournament_matches_updated_at BEFORE UPDATE ON public.tournament_matches FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- TOC entry 4740 (class 2620 OID 41796)
-- Name: tournaments update_tournaments_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_tournaments_updated_at BEFORE UPDATE ON public.tournaments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- TOC entry 4729 (class 2606 OID 24599)
-- Name: password_resets password_resets_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.password_resets
    ADD CONSTRAINT password_resets_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 4734 (class 2606 OID 49297)
-- Name: tournament_matches tournament_matches_next_match_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tournament_matches
    ADD CONSTRAINT tournament_matches_next_match_id_fkey FOREIGN KEY (next_match_id) REFERENCES public.tournament_matches(id);


--
-- TOC entry 4735 (class 2606 OID 49282)
-- Name: tournament_matches tournament_matches_player1_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tournament_matches
    ADD CONSTRAINT tournament_matches_player1_id_fkey FOREIGN KEY (player1_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- TOC entry 4736 (class 2606 OID 49287)
-- Name: tournament_matches tournament_matches_player2_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tournament_matches
    ADD CONSTRAINT tournament_matches_player2_id_fkey FOREIGN KEY (player2_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- TOC entry 4737 (class 2606 OID 49277)
-- Name: tournament_matches tournament_matches_tournament_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tournament_matches
    ADD CONSTRAINT tournament_matches_tournament_id_fkey FOREIGN KEY (tournament_id) REFERENCES public.tournaments(id) ON DELETE CASCADE;


--
-- TOC entry 4738 (class 2606 OID 49292)
-- Name: tournament_matches tournament_matches_winner_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tournament_matches
    ADD CONSTRAINT tournament_matches_winner_id_fkey FOREIGN KEY (winner_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- TOC entry 4732 (class 2606 OID 41826)
-- Name: tournament_participants tournament_participants_tournament_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tournament_participants
    ADD CONSTRAINT tournament_participants_tournament_id_fkey FOREIGN KEY (tournament_id) REFERENCES public.tournaments(id);


--
-- TOC entry 4733 (class 2606 OID 41060)
-- Name: tournament_participants tournament_participants_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tournament_participants
    ADD CONSTRAINT tournament_participants_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 4730 (class 2606 OID 41034)
-- Name: tournaments tournaments_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tournaments
    ADD CONSTRAINT tournaments_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- TOC entry 4731 (class 2606 OID 41039)
-- Name: tournaments tournaments_winner_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tournaments
    ADD CONSTRAINT tournaments_winner_id_fkey FOREIGN KEY (winner_id) REFERENCES public.users(id);


--
-- TOC entry 4728 (class 2606 OID 32797)
-- Name: users users_country_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_country_id_fkey FOREIGN KEY (country_id) REFERENCES public.countries(id);


-- Completed on 2025-05-23 10:13:50

--
-- PostgreSQL database dump complete
--

