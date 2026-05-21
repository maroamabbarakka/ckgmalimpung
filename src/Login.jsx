import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from './firebase'; 
import { collection, query, where, getDocs } from 'firebase/firestore';
import { logActivity } from './utils/logger';

const LOGO_PINRANG = "/logo_pinrang.png";
const LOGO_MALIMPUNG = "/logo_malimpung.png";

function Login() {
  const [username, setUsername] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
        const q = query(
            collection(db, "staff"), 
            where("username", "==", username.toLowerCase().replace(/\s/g, '')),
            where("pin", "==", pin),
            where("isActive", "==", true)
        );
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
            const userData = querySnapshot.docs[0].data();
            sessionStorage.setItem('isAuthenticated', 'true');
            sessionStorage.setItem('username', username.toLowerCase().replace(/\s/g, ''));
            sessionStorage.setItem('namaPegawai', userData.nama);
            sessionStorage.setItem('rolePegawai', JSON.stringify(userData.role));
            
            // Catat log aktivitas login
            await logActivity("Berhasil masuk ke dalam sistem aplikasi", "Autentikasi Sistem");
            
            navigate('/');
        } else {
            setError('Username atau PIN salah, atau akun tidak aktif.');
        }
    } catch (err) {
        setError('Gagal terhubung ke server. Periksa koneksi internet.');
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4 relative overflow-hidden font-sans">
        {/* Dekorasi Background */}
        <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-teal-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-emerald-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30"></div>

        <div className="w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl p-8 md:p-10 relative z-10 border border-white">
            <div className="text-center mb-8">
                <div className="flex justify-center gap-4 mb-6">
                    <img src={LOGO_PINRANG} alt="Pinrang" className="h-12 w-auto object-contain" />
                    <img src={LOGO_MALIMPUNG} alt="Malimpung" className="h-12 w-auto object-contain" />
                </div>
                <h1 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Tersanjung</h1>
                <p className="text-[10px] text-slate-400 font-bold tracking-[0.2em] mt-1 uppercase">Puskesmas Malimpung</p>
            </div>

            {error && (
                <div className="bg-rose-50 border-l-4 border-rose-500 text-rose-700 p-4 rounded-xl mb-6 text-xs font-bold animate-shake">
                    {error}
                </div>
            )}

            <form onSubmit={handleLogin} className="space-y-5">
                <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">ID Pengguna</label>
                    <input 
                        type="text" 
                        value={username} 
                        onChange={(e) => setUsername(e.target.value)} 
                        className="w-full bg-slate-50 border border-slate-200 text-slate-700 rounded-2xl px-5 py-4 focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition-all font-bold"
                        placeholder="Username staf..."
                        required 
                    />
                </div>

                <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">PIN Keamanan</label>
                    <input 
                        type="password" 
                        value={pin} 
                        onChange={(e) => setPin(e.target.value)} 
                        className="w-full bg-slate-50 border border-slate-200 text-slate-700 rounded-2xl px-5 py-4 focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition-all font-bold tracking-[0.5em]"
                        placeholder="••••••"
                        required 
                    />
                </div>

                <button 
                    type="submit" 
                    disabled={loading}
                    className="w-full mt-4 bg-gradient-to-r from-teal-600 to-emerald-600 text-white font-black py-5 rounded-2xl shadow-xl shadow-teal-200 hover:shadow-teal-300 transition-all active:scale-95 disabled:opacity-50 text-sm uppercase tracking-widest"
                >
                    {loading ? 'Memverifikasi...' : 'Masuk Ke Sistem'}
                </button>
            </form>

            <div className="mt-10 text-center">
                <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest leading-relaxed">
                    Khusus Tenaga Medis & Staf Resmi<br/>Akses Terintegrasi RME
                </p>
            </div>
        </div>
    </div>
  );
}

export default Login;
