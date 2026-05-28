import { useEffect, useState } from 'react';

const DEFAULT_WARNING_MS = 15 * 60 * 1000;
const DEFAULT_TIMEOUT_MS = 20 * 60 * 1000;
const ACTIVITY_EVENTS = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll'];

export default function useIdleTimeout({
  enabled = true,
  warningMs = DEFAULT_WARNING_MS,
  timeoutMs = DEFAULT_TIMEOUT_MS,
  onTimeout
} = {}) {
  const [isWarning, setIsWarning] = useState(false);

  useEffect(() => {
    if (!enabled) {
      setIsWarning(false);
      return undefined;
    }

    let warningTimer;
    let timeoutTimer;

    const resetTimers = () => {
      setIsWarning(false);
      window.clearTimeout(warningTimer);
      window.clearTimeout(timeoutTimer);
      warningTimer = window.setTimeout(() => setIsWarning(true), warningMs);
      timeoutTimer = window.setTimeout(() => {
        setIsWarning(false);
        onTimeout?.();
      }, timeoutMs);
    };

    resetTimers();
    ACTIVITY_EVENTS.forEach((eventName) => window.addEventListener(eventName, resetTimers, { passive: true }));

    return () => {
      window.clearTimeout(warningTimer);
      window.clearTimeout(timeoutTimer);
      ACTIVITY_EVENTS.forEach((eventName) => window.removeEventListener(eventName, resetTimers));
    };
  }, [enabled, onTimeout, timeoutMs, warningMs]);

  return { isWarning };
}
