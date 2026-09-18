import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Logo } from './Icons';
import './Sidebar.css';

function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const isActive = (path) => location.pathname === path;

  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      <button className="collapse-btn" onClick={() => setCollapsed(!collapsed)} aria-label="Toggle sidebar">
        {collapsed ? '›' : '‹'}
      </button>
      <Link to="/" className="brand">
        <Logo size={26} />
        {!collapsed && <span>SentinelAP</span>}
      </Link>
      <nav>
        <Link to="/" className={isActive('/') ? 'active' : ''}>{collapsed ? 'O' : 'Overview'}</Link>
        <Link to="/about" className={isActive('/about') ? 'active' : ''}>{collapsed ? 'A' : 'About us'}</Link>
        <Link to="/login" className={isActive('/login') ? 'active' : ''}>{collapsed ? 'L' : 'Login'}</Link>
      </nav>
      {!collapsed && <Link to="/dashboard" className="sidebar-dashboard-link">View dashboard →</Link>}
    </aside>
  );
}

export default Sidebar;