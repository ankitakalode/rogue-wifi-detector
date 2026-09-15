import { useState, useEffect } from 'react';
import '../App.css';

function Dashboard() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchAlerts();
  }, []);

  const fetchAlerts = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/alerts');
      const data = await response.json();
      setAlerts(data.alerts);
      setLoading(false);
    } catch (err) {
      setError('Backend se data nahi mil raha. Check karo server chal raha hai kya.');
      setLoading(false);
    }
  };

  if (loading) return <p>Loading...</p>;
  if (error) return <p style={{ color: 'red' }}>{error}</p>;

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial' }}>
      <h1>Rogue WiFi Detector Dashboard</h1>
      <p>Total Scans: {alerts.length}</p>
      <table border="1" cellPadding="10" style={{ borderCollapse: 'collapse', width: '100%' }}>
        <thead>
          <tr>
            <th>SSID</th><th>BSSID</th><th>Signal</th><th>Encryption</th><th>Status</th><th>Time</th>
          </tr>
        </thead>
        <tbody>
          {alerts.map((alert) => (
            <tr key={alert._id}>
              <td>{alert.ssid}</td>
              <td>{alert.bssid}</td>
              <td>{alert.signal}</td>
              <td>{alert.encryption}</td>
              <td style={{ color: alert.status === 'suspicious' ? 'red' : 'green', fontWeight: 'bold' }}>
                {alert.status}
              </td>
              <td>{new Date(alert.timestamp).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default Dashboard;