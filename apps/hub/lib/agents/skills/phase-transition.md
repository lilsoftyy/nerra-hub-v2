# Skill: Faseovergang

## Formål
Vurder om en kunde bør flyttes til neste fase i pipelinen, og opprett et forslag (proposal) hvis ja.

## Faser (i rekkefølge)
1. **Lead** — første kontakt, research gjennomført
2. **Kvalifisering** — kvalifiseringsskjema sendt og mottatt
3. **Salg** — møte avtalt/gjennomført, kontrakt sendt
4. **Onboarding** — velkomstpakke sendt, plattformtilgang gitt
5. **Opplæring** — teori og praktisk opplæring, sertifisering
6. **Operativ** — første oppdrag fullført, tilbakemelding samlet
7. **Ferdig** — samarbeidet er avsluttet

## Regler for overgang

### Når skal en kunde flyttes?
- Alle sjekkpunkter for nåværende fase er fullført
- Det finnes ikke allerede et ventende forslag for denne kunden

### Hva er IKKE tillatt?
- Hoppe over faser (f.eks. Lead → Salg)
- Flytte bakover (f.eks. Salg → Kvalifisering) — kun mennesker kan gjøre dette
- Flytte til Ferdig uten at alle steg er gjennomført

## Steg

1. **Hent kundedata** — fase, sjekkpunkter, kontakter, aktivitetslogg
2. **Sjekk sjekkpunkter** — er alle fullført for nåværende fase?
3. **Sjekk ventende forslag** — finnes det allerede et?
4. **Begrunn overgangen** — skriv 1-2 setninger på norsk om hvorfor kunden bør flyttes
5. **Opprett proposal** med action_type: phase_transition

## Proposal-format
```json
{
  "action_type": "phase_transition",
  "title": "Flytt [firmanavn] til [neste fase]",
  "description": "[begrunnelse]",
  "payload": {
    "company_id": "[id]",
    "from_phase": "[nåværende]",
    "to_phase": "[neste]",
    "trigger": "checklist_completed"
  }
}
```
