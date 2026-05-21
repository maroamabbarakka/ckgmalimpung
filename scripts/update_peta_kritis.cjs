const fs = require('fs');

const file = 'd:/PKM_MALIMPUNG/ckg-malimpung/src/AdminDashboard.jsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Add states
content = content.replace(
  `  const [filters, setFilters] = useState({`,
  `  const [selectedRiskCategory, setSelectedRiskCategory] = useState(null);\n  const [selectedRiskPatient, setSelectedRiskPatient] = useState(null);\n  const [showFilters, setShowFilters] = useState(false);\n  const [filters, setFilters] = useState({`
);

// 2. Add riskPatients logic to analytics useMemo
const risksCalcMatch = `    const risks = getRiskStats(filteredVisits);`;
const riskPatientsLogic = `
    const riskPatients = {
      hipertensi: [],
      hiperglikemia: [],
      obesitas: [],
      paru: [],
      mental: [],
      indera: []
    };

    filteredVisits.forEach((visit) => {
      const td = String(visit.pos2?.td || '');
      const systolic = parseInt(td.split('/')[0], 10);
      if (!Number.isNaN(systolic) && systolic >= 140) riskPatients.hipertensi.push(visit);

      const gds = parseInt(visit.pos4?.gds || visit.pos2?.gds || 0, 10);
      const gdp = parseInt(visit.pos4?.gdp || visit.pos2?.gdp || 0, 10);
      if (gds >= 200 || gdp >= 126) riskPatients.hiperglikemia.push(visit);

      const tb = parseFloat(visit.pos2?.tb || 0);
      const bb = parseFloat(visit.pos2?.bb || 0);
      if (tb > 0 && bb > 0 && !['Bayi/Balita'].includes(getCluster(visit))) {
        const imt = bb / Math.pow(tb / 100, 2);
        if (imt >= 25) riskPatients.obesitas.push(visit);
      }

      const p3 = visit.pos3 || {};
      const p4 = visit.pos4 || {};
      const p5 = visit.pos5 || {};
      const p6 = visit.pos6 || {};
      const skilas = p3.skilas || p6.skilas || {};

      if (
        p4.ppok?.nafas_pendek === 'Ya' ||
        p5.ppok?.nafas_pendek === 'Ya' ||
        p4.resiko_ca_paru?.riw_merokok === 'Ya' ||
        p4.resiko_tb?.batuk_lama === '>2Mg' ||
        p5.resiko_tb?.batuk === 'Ya'
      ) {
        riskPatients.paru.push(visit);
      }

      const mental =
        Object.values(p3.jiwa_srq20 || {}).some((value) => String(value) !== 'Tidak' && String(value) !== 'Tdk' && value !== '') ||
        Object.values(p6.jiwa_srq20 || {}).some((value) => String(value) !== 'Tidak' && String(value) !== 'Tdk' && value !== '') ||
        Object.values(p3.jiwa_sdq || {}).some((value) => String(value) === 'Ya') ||
        skilas.dep_sedih === 'Ya' ||
        skilas.dep_minat_turun === 'Ya';
      if (mental) riskPatients.mental.push(visit);

      const visus = String(p3.mata?.visus || '').toLowerCase();
      if ((visus && !['6/6', 'normal'].includes(visus)) || p3.telinga?.gg_pendengaran === 'Ya' || p3.telinga?.infeksi === 'Ya') {
        riskPatients.indera.push(visit);
      }
    });
`;

if (!content.includes('riskPatients.hipertensi.push')) {
  content = content.replace(risksCalcMatch, risksCalcMatch + riskPatientsLogic);
  
  // Update return object
  content = content.replace(
    `      risks,\n      trend:`,
    `      risks,\n      riskPatients,\n      trend:`
  );
}

// 3. Remove "Dashboard Peta Kritis" title logic
content = content.replace(
  `{activeMenu === 'risiko' && 'Dashboard Peta Kritis Cek Kesehatan Gratis'}\n`,
  ``
);

// 4. Hide subtitle for risiko
content = content.replace(
  `<p className="mt-2 text-sm font-semibold text-slate-500">Backend monitoring untuk Kepala Puskesmas dan Administrator TERSANJUNG.</p>`,
  `{activeMenu !== 'risiko' && <p className="mt-2 text-sm font-semibold text-slate-500">Backend monitoring untuk Kepala Puskesmas dan Administrator TERSANJUNG.</p>}`
);

// 5. Hide global filter
content = content.replace(
  `{activeMenu !== 'privasi' && activeMenu !== 'simpeg' && (`,
  `{activeMenu !== 'privasi' && activeMenu !== 'simpeg' && activeMenu !== 'risiko' && (`
);

// 6. Hide generic section
content = content.replace(
  `{activeMenu !== 'laporan' && activeMenu !== 'privasi' && activeMenu !== 'wilayah' && activeMenu !== 'simpeg' && (`,
  `{activeMenu !== 'laporan' && activeMenu !== 'privasi' && activeMenu !== 'wilayah' && activeMenu !== 'simpeg' && activeMenu !== 'risiko' && (`
);

