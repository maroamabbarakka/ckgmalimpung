export function PosLayout({ title, subtitle, patient, queue, children, actions }) {
  return (
    <main className="mx-auto max-w-7xl px-3 py-4 pb-28 md:px-6 md:py-6">
      <header className="mb-4 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
        {subtitle && <p className="text-xs font-bold uppercase text-teal-600">{subtitle}</p>}
        <h1 className="text-2xl font-black text-slate-900 md:text-3xl">{title}</h1>
        {patient && (
          <div className="mt-3 rounded-2xl bg-slate-50 p-3">
            <p className="text-sm font-black text-slate-800">{patient.nama}</p>
            <p className="text-xs text-slate-500">NIK: {patient.nik || '-'} | Umur: {patient.umur || '-'}</p>
          </div>
        )}
      </header>

      <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
        <aside className="rounded-3xl border border-slate-200 bg-white p-3 shadow-sm">{queue}</aside>
        <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">{children}</section>
      </div>

      {actions && (
        <footer className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/95 p-3 backdrop-blur md:static md:mt-4 md:rounded-3xl md:border md:shadow-sm">
          {actions}
        </footer>
      )}
    </main>
  );
}

export function ActivePatientCard({ patient, visit }) {
  if (!patient && !visit) return null;
  const source = patient || visit || {};

  return (
    <section className="rounded-3xl border border-teal-100 bg-teal-50 p-4">
      <p className="text-xs font-black uppercase text-teal-700">Pasien Aktif</p>
      <h2 className="mt-1 text-xl font-black text-slate-900">{source.nama || source.patientName || '-'}</h2>
      <p className="text-sm text-slate-600">
        NIK: {source.nik || source.patientNIK || '-'} | {source.umur || source.age || '-'} tahun | {source.jenisKelamin || source.j_kelamin || '-'}
      </p>
      <p className="mt-2 text-xs font-bold text-teal-700">Status: {visit?.statusLabel || visit?.status || visit?.status_antrian || '-'}</p>
    </section>
  );
}
