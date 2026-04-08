'use client';

import { useState } from 'react';

export function IntegratedForm() {
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);

    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());

    try {
      const hubUrl = process.env.NEXT_PUBLIC_HUB_URL || 'https://nerra-hub.vercel.app';
      const res = await fetch(`${hubUrl}/api/public/qualification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (res.ok) {
        setSubmitted(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        alert('Noe gikk galt. Vennligst prøv igjen.');
      }
    } catch {
      alert('Kunne ikke sende skjemaet. Sjekk internettforbindelsen.');
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="py-16 text-center">
        <h2 className="text-2xl font-semibold text-gray-900">Takk for innsendingen</h2>
        <p className="mt-4 text-gray-600 leading-7 max-w-lg mx-auto">
          Vi har mottatt kvalifiseringsskjemaet ditt og vil gjennomgå informasjonen.
          Vi tar kontakt innen kort tid for å diskutere neste steg.
        </p>
      </div>
    );
  }

  const inputClass = "w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900";
  const labelClass = "block text-sm font-medium text-gray-700 mb-1";

  return (
    <form onSubmit={handleSubmit}>
      {/* Title */}
      <h2 className="text-2xl font-semibold mb-2">Kvalifiserings- og forventningsdokument</h2>
      <p className="text-gray-500 text-sm mb-10">Grunnlag for videre samarbeid</p>

      {/* Section 1 */}
      <section className="mb-10">
        <h3 className="text-lg font-semibold mb-3">1. Bakgrunn og hensikt</h3>
        <p className="text-sm text-gray-700 leading-6 mb-3">
          Dette dokumentet er utarbeidet for å gi et helhetlig bilde av hva et samarbeid med oss innebærer,
          og hvilke forutsetninger som må være på plass for at prosessen skal kunne gjennomføres på en
          forsvarlig og effektiv måte.
        </p>
        <p className="text-sm text-gray-700 leading-6">
          Dokumentet er ment å fungere som et felles referansepunkt før eventuell videre dialog og forpliktelse.
        </p>
      </section>

      {/* Form: Contact + Company */}
      <section className="mb-10 rounded-lg border bg-gray-50 p-6 space-y-4">
        <h3 className="text-base font-semibold text-gray-900">Om dere</h3>

        <div>
          <label htmlFor="contact_name" className={labelClass}>Kontaktperson — navn *</label>
          <input id="contact_name" name="contact_name" required className={inputClass} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="contact_email" className={labelClass}>E-post *</label>
            <input id="contact_email" name="contact_email" type="email" required className={inputClass} />
          </div>
          <div>
            <label htmlFor="contact_phone" className={labelClass}>Telefon</label>
            <input id="contact_phone" name="contact_phone" type="tel" className={inputClass} />
          </div>
        </div>
        <div>
          <label htmlFor="company_name" className={labelClass}>Firmanavn *</label>
          <input id="company_name" name="company_name" required className={inputClass} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="country" className={labelClass}>Land *</label>
            <input id="country" name="country" required className={inputClass} placeholder="f.eks. Norge" />
          </div>
          <div>
            <label htmlFor="operational_area" className={labelClass}>Operasjonsområde</label>
            <input id="operational_area" name="operational_area" className={inputClass} placeholder="f.eks. Oslo og omegn" />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="employee_count" className={labelClass}>Antall ansatte</label>
            <input id="employee_count" name="employee_count" type="number" className={inputClass} />
          </div>
          <div>
            <label htmlFor="facade_team_size" className={labelClass}>Fasadeteam-størrelse</label>
            <input id="facade_team_size" name="facade_team_size" type="number" className={inputClass} />
          </div>
        </div>
      </section>

      {/* Section 2 */}
      <section className="mb-10">
        <h3 className="text-lg font-semibold mb-3">2. Overordnet beskrivelse av samarbeidet</h3>
        <p className="text-sm text-gray-700 leading-6 mb-3">
          Vi bistår virksomheter som ønsker å etablere eller profesjonalisere dronevaskoperasjoner
          innenfor EASA-regelverket. Vårt bidrag er kurs, struktur, erfaringsoverføring, metode og
          praktisk veiledning – ikke overtakelse av ansvar.
        </p>
        <p className="text-sm text-gray-700 leading-6 mb-2">Samarbeidet omfatter blant annet:</p>
        <ul className="text-sm text-gray-700 leading-6 list-disc ml-5 space-y-1 mb-3">
          <li>Regulatorisk forståelse og anvendelse</li>
          <li>Operativ struktur og modenhet</li>
          <li>Rolleavklaringer og styringsmodell</li>
          <li>Dokumentasjon, prosedyrer og praksis</li>
        </ul>
        <p className="text-sm text-gray-700 leading-6">
          Alle løsninger tilpasses virksomhetens faktiske kapasitet og modenhet.
        </p>
      </section>

      {/* Form: Services + Experience */}
      <section className="mb-10 rounded-lg border bg-gray-50 p-6 space-y-4">
        <h3 className="text-base font-semibold text-gray-900">Deres virksomhet</h3>

        <div>
          <label htmlFor="building_types" className={labelClass}>Hvilke typer bygninger har dere i porteføljen? *</label>
          <p className="text-xs text-gray-500 mb-1">F.eks. enebolig, borettslag, blokker, kontor, eiendomsforvaltning</p>
          <textarea id="building_types" name="building_types" required rows={2} className={inputClass} />
        </div>
        <div>
          <label htmlFor="current_methods" className={labelClass}>Nåværende metoder for fasadevask</label>
          <p className="text-xs text-gray-500 mb-1">F.eks. lift, stige, tau, kjemisk vask</p>
          <textarea id="current_methods" name="current_methods" rows={2} className={inputClass} />
        </div>
        <div>
          <label htmlFor="drone_experience" className={labelClass}>Har dere droneerfaring fra før?</label>
          <p className="text-xs text-gray-500 mb-1">Beskriv eventuell erfaring, sertifiseringer (A1/A3, A2, STS-01), utstyr osv.</p>
          <textarea id="drone_experience" name="drone_experience" rows={3} className={inputClass} />
        </div>
      </section>

      {/* Section 3 */}
      <section className="mb-10">
        <h3 className="text-lg font-semibold mb-3">3. Rolle- og ansvarsforståelse</h3>

        <h4 className="text-base font-semibold mt-4 mb-2">3.1 Accountable Manager – praktisk betydning</h4>
        <p className="text-sm text-gray-700 leading-6 mb-3">
          Accountable Manager er en sentral rolle i et dronefirma. Rollen innebærer det overordnede
          ansvaret overfor både interne og eksterne krav, inkludert myndigheter.
        </p>
        <p className="text-sm text-gray-700 leading-6 mb-2">Vi forventer at Accountable Manager:</p>
        <ul className="text-sm text-gray-700 leading-6 list-disc ml-5 space-y-1 mb-3">
          <li>Forstår sitt juridiske og operative ansvar</li>
          <li>Har myndighet til å ta bindende beslutninger</li>
          <li>Er tilgjengelig og involvert gjennom hele løpet</li>
          <li>Har eierskap til både prosess og resultat</li>
          <li>Personlige egenskaper: Trygg i seg selv, tør å ha ansvar, reflektert</li>
        </ul>
        <p className="text-sm font-semibold text-gray-900 leading-6 mb-3">
          Uten en tydelig og reell Accountable Manager vil prosjektet ikke være gjennomførbart.
        </p>

        <h4 className="text-base font-semibold mt-4 mb-2">3.2 Organisatorisk forankring</h4>
        <p className="text-sm text-gray-700 leading-6 mb-2">Samarbeidet forutsetter at ledelsen i virksomheten:</p>
        <ul className="text-sm text-gray-700 leading-6 list-disc ml-5 space-y-1 mb-3">
          <li>Støtter Accountable Manager-rollen</li>
          <li>Aksepterer nødvendige organisatoriske tilpasninger</li>
          <li>Prioriterer etterlevelse fremfor snarveier</li>
        </ul>
        <p className="text-sm text-gray-700 leading-6">
          Dette er avgjørende for langsiktig operativ drift.
        </p>
      </section>

      {/* Section 4 */}
      <section className="mb-10">
        <h3 className="text-lg font-semibold mb-3">4. Regulatorisk rammeverk – EASA</h3>
        <p className="text-sm text-gray-700 leading-6 mb-3">
          Vi arbeider kun innenfor EASA-regelverk i land der vi har dokumentert operativ erfaring.
        </p>
        <p className="text-sm text-gray-700 leading-6 mb-2">Dette innebærer:</p>
        <ul className="text-sm text-gray-700 leading-6 list-disc ml-5 space-y-1 mb-3">
          <li>Kjennskap til praktisk myndighetsdialog</li>
          <li>Erfaring med tolkning og implementering</li>
          <li>Realistisk tilnærming til krav og begrensninger</li>
        </ul>
        <p className="text-sm text-gray-700 leading-6">
          Denne avgrensningen er gjort for å sikre kvalitet og forutsigbarhet for begge parter.
        </p>
      </section>

      {/* Section 5 */}
      <section className="mb-10">
        <h3 className="text-lg font-semibold mb-3">5. Kundens bidrag og ansvar</h3>
        <p className="text-sm text-gray-700 leading-6 mb-2">
          For å lykkes med dette løpet må kunden bidra aktivt gjennom:
        </p>
        <ul className="text-sm text-gray-700 leading-6 list-disc ml-5 space-y-1 mb-3">
          <li>Dedikert tidsbruk</li>
          <li>Tilgang til nødvendig informasjon og dokumentasjon</li>
          <li>Intern kommunikasjon og forankring</li>
          <li>Åpenhet rundt utfordringer og begrensninger</li>
        </ul>
        <p className="text-sm text-gray-700 leading-6">
          Vi kan strukturere og veilede – men ikke kompensere for manglende eierskap.
        </p>
      </section>

      {/* Section 6 */}
      <section className="mb-10">
        <h3 className="text-lg font-semibold mb-3">6. Arbeidsform og prinsipper</h3>
        <p className="text-sm text-gray-700 leading-6 mb-2">Vårt arbeid bygger på følgende prinsipper:</p>
        <ul className="text-sm text-gray-700 leading-6 list-disc ml-5 space-y-1 mb-3">
          <li>Tydelige forventninger</li>
          <li>Ingen løfter som ikke kan holdes</li>
          <li>Dokumentasjon gjennom hele prosessen</li>
          <li>Fokus på varig operativ kvalitet</li>
        </ul>
        <p className="text-sm text-gray-700 leading-6">
          Vi prioriterer samarbeid med aktører som deler dette verdigrunnlaget.
        </p>
      </section>

      {/* Section 7 */}
      <section className="mb-10">
        <h3 className="text-lg font-semibold mb-3">7. Selvkvalifisering før videre dialog</h3>
        <p className="text-sm text-gray-700 leading-6 mb-2">Før dere går videre anbefaler vi at dere vurderer:</p>
        <ul className="text-sm text-gray-700 leading-6 list-disc ml-5 space-y-1">
          <li>Har dere riktig person i Accountable Manager-rollen?</li>
          <li>Er dere forberedt på regulatorisk ansvar?</li>
          <li>Opererer dere innenfor riktig geografisk og regulatorisk område?</li>
          <li>Er dere villige til å investere nødvendig innsats?</li>
        </ul>
      </section>

      {/* Form: Goals */}
      <section className="mb-10 rounded-lg border bg-gray-50 p-6 space-y-4">
        <h3 className="text-base font-semibold text-gray-900">Mål og forventninger</h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="desired_start_date" className={labelClass}>Ønsket oppstartsdato</label>
            <input id="desired_start_date" name="desired_start_date" type="date" className={inputClass} />
          </div>
          <div>
            <label htmlFor="drone_teams" className={labelClass}>Antall ønsket drone-team</label>
            <input id="drone_teams" name="drone_teams" type="number" min="1" className={inputClass} />
          </div>
        </div>
        <div>
          <label htmlFor="additional_info" className={labelClass}>Annet vi bør vite?</label>
          <textarea id="additional_info" name="additional_info" rows={3} className={inputClass} />
        </div>
      </section>

      {/* Section 8 */}
      <section className="mb-10">
        <h3 className="text-lg font-semibold mb-3">8. Neste steg</h3>
        <p className="text-sm text-gray-700 leading-6 mb-3">
          Dersom begge parter vurderer forutsetningene som riktige, vil neste steg være en strukturert
          gjennomgang av deres nåværende situasjon og mål.
        </p>
        <p className="text-sm text-gray-700 leading-6">
          Videre samarbeid forutsetter gjensidig forståelse, tydelig ansvar og realistiske forventninger.
        </p>
      </section>

      {/* Submit */}
      <div className="border-t pt-8">
        <p className="text-sm text-gray-600 mb-4">
          Ved å sende inn dette skjemaet bekrefter du at du har lest og forstått dokumentet over.
        </p>
        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded bg-gray-900 px-4 py-3 text-sm font-medium text-white hover:bg-gray-800 disabled:bg-gray-400 transition-colors"
        >
          {submitting ? 'Sender...' : 'Send inn kvalifiseringsskjema'}
        </button>
      </div>
    </form>
  );
}
