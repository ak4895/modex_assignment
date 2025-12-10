import React from 'react';
import { useAuth } from '../hooks/index';

export const Header: React.FC = () => {
  const { user, logout } = useAuth();

  return (
    <header style={styles.header}>
      <div style={styles.container}>
        <div style={styles.content}>
          <h1 style={styles.logo}>🎫 TicketBook</h1>
          <nav style={styles.nav}>
            <a href="/" style={styles.link}>Home</a>
            {user && (
              <>
                <a href="/my-bookings" style={styles.link}>My Bookings</a>
                <a href="/admin" style={styles.link}>Admin</a>
                <span style={styles.user}>{user.name}</span>
                <button onClick={logout} style={styles.logoutBtn}>Logout</button>
              </>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
};

const styles = {
  header: {
    backgroundColor: '#333',
    color: 'white',
    padding: '1rem 0',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  } as React.CSSProperties,
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '0 20px',
  } as React.CSSProperties,
  content: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  } as React.CSSProperties,
  logo: {
    margin: 0,
    fontSize: '1.5rem',
  } as React.CSSProperties,
  nav: {
    display: 'flex',
    gap: '2rem',
    alignItems: 'center',
  } as React.CSSProperties,
  link: {
    color: 'white',
    textDecoration: 'none',
    cursor: 'pointer',
    fontSize: '0.95rem',
  } as React.CSSProperties,
  user: {
    fontSize: '0.9rem',
    opacity: 0.8,
  } as React.CSSProperties,
  logoutBtn: {
    backgroundColor: '#dc3545',
    color: 'white',
    border: 'none',
    padding: '0.5rem 1rem',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '0.9rem',
  } as React.CSSProperties,
};
