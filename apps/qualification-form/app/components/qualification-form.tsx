'use client';

import { useState } from 'react';

export function QualificationForm() {
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);

    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());

    try {
      const res = await fetch('/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (res.ok) {
        setSubmitted(true);
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
      <div className="rounded-lg border border-green-200 bg-green-50 p-6 text-center">
        <h3 className="text-lg font-semibold text-green-800">Takk for innsendingen!</h3>
        <p className="mt-2 text-green-700">
          Vi har mottatt informasjonen din og tar kontakt innen kort tid.
        </p>
      </div>
    );
  }

  const inputClass = "w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900";
  const labelClass = "block text-sm font-medium text-gray-700 mb-1";
  const sectionClass = "space-y-4 mb-8";

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Kontaktperson */}
      <div className={sectionClass}>
        <h3 className="text-base font-semibold border-b pb-2">Kontaktperson</h3>
        <div>
          <label htmlFor="contact_name" className={labelClass}>Navn *</label>
          <input id="contact_name" name="contact_name" required className={inputClass} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="contact_email" className={labelClass}>E-post *</label>
            <input id="contact_email" name="contact_email" type="email" required className={inputClass} />
          </div>
          <div>
            <label htmlFor="contact_phone" className={labelClass}>Telefon</label>
            <input id="contact_phone" name="contact_phone" type="tel" className={inputClass} />
          </div>
        </div>
      </div>

      {/* Firma */}
      <div className={sectionClass}>
        <h3 className="text-base font-semibold border-b pb-2">Firmaopplysninger</h3>
        <div>
          <label htmlFor="company_name" className={labelClass}>Firmanavn *</label>
          <input id="company_name" name="company_name" required className={inputClass} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="country" className={labelClass}>Land *</label>
            <input id="country" name="country" required className={inputClass} placeholder="f.eks. Norge" />
          </div>
          <div>
            <label htmlFor="operational_area" className={labelClass}>Operasjonsområde</label>
            <input id="operational_area" name="operational_area" className={inputClass} placeholder="f.eks. Oslo og omegn" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="employee_count" className={labelClass}>Antall ansatte</label>
            <input id="employee_count" name="employee_count" type="number" className={inputClass} />
          </div>
          <div>
            <label htmlFor="facade_team_size" className={labelClass}>Fasadeteam-størrelse</label>
            <input id="facade_team_size" name="facade_team_size" type="number" className={inputClass} />
          </div>
        </div>
      </div>

      {/* Tjenester */}
      <div className={sectionClass}>
        <h3 className="text-base font-semibold border-b pb-2">Tjenester og erfaring</h3>
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
      </div>

      {/* Mål */}
      <div className={sectionClass}>
        <h3 className="text-base font-semibold border-b pb-2">Mål og forventninger</h3>
        <div className="grid grid-cols-2 gap-4">
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
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-md bg-gray-900 px-4 py-3 text-sm font-medium text-white hover:bg-gray-800 disabled:bg-gray-400 transition-colors"
      >
        {submitting ? 'Sender...' : 'Send inn kvalifiseringsskjema'}
      </button>
    </form>
  );
}
