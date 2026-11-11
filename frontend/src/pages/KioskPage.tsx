import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { useAuth } from '../auth/AuthContext';
import { fetchClockToken } from '../api/client';
import { CloseIcon, ExpandIcon, PowerIcon } from '../components/icons';
import './kiosk-shared.css';

// Same business timezone the backend uses (backend/src/common/business-time.ts)
// — no shared package between the two, so it's duplicated here.
const BUSINESS_TIMEZONE = 'Atlantic/Canary';
const TOKEN_REFRESH_MS = 30_000;

const dateFormatter = new Intl.DateTimeFormat('es-ES', {
  timeZone: BUSINESS_TIMEZONE,
  weekday: 'long',
  day: 'numeric',
  month: 'long',
});
const timeFormatter = new Intl.DateTimeFormat('es-ES', {
  timeZone: BUSINESS_TIMEZONE,
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
});

export default function KioskPage() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [token, setToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [now, setNow] = useState(() => new Date());
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    const refresh = () => {
      fetchClockToken()
        .then((res) => {
          if (cancelled) return;
          setToken(res.token);
          setError(null);
        })
        .catch(() => {
          if (cancelled) return;
          setError('No se ha podido renovar el código. Reintentando...');
        });
    };
    refresh();
    const interval = setInterval(refresh, TOKEN_REFRESH_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const toggleFullscreen = () => {
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      containerRef.current?.requestFullscreen();
    }
  };

  const clockUrl = token ? `${window.location.origin}/clock?t=${token}` : null;

  return (
    <div className="kiosk-page" ref={containerRef}>
      <button className="kiosk-icon-button kiosk-fullscreen-button" onClick={toggleFullscreen} aria-label="Pantalla completa">
        <ExpandIcon />
      </button>
      <button
        className="kiosk-icon-button kiosk-exit-button"
        onClick={() => navigate('/')}
        aria-label="Salir del modo kiosco"
        title="Salir del modo kiosco"
      >
        <CloseIcon />
      </button>
      <button className="kiosk-icon-button kiosk-logout-button" onClick={logout} aria-label="Cerrar sesión" title="Cerrar sesión">
        <PowerIcon />
      </button>

      <div className="kiosk-clock">
        <span className="kiosk-time">{timeFormatter.format(now)}</span>
        <span className="kiosk-date">{dateFormatter.format(now)}</span>
      </div>

      <div className="kiosk-qr-card">
        {clockUrl ? (
          <QRCodeSVG value={clockUrl} size={320} level="M" marginSize={2} />
        ) : (
          <div className="kiosk-qr-placeholder">Cargando código...</div>
        )}
      </div>

      <p className="kiosk-hint">Escanea este código con tu móvil para fichar</p>
      {error && <p className="kiosk-error">{error}</p>}
    </div>
  );
}
