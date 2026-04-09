# Skill: Kontraktgenerering

## Formål
Generer et kontrakttilbud (PDF) for en kunde basert på deres kvalifiseringsdata og avtalte pakker.

## Input
- Kundedata: firmanavn, land, kontaktperson
- DWA-detaljer: pakker, antall piloter, ønsket oppstart
- Prisinformasjon fra Magnus/Martin

## Steg

1. **Hent kundedata** fra Hub — firma, kontakt, DWA-detaljer, kvalifiseringssvar
2. **Bestem pakker** basert på kundens behov:
   - Grunnkurs (teori + praktisk)
   - Utvidet kurs (inkludert STS-01)
   - Full pakke (kurs + utstyr + oppfølging)
3. **Beregn priser** — pris per person × antall deltakere
4. **Sett gyldighetsdato** — standard 30 dager fra i dag
5. **Opprett kontrakt** i Hub med pakker, priser og totalt beløp
6. **Generer PDF** via kontrakts-API-et

## Kontraktinnhold
- Tilbudstittel og dato
- Kundens firmanavn
- Pakkeliste med antall og priser
- Subtotal, eventuell justering, total
- Valuta (standard NOK, EUR for utenlandske)
- Gyldig til-dato
- Nerra AS som avsender

## Regler
- Aldri send kontrakt direkte til kunden. Opprett som utkast og la Magnus/Martin sende.
- Priser settes alltid av mennesker — agenten foreslår basert på standard prisliste, men Magnus godkjenner.
- Kontrakter på norsk for norske kunder, engelsk for utenlandske.
- Valuta følger kundens land: NOK for Norge, EUR for EU-land.
