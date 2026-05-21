const fs = require('fs');
const file = 'd:/PKM_MALIMPUNG/ckg-malimpung/src/AdminDashboard.jsx';
let content = fs.readFileSync(file, 'utf8');

// Add search state if not exists
const stateTarget = `const [selectedRiskCategory, setSelectedRiskCategory] = useState(null);`;
if (!content.includes('const [searchRiskPatient, setSearchRiskPatient] = useState(\'\');')) {
    content = content.replace(stateTarget, stateTarget + '\n  const [searchRiskPatient, setSearchRiskPatient] = useState(\'\');');
}

// Find the boundaries of the activeMenu === 'wilayah' section
const startStr = `{activeMenu === 'wilayah' && (`;
const endStr = `{activeMenu === 'sekolah' && (`;
const startIdx = content.indexOf(startStr);
const endIdx = content.indexOf(endStr);

if (startIdx !== -1 && endIdx !== -1) {
    const newWilayahUI = `{activeMenu === 'wilayah' && (
              <section className="space-y-6 animate-in fade-in duration-500">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b border-slate-200 pb-4">
                  <div>
                    <h2 className="text-3xl font-black text-slate-950 tracking-tight">Master Control Peta Kritis</h2>
                    <p className="text-sm font-semibold text-slate-500 mt-1">Pemantauan strategis indikator kesehatan wilayah dan demografi.</p>
                  </div>
                  <button type="button" onClick={() => setShowFilters(!showFilters)} className="rounded-lg bg-white border border-slate-300 px-4 py-2 text-xs font-black text-slate-700 shadow-sm hover:bg-slate-50 transition">
                    {showFilters ? 'Sembunyikan Filter' : 'Tampilkan Filter'}
                  </button>
                </div>

                {showFilters && (
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-3 xl:grid-cols-6 rounded-xl border border-slate-200 bg-slate-50 p-4 animate-in slide-in-from-top-4">
                    <div className="flex items-end">
                      <button type="button" onClick={resetFilter} className="w-full h-11 rounded-lg bg-teal-500 px-4 text-xs font-black text-white shadow-sm hover:bg-teal-600 transition">Reset Filter</button>
                    </div>
                  </div>
                )}

                {/* Bagian PTM */}
                <h3 className="text-lg font-black text-slate-900 mt-8 mb-2">Indikasi Penyakit Tidak Menular (PTM)</h3>
                <div className="grid grid-cols-2 gap-4 xl:grid-cols-6">
                  {[
                    ['Kardiovaskular', 'hipertensi', analytics.risks?.hipertensi || 0, '#e11d48', 'Hipertensi berat'],
                    ['Gula Tinggi', 'hiperglikemia', analytics.risks?.hiperglikemia || 0, '#d97706', 'Indikasi diabetes'],
                    ['Obesitas', 'obesitas', analytics.risks?.obesitas || 0, '#2563eb', 'IMT >= 25'],
                    ['Paru / TB', 'paru', analytics.risks?.paru || 0, '#0d9488', 'Batuk / PPOK'],
                    ['Kesehatan Jiwa', 'mental', analytics.risks?.mental || 0, '#475569', 'Gejala SRQ/SDQ'],
                    ['Fungsi Indera', 'indera', analytics.risks?.indera || 0, '#db2777', 'Mata / Telinga']
                  ].map(([title, key, value, color, desc]) => (
                    <button 
                      key={key}
                      onClick={() => { setSelectedRiskCategory(selectedRiskCategory === key ? null : key); setSearchRiskPatient(''); }}
                      className={\`text-left p-4 rounded-xl border transition-all duration-200 \${selectedRiskCategory === key ? 'ring-2 shadow-md bg-white scale-[1.02]' : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm'}\`}
                      style={{ borderColor: selectedRiskCategory === key ? color : undefined }}
                    >
                      <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">{title}</p>
                      <p className="mt-2 text-3xl font-black text-slate-950">{formatNumber(value)}</p>
                      <p className="mt-1 text-[10px] font-bold text-slate-400">{desc}</p>
                    </button>
                  ))}
                </div>

                {selectedRiskCategory && (() => {
                  const riskPatientsList = analytics.riskPatients?.[selectedRiskCategory] || [];
                  const searchRaw = (searchRiskPatient || '').toLowerCase().replace(/[^a-z0-9]/g, '');
                  const filteredRiskPatients = searchRaw ? riskPatientsList.filter(v => {
                      const str = (v.pasien_snapshot?.nama || '') + ' ' + (v.patientNIK || '') + ' ' + (v.pasien_snapshot?.dusun || '');
                      return str.toLowerCase().replace(/[^a-z0-9]/g, '').includes(searchRaw);
                  }) : riskPatientsList;

                  return (
                  <div className="rounded-xl border border-slate-200 bg-white shadow-sm animate-in fade-in slide-in-from-top-4 mt-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 p-5 gap-4">
                      <div>
                        <h3 className="text-lg font-black text-slate-900 capitalize">Detail Pasien: {selectedRiskCategory}</h3>
                        <p className="text-xs font-semibold text-slate-500">Klik baris pasien untuk melihat rincian klinis.</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <input 
                           type="text" 
                           placeholder="Cari nama, NIK, atau dusun..." 
                           value={searchRiskPatient}
                           onChange={(e) => setSearchRiskPatient(e.target.value)}
                           className="text-sm border border-slate-300 rounded-lg px-3 py-2 w-full sm:w-64 focus:outline-none focus:border-teal-500 font-medium"
                        />
                        <span className="rounded-full bg-teal-50 px-3 py-1 text-xs font-black text-teal-700 whitespace-nowrap">{filteredRiskPatients.length} Pasien</span>
                      </div>
                    </div>
                    
                    <div className="overflow-x-auto max-h-[500px]">
                      {filteredRiskPatients.length === 0 ? (
                        <p className="text-center py-12 text-sm font-medium text-slate-400">Tidak ada data pasien yang cocok dengan filter atau pencarian Anda.</p>
                      ) : (
                        <table className="w-full text-left text-sm whitespace-nowrap">
                          <thead className="bg-slate-50 text-slate-500 sticky top-0 z-10 shadow-sm">
                            <tr>
                              <th className="px-5 py-3 font-black text-[10px] uppercase tracking-wider">Nama Pasien</th>
                              <th className="px-5 py-3 font-black text-[10px] uppercase tracking-wider">NIK / ID</th>
                              <th className="px-5 py-3 font-black text-[10px] uppercase tracking-wider">Wilayah (Dusun)</th>
                              <th className="px-5 py-3 font-black text-[10px] uppercase tracking-wider text-right">Aksi</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {filteredRiskPatients.map((visit) => (
                              <tr key={visit.id} className="hover:bg-slate-50 transition cursor-pointer" onClick={() => setSelectedRiskPatient(visit)}>
                                <td className="px-5 py-3 font-bold text-slate-900">{visit.pasien_snapshot?.nama || 'Tanpa Nama'}</td>
                                <td className="px-5 py-3 font-medium text-slate-500">{visit.pasien_snapshot?.nik || visit.patientNIK || '-'}</td>
                                <td className="px-5 py-3 font-medium text-slate-500">{visit.pasien_snapshot?.dusun || getDesa(visit) || '-'}</td>
                                <td className="px-5 py-3 text-right">
                                  <span className="text-xs font-black text-teal-600 hover:text-teal-700">Lihat Detail &rarr;</span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>
                  </div>
                )})()}

                {/* Infografis Wilayah & Demografi */}
                <h3 className="text-lg font-black text-slate-900 mt-10 mb-2 border-t border-slate-200 pt-8">Infografis & Demografi</h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* BarChart */}
                  <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                    <h4 className="text-sm font-black text-slate-800 mb-6 uppercase tracking-widest text-center">Distribusi Pasien per Wilayah (Top 10)</h4>
                    <div className="h-72">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={wilayahAnalytics.byDusun.slice(0, 10)}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                          <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#64748b', fontWeight: 'bold' }} tickLine={false} axisLine={false} />
                          <YAxis tick={{ fontSize: 10, fill: '#64748b' }} tickLine={false} axisLine={false} />
                          <Tooltip cursor={{ fill: '#f1f5f9' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                          <Bar dataKey="total" name="Total Kunjungan" fill="#0d9488" radius={[4, 4, 0, 0]} barSize={28} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* PieChart */}
                  <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                    <h4 className="text-sm font-black text-slate-800 mb-6 uppercase tracking-widest text-center">Demografi Klaster Usia</h4>
                    <div className="h-72">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={analytics.byCluster}
                            cx="50%"
                            cy="45%"
                            innerRadius={60}
                            outerRadius={90}
                            paddingAngle={5}
                            dataKey="value"
                          >
                            {analytics.byCluster.map((entry, index) => (
                              <Cell key={\`cell-\${index}\`} fill={['#0ea5e9', '#10b981', '#f59e0b', '#f43f5e', '#8b5cf6'][index % 5]} />
                            ))}
                          </Pie>
                          <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                          <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '11px', fontWeight: 'bold', color: '#475569' }} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              </section>
            )}

            `;
    content = content.substring(0, startIdx) + newWilayahUI + content.substring(endIdx);
    fs.writeFileSync(file, content);
    console.log('UI updated successfully!');
} else {
    console.log('Could not find boundaries.');
}
