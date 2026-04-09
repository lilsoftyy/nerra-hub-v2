# Skill: Kontraktgenerering

## Formål
Guider Magnus eller Martin gjennom et strukturert intervju for å samle all nødvendig informasjon om kundens behov, og genererer deretter et komplett tilbudsdokument basert på svarene. Tilbudet legges i godkjenningskøen i Nerra Hub for manuell gjennomgang og sending.

---

## Trigger
Kjøres manuelt fra kundens profil i Nerra Hub — typisk etter at evaluering og prisforslag er utarbeidet (steg 5 i kundeprosessen).

---

## Steg 1 — Hent kundekontekst

Agenten henter automatisk følgende fra CRM før intervjuet starter:

- Firmanavn, land og kontaktperson
- Kvalifiseringsskjema-svar
- Møtereferater
- Eventuelle notater om kundens behov og størrelse

Dette brukes til å stille mer presise spørsmål og unngå å spørre om ting som allerede er kjent.

---

## Steg 2 — Strukturert intervju

Agenten stiller spørsmålene i denne rekkefølgen. Hvert svar lagres og brukes direkte i tilbudet.

### Kurspakker
- Hvor mange **medhjelpere** skal læres opp? *(3 000 NOK per person)*
- Hvor mange **piloter** skal læres opp? *(7 500 NOK per person)*
- Hvor mange **Accountable Managers** skal læres opp? *(15 000 NOK per person)*

### Tilleggstjenester
- Skal kunden ha **dokument- og markedsføringspakke**? *(5 000 NOK)*
- Skal kunden ha **operasjonsmanual**? *(60 000 NOK)*
- Skal kunden ha **praktisk opplæring**? *(100 000 NOK per lokasjon/gruppe)*
  - Hvis ja: Hvor mange lokasjoner?
  - Hvis ja: Reise og hotell faktureres separat — bekreft at dette er kommunisert til kunden

### Prisjustering
- Skal det legges på et **prosentpåslag** på totalsum? *(f.eks. +10% for kompleksitet eller hastegrad)*
- Skal det legges inn et **fratrekk** på totalsum? *(f.eks. rabatt for stor kunde eller strategisk prioritering)*

### Betalingsstruktur
Agenten spør alltid om betalingsstruktur — det finnes ingen standard, og dette avklares individuelt med hver kunde:
- Hva er avtalt betalingsstruktur med kunden? *(f.eks. 60% ved signering og 40% etter opplæring, eller annen fordeling)*
- Er det avtalt delbetaling, milepælsbasert betaling, eller annet?

Svaret noteres eksplisitt og reflekteres i tilbudsdokumentet.

### Kontraktdetaljer
- Hva er **forventet oppstartsdato** for implementeringen?
- Er det spesielle **vilkår eller avtaler** som skal inn i kontrakten utover standard leveringsvilkår?

---

## Steg 3 — Prisberegning

Agenten beregner totalsum basert på svarene:

| Linje | Antall | Enhetspris | Sum |
|---|---|---|---|
| Medhjelper-kurs | X | 3 000 NOK | X × 3 000 |
| Pilot-kurs | X | 7 500 NOK | X × 7 500 |
| Accountable Manager-kurs | X | 15 000 NOK | X × 15 000 |
| Dokument- og markedsføringspakke | 1 | 5 000 NOK | 5 000 |
| Operasjonsmanual | 1 | 60 000 NOK | 60 000 |
| Praktisk opplæring | X lokasjoner | 100 000 NOK | X × 100 000 |
| **Subtotal** | | | |
| Prisjustering (± %) | | | |
| **Totalsum** | | | |
| **60% ved signering** | | | |
| **40% etter opplæring** | | | |

*Alle tilbud faktureres i EUR. Reise og hotell faktureres separat og er ikke inkludert i totalsum.*

---

## Steg 4 — Generer tilbudsdokument

Agenten genererer et komplett tilbudsdokument på engelsk (standard for alle kunder) som inneholder:

- Nerras logo og kontaktinformasjon
- Kundens firmanavn, land og kontaktperson
- Dato og tilbudsnummer
- Beskrivelse av hva DWA-implementeringen inneholder
- Spesifisert pristabell med alle valgte linjer
- Totalsum med prisjustering
- Betalingsstruktur — 60/40-fordeling med beløp
- Forventet oppstartsdato
- Gyldighetsperiode for tilbudet *(standard: 30 dager)*
- Referanse til generelle leveringsvilkår

---

## Output

Tilbudsdokumentet legges i godkjenningskøen i Nerra Hub med:

- **Kunde:** Firmanavn og land
- **Totalsum:** Beregnet sum inkludert prisjustering
- **Valuta:** EUR
- **Generert:** Dato og tidspunkt
- **Handling:** Godkjenn og send / Rediger / Avvis

Magnus eller Martin gjennomgår tilbudet, justerer ved behov og sender manuelt til kunden. Ingenting sendes automatisk.

---

## Avgrensninger

- Agenten sender aldri tilbud på egenhånd
- Agenten dikterer ikke prisjustering — det er alltid Magnus eller Martin som bestemmer eventuelt påslag eller rabatt
- Agenten dikterer ikke betalingsstruktur — dette avklares alltid med kunden og noteres eksplisitt
- Alle tilbud genereres i EUR
- Reise og hotell er alltid separat — agenten skal aldri inkludere dette i tilbudssummen
- Agenten genererer ikke kontrakten på kundens språk — tilbudet er alltid på engelsk
