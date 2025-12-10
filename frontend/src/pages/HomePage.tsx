import React, { useState, useEffect } from 'react';
import { useShows } from '../hooks/index';
import { Show } from '../types/index';

export const HomePage: React.FC = () => {
  const { shows, loading, error, fetchShows } = useShows();
  const [filteredShows, setFilteredShows] = useState<Show[]>([]);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    fetchShows();
  }, []);

  useEffect(() => {
    if (filter) {
      setFilteredShows(
        shows.filter((show) =>
          show.name.toLowerCase().includes(filter.toLowerCase())
        )
      );
    } else {
      setFilteredShows(shows);
    }
  }, [shows, filter]);

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1>Available Shows</h1>
        <p style={styles.subtitle}>Browse and book your tickets</p>
      </div>

      <div style={styles.searchBox}>
        <input
          type="text"
          placeholder="Search shows..."
          value={filter}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setFilter(e.target.value)
          }
          style={styles.searchInput}
        />
      </div>

      {error && <div style={styles.error}>{error}</div>}

      {loading ? (
        <div style={styles.loading}>
          <div style={styles.spinner}></div>
          <p>Loading shows...</p>
        </div>
      ) : filteredShows.length === 0 ? (
        <div style={styles.empty}>
          <p>No shows available</p>
        </div>
      ) : (
        <div style={styles.grid}>
          {filteredShows.map((show) => (
            <div key={show.id} style={styles.card}>
              <div style={styles.cardHeader}>
                <h3>{show.name}</h3>
                <span style={styles.badge}>{show.show_type}</span>
              </div>
              <div style={styles.cardBody}>
                <p>
                  <strong>Start Time:</strong>{' '}
                  {new Date(show.start_time).toLocaleString()}
                </p>
                <p>
                  <strong>Available Seats:</strong> {show.available_seats} /{' '}
                  {show.total_seats}
                </p>
                <div style={styles.seatBar}>
                  <div
                    style={{
                      ...styles.seatBarFilled,
                      width: `${(show.available_seats / show.total_seats) * 100}%`,
                    }}
                  ></div>
                </div>
              </div>
              <div style={styles.cardFooter}>
                <a href={`/booking/${show.id}`} style={styles.bookButton}>
                  Book Now
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const styles = {
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '40px 20px',
  } as React.CSSProperties,
  header: {
    textAlign: 'center' as const,
    marginBottom: '40px',
  } as React.CSSProperties,
  subtitle: {
    color: '#666',
    fontSize: '1.1rem',
  } as React.CSSProperties,
  searchBox: {
    marginBottom: '30px',
    display: 'flex',
    justifyContent: 'center',
  } as React.CSSProperties,
  searchInput: {
    width: '100%',
    maxWidth: '400px',
    padding: '12px 20px',
    fontSize: '1rem',
    border: '2px solid #ddd',
    borderRadius: '8px',
  } as React.CSSProperties,
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: '20px',
  } as React.CSSProperties,
  card: {
    backgroundColor: 'white',
    borderRadius: '8px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    overflow: 'hidden',
    transition: 'transform 0.3s ease, box-shadow 0.3s ease',
    cursor: 'pointer',
  } as React.CSSProperties,
  cardHeader: {
    backgroundColor: '#f8f9fa',
    padding: '15px',
    borderBottom: '1px solid #eee',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  } as React.CSSProperties,
  badge: {
    backgroundColor: '#007bff',
    color: 'white',
    padding: '4px 12px',
    borderRadius: '20px',
    fontSize: '0.8rem',
    fontWeight: 'bold',
  } as React.CSSProperties,
  cardBody: {
    padding: '20px',
  } as React.CSSProperties,
  seatBar: {
    height: '8px',
    backgroundColor: '#e9ecef',
    borderRadius: '4px',
    overflow: 'hidden',
    marginTop: '10px',
  } as React.CSSProperties,
  seatBarFilled: {
    height: '100%',
    backgroundColor: '#28a745',
    transition: 'width 0.5s ease',
  } as React.CSSProperties,
  cardFooter: {
    padding: '15px',
    borderTop: '1px solid #eee',
  } as React.CSSProperties,
  bookButton: {
    display: 'block',
    backgroundColor: '#007bff',
    color: 'white',
    padding: '12px',
    textAlign: 'center',
    borderRadius: '4px',
    textDecoration: 'none',
    fontWeight: 'bold',
    transition: 'background-color 0.3s ease',
  } as React.CSSProperties,
  error: {
    backgroundColor: '#f8d7da',
    color: '#721c24',
    padding: '15px',
    borderRadius: '4px',
    marginBottom: '20px',
  } as React.CSSProperties,
  loading: {
    display: 'flex',
    flexDirection: 'column' as const,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '400px',
  } as React.CSSProperties,
  spinner: {
    width: '50px',
    height: '50px',
    border: '4px solid #f3f3f3',
    borderTop: '4px solid #007bff',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  } as React.CSSProperties,
  empty: {
    textAlign: 'center' as const,
    padding: '60px 20px',
    color: '#999',
  } as React.CSSProperties,
};
