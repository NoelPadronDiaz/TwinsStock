import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { punchClock, PunchResult } from '../api/client';
import { formatMinutes } from '../utils/scheduleDates';
import './kiosk-shared.css';

const BUSINESS_TIMEZONE = 'Atlantic/Canary';
const timeFormatter = new Intl.DateTimeFormat('es-ES', {
  timeZone: BUSINESS_TIMEZONE,
  hour: '2-digit',
  minute: '2-digit',
});

type Status = 'loading' | 'success' | 'error';

export default function ClockPage() {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<Status>('loading');
  const [result, setResult] = useState<PunchResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = searchParams.get('t');
    if (!token) {
      setStatus('error');
      setError('Falta el código del QR. Escanéalo de nuevo.');
      return;
    }
    punchClock(token)
      .then((res) => {
        setResult(res);
        setStatus('success');
      })
      .catch((err) => {
        setError(err.response?.data?.message ?? 'No se ha podido registrar el fichaje.');
        setStatus('error');
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const durationLabel =
    result?.action === 'clock-out'
      ? formatMinutes((new Date(result.at).getTime() - new Date(result.clockIn).getTime()) / 60000)
      : null;

  return (
    <div className="kiosk-page clock-page">
      <div className="clock-result-card">
        {status === 'loading' && <p className="clock-result-title">Registrando...</p>}

        {status === 'success' && result && (
          <>
            <span className={`clock-result-icon ${result.action}`}>{result.action === 'clock-in' ? '→' : '←'}</span>
            <p className="clock-result-title">{result.action === 'clock-in' ? 'Entrada registrada' : 'Salida registrada'}</p>
            <p className="clock-result-time">{timeFormatter.format(new Date(result.at))}</p>
            {durationLabel && <p className="clock-result-duration">Turno de {durationLabel}</p>}
          </>
        )}

        {status === 'error' && (
          <>
            <span className="clock-result-icon error">!</span>
            <p className="clock-result-title">No se pudo fichar</p>
            <p className="clock-result-message">{error}</p>
          </>
        )}
      </div>
    </div>
  );
}
