import Sidebar from '../components/Sidebar';
import { UserIcon } from '../components/Icons';
import './Pages.css';

const team = [
  { name: 'Shoib Sayyad' },
  { name: 'Saloni Funne' },
  { name: 'Ankita Kalode' },
  { name: 'Noman Shekh' },
  { name: 'Shraddha Bansod' },
];

function AboutUs() {
  return (
    <div className="page-layout">
      <Sidebar />
      <main>
        <h1>About the project</h1>
        <p className="about-intro">
          SentinelAP was built by a team of five to solve a problem most
          people don't think about until it's too late — that the WiFi
          network at an airport or cafe might not be what it claims to be.
        </p>
        <div className="team-grid">
          {team.map((m) => (
            <div className="team-card" key={m.name}>
              <div className="avatar-icon"><UserIcon /></div>
              <h3>{m.name}</h3>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

export default AboutUs;