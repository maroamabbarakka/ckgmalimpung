import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './auth/AuthContext';

const LOGO_PINRANG = "/logo_pinrang.png";
const LOGO_MALIMPUNG = "/logo_malimpung.png";
const HERO_IMAGE = "/puskesmas_malimpung.jpg";
const WORKFLOW_ITEMS = ['Antrean', 'Pemeriksaan', 'Rapor', 'Monitoring'];
const MAX_FAILED_ATTEMPTS = 5;
const FAILED_ATTEMPT_DELAY_MS = 2000;
const LOCKOUT_MS = 60000;

const UserIcon = () => (
  <svg aria-hidden="true" viewBox="0 0 24 24" className="login-input-icon">
    <path d="M20 21a8 8 0 0 0-16 0" />
    <circle cx="12" cy="8" r="4" />
  </svg>
);

const LockIcon = () => (
  <svg aria-hidden="true" viewBox="0 0 24 24" className="login-input-icon">
    <rect x="4" y="11" width="16" height="9" rx="2" />
    <path d="M8 11V8a4 4 0 0 1 8 0v3" />
  </svg>
);

const LogInIcon = () => (
  <svg aria-hidden="true" viewBox="0 0 24 24" className="login-button-icon">
    <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
    <path d="M10 17l5-5-5-5" />
    <path d="M15 12H3" />
  </svg>
);

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
    setError('ID pengguna atau PIN belum sesuai. Periksa kembali data akses Anda.');
  };

  return (
    <div className="login-page">

        <section
            className="login-hero-panel"
        >
            <div className="login-hero-media">
                <img
                    src={HERO_IMAGE}
                    alt=""
                    aria-hidden="true"
                    className="login-hero-photo"
                />
                <div className="login-hero-overlay" />
            </div>

            <div className="login-hero-content">
                <div className="login-hero-brand">
                    <div className="login-hero-logo">
                        <img src={LOGO_MALIMPUNG} alt="Malimpung" />
                    </div>
                    <div>
                        <p className="login-hero-kicker">Puskesmas Malimpung</p>
                        <p className="login-hero-region">Kabupaten Pinrang</p>
                    </div>
                </div>
                <h2 className="login-hero-title">
                    Sistem Layanan<br />Cek Kesehatan Gratis
                </h2>
                <p className="login-hero-description">
                    Platform operasional untuk antrean, pemeriksaan, rapor, dan monitoring layanan CKG.
                </p>
            </div>
            <div className="login-hero-chips">
                    {WORKFLOW_ITEMS.map((item) => (
                        <span key={item} className="login-hero-chip">
                            {item}
                        </span>
                    ))}
            </div>
        </section>

        <section className="login-card-shell">
        <div className="login-card">
            <div className="login-brand-block">
                <div className="login-logo-row">
                    <img src={LOGO_PINRANG} alt="Pinrang" />
                    <img src={LOGO_MALIMPUNG} alt="Malimpung" />
                </div>
                <h1 className="login-app-title">Tersanjung</h1>
                <p className="login-app-subtitle">Puskesmas Malimpung</p>
                <div className="login-system-badge">
                    Sistem Layanan Cek Kesehatan Gratis
                </div>
            </div>

            {error && (
                <div className="login-error animate-shake">
                    {error}
                    {cooldownRemaining > 0 && (
                        <span className="login-error-note">
                            Coba lagi dalam {cooldownSeconds} detik.
                        </span>
                    )}
                </div>
            )}

            <form onSubmit={handleLogin} className="login-form">
                <div className="login-form-group">
                    <label htmlFor="username" className="login-form-label">ID Pengguna</label>
                    <div className="login-input-wrap">
                        <UserIcon />
                        <input
                            id="username"
                            name="username"
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="Username staf..."
                            className="login-form-input"
                            required
                        />
                    </div>
                </div>

                <div className="login-form-group">
                    <label htmlFor="pin" className="login-form-label">PIN Keamanan</label>
                    <div className="login-input-wrap">
                        <LockIcon />
                        <input
                            id="pin"
                            name="pin"
                            type="password"
                            value={pin}
                            onChange={(e) => setPin(e.target.value)}
                            placeholder="******"
                            className="login-form-input login-pin-input"
                            required
                        />
                    </div>
                </div>

                <button type="submit" disabled={loginDisabled} className={`login-button ${authLoading ? 'is-loading' : ''}`}>
                  {authLoading ? (
                    <>
                      <span className="login-spinner" />
                      Memeriksa Akses...
                    </>
                  ) : cooldownRemaining > 0 ? (
                    `Tunggu ${cooldownSeconds} Detik`
                  ) : (
                    <>
                      <LogInIcon />
                      Masuk Ke Sistem
                    </>
                  )}
                </button>
            </form>

            <div className="login-footer">
                <p>
                    Khusus Tenaga Medis & Staf Resmi<br/>Akses Terintegrasi RME
                </p>
                <span>© 2026 Puskesmas Malimpung</span>
            </div>
        </div>
        </section>
    </div>
  );
}

export default Login;
