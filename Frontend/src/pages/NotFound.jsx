import { Link } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import './Pages.css';

function NotFound() {
  return (
    <div className="page-layout">
      <Sidebar />
      <main>
        <h1>Page not found</h1>
        <p className="about-intro">The page you're looking for doesn't exist.</p>
        <Link to="/" className="cta">Back to home</Link>
      </main>
    </div>
  );
}

export default NotFound;