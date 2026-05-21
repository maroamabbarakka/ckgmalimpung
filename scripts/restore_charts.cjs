const fs = require('fs');

const file = 'd:/PKM_MALIMPUNG/ckg-malimpung/src/AdminDashboard.jsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Add analytics variables to the useMemo
const analyticsLogicToFind = `    filteredVisits.forEach((visit) => {`;
const newAnalyticsLogic = `
    const trendMap = new Map();
    const byClusterMap = new Map();
    const byPosMap = new Map();

    filteredVisits.forEach((visit) => {
      // For Trend
      const dKey = dateKey(visit._date);
      if (!trendMap.has(dKey)) trendMap.set(dKey, { tanggal: dKey, hadir: 0, selesai: 0 });
      const trendItem = trendMap.get(dKey);
      if (isAttended(visit)) trendItem.hadir += 1;
      if (isCompleted(visit)) trendItem.selesai += 1;

      // For Cluster
      const cluster = getCluster(visit);
      if (!byClusterMap.has(cluster)) byClusterMap.set(cluster, { name: cluster, value: 0 });
      byClusterMap.get(cluster).value += 1;

      // For Pos
      const pos = visit.status_antrian || 'Terdaftar';
      if (!byPosMap.has(pos)) byPosMap.set(pos, { name: pos, value: 0 });
      byPosMap.get(pos).value += 1;
      
`;

if (!content.includes('const trendMap = new Map();')) {
    content = content.replace(analyticsLogicToFind, newAnalyticsLogic + '    ' + analyticsLogicToFind.trim());
}

const analyticsReturnToFind = `      risks,
      riskPatients
    };
  }, [filteredVisits]);`;

const newAnalyticsReturn = `      risks,
      riskPatients,
      trend: Array.from(trendMap.values()).sort((a, b) => a.tanggal.localeCompare(b.tanggal)).slice(-14),
      byCluster: Array.from(byClusterMap.values()).sort((a, b) => b.value - a.value),
      hadir,
      belumHadir: total - hadir,
      byPos: Array.from(byPosMap.values()).sort((a, b) => b.value - a.value)
    };
  }, [filteredVisits]);`;

if (!content.includes('trend: Array.from(trendMap.values())')) {
    content = content.replace(analyticsReturnToFind, newAnalyticsReturn);
}

// 2. Remove the "Modul Dalam Pengembangan" placeholder for pendaftaran, kehadiran, pelayanan
const placeholderToFind = `{activeMenu !== 'laporan' && activeMenu !== 'privasi' && activeMenu !== 'wilayah' && activeMenu !== 'simpeg' && activeMenu !== 'sekolah' && (
            <div className="flex h-64 flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-white text-center">
              <p className="text-4xl">🚧</p>
              <h3 className="mt-4 text-lg font-black text-slate-900">Modul Dalam Pengembangan</h3>
              <p className="mt-1 text-sm font-medium text-slate-500">Fitur ini sedang dalam tahap integrasi dengan SIMPUS.</p>
            </div>
          )}`;

content = content.replace(placeholderToFind, '');


// 3. Inject Pendaftaran
const pendaftaranJSX = `
          {activeMenu === 'pendaftaran' && (
              <section className="space-y-6 animate-in fade-in duration-500">
                  <div className="mb-6 flex flex-col gap-1 border-b border-slate-200 pb-4">
                    <h2 className="text-3xl font-black text-slate-950 tracking-tight">Dashboard Pendaftaran</h2>
                    <p className="text-sm font-semibold text-slate-500 mt-1">Demografi sasaran CKG.</p>
                  </div>
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
              </section>
          )}
`;

// 4. Inject Kehadiran
const kehadiranJSX = `
          {activeMenu === 'kehadiran' && (
              <section className="space-y-6 animate-in fade-in duration-500">
                  <div className="mb-6 flex flex-col gap-1 border-b border-slate-200 pb-4">
                    <h2 className="text-3xl font-black text-slate-950 tracking-tight">Dashboard Kehadiran</h2>
                    <p className="text-sm font-semibold text-slate-500 mt-1">Pemantauan partisipasi masyarakat.</p>
                  </div>
                  <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
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
                  </div>
              </section>
          )}
`;

// 5. Inject Pelayanan
const pelayananJSX = `
          {activeMenu === 'pelayanan' && (
              <section className="space-y-6 animate-in fade-in duration-500">
                  <div className="mb-6 flex flex-col gap-1 border-b border-slate-200 pb-4">
                    <h2 className="text-3xl font-black text-slate-950 tracking-tight">Dashboard Layanan Klinis</h2>
                    <p className="text-sm font-semibold text-slate-500 mt-1">Pemantauan beban antrean layanan pos.</p>
                  </div>
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
              </section>
          )}
`;

const anchorWILAYAH = `{activeMenu === 'wilayah' && (`;

content = content.replace(anchorWILAYAH, pendaftaranJSX + '\n' + kehadiranJSX + '\n' + pelayananJSX + '\n' + anchorWILAYAH);

fs.writeFileSync(file, content);
console.log('Successfully injected charts to individual tabs.');
