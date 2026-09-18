import { useState } from 'react';
import { Link } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Footer from '../components/Footer';
import './LandingPage.css';

const scanDemo = [
  { ssid: 'Airport_Free_WiFi', signal: -42, flag: 'Duplicate SSID detected', status: 'suspicious' },
  { ssid: 'Cafe_Mocha_5G', signal: -58, flag: 'Verified pattern', status: 'genuine' },
  { ssid: 'Home_Guest', signal: -70, flag: 'Verified pattern', status: 'genuine' },
];

function LandingPage() {
  const [downloading, setDownloading] = useState(false);

  const handleDownload = (e) => {
    e.preventDefault();
    setDownloading(true);
    setTimeout(() => {
      setDownloading(false);
    }, 1500);
  };

  return (
    <div className="landing">
      <Sidebar />

      <main className="content">
        <section id="hero" className="hero">
          <div className="hero-text">
            <h1>Not every WiFi you see is the one you think it is.</h1>
            <p>
              Public networks at airports, cafes and malls can be spoofed by
              an attacker running a fake access point with the same name.
              This scans the networks around you and flags the ones built to
              intercept your traffic — before you connect.
            </p>
            <a href="#" className="cta" onClick={handleDownload}>
              {downloading ? 'Preparing download...' : 'Download the scanner'}
            </a>
            <span className="cta-note">Windows · Free · No sign-up</span>
            <Link to="/how-it-works" className="how-link">See what happens after you download →</Link>
          </div>

          <div className="scan-panel">
            <div className="scan-panel-header">
              <span>Nearby networks</span>
              <span className="scan-dot" />
            </div>
            {scanDemo.map((n) => (
              <div className={`scan-row ${n.status}`} key={n.ssid}>
                <span className="ssid">{n.ssid}</span>
                <span className="signal">{n.signal} dBm</span>
                <span className="flag">{n.flag}</span>
              </div>
            ))}
          </div>
        </section>

        <section id="how" className="how">
          <h2>How it works</h2>
          <ol>
            <li>
              <span className="step-num">1</span>
              <div>
                <h3>Scan</h3>
                <p>The agent listens to every access point broadcasting nearby, the same way your device already does.</p>
              </div>
            </li>
            <li>
              <span className="step-num">2</span>
              <div>
                <h3>Analyze</h3>
                <p>Signal strength, encryption, SSID duplication and vendor signatures are checked against known rogue-AP patterns.</p>
              </div>
            </li>
            <li>
              <span className="step-num">3</span>
              <div>
                <h3>Alert</h3>
                <p>If a network looks staged to imitate a trusted one, you're warned before you connect, not after.</p>
              </div>
            </li>
          </ol>
        </section>

        <section id="features" className="features">
          <h2>What it does</h2>
          <div className="feature-row">
            <h4>Real-time detection</h4>
            <p>Runs passively in the background whenever WiFi is available on your device.</p>
          </div>
          <div className="feature-row">
            <h4>Confidence scoring</h4>
            <p>Every alert comes with how sure the model is, not just a yes or no.</p>
          </div>
          <div className="feature-row">
            <h4>History dashboard</h4>
            <p>Every scan is logged, so you can see what changed and when.</p>
          </div>
        </section>

        <section id="download" className="download-cta">
          <h2>Scan before you connect.</h2>
          <a href="#" className="cta" onClick={handleDownload}>
            {downloading ? 'Preparing download...' : 'Download for Windows'}
          </a>
        </section>

        <Footer />
      </main>
    </div>
  );
}

export default LandingPage;