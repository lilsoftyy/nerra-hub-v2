# Skill: E-postutkast

## Formål
Leser innkommende e-poster, vurderer kontekst og avsender, og foreslår ett ferdig utkast til svar. Målet er at Magnus eller Martin skal kunne lese utkastet, justere minimalt og sende — ikke skrive fra bunnen av.

---

## Trigger
Kjøres automatisk når en ny e-post kommer inn på en av Nerras kontoer. Agenten behandler e-posten og legger utkastet i godkjenningskøen i Nerra Hub.

---

## Steg 1 — Identifiser avsender

Agenten sjekker først om avsenderens e-postadresse finnes i Supabase.

**Kjent avsender (eksisterende kunde eller lead):**
- Hent kundeprofil fra CRM — fase, siste møte, åpne handlingspunkter, historikk
- Les e-posten i lys av denne konteksten
- Utkastet skal reflektere hvor kunden er i prosessen

**Ukjent avsender:**
- Les kun selve e-posten
- Ikke gjett på kontekst som ikke finnes
- Behandles som kald henvendelse inntil annet er avklart

---

## Steg 2 — Kategoriser e-posten

Agenten klassifiserer e-posten i én av følgende kategorier før den skriver utkast:

| Kategori | Beskrivelse |
|---|---|
| Kald henvendelse | Ukjent avsender som tar kontakt for første gang |
| Kundeoppfølging | Eksisterende kunde med spørsmål eller oppdatering |
| Praktisk koordinering | Dato, logistikk, dokumenter, bekreftelser |
| Klage eller misnøye | Avsender uttrykker frustrasjon eller problem |
| Strategisk / juridisk / økonomisk | Inneholder tilbud, avtaler, betingelser eller sensitiv beslutning |
| Intern | Mellom Magnus og Martin — agenten skriver ikke utkast, men flagges for oversikt |

---

## Steg 3 — Flagging

Agenten vurderer hvem e-posten naturlig er ment for og flagger dette i Hub:

**Flagges til Magnus:**
- Strategiske spørsmål om pris, pakker eller avtalevilkår
- Juridiske eller økonomiske henvendelser
- Tekniske spørsmål om plattform, utvikling eller regulatoriske forhold
- Henvendelser fra investorer, partnere eller media

**Flagges til Martin:**
- Spørsmål om kursinnhold, opplæringsplan eller praktisk gjennomføring
- Koordinering av datoer og reise
- Oppfølging fra eksisterende kunder i operativ fase
- Generell kundekontakt og relasjonsbygging

**Uklar fordeling:**
Hvis agenten ikke kan avgjøre hvem e-posten tilhører, flagges den til begge med en kort begrunnelse.

---

## Steg 4 — Skriv utkast

Agenten skriver alltid ett utkast. Aldri flere alternativer.

### Tone og stil
- Profesjonell men varm — ikke formell og stiv
- Direkte og konkret — ingen unødvendig innledning
- Tilpass tonen til avsender: kald henvendelse får litt mer struktur, kjent kunde får mer personlig tone
- Skriv på samme språk som avsender brukte

### Innhold
- Svar på det som faktisk ble spurt om — ikke mer
- Hvis noe mangler for å gi et fullstendig svar, noter dette tydelig i flaggingen — ikke dikter opp informasjon
- Kald henvendelse: bekreft mottak, vis interesse, foreslå en kort samtale som neste steg
- Klage eller misnøye: anerkjenn problemet først, løsning etterpå — aldri defensivt

### Signatur
Agenten setter signaturen basert på hvem e-posten er flagget til:
- Magnus: Magnus Skarpaas Andersen, Nerra AS
- Martin: Martin Skarpaas Andersen, Nerra AS
- Uklar: ingen signatur settes — Magnus eller Martin velger selv

---

## Output

Agenten leverer følgende til godkjenningskøen i Nerra Hub:

- **Kategori** — hva slags e-post dette er
- **Flagget til** — Magnus, Martin, eller begge
- **Kort kontekst** — 1–2 setninger om hva e-posten handler om og eventuell CRM-kontekst
- **Utkast** — ferdig e-posttekst klar til sending

Magnus eller Martin leser, justerer ved behov og sender manuelt. Ingenting sendes automatisk.

---

## Avgrensninger

- Agenten sender aldri e-post på egenhånd
- Agenten skriver ikke utkast til interne e-poster mellom Magnus og Martin
- Agenten finner ikke opp informasjon — hvis kontekst mangler, noteres dette eksplisitt
