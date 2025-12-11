import React, { useState, useEffect } from 'react';
import { useShows } from '../hooks/index';
import { Show } from '../types/index';

// Helper function to get availability status
const getAvailabilityStatus = (show: Show) => {
  const availabilityPercent = (show.available_seats / show.total_seats) * 100;
  if (availabilityPercent > 75) return { status: 'AVAILABLE', color: '#28a745' };
  if (availabilityPercent > 25) return { status: 'FILLING_UP', color: '#ffc107' };
  return { status: 'ALMOST_FULL', color: '#dc3545' };
};

// Helper function to generate multiple show times
const generateShowTimes = (baseTime: Date): Date[] => {
  const times: Date[] = [];
  const base = new Date(baseTime);
  const hours = [11, 14, 17, 20, 23];
  
  for (const hour of hours) {
    const time = new Date(base);
    time.setHours(hour, 0, 0, 0);
    if (time > new Date()) times.push(time);
  }
  return times.length > 0 ? times : [base];
};

export const HomePage: React.FC = () => {
  const { shows, loading, error, fetchShows } = useShows();
  const [filteredShows, setFilteredShows] = useState<Show[]>([]);
  const [filter, setFilter] = useState('');
  const [showTimes, setShowTimes] = useState<Record<number, Date[]>>({});
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  // Initial fetch
  useEffect(() => {
    fetchShows();
  }, []);

  // Auto-refresh every 10 seconds for real-time availability updates
  useEffect(() => {
    const refreshInterval = setInterval(() => {
      fetchShows();
      setLastRefresh(new Date());
    }, 10000); // 10 seconds

    return () => clearInterval(refreshInterval);
  }, [fetchShows]);

  useEffect(() => {
    if (shows.length > 0) {
      const times: Record<number, Date[]> = {};
      shows.forEach(show => {
        times[show.id] = generateShowTimes(new Date(show.start_time));
      });
      setShowTimes(times);
    }
  }, [shows]);

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
        <h1>🎬 Available Shows</h1>
        <p style={styles.subtitle}>Browse and book your favorite tickets</p>
        <p style={styles.refreshIndicator}>🔄 Live updates • Last refresh: {lastRefresh.toLocaleTimeString()}</p>
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
          {filteredShows.map((show) => {
            const { status, color } = getAvailabilityStatus(show);
            const times = showTimes[show.id] || [];
            
            return (
              <div 
                key={show.id} 
                style={{
                  ...styles.card,
                  borderLeft: `5px solid ${color}`,
                }}
              >
                <div style={{...styles.cardHeader, backgroundColor: color + '15'}}>
                  <div>
                    <h3 style={{margin: '0 0 5px 0'}}>{show.name}</h3>
                    <span style={{...styles.statusBadge, backgroundColor: color}}>
                      {status}
                    </span>
                  </div>
                  <span style={styles.typeBadge}>{show.show_type}</span>
                </div>

                <div style={styles.cardBody}>
                  {/* Availability Bar */}
                  <div style={styles.availabilitySection}>
                    <p style={styles.sectionLabel}>
                      <strong>Availability</strong>
                    </p>
                    <div style={styles.seatBar}>
                      <div
                        style={{
                          ...styles.seatBarFilled,
                          width: `${(show.available_seats / show.total_seats) * 100}%`,
                          backgroundColor: color,
                        }}
                      ></div>
                    </div>
                    <p style={{fontSize: '0.9rem', color: '#666', marginTop: '8px'}}>
                      <strong>{show.available_seats}</strong> / {show.total_seats} seats available
                    </p>
                  </div>

                  {/* Show Times */}
                  <div style={styles.showTimesSection}>
                    <p style={styles.sectionLabel}><strong>Show Times</strong></p>
                    <div style={styles.timesGrid}>
                      {times.slice(0, 4).map((time, idx) => (
                        <a
                          key={idx}
                          href={`/booking/${show.id}?time=${time.getTime()}`}
                          style={{
                            ...styles.timeButton,
                            borderColor: color,
                            color: color,
                          }}
                        >
                          {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}
                        </a>
                      ))}
                    </div>
                  </div>
                </div>

                <div style={styles.cardFooter}>
                  <a 
                    href={`/booking/${show.id}`} 
                    style={{
                      ...styles.bookButton,
                      backgroundColor: color,
                    }}
                  >
                    Book Now
                  </a>
                </div>
              </div>
            );
          })}
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
  refreshIndicator: {
    color: '#28a745',
    fontSize: '0.9rem',
    marginTop: '10px',
    fontWeight: '500',
    animation: 'pulse 2s infinite',
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
    transition: 'border-color 0.3s ease',
  } as React.CSSProperties,
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
    gap: '25px',
  } as React.CSSProperties,
  card: {
    backgroundColor: 'white',
    borderRadius: '12px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
    overflow: 'hidden',
    transition: 'transform 0.3s ease, box-shadow 0.3s ease',
    cursor: 'pointer',
  } as React.CSSProperties,
  cardHeader: {
    padding: '20px',
    borderBottom: '1px solid #eee',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  } as React.CSSProperties,
  statusBadge: {
    color: 'white',
    padding: '6px 12px',
    borderRadius: '20px',
    fontSize: '0.75rem',
    fontWeight: 'bold',
    display: 'inline-block',
    marginTop: '8px',
  } as React.CSSProperties,
  typeBadge: {
    backgroundColor: '#e3f2fd',
    color: '#1976d2',
    padding: '6px 12px',
    borderRadius: '20px',
    fontSize: '0.8rem',
    fontWeight: 'bold',
  } as React.CSSProperties,
  cardBody: {
    padding: '20px',
  } as React.CSSProperties,
  availabilitySection: {
    marginBottom: '20px',
  } as React.CSSProperties,
  showTimesSection: {
    marginBottom: '10px',
  } as React.CSSProperties,
  sectionLabel: {
    marginBottom: '10px',
    fontSize: '0.95rem',
    color: '#333',
  } as React.CSSProperties,
  seatBar: {
    height: '12px',
    backgroundColor: '#e9ecef',
    borderRadius: '6px',
    overflow: 'hidden',
    marginBottom: '8px',
    boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.05)',
  } as React.CSSProperties,
  seatBarFilled: {
    height: '100%',
    transition: 'width 0.5s ease',
  } as React.CSSProperties,
  timesGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '8px',
  } as React.CSSProperties,
  timeButton: {
    padding: '10px 8px',
    textAlign: 'center' as const,
    borderRadius: '6px',
    textDecoration: 'none',
    border: '2px solid',
    fontSize: '0.85rem',
    fontWeight: '600',
    transition: 'all 0.3s ease',
    backgroundColor: 'white',
  } as React.CSSProperties,
  cardFooter: {
    padding: '15px 20px',
    borderTop: '1px solid #eee',
  } as React.CSSProperties,
  bookButton: {
    display: 'block',
    color: 'white',
    padding: '12px',
    textAlign: 'center',
    borderRadius: '6px',
    textDecoration: 'none',
    fontWeight: 'bold',
    transition: 'all 0.3s ease',
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
    borderTop: '4px solid #667eea',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  } as React.CSSProperties,
  empty: {
    textAlign: 'center' as const,
    padding: '60px 20px',
    color: '#999',
  } as React.CSSProperties,
};
