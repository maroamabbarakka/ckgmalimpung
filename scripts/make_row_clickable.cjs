const fs = require('fs');

const file = 'd:/PKM_MALIMPUNG/ckg-malimpung/src/AdminDashboard.jsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Make the row clickable and stylize it
const oldRowRegex = /<tr key=\{staff\.id\} className="hover:bg-slate-50">[\s\S]*?<td className="px-5 py-4">[\s\S]*?<p className="font-black text-slate-900">\{staff\.nama\}<\/p>/;

const newRow = `<tr key={staff.id} className="hover:bg-teal-50/50 cursor-pointer group transition-colors" onClick={() => openStaffForm(staff)}>
                                  <td className="px-5 py-4">
                                    <p className="font-black text-slate-900 group-hover:text-teal-700">{staff.nama}</p>`;

content = content.replace(oldRowRegex, newRow);

// 2. Stop propagation on the Active toggle
const oldActiveToggleRegex = /onClick=\{\(\) => handleToggleStaffActive\(staff\)\}/;
const newActiveToggle = `onClick={(e) => { e.stopPropagation(); handleToggleStaffActive(staff); }}`;
content = content.replace(oldActiveToggleRegex, newActiveToggle);

// 3. Update the Action column, remove Edit button, add stopPropagation to Reset PIN
const oldActionCol = `<td className="px-5 py-4">
                                    <div className="flex justify-center gap-2">
                                      <button type="button" onClick={() => openStaffForm(staff)} className="rounded-lg border border-blue-200 px-3 py-1.5 text-xs font-black text-blue-700 hover:bg-blue-50">Edit</button>
                                      <button type="button" onClick={() => handleResetPIN(staff)} className="rounded-lg border border-rose-200 px-3 py-1.5 text-xs font-black text-rose-700 hover:bg-rose-50">Reset PIN</button>
                                    </div>
                                  </td>`;

const newActionCol = `<td className="px-5 py-4">
                                    <div className="flex justify-center gap-2">
                                      <button type="button" onClick={(e) => { e.stopPropagation(); handleResetPIN(staff); }} className="rounded-lg border border-rose-200 bg-white px-3 py-1.5 text-xs font-black text-rose-700 hover:bg-rose-50 hover:border-rose-300 transition-colors">Reset PIN</button>
                                    </div>
                                  </td>`;

content = content.replace(oldActionCol, newActionCol);

fs.writeFileSync(file, content);
console.log('Row diubah menjadi dapat diklik.');
