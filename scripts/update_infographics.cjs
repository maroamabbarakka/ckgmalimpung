const fs = require('fs');
const file = 'd:/PKM_MALIMPUNG/ckg-malimpung/src/AdminDashboard.jsx';
let content = fs.readFileSync(file, 'utf8');

const startStr = `<h3 className="text-lg font-black text-slate-900 mt-10 mb-2 border-t border-slate-200 pt-8">Infografis & Demografi</h3>`;
const endStr = `</section>\n            )}`;

const startIdx = content.indexOf(startStr);
const endIdx = content.indexOf(endStr, startIdx);

if (startIdx !== -1 && endIdx !== -1) {
    const newUI = `<h3 className="text-lg font-black text-slate-900 mt-10 mb-2 border-t border-slate-200 pt-8">Pusat Intelijen Demografi & Tren Wilayah</h3>
                
                {/* Baris Pertama: Dusun & Umur */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                  {/* BarChart Dusun */}
                  <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                    <h4 className="text-sm font-black text-slate-800 mb-6 uppercase tracking-widest text-center">Distribusi Kunjungan per Dusun (Top 10)</h4>
                    <div className="h-72">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={wilayahAnalytics.byDusun.slice(0, 10)}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                          <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#64748b', fontWeight: 'bold' }} tickLine={false} axisLine={false} />
                          <YAxis tick={{ fontSize: 10, fill: '#64748b' }} tickLine={false} axisLine={false} />
                          <Tooltip cursor={{ fill: '#f1f5f9' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                          <Bar dataKey="total" name="Kunjungan" fill="#0d9488" radius={[4, 4, 0, 0]} barSize={28} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* AreaChart Tren Harian */}
                  <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                    <h4 className="text-sm font-black text-slate-800 mb-6 uppercase tracking-widest text-center">Tren Kunjungan Skrining Aktif</h4>
                    <div className="h-72">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={analytics.trend.slice(-14)}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                          <XAxis dataKey="tanggal" tick={{ fontSize: 10, fill: '#64748b', fontWeight: 'bold' }} tickLine={false} axisLine={false} tickFormatter={(val) => val.split('-').slice(1).join('/')} />
                          <YAxis tick={{ fontSize: 10, fill: '#64748b' }} tickLine={false} axisLine={false} />
                          <Tooltip cursor={{ stroke: '#94a3b8', strokeWidth: 1, strokeDasharray: '4 4' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                          <Area type="monotone" dataKey="pendaftar" name="Pendaftar" stroke="#3b82f6" fillOpacity={1} fill="url(#colorPendaftar)" />
                          <Area type="monotone" dataKey="selesai" name="Selesai" stroke="#10b981" fillOpacity={1} fill="url(#colorSelesai)" />
                          <defs>
                            <linearGradient id="colorPendaftar" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                            </linearGradient>
                            <linearGradient id="colorSelesai" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                              <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>

                {/* Baris Kedua: PTM, Demografi, Gender */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                  {/* Beban PTM */}
                  <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                    <h4 className="text-sm font-black text-slate-800 mb-6 uppercase tracking-widest text-center">Komposisi Beban PTM</h4>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart layout="vertical" data={[
                          { name: 'Kardio', value: analytics.risks?.hipertensi || 0, fill: '#e11d48' },
                          { name: 'Gula', value: analytics.risks?.hiperglikemia || 0, fill: '#d97706' },
                          { name: 'Obesitas', value: analytics.risks?.obesitas || 0, fill: '#2563eb' },
                          { name: 'Paru/TB', value: analytics.risks?.paru || 0, fill: '#0d9488' },
                          { name: 'Keswa', value: analytics.risks?.mental || 0, fill: '#475569' },
                          { name: 'Indera', value: analytics.risks?.indera || 0, fill: '#db2777' }
                        ].sort((a,b) => b.value - a.value)}>
                          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                          <XAxis type="number" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                          <YAxis dataKey="name" type="category" width={60} tick={{ fontSize: 10, fill: '#475569', fontWeight: 'bold' }} tickLine={false} axisLine={false} />
                          <Tooltip cursor={{ fill: '#f1f5f9' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                          <Bar dataKey="value" name="Total Indikasi" radius={[0, 4, 4, 0]} barSize={20}>
                             {
                                [0,1,2,3,4,5].map((entry, index) => (
                                  <Cell key={\`cell-\${index}\`} fill={[
                                    { name: 'Kardio', value: analytics.risks?.hipertensi || 0, fill: '#e11d48' },
                                    { name: 'Gula', value: analytics.risks?.hiperglikemia || 0, fill: '#d97706' },
                                    { name: 'Obesitas', value: analytics.risks?.obesitas || 0, fill: '#2563eb' },
                                    { name: 'Paru/TB', value: analytics.risks?.paru || 0, fill: '#0d9488' },
                                    { name: 'Keswa', value: analytics.risks?.mental || 0, fill: '#475569' },
                                    { name: 'Indera', value: analytics.risks?.indera || 0, fill: '#db2777' }
                                  ].sort((a,b) => b.value - a.value)[index].fill} />
                                ))
                             }
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Demografi */}
                  <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                    <h4 className="text-sm font-black text-slate-800 mb-6 uppercase tracking-widest text-center">Klaster Usia</h4>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={analytics.byCluster} cx="50%" cy="45%" innerRadius={50} outerRadius={80} paddingAngle={5} dataKey="value">
                            {analytics.byCluster.map((entry, index) => (
                              <Cell key={\`cell-\${index}\`} fill={['#0ea5e9', '#10b981', '#f59e0b', '#f43f5e', '#8b5cf6'][index % 5]} />
                            ))}
                          </Pie>
                          <Tooltip contentStyle={{ borderRadius: '12px', border: 'none' }} />
                          <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '11px', fontWeight: 'bold' }} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Gender */}
                  <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                    <h4 className="text-sm font-black text-slate-800 mb-6 uppercase tracking-widest text-center">Rasio Gender</h4>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={[ { name: 'Laki-Laki', value: analytics.laki || 0 }, { name: 'Perempuan', value: analytics.perempuan || 0 } ]} cx="50%" cy="45%" innerRadius={0} outerRadius={80} paddingAngle={2} dataKey="value">
                            <Cell fill="#3b82f6" />
                            <Cell fill="#ec4899" />
                          </Pie>
                          <Tooltip contentStyle={{ borderRadius: '12px', border: 'none' }} />
                          <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '11px', fontWeight: 'bold' }} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              `;
    content = content.substring(0, startIdx) + newUI + content.substring(endIdx);
    fs.writeFileSync(file, content);
    console.log('Infographics updated successfully!');
} else {
    console.log('Could not find boundaries.');
}
