# Skill: Faseovergang

## Formål
Overvåker all kommunikasjon og aktivitet knyttet til en kunde, oppdager når kriteriene for neste fase er oppfylt, og foreslår faseovergang til Magnus eller Martin for godkjenning. Agenten flytter aldri en kunde automatisk — alt krever manuell bekreftelse.

---

## Kundeprosessen — 17 steg

Alle kunder går gjennom følgende prosess fra første kontakt til operativ drift:

| Steg | Beskrivelse |
|---|---|
| 1 | Innkommende lead |
| 2 | Kvalifiseringsskjema sendt |
| 3 | Kvalifiseringsskjema mottatt |
| 4 | Første møte gjennomført |
| 5 | Evaluering og prisforslag utarbeidet |
| 6 | Tilbud sendt |
| 7 | Kontrakt signert / forskuddsbetaling mottatt |
| 8 | Kursplattform åpnet / dokumentpakke levert |
| 9 | Utstyrskartlegging gjennomført |
| 10 | A1/A3-sertifisering fullført |
| 11 | A2-sertifisering fullført |
| 12 | Utstyr innkjøpt |
| 13 | Digitale kurs gjennomført |
| 14 | Praktisk opplæring booket |
| 15 | Praktisk opplæring gjennomført |
| 16 | Sluttfaktura sendt |
| 17 | Kunde operativ |

---

## Hva agenten overvåker

Agenten leser kontinuerlig all kommunikasjon knyttet til kunden:

- **Slack** — meldinger mellom Magnus og Martin om kunden
- **E-post** — korrespondanse med kunden via Google Workspace
- **Møtereferater** — output fra møtereferentagenten
- **CRM-aktivitet** — registrerte hendelser og dokumenter i Nerra Hub

Agenten matcher det den leser mot nåværende fase og vurderer om noe indikerer at et steg er fullført.

---

## Kriterier per faseovergang

### Steg 1 → 2: Kvalifiseringsskjema sendes
- Trigger: Kunden er registrert i CRM og innledende kontakt er bekreftet
- Signal: Magnus eller Martin bekrefter at kunden er klar for neste steg

### Steg 2 → 3: Skjema mottatt
- Trigger: Kvalifiseringsskjema er fylt ut og lagret i Supabase
- Signal: Automatisk systemhendelse — agenten oppdager innkommet skjemasvar

### Steg 3 → 4: Første møte gjennomført
- Trigger: Møtereferat fra Agent 1 er generert og kunden er identifisert
- Signal: Referat inneholder bekreftet gjennomført møte med kunden

### Steg 4 → 5: Evaluering og prisforslag utarbeidet
- Trigger: Intern diskusjon i Slack eller e-post indikerer at Magnus har vurdert pakker og pris
- Signal: Eksplisitt nevnt at tilbud er under utarbeidelse eller klart

### Steg 5 → 6: Tilbud sendt
- Trigger: Tilbud er generert i CRM og sendt til kunden
- Signal: Systemhendelse fra kontraktgenerering, eller e-post til kunden med tilbud

### Steg 6 → 7: Kontrakt signert og forskuddsbetaling mottatt
- Trigger: Signert kontrakt mottatt OG 60%-betaling bekreftet i Tripletex
- Signal: Begge deler må være på plass — ikke bare signering alene

### Steg 7 → 8: Kursplattform åpnet og dokumentpakke levert
- Trigger: Kurstilgang aktivert for kundens brukere og dokumentpakke sendt
- Signal: Systemhendelse fra kursplattform + e-post til kunden med dokumenter

### Steg 8 → 9: Utstyrskartlegging gjennomført
- Trigger: Kunden har mottatt utstyrsveiledning og bekreftet hvilke droner/utstyr de planlegger å kjøpe
- Signal: Nevnt i møtereferat, e-post eller Slack

### Steg 9 → 10: A1/A3-sertifisering fullført
- Trigger: Kunden bekrefter at alle relevante personer har A1/A3-sertifikat
- Signal: Melding fra kunden i e-post eller Slack, eller nevnt i møte

### Steg 10 → 11: A2-sertifisering fullført
- Trigger: Kunden bekrefter at piloter har A2-sertifikat
- Signal: Melding fra kunden i e-post eller Slack, eller nevnt i møte

### Steg 11 → 12: Utstyr innkjøpt
- Trigger: Kunden bekrefter at droner og nødvendig utstyr er kjøpt og på plass
- Signal: Melding fra kunden i e-post eller Slack, eller nevnt i møte

### Steg 12 → 13: Digitale kurs gjennomført
- Trigger: Kursplattformen registrerer at alle relevante brukere har fullført påkrevde kurs
- Signal: Systemhendelse fra kursplattform

### Steg 13 → 14: Praktisk opplæring booket
- Trigger: Dato og lokasjon for praktisk opplæring er bekreftet med kunden
- Signal: Kalenderoppføring opprettet, eller eksplisitt bekreftelse i e-post eller Slack

### Steg 14 → 15: Praktisk opplæring gjennomført
- Trigger: Opplæringsuken er over og Martin bekrefter at opplæringen er gjennomført
- Signal: Melding fra Martin i Slack, eller møtereferat fra opplæringsuke

### Steg 15 → 16: Sluttfaktura sendt
- Trigger: 40%-faktura er generert og sendt til kunden via Tripletex
- Signal: Systemhendelse fra Tripletex

### Steg 16 → 17: Kunde operativ
- Trigger: Sluttfaktura er betalt og kunden er bekreftet selvstendig operativ
- Signal: Betaling bekreftet i Tripletex, eventuelt kombinert med bekreftelse fra kunden

---

## Output

Når agenten oppdager at kriteriene for neste steg sannsynligvis er oppfylt, leverer den et forslag i Nerra Hub:

- **Kunde:** Firmanavn
- **Nåværende steg:** Steg X — beskrivelse
- **Foreslått steg:** Steg X+1 — beskrivelse
- **Grunnlag:** Kort beskrivelse av hva agenten oppdaget og hvor (f.eks. "Martin bekreftet i Slack 08.04 at praktisk opplæring er gjennomført")
- **Handling:** Godkjenn / Avvis

Magnus eller Martin godkjenner eller avviser forslaget. Ved godkjenning oppdateres CRM.

---

## Avgrensninger

- Agenten flytter aldri en kunde til neste fase uten godkjenning
- Agenten eskalerer ikke forbi én fase om gangen — selv om flere steg ser ut til å være fullført, foreslås de ett om gangen
- Ved tvetydig signal — agenten er usikker på om kriteriet faktisk er oppfylt — noteres dette i grunnlaget og forslaget merkes som usikkert
- Agenten overtar ikke for kundeoppfølgingsagenten — den reagerer på fullførte steg, ikke på manglende aktivitet
