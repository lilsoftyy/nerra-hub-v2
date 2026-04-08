'use client';

import ReactMarkdown from 'react-markdown';

const documentContent = `# Kvalifiserings- og forventningsdokument
## Grunnlag for videre samarbeid

### 1. Bakgrunn og hensikt
Dette dokumentet er utarbeidet for å gi et helhetlig bilde av hva et samarbeid med oss innebærer, og hvilke forutsetninger som må være på plass for at prosessen skal kunne gjennomføres på en forsvarlig og effektiv måte.

Dokumentet er ment å fungere som et felles referansepunkt før eventuell videre dialog og forpliktelse.

### 2. Overordnet beskrivelse av samarbeidet
Vi bistår virksomheter som ønsker å etablere eller profesjonalisere dronevaskoperasjoner innenfor EASA-regelverket.

Vårt bidrag er kurs, struktur, erfaringsoverføring, metode og praktisk veiledning – ikke overtakelse av ansvar.

Samarbeidet omfatter blant annet:
- Regulatorisk forståelse og anvendelse
- Operativ struktur og modenhet
- Rolleavklaringer og styringsmodell
- Dokumentasjon, prosedyrer og praksis

Alle løsninger tilpasses virksomhetens faktiske kapasitet og modenhet.

### 3. Rolle- og ansvarsforståelse

#### 3.1 Accountable Manager – praktisk betydning
Accountable Manager er en sentral rolle i et dronefirma. Rollen innebærer det overordnede ansvaret overfor både interne og eksterne krav, inkludert myndigheter.

Vi forventer at Accountable Manager:
- Forstår sitt juridiske og operative ansvar
- Har myndighet til å ta bindende beslutninger
- Er tilgjengelig og involvert gjennom hele løpet
- Har eierskap til både prosess og resultat
- Personlige egenskaper: Trygg i seg selv, tør å ha ansvar, reflektert

**Uten en tydelig og reell Accountable Manager vil prosjektet ikke være gjennomførbart.**

#### 3.2 Organisatorisk forankring
Samarbeidet forutsetter at ledelsen i virksomheten:
- Støtter Accountable Manager-rollen
- Aksepterer nødvendige organisatoriske tilpasninger
- Prioriterer etterlevelse fremfor snarveier

Dette er avgjørende for langsiktig operativ drift.

### 4. Regulatorisk rammeverk – EASA
Vi arbeider kun innenfor EASA-regelverk i land der vi har dokumentert operativ erfaring.

Dette innebærer:
- Kjennskap til praktisk myndighetsdialog
- Erfaring med tolkning og implementering
- Realistisk tilnærming til krav og begrensninger

Denne avgrensningen er gjort for å sikre kvalitet og forutsigbarhet for begge parter.

### 5. Kundens bidrag og ansvar
For å lykkes med dette løpet må kunden bidra aktivt gjennom:
- Dedikert tidsbruk
- Tilgang til nødvendig informasjon og dokumentasjon
- Intern kommunikasjon og forankring
- Åpenhet rundt utfordringer og begrensninger

Vi kan strukturere og veilede – men ikke kompensere for manglende eierskap.

### 6. Arbeidsform og prinsipper
Vårt arbeid bygger på følgende prinsipper:
- Tydelige forventninger
- Ingen løfter som ikke kan holdes
- Dokumentasjon gjennom hele prosessen
- Fokus på varig operativ kvalitet

Vi prioriterer samarbeid med aktører som deler dette verdigrunnlaget.

### 7. Selvkvalifisering før videre dialog
Før dere går videre anbefaler vi at dere vurderer:
- Har dere riktig person i Accountable Manager-rollen?
- Er dere forberedt på regulatorisk ansvar?
- Opererer dere innenfor riktig geografisk og regulatorisk område?
- Er dere villige til å investere nødvendig innsats?

### 8. Neste steg
Dersom begge parter vurderer forutsetningene som riktige, vil neste steg være en strukturert gjennomgang av deres nåværende situasjon og mål.

Videre samarbeid forutsetter gjensidig forståelse, tydelig ansvar og realistiske forventninger.
`;

export function QualificationDocument() {
  return (
    <div className="sticky top-8">
      <h2 className="text-lg font-semibold mb-4 text-gray-800">Les dette før du fyller ut</h2>
      <div className="rounded-lg border bg-gray-50 p-6 max-h-[calc(100vh-12rem)] overflow-y-auto">
        <article className="text-sm leading-6 text-gray-700">
          <ReactMarkdown
            components={{
              h1: ({ children }) => (
                <h1 className="text-lg font-semibold mt-0 mb-2 text-gray-900">{children}</h1>
              ),
              h2: ({ children }) => (
                <h2 className="text-base font-semibold mt-5 mb-2 text-gray-900 first:mt-0">{children}</h2>
              ),
              h3: ({ children }) => (
                <h3 className="text-sm font-semibold mt-4 mb-1 text-gray-900">{children}</h3>
              ),
              h4: ({ children }) => (
                <h4 className="text-sm font-semibold mt-3 mb-1 text-gray-800">{children}</h4>
              ),
              p: ({ children }) => (
                <p className="mb-2 leading-6">{children}</p>
              ),
              ul: ({ children }) => (
                <ul className="mb-2 ml-4 list-disc space-y-0.5">{children}</ul>
              ),
              li: ({ children }) => (
                <li className="leading-6">{children}</li>
              ),
              strong: ({ children }) => (
                <strong className="font-semibold text-gray-900">{children}</strong>
              ),
            }}
          >
            {documentContent}
          </ReactMarkdown>
        </article>
      </div>
    </div>
  );
}
