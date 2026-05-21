const fs = require('fs');
const file = 'd:/PKM_MALIMPUNG/ckg-malimpung/src/AdminDashboard.jsx';
let content = fs.readFileSync(file, 'utf8');

const oldBlock = `                <div className="grid grid-cols-2 gap-4 xl:grid-cols-6">
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
                </div>`;

const newBlock = `                <div className="grid grid-cols-2 gap-4 xl:grid-cols-6">
                  {[
                    ['Kardiovaskular', 'hipertensi', analytics.risks?.hipertensi || 0, 'from-rose-50 to-white text-rose-600 border-rose-200 ring-rose-500', 'bg-rose-100 text-rose-700', 'Hipertensi', '❤️'],
                    ['Gula Tinggi', 'hiperglikemia', analytics.risks?.hiperglikemia || 0, 'from-amber-50 to-white text-amber-600 border-amber-200 ring-amber-500', 'bg-amber-100 text-amber-700', 'Diabetes', '🩸'],
                    ['Obesitas', 'obesitas', analytics.risks?.obesitas || 0, 'from-blue-50 to-white text-blue-600 border-blue-200 ring-blue-500', 'bg-blue-100 text-blue-700', 'IMT >= 25', '⚖️'],
                    ['Paru / TB', 'paru', analytics.risks?.paru || 0, 'from-teal-50 to-white text-teal-600 border-teal-200 ring-teal-500', 'bg-teal-100 text-teal-700', 'Batuk/PPOK', '🫁'],
                    ['Keswa', 'mental', analytics.risks?.mental || 0, 'from-slate-100 to-white text-slate-600 border-slate-200 ring-slate-500', 'bg-slate-200 text-slate-700', 'SRQ/SDQ', '🧠'],
                    ['Indera', 'indera', analytics.risks?.indera || 0, 'from-fuchsia-50 to-white text-fuchsia-600 border-fuchsia-200 ring-fuchsia-500', 'bg-fuchsia-100 text-fuchsia-700', 'Mata/Telinga', '👁️']
                  ].map(([title, key, value, colorScheme, badgeColor, desc, emoji]) => (
                    <button 
                      key={key}
                      onClick={() => { setSelectedRiskCategory(selectedRiskCategory === key ? null : key); setSearchRiskPatient(''); }}
                      className={\`relative overflow-hidden text-left p-5 rounded-2xl border bg-gradient-to-br transition-all duration-300 group
                      \${selectedRiskCategory === key 
                          ? \\\`\${colorScheme} ring-2 shadow-lg scale-[1.03] z-10\\\` 
                          : \\\`\${colorScheme} hover:shadow-md hover:scale-[1.02] opacity-90 hover:opacity-100\\\`
                      }\`}
                    >
                      <div className="absolute -right-4 -top-4 text-7xl opacity-[0.05] group-hover:opacity-[0.12] transition-opacity duration-300 transform group-hover:scale-110 group-hover:-rotate-12 grayscale">
                        {emoji}
                      </div>
                      <div className="flex flex-col h-full justify-between relative z-10">
                        <div>
                          <div className="flex items-center justify-between mb-2">
                             <span className="text-xl drop-shadow-sm">{emoji}</span>
                             <span className={\`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider shadow-sm \${badgeColor}\`}>
                               {desc}
                             </span>
                          </div>
                          <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mt-4 leading-tight">{title}</p>
                        </div>
                        <div className="mt-1 flex items-end justify-between">
                          <p className={\`text-3xl font-black tracking-tighter \${selectedRiskCategory === key ? 'text-slate-900' : 'text-slate-700'}\`}>
                            {formatNumber(value)}
                          </p>
                        </div>
                      </div>
                      
                      {selectedRiskCategory === key && (
                        <div className="absolute inset-x-0 bottom-0 h-1 bg-current opacity-20"></div>
                      )}
                    </button>
                  ))}
                </div>`;

content = content.replace(oldBlock, newBlock);
fs.writeFileSync(file, content);
console.log('PTM Cards upgraded successfully!');
