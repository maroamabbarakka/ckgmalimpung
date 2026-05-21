const fs = require('fs');

const file = 'd:/PKM_MALIMPUNG/ckg-malimpung/src/AdminDashboard.jsx';
let content = fs.readFileSync(file, 'utf8');

const regexPrivasi = /\{activeMenu === 'privasi' && \([\s\S]*?\}\)[\s\n]*<\/div>[\s\n]*\)}[\s\n]*<\/main>/;

const newPrivasiContent = `{activeMenu === 'privasi' && (
              <section className="mx-auto max-w-5xl rounded-lg border border-slate-200 bg-white p-8 text-sm leading-7 text-slate-700 shadow-sm">
                <div className="mb-7 flex flex-col gap-4 border-b border-slate-200 pb-5 md:flex-row md:items-center md:justify-between">
                  <div className="flex items-center gap-3">
                    <img src={LOGO_PINRANG} alt="Pinrang" className="h-10 w-auto" />
                    <img src={LOGO_MALIMPUNG} alt="Malimpung" className="h-10 w-auto" />
                  </div>
                  <div className="text-left md:text-right">
                    <p className="text-lg font-black tracking-tight text-slate-900">Pemberitahuan Privasi & Ketentuan</p>
                    <p className="text-xs font-semibold text-slate-500">Berlaku efektif: 1 Agustus 2024</p>
                  </div>
                </div>

                <div className="space-y-6">
                  <div>
                    <h3 className="mb-2 text-base font-black text-slate-950">1. Ketentuan Umum</h3>
                    <p className="mb-3 font-semibold uppercase text-slate-800">
                      MOHON UNTUK MEMBACA SELURUH PEMBERITAHUAN PRIVASI DAN KETENTUAN PENGGUNAAN YANG TERLAMPIR DENGAN CERMAT DAN SAKSAMA SEBELUM MENGGUNAKAN SETIAP FITUR DAN/ATAU LAYANAN YANG TERSEDIA DALAM APLIKASI TERSANJUNG
                    </p>
                    <p className="mb-2 text-justify">
                      Pemberitahuan Privasi dan Ketentuan Penggunaan ini adalah perjanjian antara pengguna (“Pengguna”) dan Puskesmas Malimpung selaku Penyelenggara Sistem Elektronik Aplikasi TERSANJUNG (Cek Kesehatan Gratis) untuk kepentingan input data, monitoring data perkembangan pasien, pelaksanaan program, pelayanan kesehatan primer oleh tenaga medis dan tenaga kesehatan, serta untuk kepentingan upaya kesehatan lainnya yang bersifat promotif, preventif, kuratif, dan rehabilitatif. Pemberitahuan Privasi dan Ketentuan Penggunaan ini mengatur akses, penggunaan, konten dan produk TERSANJUNG.
                    </p>
                    <p className="text-justify">
                      Dengan menggunakan TERSANJUNG, Pengguna dianggap setuju untuk terikat dengan ketentuan Pemberitahuan Privasi dan Ketentuan Penggunaan ini. Apabila Pengguna tidak setuju terhadap salah satu, sebagian, atau seluruh isi yang tertuang dalam dokumen ini, maka Pengguna diperkenankan untuk tidak mengakses dan/atau tidak menggunakan TERSANJUNG.
                    </p>
                  </div>

                  <div>
                    <h3 className="mb-2 text-base font-black text-slate-950">2. Definisi</h3>
                    <ul className="list-outside list-disc space-y-1.5 pl-5 text-justify">
                      <li><strong>“SIK”</strong> adalah Sistem Informasi Kesehatan yang mengintegrasikan pemrosesan dan pelaporan.</li>
                      <li><strong>“TERSANJUNG”</strong> adalah SIK dalam bentuk aplikasi dan situs yang dipergunakan Puskesmas Malimpung untuk pencatatan layanan kesehatan, pencatatan data-data pasien pada fasilitas pelayanan kesehatan dan upaya kesehatan lainnya di wilayah kerja Puskesmas Malimpung.</li>
                      <li><strong>“Pengguna”</strong> adalah setiap Tenaga Medis, Tenaga Kesehatan, Kader atau petugas instansi terkait yang memiliki hak akses.</li>
                      <li><strong>“Pasien” atau “Individu”</strong> adalah setiap orang yang mendapatkan pelayanan kesehatan atau tindakan yang diperlukan yang datanya diinput ke dalam TERSANJUNG.</li>
                      <li><strong>“Data Pribadi” atau “Informasi Kesehatan”</strong> meliputi data pribadi (nama, NIK, alamat) dan data kesehatan (diagnosa, kondisi kesehatan, alergi, vaksinasi, tindakan, riwayat medis) pasien.</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="mb-2 text-base font-black text-slate-950">3. Tujuan & Landasan Pemrosesan Data</h3>
                    <p className="text-justify">
                      Pemrosesan data ditujukan untuk Pelayanan Kesehatan, Upaya Kesehatan Perseorangan, dan Upaya Kesehatan Masyarakat berdasarkan UU No. 17 Tahun 2023 tentang Kesehatan dan UU No. 27 Tahun 2022 tentang Pelindungan Data Pribadi, dalam kerangka integrasi Rekam Medis Elektronik nasional.
                    </p>
                  </div>

                  <div>
                    <h3 className="mb-2 text-base font-black text-slate-950">4. Informasi yang Dikumpulkan & Penyimpanan</h3>
                    <ul className="list-outside list-disc space-y-1.5 pl-5 text-justify">
                      <li>TERSANJUNG mengumpulkan data Pengguna sehubungan pelaksanaan profesinya dan Informasi Kesehatan Pasien yang dicatat secara langsung.</li>
                      <li>Apabila TERSANJUNG tidak digunakan atau dihentikan, sistem tetap menyimpan dan menggunakan Data Pribadi sesuai kebijakan retensi.</li>
                      <li>Data disimpan menggunakan infrastruktur dan server yang dikelola secara aman di wilayah Republik Indonesia.</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="mb-2 text-base font-black text-slate-950">5. Kerahasiaan, Hak Akses & Tanggung Jawab</h3>
                    <p className="mb-2 text-justify">
                      Setiap Pengguna yang memiliki akses harus memberikan jaminan kerahasiaan dan keamanan Data Pribadi dari akses yang tidak sah. Hak akses disusun berdasarkan fungsi dan kewenangan. Pengguna dilarang memberikan akun atau hak akses kepada pihak yang tidak sah.
                    </p>
                    <p className="text-justify">
                      TERSANJUNG dibebaskan dari segala bentuk penggunaan, penyebaran, penyimpanan, pemrosesan, pengubahan, atau akses yang tidak sah terhadap data pribadi yang diunduh (ekspor) oleh Pengguna. Pengguna bertanggung jawab penuh terhadap risiko pengunduhan data dan menjaga data yang diunduh.
                    </p>
                  </div>

                  <div>
                    <h3 className="mb-2 text-base font-black text-slate-950">6. Rekam Jejak Audit (Audit Trail)</h3>
                    <p className="text-justify">
                      TERSANJUNG mengaktifkan fungsi perekaman pemrosesan data (Audit Trail). Sistem menyimpan seluruh aktivitas pemrosesan data yang mencakup waktu (timestamp) pemrosesan, informasi detail pihak yang melakukan pemrosesan, dan objek data yang diproses. Penyelenggara berhak membatasi dan menindaklanjuti aktivitas Pengguna yang mencurigakan.
                    </p>
                  </div>

                  <div>
                    <h3 className="mb-2 text-base font-black text-slate-950">7. Indikasi Fraud & Hal yang Dilarang</h3>
                    <p className="mb-2">Setiap Pengguna dilarang:</p>
                    <ul className="list-outside list-disc space-y-1.5 pl-5 text-justify">
                      <li>Melakukan akses data pribadi yang tidak sesuai dengan tujuan pemrosesan data TERSANJUNG.</li>
                      <li>Memberikan akses atau menyebarkan Data Pribadi atau Informasi Kesehatan Pasien kepada pihak yang tidak sah.</li>
                      <li>Mengubah, memodifikasi, atau memalsukan Data Pribadi.</li>
                      <li>Menggunakan TERSANJUNG untuk tujuan ilegal, meretas, merekayasa balik (reverse engineering), atau memasukkan kode berbahaya (malware/virus).</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="mb-2 text-base font-black text-slate-950">8. Pengakuan Konsekuensi Hukum</h3>
                    <p className="text-justify">
                      Pengguna mengakui dan menyadari bahwa penyalahgunaan akun, pemalsuan, penyebaran, atau pengubahan data pribadi yang tidak sah dapat memiliki konsekuensi hukum berupa sanksi administrasi, gugatan perdata, atau <strong>sanksi pidana penjara paling lama 6 (enam) tahun dan/atau pidana denda paling banyak Rp 6.000.000.000,00 (enam miliar rupiah)</strong> sebagaimana diatur dalam Pasal 65, 66, 67, dan 68 UU Pelindungan Data Pribadi.
                    </p>
                  </div>

                  <div className="mt-8 rounded-lg bg-slate-50 p-6 text-center shadow-inner border border-slate-100">
                    <p className="font-black leading-relaxed text-slate-900 tracking-tight">
                      SAYA TELAH MEMBACA DAN MENGERTI SELURUH KEBIJAKAN PRIVASI DAN KETENTUAN PENGGUNAAN APLIKASI TERSANJUNG INI BESERTA KONSEKUENSINYA, DAN DENGAN INI MENERIMA SETIAP HAK, KEWAJIBAN, DAN KETENTUAN YANG TELAH DIATUR.
                    </p>
                  </div>
                </div>
              </section>
            )}
          </div>
        )}
      </main>`;

content = content.replace(regexPrivasi, newPrivasiContent);

fs.writeFileSync(file, content);
console.log('Naskah privasi berhasil diubahsuai.');
