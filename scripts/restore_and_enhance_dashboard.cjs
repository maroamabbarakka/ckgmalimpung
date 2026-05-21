const fs = require('fs');

const file = 'd:/PKM_MALIMPUNG/ckg-malimpung/src/AdminDashboard.jsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Update SidebarItem styling
content = content.replace(
  `const SidebarItem = ({ item, active, onClick }) => (
  <button
    type="button"
    onClick={() => onClick(item.id)}
    className={\`w-full text-left px-3 py-2 text-[13px] transition \${active ? 'bg-teal-50 text-teal-700 font-semibold' : 'text-slate-700 hover:bg-slate-50'}\`}
  >
    {item.label}
  </button>
);`,
  `const SidebarItem = ({ item, active, onClick }) => (
  <button
    type="button"
    onClick={() => onClick(item.id)}
    className={\`w-full text-left px-4 py-2.5 my-0.5 rounded-lg text-sm font-semibold transition-all \${active ? 'bg-teal-500 text-white shadow-md shadow-teal-500/20' : 'text-slate-600 hover:bg-slate-100'}\`}
  >
    {item.label}
  </button>
);`
);

// 2. Update SummaryMetric styling
content = content.replace(
  `const SummaryMetric = ({ label, value, helper }) => (
  <div className="rounded-lg border border-slate-200 bg-white p-4">
    <p className="text-xs font-semibold text-slate-500">{label}</p>
    <p className="mt-2 text-2xl font-black text-slate-950">{value}</p>
    {helper && <p className="mt-1 text-xs font-semibold text-slate-500">{helper}</p>}
  </div>
);`,
  `const SummaryMetric = ({ label, value, helper }) => (
  <div className="rounded-xl border border-slate-100 bg-white p-5 shadow-sm transition hover:shadow-md hover:border-teal-100">
    <p className="text-xs font-bold uppercase tracking-wider text-slate-500">{label}</p>
    <p className="mt-3 text-3xl font-black text-slate-900">{value}</p>
    {helper && <p className="mt-2 text-xs font-semibold text-slate-400">{helper}</p>}
  </div>
);`
);

// 3. Update ChartShell styling
content = content.replace(
  `const ChartShell = ({ title, subtitle, children }) => (
  <section className="min-h-[360px] rounded-lg border border-slate-200 bg-white p-5">
    <div className="mb-4">
      <h3 className="text-xl font-black text-slate-950">{title}</h3>
      {subtitle && <p className="text-sm font-medium text-slate-500">{subtitle}</p>}
    </div>
    <div className="h-[280px]">{children}</div>
  </section>
);`,
  `const ChartShell = ({ title, subtitle, children }) => (
  <section className="min-h-[360px] rounded-xl border border-slate-100 bg-white p-6 shadow-sm hover:shadow-md transition duration-300">
    <div className="mb-6 flex flex-col gap-1 border-b border-slate-50 pb-4">
      <h3 className="text-lg font-black text-slate-900">{title}</h3>
      {subtitle && <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{subtitle}</p>}
    </div>
    <div className="h-[260px]">{children}</div>
  </section>
);`
);

// 4. Update the Master Control Header slightly for more elegance
content = content.replace(
  `<h2 className="text-3xl font-black text-slate-950 tracking-tight">Master Control Peta Kritis</h2>
                    <p className="text-sm font-semibold text-slate-500 mt-1">Pemantauan strategis indikator kesehatan wilayah kerja.</p>`,
  `<h2 className="text-3xl font-black text-slate-900 tracking-tight">Master Control Peta Kritis</h2>
                    <p className="text-sm font-medium text-slate-500 mt-1">Pemantauan strategis dan visualisasi komprehensif wilayah kerja Malimpung.</p>`
);

// 5. Append Visual Analytics to risiko section
const insertPoint = `                  </div>
                )}
              </section>
            )}

{activeMenu === 'wilayah' && (`;

const visualAnalytics = `                  </div>
                )}

                {/* Visual Analytics Infografis */}
                <div className="grid grid-cols-1 gap-5 xl:grid-cols-2 mt-8 border-t border-slate-100 pt-8 animate-in fade-in duration-500">
                  <ChartShell title="Tren Kehadiran & Penyelesaian" subtitle="Data harian berdasarkan filter aktif">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={analytics.trend}>
                        <CartesianGrid stroke="#f1f5f9" strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="tanggal" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                        <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} formatter={(value) => formatNumber(value)} />
                        <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', fontWeight: 600, color: '#475569', paddingTop: '10px' }} />
                        <Bar dataKey="hadir" name="Hadir" fill={COLORS.teal} radius={[4, 4, 0, 0]} />
                        <Bar dataKey="selesai" name="Selesai" fill={COLORS.amber} radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </ChartShell>

                  <ChartShell title="Distribusi Klaster Usia" subtitle="Proporsi pendaftar per rentang usia">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={analytics.byCluster}>
                        <CartesianGrid stroke="#f1f5f9" strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                        <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} formatter={(value) => formatNumber(value)} />
                        <Bar dataKey="value" name="Jumlah Pasien" fill={COLORS.blue} radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </ChartShell>
                  
                  <ChartShell title="Komposisi Status Kehadiran" subtitle="Persentase kehadiran vs ketidakhadiran">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={[
                            { name: 'Hadir', value: analytics.hadir },
                            { name: 'Belum Lengkap', value: analytics.belumHadir }
                          ]}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          innerRadius={70}
                          outerRadius={105}
                          paddingAngle={3}
                          label={({ percent }) => \`\${(percent * 100).toFixed(1)}%\`}
                        >
                          <Cell fill={COLORS.teal} />
                          <Cell fill={COLORS.amber} />
                        </Pie>
                        <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', fontWeight: 600, color: '#475569' }} />
                        <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} formatter={(value) => formatNumber(value)} />
                      </PieChart>
                    </ResponsiveContainer>
                  </ChartShell>

                  <ChartShell title="Status Per Pos Pelayanan" subtitle="Distribusi antrean pada saat ini">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={analytics.byPos}>
                        <CartesianGrid stroke="#f1f5f9" strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                        <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} formatter={(value) => formatNumber(value)} />
                        <Bar dataKey="value" name="Jumlah Pasien" fill={COLORS.rose} radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </ChartShell>
                </div>
              </section>
            )}

{activeMenu === 'wilayah' && (`;

content = content.replace(insertPoint, visualAnalytics);

// 6. Fix generic header layout design a bit
content = content.replace(
  `<h1 className="text-2xl font-black tracking-tight text-slate-950 md:text-3xl">`,
  `<h1 className="text-2xl font-black tracking-tight text-slate-900 md:text-3xl">`
);

fs.writeFileSync(file, content);
console.log('Restored infographics and enhanced styling.');
