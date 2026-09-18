import Sidebar from '../components/Sidebar';
import './Pages.css';

function HowItWorks() {
  return (
    <div className="page-layout">
      <Sidebar />
      <main>
        <h1>What happens after you download</h1>
        <p className="about-intro">
          The download is a small Windows program (.exe), not a browser
          extension. Here's exactly what it does on your machine.
        </p>
        <div className="steps-detail">
          <div className="step">
            <h3>1. Windows may show a warning</h3>
            <p>Since this is a student project without a paid code-signing certificate, Windows SmartScreen may flag it as unrecognized. Click "More info" then "Run anyway" to continue.</p>
          </div>
          <div className="step">
            <h3>2. It runs locally, not in the cloud</h3>
            <p>The agent scans the WiFi networks your device can already see — nothing is sent until a scan is complete.</p>
          </div>
          <div className="step">
            <h3>3. Results sync to your dashboard</h3>
            <p>Each scan result is sent to the backend and appears on the dashboard, so you can see history over time.</p>
          </div>
          <div className="step">
            <h3>4. It keeps running in the background</h3>
            <p>You don't need to keep a window open — it checks periodically and alerts you if something looks wrong.</p>
          </div>
        </div>
      </main>
    </div>
  );
}

export default HowItWorks;