// 7. Remove 'risiko' from generic title
content = content.replace(
  `{activeMenu === 'risiko' && 'Rangkuman Peta Kritis Cek Kesehatan Gratis'}\n`,
  ``
);

// 8. Add the new risiko section
const newRisikoSection = `
            {activeMenu === 'risiko' && (
              <section className="space-y-6">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h2 className="text-3xl font-black text-slate-950 tracking-tight">Master Control Peta Kritis</h2>
                    <p className="text-sm font-semibold text-slate-500 mt-1">Pemantauan strategis indikator kesehatan wilayah kerja.</p>
                  </div>
                  <button type="button" onClick={() => setShowFilters(!showFilters)} className="rounded-lg bg-white border border-slate-300 px-4 py-2 text-xs font-black text-slate-700 shadow-sm hover:bg-slate-50 transition">
                    {showFilters ? 'Sembunyikan Filter' : 'Tampilkan Filter'}
                  </button>
                </div>

                {showFilters && (
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-3 xl:grid-cols-6 rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <SelectField label="Tahun" value={filters.year} onChange={(value) => updateFilter('year', value)} options={yearOptions} />
                    <SelectField label="Bulan" value={filters.month} onChange={(value) => updateFilter('month', value)} options={['Semua', ...MONTHS]} />
                    <SelectField label="Desa" value={filters.desa} onChange={(value) => updateFilter('desa', value)} options={DESA_OPTIONS} />
                    <SelectField label="Dusun" value={filters.dusun} onChange={(value) => updateFilter('dusun', value)} options={dusunOptions} />
                    <SelectField label="Klaster" value={filters.cluster} onChange={(value) => updateFilter('cluster', value)} options={CLUSTER_OPTIONS} />
                    <div className="flex items-end">
                      <button type="button" onClick={resetFilter} className="w-full h-11 rounded-lg bg-teal-500 px-4 text-xs font-black text-white shadow-sm hover:bg-teal-600 transition">Reset</button>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4 xl:grid-cols-6">
                  {[
                    ['Kardiovaskular', 'hipertensi', analytics.risks.hipertensi, COLORS.rose, 'Hipertensi berat'],
                    ['Gula Tinggi', 'hiperglikemia', analytics.risks.hiperglikemia, COLORS.amber, 'Indikasi diabetes'],
                    ['Obesitas', 'obesitas', analytics.risks.obesitas, COLORS.blue, 'IMT >= 25'],
                    ['Paru / TB', 'paru', analytics.risks.paru, COLORS.teal, 'Batuk / PPOK'],
                    ['Kesehatan Jiwa', 'mental', analytics.risks.mental, COLORS.slate, 'Gejala SRQ/SDQ'],
                    ['Fungsi Indera', 'indera', analytics.risks.indera, COLORS.pink, 'Penglihatan / Pendengaran']
                  ].map(([title, key, value, color, desc]) => (
                    <button 
                      key={key}
                      onClick={() => setSelectedRiskCategory(selectedRiskCategory === key ? null : key)}
                      className={\`text-left p-4 rounded-xl border transition-all duration-200 \${selectedRiskCategory === key ? 'ring-2 shadow-md bg-white scale-[1.02]' : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm'}\`}
                      style={{ borderColor: selectedRiskCategory === key ? color : undefined, ringColor: color }}
                    >
                      <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">{title}</p>
                      <p className="mt-2 text-3xl font-black text-slate-950">{formatNumber(value)}</p>
                      <p className="mt-1 text-[10px] font-bold text-slate-400">{desc}</p>
                    </button>
                  ))}
                </div>

                {selectedRiskCategory && (
                  <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm animate-in fade-in slide-in-from-top-4">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
                      <h3 className="text-lg font-black text-slate-900 capitalize">Daftar Pasien: {selectedRiskCategory}</h3>
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">{analytics.riskPatients[selectedRiskCategory]?.length || 0} Pasien</span>
                    </div>
                    
                    <div className="max-h-[400px] overflow-y-auto">
                      {analytics.riskPatients[selectedRiskCategory]?.length === 0 ? (
                        <p className="text-center py-8 text-sm font-medium text-slate-400">Tidak ada data pasien untuk kategori ini pada rentang filter aktif.</p>
                      ) : (
                        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
                          {analytics.riskPatients[selectedRiskCategory]?.map((visit) => (
                            <button
                              key={visit.id}
                              onClick={() => setSelectedRiskPatient(visit)}
                              className="flex flex-col text-left rounded-lg border border-slate-100 bg-slate-50 p-3 hover:border-teal-300 hover:bg-teal-50 transition"
                            >
                              <span className="font-bold text-slate-900 text-sm truncate">{visit.pasien_snapshot?.nama || visit.patientNIK || 'Tanpa Nama'}</span>
                              <span className="text-xs font-medium text-slate-500 mt-1">{getDesa(visit)} - {getDusun(visit)}</span>
                              <span className="text-[10px] font-bold text-slate-400 mt-2">{formatWaktu(getVisitDate(visit))}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </section>
            )}

`;

