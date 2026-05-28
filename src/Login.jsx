import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './auth/AuthContext';
import AppButton from './design-system/components/AppButton';
import AppCard from './design-system/components/AppCard';
import AppInput from './design-system/components/AppInput';

const LOGO_PINRANG = "/logo_pinrang.png";
const LOGO_MALIMPUNG = "/logo_malimpung.png";
const MAX_FAILED_ATTEMPTS = 5;
const FAILED_ATTEMPT_DELAY_MS = 2000;
const LOCKOUT_MS = 60000;

function Login() {
  const [username, setUsername] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [retryAfter, setRetryAfter] = useState(0);
  const [currentTime, setCurrentTime] = useState(Date.now());
  const navigate = useNavigate();

  const { signIn, loading: authLoading } = useAuth();
  const cooldownRemaining = Math.max(0, retryAfter - currentTime);
  const cooldownSeconds = Math.ceil(cooldownRemaining / 1000);
  const loginDisabled = authLoading || cooldownRemaining > 0;

  useEffect(() => {
    if (!retryAfter) return undefined;
    const timer = setInterval(() => setCurrentTime(Date.now()), 500);
    return () => clearInterval(timer);
  }, [retryAfter]);

  useEffect(() => {
    if (retryAfter && cooldownRemaining === 0) {
      setRetryAfter(0);
    }
  }, [cooldownRemaining, retryAfter]);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (loginDisabled) return;
    setError('');

    const result = await signIn({ username, pin });
    if (result.success) {
      setFailedAttempts(0);
      setRetryAfter(0);
      navigate('/');
      return;
    }

    const nextFailedAttempts = failedAttempts + 1;
    setFailedAttempts(nextFailedAttempts);
    setCurrentTime(Date.now());
    setRetryAfter(Date.now() + (nextFailedAttempts >= MAX_FAILED_ATTEMPTS ? LOCKOUT_MS : FAILED_ATTEMPT_DELAY_MS));
    setError(result.message || 'Username atau PIN salah, atau akun tidak aktif.');
  };

  return (
    <div className="min-h-screen bg-slate-100 p-4 relative overflow-hidden font-sans lg:grid lg:grid-cols-[1fr_520px] lg:items-stretch lg:gap-8 lg:p-8">
        {/* Dekorasi Background */}
        <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-teal-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-emerald-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30"></div>

        <section className="relative z-10 hidden min-h-[calc(100vh-4rem)] flex-col justify-between rounded-[2.5rem] bg-teal-700 p-12 text-white shadow-2xl lg:flex">
            <div>
                <div className="flex items-center gap-4">
                    <div className="rounded-2xl bg-white p-3 shadow-lg">
                        <img src={LOGO_MALIMPUNG} alt="Malimpung" className="h-12 w-auto object-contain" />
                    </div>
                    <div>
                        <p className="text-xs font-black uppercase tracking-[0.24em] text-teal-100">Puskesmas Malimpung</p>
                        <p className="mt-1 text-sm font-semibold text-teal-50">Kabupaten Pinrang</p>
                    </div>
                </div>
                <h2 className="mt-16 max-w-2xl text-5xl font-black leading-tight tracking-tight">
                    Sistem Layanan Cek Kesehatan Gratis
                </h2>
                <p className="mt-6 max-w-xl text-base font-medium leading-8 text-teal-50">
                    Platform operasional terpadu untuk antrean, pemeriksaan, rapor, dan monitoring layanan CKG.
                </p>
            </div>
            <div className="grid max-w-2xl grid-cols-3 gap-3 text-xs font-black uppercase tracking-widest text-teal-50">
                <div className="rounded-2xl border border-white/20 bg-white/10 p-4">Antrean</div>
                <div className="rounded-2xl border border-white/20 bg-white/10 p-4">Pemeriksaan</div>
                <div className="rounded-2xl border border-white/20 bg-white/10 p-4">Rapor</div>
            </div>
        </section>

        <section className="relative z-10 flex min-h-[calc(100vh-2rem)] items-center justify-center lg:min-h-[calc(100vh-4rem)]">
        <AppCard className="w-full max-w-md p-8 md:p-10 relative z-10 border-white rounded-[2.5rem] shadow-2xl">
            <div className="text-center mb-8">
                <div className="flex justify-center gap-4 mb-6">
                    <img src={LOGO_PINRANG} alt="Pinrang" className="h-12 w-auto object-contain" />
                    <img src={LOGO_MALIMPUNG} alt="Malimpung" className="h-12 w-auto object-contain" />
                </div>
                <h1 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Tersanjung</h1>
                <p className="text-[10px] text-slate-400 font-bold tracking-[0.2em] mt-1 uppercase">Puskesmas Malimpung</p>
                <p className="mt-4 rounded-full bg-teal-50 px-4 py-2 text-[10px] font-black uppercase tracking-[0.16em] text-teal-700">
                    Sistem Layanan Cek Kesehatan Gratis
                </p>
            </div>

            {error && (
                <div className="bg-rose-50 border-l-4 border-rose-500 text-rose-700 p-4 rounded-xl mb-6 text-xs font-bold animate-shake">
                    {error}
                    {cooldownRemaining > 0 && (
                        <span className="mt-2 block text-rose-600">
                            Coba lagi dalam {cooldownSeconds} detik.
                        </span>
                    )}
                </div>
            )}

            <form onSubmit={handleLogin} className="space-y-5">
                <AppInput
                    label="ID Pengguna"
                    name="username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Username staf..."
                    required
                />

                <AppInput
                    label="PIN Keamanan"
                    name="pin"
                    type="password"
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    inputClassName="tracking-[0.5em]"
                    placeholder="******"
                    required
                />

                <AppButton type="submit" disabled={loginDisabled} size="xl" className="w-full mt-4 font-black tracking-widest uppercase">
                  {authLoading ? 'Memverifikasi...' : cooldownRemaining > 0 ? `Tunggu ${cooldownSeconds} Detik` : 'Masuk Ke Sistem'}
                </AppButton>
            </form>

            <div className="mt-10 text-center">
                <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest leading-relaxed">
                    Khusus Tenaga Medis & Staf Resmi<br/>Akses Terintegrasi RME
                </p>
            </div>
        </AppCard>
        </section>
    </div>
  );
}

export default Login;
