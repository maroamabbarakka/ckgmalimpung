import { useState } from 'react';

const faqData = [
  {
    group: 'PENGENALAN & ARSITEKTUR',
    items: [
      {
        id: 'pengenalan',
        title: 'Apa itu Aplikasi TERSANJUNG?',
        content: (
           <div className="space-y-4">
              <p>TERSANJUNG adalah aplikasi rekam medis dan dashboard operasional yang dirancang khusus untuk mendukung layanan Cek Kesehatan Gratis (CKG) di UPT Puskesmas Malimpung.</p>
              <p>Sistem ini menggabungkan registrasi pasien, antrean, skrining klinis per pos, rapor digital, dashboard pemantauan, ekspor laporan, serta alur kunjungan rumah dalam satu aplikasi berbasis web.</p>
           </div>
        )
      },
      {
        id: 'arsitektur',
        title: 'Arsitektur dan Koneksi Sistem',
        content: (
           <div className="space-y-4">
              <p>Aplikasi ini dirancang dengan teknologi PWA (Progressive Web App) modern.</p>
              <p>Data klinis pasien diamankan dalam database <strong>Firestore secara real-time</strong>. Sinkronisasi antrean, kunjungan, pasien, dan dashboard terjadi secara langsung.</p>
              <div className="p-4 border border-blue-200 rounded-lg bg-blue-50">
                 <h4 className="font-bold text-blue-800 mb-1">Prinsip Arsitektur</h4>
                 <p className="text-blue-700 text-sm">Data klinis tetap berada di Firestore dan workflow utama tetap berjalan di browser. Sistem sangat siap dipakai di dalam gedung maupun layanan lapangan.</p>
              </div>
           </div>
        )
      }
    ]
  },
  {
    group: 'MODUL OPERASIONAL',
    items: [
      {
        id: 'scan_ocr',
        title: 'Scan Identitas Multi-Dokumen',
        content: (
           <div className="space-y-4">
              <p>Pembaruan terkini memperkuat ketahanan alur lapangan melalui <strong>Scan Identitas multi-dokumen</strong>.</p>
              <p>Ketika warga tidak membawa KTP, Anda tetap bisa melakukan pendaftaran dengan memindai Kartu Keluarga (KK), BPJS/KIS/JKN, atau dokumen jaminan kesehatan lainnya secara langsung menggunakan kamera.</p>
              <details className="p-4 border border-slate-200 rounded-lg bg-white cursor-pointer shadow-sm mt-4">
                 <summary className="font-semibold text-slate-800">Bagaimana jika server backend OCR terputus?</summary>
                 <p className="mt-3 text-slate-600 text-sm leading-relaxed">Aplikasi dilengkapi fallback offline dengan <strong>Tesseract.js</strong> untuk membaca dokumen identitas secara lokal di browser, memastikan layanan lapangan tidak terganggu meskipun tanpa koneksi internet yang stabil.</p>
              </details>
           </div>
        )
      },
      {
        id: 'alur_pos',
        title: 'Pemahaman Alur Pos 1 - 7',
        content: (
           <div className="space-y-4">
              <p>Sistem mengatur alur pemeriksaan klinis dalam 7 Pos dengan 18 Form Skrining Utama dan 1.543 Pertanyaan RME (Rekam Medis Elektronik).</p>
              <ul className="list-disc pl-5 space-y-3 text-slate-700 mt-4">
                 <li><strong>Pos 1:</strong> Registrasi, validasi NIK, identitas, umur, dan wilayah.</li>
                 <li><strong>Pos 2-6:</strong> Pemeriksaan fisik, lab, skrining risiko (hipertensi, gula darah tinggi), kesehatan mental, dan geriatri. Form yang relevan akan otomatis aktif berdasarkan demografi pasien.</li>
                 <li><strong>Pos 7:</strong> Validasi dokter, diagnosis akhir, serta pencetakan dan pengiriman rapor digital.</li>
              </ul>
           </div>
        )
      }
    ]
  },
  {
    group: 'LAPORAN & EKSPOR',
    items: [
      {
        id: 'export_data',
        title: 'Cara Ekspor Laporan Kolektif',
        content: (
           <div className="space-y-4">
              <p>Anda dapat mengunduh laporan secara terpusat melalui menu Laporan CKG pada sistem TERSANJUNG.</p>
              <p>Laporan dihasilkan dalam format Excel (XLSX) atau PDF secara instan. Khusus format Excel, ekspor kolektif menyertakan <strong>Sheet Rekap Keseluruhan</strong> serta perbaikan klasifikasi jenjang (SD/SMP/SMA) untuk sinkronisasi ke tingkat dinas.</p>
           </div>
        )
      }
    ]
  },
  {
    group: 'INFRASTRUKTUR & KEAMANAN',
    items: [
      {
        id: 'backup_data',
        title: 'Aturan Backup Database Mingguan',
        content: (
           <div className="space-y-4">
              <p>Fitur Backup Database berfungsi untuk mengunduh arsip rekam medis ke dalam format JSON. Karena besarnya muatan data pasien, fitur ini sangat <strong>menguras kuota baca (reads)</strong> dari Cloud Firestore.</p>
              <div className="p-4 border border-rose-200 rounded-lg bg-rose-50">
                 <h4 className="font-bold text-rose-800 mb-1">Peringatan Penting!</h4>
                 <p className="text-rose-700 text-sm">Dimohon untuk mengklik tombol unduh Backup JSON hanya <strong>1 kali seminggu</strong> (misal: hari Jumat atau Sabtu sore). Mengklik tombol ini setiap hari dapat menyebabkan kuota habis seketika dan membuat aplikasi tidak bisa digunakan.</p>
              </div>
           </div>
        )
      },
      {
        id: 'keamanan_transaksi',
        title: 'Keamanan Data Transaksional',
        content: (
           <div className="space-y-4">
              <p>TERSANJUNG v4.2 telah dilengkapi sistem <strong>Atomic Transactions</strong>.</p>
              <p>Ini berarti apabila ada dua Nakes atau lebih yang menghapus/mengubah data yang sama secara bersamaan di dalam waktu yang sama, sistem akan memblokirnya secara cerdas sehingga <strong>Data Tidak Akan Korup atau Bentrok</strong>.</p>
           </div>
        )
      }
    ]
  }
];

