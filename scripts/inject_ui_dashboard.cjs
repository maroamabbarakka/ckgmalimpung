const fs = require('fs');
let code = fs.readFileSync('Dashboard.jsx', 'utf8');

code = code.replace(/import \{ useNavigate \} from 'react-router-dom';/, 
\`import { useNavigate } from 'react-router-dom';
import { exportToPKGExcel, exportToPKG_PDF } from './utils/exportPKG';\`);

code = code.replace(/const toggleEditMode = \(\) => \{\n\s*setIsEditMode\(\!isEditMode\);\n\s*setPopupConfig\(\{isOpen: false, type: '', title: ''\}\);\n\s*\};/,
\`const toggleEditMode = () => { setIsEditMode(!isEditMode); setPopupConfig({isOpen: false, type: '', title: ''}); };

  const [showExportMenu, setShowExportMenu] = useState(false);\`);

const targetStr = \`<div className="flex items-center bg-white/10 backdrop-blur-md border border-white/20 rounded-lg px-2 w-full sm:w-auto">
                      <span className="text-xs mr-1">🌍</span>\`;
                      
const replacer = \`{/* TOMBOL EKSPOR PKG */}
                      <div className="relative">
                          <button onClick={() => setShowExportMenu(!showExportMenu)} className="flex items-center bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 rounded-lg px-3 py-2 text-white font-bold text-xs transition-all w-full sm:w-auto justify-center shadow-inner">
                              <span className="mr-1.5 text-lg">📥</span> Ekspor Data (PKG)
                          </button>
                          {showExportMenu && (
                              <div className="absolute top-full mt-2 left-0 w-full sm:w-48 bg-white rounded-[1rem] shadow-2xl border border-slate-100 overflow-hidden z-50 animate-fade-in-up">
                                  <button onClick={() => { setShowExportMenu(false); exportToPKGExcel(filteredVisits); }} className="w-full text-left px-4 py-3 text-xs font-black text-emerald-700 hover:bg-emerald-50 flex items-center gap-2 border-b border-slate-100 transition-colors">
                                      <span className="text-lg">📊</span> Tabel Excel
                                  </button>
                                  <button onClick={() => { setShowExportMenu(false); exportToPKG_PDF(filteredVisits); }} className="w-full text-left px-4 py-3 text-xs font-black text-rose-700 hover:bg-rose-50 flex items-center gap-2 transition-colors">
                                      <span className="text-lg">📄</span> Dokumen PDF
                                  </button>
                              </div>
                          )}
                      </div>

                      <div className="flex items-center bg-white/10 backdrop-blur-md border border-white/20 rounded-lg px-2 w-full sm:w-auto">
                      <span className="text-xs mr-1">🌍</span>\`;

code = code.replace(targetStr, replacer);
fs.writeFileSync('Dashboard.jsx', code);
console.log('Dashboard UI updated!');