content = content.replace(
  `{activeMenu === 'wilayah' && (`,
  newRisikoSection + `{activeMenu === 'wilayah' && (`
);

// 9. Add Patient Detail Modal
const patientDetailModal = `
      {selectedRiskPatient && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 p-5">
              <div>
                <h2 className="text-xl font-black text-slate-950">Detail Pemeriksaan Pasien</h2>
                <p className="text-xs font-semibold text-slate-500">Tinjauan klinis singkat untuk tindak lanjut.</p>
              </div>
              <button type="button" onClick={() => setSelectedRiskPatient(null)} className="rounded-lg bg-white px-3 py-2 text-sm font-black text-slate-500 shadow-sm hover:text-rose-600">
                Tutup
              </button>
            </div>
            <div className="overflow-y-auto p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] font-black uppercase text-slate-400">Nama Lengkap</p>
                  <p className="font-bold text-slate-900">{selectedRiskPatient.pasien_snapshot?.nama || '-'}</p>
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase text-slate-400">NIK / ID</p>
                  <p className="font-bold text-slate-900">{selectedRiskPatient.patientNIK || '-'}</p>
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase text-slate-400">Alamat</p>
                  <p className="font-bold text-slate-900">{getDesa(selectedRiskPatient)} - {getDusun(selectedRiskPatient)}</p>
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase text-slate-400">Waktu Pemeriksaan</p>
                  <p className="font-bold text-slate-900">{formatWaktu(getVisitDate(selectedRiskPatient))}</p>
                </div>
              </div>

              <div className="rounded-xl border border-rose-100 bg-rose-50/50 p-4">
                <h4 className="font-black text-rose-900 mb-3 text-sm">Faktor Risiko (Pos 2 & 4)</h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-rose-700 font-semibold">Tekanan Darah: </span>
                    <span className="font-black text-slate-900">{selectedRiskPatient.pos2?.td || '-'}</span>
                  </div>
                  <div>
                    <span className="text-rose-700 font-semibold">Gula Darah: </span>
                    <span className="font-black text-slate-900">GDS {selectedRiskPatient.pos4?.gds || selectedRiskPatient.pos2?.gds || '-'} / GDP {selectedRiskPatient.pos4?.gdp || selectedRiskPatient.pos2?.gdp || '-'}</span>
                  </div>
                  <div>
                    <span className="text-rose-700 font-semibold">Tinggi Badan: </span>
                    <span className="font-black text-slate-900">{selectedRiskPatient.pos2?.tb || '-'} cm</span>
                  </div>
                  <div>
                    <span className="text-rose-700 font-semibold">Berat Badan: </span>
                    <span className="font-black text-slate-900">{selectedRiskPatient.pos2?.bb || '-'} kg</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-rose-700 font-semibold">Lingkar Perut: </span>
                    <span className="font-black text-slate-900">{selectedRiskPatient.pos2?.lp || '-'} cm</span>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-4">
                <h4 className="font-black text-blue-900 mb-3 text-sm">Catatan Lanjutan (Pos 3 & 5)</h4>
                <div className="space-y-2 text-sm">
                  <p>
                    <span className="text-blue-700 font-semibold">Mental / Jiwa: </span>
                    <span className="font-bold text-slate-900">
                       {selectedRiskPatient.pos3?.skilas?.dep_sedih === 'Ya' || selectedRiskPatient.pos6?.skilas?.dep_sedih === 'Ya' ? 'Ada keluhan sedih/minat turun' : 'Tidak ada indikasi umum dari skilas'}
                    </span>
                  </p>
                  <p>
                    <span className="text-blue-700 font-semibold">Indera: </span>
                    <span className="font-bold text-slate-900">
                      Visus {selectedRiskPatient.pos3?.mata?.visus || '-'} | Pendengaran terganggu: {selectedRiskPatient.pos3?.telinga?.gg_pendengaran || '-'}
                    </span>
                  </p>
                  <p>
                    <span className="text-blue-700 font-semibold">PPOK / TB: </span>
                    <span className="font-bold text-slate-900">
                      Napas Pendek: {selectedRiskPatient.pos4?.ppok?.nafas_pendek || selectedRiskPatient.pos5?.ppok?.nafas_pendek || '-'} | Batuk Lama: {selectedRiskPatient.pos4?.resiko_tb?.batuk_lama || selectedRiskPatient.pos5?.resiko_tb?.batuk || '-'}
                    </span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
`;

content = content.replace(
  `{isStaffModalOpen && editStaff && (`,
  patientDetailModal + `\n      {isStaffModalOpen && editStaff && (`
);

fs.writeFileSync(file, content);
console.log('Update Peta Kritis selesai.');