export default function PusatBantuan() {
  const [activeId, setActiveId] = useState('pengenalan');

  let activeItem = faqData[0].items[0];
  for (const group of faqData) {
    for (const item of group.items) {
      if (item.id === activeId) {
        activeItem = { ...item, groupName: group.group };
        break;
      }
    }
  }

  return (
    <div className="flex h-[75vh] w-full bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden animate-in fade-in duration-500">
       {/* Sidebar FAQ */}
       <div className="w-1/3 max-w-[280px] border-r border-slate-200 bg-slate-50/80 p-5 overflow-y-auto hidden md:block">
          <div className="flex items-center gap-3 mb-8 px-2">
             <div className="w-8 h-8 rounded-lg bg-teal-600 flex items-center justify-center text-white shadow-sm">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
             </div>
             <h3 className="font-black text-slate-800 text-lg">Pusat Bantuan</h3>
          </div>
          {faqData.map((group, gIndex) => (
             <div key={gIndex} className="mb-8">
                <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-3 px-2 flex items-center gap-2">
                   {group.group}
                </h4>
                <ul className="space-y-1">
                   {group.items.map((item) => (
                      <li key={item.id}>
                         <button 
                            onClick={() => setActiveId(item.id)}
                            className={`w-full text-left px-3 py-2.5 text-xs font-bold rounded-lg transition-all ${activeId === item.id ? 'bg-white text-teal-700 shadow-sm border border-slate-200/60' : 'text-slate-500 hover:bg-slate-200/50 hover:text-slate-800 border border-transparent'}`}
                         >
                            {item.title}
                         </button>
                      </li>
                   ))}
                </ul>
             </div>
          ))}
       </div>

       {/* Content FAQ */}
       <div className="flex-1 p-8 lg:p-14 overflow-y-auto bg-white">
          <div className="max-w-3xl mx-auto">
             <div className="text-[10px] font-black uppercase text-slate-400 tracking-wider mb-4 flex items-center gap-2">
                <span className="w-1.5 h-4 rounded-sm bg-teal-400 block"></span>
                {activeItem.groupName}
             </div>
             <h2 className="text-3xl font-black text-slate-900 mb-8 leading-tight">{activeItem.title}</h2>
             
             <div className="prose prose-slate prose-sm md:prose-base leading-relaxed text-slate-700">
                {activeItem.content}
             </div>

             {/* Footer Info */}
             <div className="mt-16 pt-8 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-slate-400">
                <span>Diperbarui pada Mei 2026</span>
                <span className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-full border border-slate-200">
                   TERSANJUNG v4.2 
                   <svg className="w-3.5 h-3.5 text-emerald-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path></svg>
                </span>
             </div>
          </div>
       </div>
    </div>
  );
}
