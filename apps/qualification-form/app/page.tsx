import { IntegratedForm } from './components/integrated-form';

export default function QualificationPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b px-6 py-6">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-2xl font-semibold">Nerra</h1>
          <p className="text-sm text-gray-500 mt-1">Drone Wash Academy</p>
        </div>
      </header>

      {/* Single column document + form */}
      <main className="max-w-3xl mx-auto px-6 py-10">
        <IntegratedForm />
      </main>

      {/* Footer */}
      <footer className="border-t px-6 py-6 mt-16">
        <div className="max-w-3xl mx-auto text-center text-xs text-gray-400">
          Nerra AS — Konfidensielt dokument
        </div>
      </footer>
    </div>
  );
}
