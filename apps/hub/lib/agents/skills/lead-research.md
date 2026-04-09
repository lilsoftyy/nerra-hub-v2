# Skill: Lead Research

## Formål
Identifiserer og kvalifiserer potensielle kunder på tvers av Europa. Jobben er bred og filtrerende — agenten leter gjennom mange selskaper og sorterer ut de som faktisk passer målprofilen til Drone Wash Academy.

Dette er proaktiv research. Ingen spesifikk kunde er gitt på forhånd. Agenten arbeider fra markedsdata, kriterier og geografisk prioritering.

---

## Trigger

Kjøres på én av to måter:

1. **Manuell kjøring** — Magnus trigger agenten fra Nerra Hub med ett eller flere søkeparametere (land, bransjesegment, størrelse)
2. **Planlagt kjøring** — Agenten kjøres periodisk (f.eks. ukentlig) og leverer nye prospekter til godkjenningskøen

---

## Målprofil — hva agenten leter etter

Et kvalifisert prospekt er et etablert fasadevaskselskap med kapasitet og insentiv til å investere i dronebasert metodikk.

### Primære kjennetegn
- Tilbyr utvendig fasadevask, vinduvask, eller fasadevedlikehold som kjernetjeneste
- Opererer kommersielt — bygg, næringseiendom, industri eller offentlig sektor
- Har ansatte piloter, tauarbeidere, eller stillasmontører i dag (= eksisterende tilgangsmetode som drone kan erstatte eller supplere)
- Minimum 5 ansatte — liten nok til å ta raske beslutninger, stor nok til å investere

### Forsterkende signaler
- Taubasert tilgang eller stillasfrie metoder nevnt på nettside eller LinkedIn
- Teknologifokus, bærekraftsrapportering eller automasjonsambisjon omtalt offentlig
- PE-støttet, børsnotert, eller med uttalt vekststrategi — indikerer investeringsvilje
- Opererer i flere land — potensial for bredere DWA-implementering
- Har nevnt droner, robotikk eller ny metodikk i innhold de siste 12 måneder

### Diskvalifiserende faktorer
- Driver utelukkende med innvendig rengjøring
- Færre enn 5 ansatte eller tydelig mangel på investeringskapasitet
- Opererer i Norge (ekskludert som salgsmarked)
- Allerede etablert egen dronevaskoperasjon uten behov for ekstern implementering

---

## Geografisk fokus

Styres av Magnus ved manuell kjøring. Agenten søker i det landet eller markedet som er spesifisert som input. Norge ekskluderes alltid som salgsmarked.

---

## Søkestrategi

### Primære kanaler
- **LinkedIn** — Selskapssøk filtrert på bransje (building maintenance, facility services, facade cleaning, rope access), land og størrelse. Identifiser selskaper med aktivt innhold siste 60 dager.
- **Google** — Søk på bransjefraser per land på lokalt språk (f.eks. "Fassadenreinigung Unternehmen Deutschland", "gevelreiniging bedrijf Nederland")
- **Bransjekataloger** — EFCI (European Cleaning Federation), nasjonale FM-bransjeforeninger, lokale næringslivsregistre

### Sekundære kanaler
- Selskapenes egne nettsider for tjenestebeskrivelser
- Google News for nylige oppkjøp, vekst eller teknologiannonsering
- Supabase — sjekk om selskapet allerede finnes i databasen fra tidligere research

---

## Hva agenten samler per prospekt

For hvert selskap som passerer innledende filtrering:

- Firmanavn, land, by
- Eierstruktur (familieid, PE-støttet, børsnotert)
- Estimert omsetning og antall ansatte
- Hvilke tjenester de tilbyr — med fokus på utvendig arbeid
- Operasjonsland og geografisk rekkevidde
- Kontaktperson og tittel (primært daglig leder eller operasjonsdirektør)
- LinkedIn-URL for selskap og kontaktperson
- Kort begrunnelse for hvorfor selskapet kvalifiserer

---

## Scoringmodell

Agenten rangerer prospekter etter følgende logikk:

| Signal | Vekt |
|---|---|
| Fasadevask er kjernetjeneste (ikke tilleggstjeneste) | Høy |
| Taubasert tilgang eller stillasfri metodikk i dag | Høy |
| Teknologi- eller automasjonsfokus nevnt offentlig | Middels |
| Opererer i flere land | Middels |
| PE-støttet eller børsnotert med vekstmandat | Middels |
| Drone nevnt i innhold siste 12 måneder | Lav (kan indikere konkurrent, ikke bare kunde) |

Prospekter med høy score på de to øverste signalene prioriteres alltid øverst i shortlisten.

---

## Output

Agenten leverer en **lead-shortlist** til Nerra Hub — én liste per kjøring, formatert som Markdown og lagret i Supabase.

Shortlisten inneholder:
- Rangert liste over kvalifiserte prospekter (typisk 5–15 per kjøring)
- Nøkkeldata per selskap som beskrevet over
- Agentens begrunnelse for inkludering og rangering
- Eventuelle røde flagg notert eksplisitt

Magnus eller Martin gjennomgår listen og godkjenner hvilke selskaper som opprettes som leads i CRM. Ingenting opprettes automatisk.

---

## Avgrensninger

- Agenten sender ingen outreach. Det håndteres av en separat skill.
- Agenten oppretter ikke kundeprofiler i CRM. Det krever manuell godkjenning.
- Agenten dupliserer ikke selskaper som allerede finnes i Supabase — eksisterende leads sjekkes alltid mot databasen før ny oppføring foreslås.
