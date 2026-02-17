import React, { useState, useEffect } from 'react';

const DEBUG_KEY = 'smartlunch_token_debug';

function isDebugMode() {
  if (typeof window === 'undefined') return false;
  try {
    if (new URLSearchParams(window.location.search).get('tokenDebug') === '1') return true;
    if (localStorage.getItem(DEBUG_KEY) === '1') return true;
  } catch (_) {}
  return false;
}

function getTokenExpirationSeconds(token) {
  if (!token || typeof token !== 'string') return null;
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const payload = JSON.parse(atob(base64));
    const exp = payload.exp;
    if (typeof exp !== 'number') return null;
    const now = Math.floor(Date.now() / 1000);
    return Math.max(0, exp - now);
  } catch (_) {
    return null;
  }
}

function formatCountdown(seconds) {
  if (seconds === null) return '--:--';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

/**
 * Banner fijo arriba en modo prueba: muestra tiempo restante del JWT y countdown.
 * Activar con ?tokenDebug=1 en la URL o localStorage.setItem('smartlunch_token_debug', '1')
 */
function TokenDebugBanner() {
  const [remainingSeconds, setRemainingSeconds] = useState(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!isDebugMode()) {
      setVisible(false);
      return;
    }

    const tick = () => {
      const token = localStorage.getItem('token');
      if (token && token !== 'null' && token !== 'undefined') {
        setVisible(true);
        const sec = getTokenExpirationSeconds(token);
        setRemainingSeconds(sec);
      } else {
        setVisible(false);
      }
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, []);

  if (!visible) return null;

  const expired = remainingSeconds !== null && remainingSeconds <= 0;
  const low = remainingSeconds !== null && remainingSeconds > 0 && remainingSeconds <= 60;
  const barHeight = 36;

  return (
    <>
      <div style={{ height: barHeight, flexShrink: 0 }} aria-hidden="true" />
      <div
        role="status"
        aria-live="polite"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 99999,
          height: barHeight,
          padding: '0 12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '13px',
          fontWeight: 600,
          backgroundColor: expired ? '#c62828' : low ? '#f57c00' : '#1565c0',
          color: '#fff',
          boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
        }}
      >
        {expired
          ? 'Token expirado — la próxima petición debería renovar o redirigir a login'
          : `Modo prueba · Token expira en: ${formatCountdown(remainingSeconds)} min`}
      </div>
    </>
  );
}

export default TokenDebugBanner;
