# Skill: Kunderesearch

## Formål
Gjennomfører dyp, kontekstuell research på ett spesifikt selskap. Målet er å gi Magnus og Martin et solid beslutnings- og møtegrunnlag — ikke bare fakta, men tolket informasjon som er direkte nyttig i en salgssituasjon eller oppstartsfase.

---

## Triggere

### 1. Automatisk — etter innkommet kvalifiseringsskjema
Når en potensiell kunde fyller ut kvalifiseringsskjemaet, trigges agenten automatisk. Skjemadataene brukes aktivt som input — agenten vet allerede hva selskapet driver med, hvilke fasadetyper de vasker, droneerfaring, mål og forventet oppstart. Researchet bygger videre på dette og fyller hullene.

Output: Full initial kunderapport.

### 2. Manuell — Magnus eller Martin trigger fra Nerra Hub
Kan kjøres på et hvilket som helst selskap, også før første kontakt. Nyttig når et interessant prospekt dukker opp og man vil vite mer før outreach.

Output: Kompakt prospektrapport — raskere og mindre detaljert enn full kunderapport.

---

## Hva agenten researcher

### Om selskapet
- Offisielt firmanavn, org.nr., eierstruktur (familieid, PE-støttet, børsnotert)
- Estimert omsetning og antall ansatte
- Kjernetjenester — hva de faktisk gjør, ikke bare hva de kaller seg
- Geografisk dekningsområde og operasjonsland
- Selskapets historie og vekstbane
- Nylige nyheter, oppkjøp, strategiske signaler eller pressemeldinger
- Hva selskapet har publisert på LinkedIn og nettside siste 60 dager

### Om kontaktperson og beslutningstager
- Navn, tittel, LinkedIn-profil
- Tid i selskapet og karrierebakgrunn
- Eventuelle offentlige uttalelser om teknologi, automasjon eller bransjetrend
- Kommunikasjonsstil basert på innhold de har publisert — formell eller uformell

### Regulatorisk kontekst for kundens land
- Hvilken nasjonal luftfartsmyndighet som gjelder
- EASA-rammeverk: spesifikk kategori, PDRA-S01, nasjonale særkrav og unntak
- Hvor modent dronemarkedet er i landet — etablert regulering, eller uklart landskap
- Kjente operatører i landet som referansepunkt

### Lokale forhold
- Utstyrsleverandører for DJI Matrice 300/350 i regionen
- Kjemikalie- og forbruksvareleverandører lokalt
- Typiske bygningstyper og fasadematerialer i markedet
- Klimatiske forhold som påvirker operasjoner (vind, temperatur, nedbør)

### Konkurranselandskap
- Finnes det andre selskaper i regionen som allerede tilbyr dronebasert fasadevask?
- Er prospektet kjent med eller i dialog med konkurrerende tilbydere?
- Eventuelle referanser til at prospektet selv har testet eller vurdert droner

---

## Output

### Full initial kunderapport (trigger 1 — etter kvalifiseringsskjema)
Omfattende dokument lagret som Markdown i Supabase, knyttet til kundeprofilen. Inneholder:

- Selskapsprofil med all informasjon listet over
- Tolkning av kvalifiseringsskjema-svarene — hva er sterke sider, hva mangler, hva bør avklares
- Kulturell og forretningsmessig kontekst for landet
- Regulatorisk landskap og hva det betyr praktisk for implementering
- Lokale leverandører og infrastruktur
- Eventuelle red flags notert eksplisitt
- Forslag til samtaleemner og konkrete spørsmål til første møte

Magnus og Martin varsles i Nerra Hub når rapporten er klar.

### Kompakt prospektrapport (trigger 2 — manuell kjøring)
Kortere dokument på samme struktur, men uten tolkning av kvalifiseringsskjema. Fokus på det viktigste: hvem er de, passer de profilen, hvem skal kontaktes, og hva er én konkret åpner for outreach basert på noe selskapet har gjort nylig.

---

## Bruk av tidligere research

Agenten sjekker alltid Supabase før den starter. Har Nerra hatt lignende kunder i samme land tidligere, gjenbrukes relevant landspesifikk kunnskap om regulering og lokale leverandører fremfor å starte fra scratch. Dette bygger seg opp over tid.

---

## Avgrensninger

- Agenten skriver ikke outreach-meldinger. Det håndteres av en separat skill.
- Agenten oppdaterer ikke CRM-status. Det håndteres av prosjektstyringsagenten.
- All output leveres til Magnus eller Martin for gjennomgang. Ingenting sendes til kunden.
