import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function Navbar() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const getInitial = (name) => name?.charAt(0)?.toUpperCase() || '?';

  return (
    <>
      {/* Desktop Sidebar Nav */}
      <nav
        className="hide-mobile"
        style={{
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
          width: '220px',
          background: 'var(--bg-secondary)',
          borderRight: '1px solid var(--border-color)',
          padding: '24px 12px',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 100,
          transition: 'background-color 0.3s ease, border-color 0.3s ease',
        }}
      >
        {/* Logo */}
        <div
          style={{ padding: '8px 16px', marginBottom: '32px', cursor: 'pointer' }}
          onClick={() => navigate('/home')}
        >
          <h1
            className="font-display accent-gradient-text"
            style={{ fontSize: '24px', fontWeight: 800 }}
          >
            SocialMini
          </h1>
        </div>

        {/* Nav Items */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
          <NavLink to="/home" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
            <span>Home</span>
          </NavLink>

          <NavLink to="/create" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <line x1="12" y1="8" x2="12" y2="16" />
              <line x1="8" y1="12" x2="16" y2="12" />
            </svg>
            <span>Create</span>
          </NavLink>

          <NavLink to="/messages" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            <span>Messages</span>
          </NavLink>

          <NavLink
            to="/profile"
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            {user?.profilePicture ? (
              <img
                src={user.profilePicture}
                alt="Profile"
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: '50%',
                  objectFit: 'cover',
                  border: '2px solid var(--border-color)',
                }}
              />
            ) : (
              <div
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: '50%',
                  background: 'var(--accent-gradient)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontSize: '12px',
                  fontWeight: 700,
                }}
              >
                {getInitial(user?.username)}
              </div>
            )}
            <span>Profile</span>
          </NavLink>
        </div>
      </nav>

      {/* Mobile Bottom Nav */}
      <nav
        className="show-mobile-only"
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          background: 'var(--bg-secondary)',
          borderTop: '1px solid var(--border-color)',
          display: 'flex',
          justifyContent: 'space-around',
          alignItems: 'center',
          padding: '8px 0',
          zIndex: 100,
          transition: 'background-color 0.3s ease, border-color 0.3s ease',
        }}
      >
        <NavLink
          to="/home"
          style={({ isActive }) => ({
            color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
            padding: '8px',
          })}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
        </NavLink>

        <NavLink
          to="/create"
          style={({ isActive }) => ({
            color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
            padding: '8px',
          })}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <line x1="12" y1="8" x2="12" y2="16" />
            <line x1="8" y1="12" x2="16" y2="12" />
          </svg>
        </NavLink>

        <NavLink
          to="/messages"
          style={({ isActive }) => ({
            color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
            padding: '8px',
          })}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        </NavLink>

        <NavLink
          to="/profile"
          style={({ isActive }) => ({
            color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
            padding: '8px',
          })}
        >
          {user?.profilePicture ? (
            <img
              src={user.profilePicture}
              alt=""
              style={{ width: 24, height: 24, borderRadius: '50%', objectFit: 'cover' }}
            />
          ) : (
            <div
              style={{
                width: 24,
                height: 24,
                borderRadius: '50%',
                background: 'var(--accent-gradient)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: '12px',
                fontWeight: 700,
              }}
            >
              {getInitial(user?.username)}
            </div>
          )}
        </NavLink>
      </nav>
    </>
  );
}
