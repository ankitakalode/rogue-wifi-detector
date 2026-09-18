import { useEffect, useRef, useState } from 'react';
import './AlertToast.css';

function AlertToast() {
  const [toast, setToast] = useState(null);
  const lastSeenId = useRef(null);
  const firstLoad = useRef(true);
  const hideTimer = useRef(null);

  useEffect(() => {
    const checkAlerts = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/alerts');
        const data = await res.json();
        const latest = data.alerts?.[0];
        if (!latest) return;

        if (firstLoad.current) {
          lastSeenId.current = latest._id;
          firstLoad.current = false;
          return;
        }

        if (latest._id !== lastSeenId.current && latest.status === 'suspicious') {
          lastSeenId.current = latest._id;

          if (hideTimer.current) {
            clearTimeout(hideTimer.current);
          }

          setToast(latest);
          hideTimer.current = setTimeout(() => {
            setToast(null);
            hideTimer.current = null;
          }, 6000);
        } else {
          lastSeenId.current = latest._id;
        }
      } catch (err) {
        // backend down ho to kuch mat karo, agla poll try karega
      }
    };

    checkAlerts();
    const interval = setInterval(checkAlerts, 10000);

    return () => {
      clearInterval(interval);
      if (hideTimer.current) clearTimeout(hideTimer.current);
    };
  }, []);

  if (!toast) return null;

  return (
    <div className="alert-toast">
      <strong>Rogue WiFi detected</strong>
      <p>{toast.ssid} looks suspicious ({toast.encryption})</p>
    </div>
  );
}

export default AlertToast;