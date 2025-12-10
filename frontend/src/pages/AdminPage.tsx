import React, { useState } from 'react';
import { useShows } from '../hooks/index';

export const AdminPage: React.FC = () => {
  const { shows, fetchShows } = useShows();
  const [formData, setFormData] = useState({
    name: '',
    start_time: '',
    total_seats: '',
    show_type: 'movie',
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!formData.name || !formData.start_time || !formData.total_seats) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    setError('');
    setMessage('');

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/shows`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: formData.name,
            start_time: new Date(formData.start_time).toISOString(),
            total_seats: parseInt(formData.total_seats),
            show_type: formData.show_type,
          }),
        }
      );

      if (response.ok) {
        setMessage('Show created successfully!');
        setFormData({
          name: '',
          start_time: '',
          total_seats: '',
          show_type: 'movie',
        });
        await fetchShows();
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to create show');
      }
    } catch (err: any) {
      setError(err.message || 'Error creating show');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <h1>Admin Dashboard</h1>

      <div style={styles.content}>
        {/* Form Section */}
        <div style={styles.formSection}>
          <h2>Create New Show</h2>
          <form onSubmit={handleSubmit} style={styles.form}>
            {error && <div style={styles.error}>{error}</div>}
            {message && <div style={styles.success}>{message}</div>}

            <div style={styles.formGroup}>
              <label>Show Name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Enter show name"
              />
            </div>

            <div style={styles.formGroup}>
              <label>Start Time</label>
              <input
                type="datetime-local"
                name="start_time"
                value={formData.start_time}
                onChange={handleInputChange}
              />
            </div>

            <div style={styles.formGroup}>
              <label>Total Seats</label>
              <input
                type="number"
                name="total_seats"
                value={formData.total_seats}
                onChange={handleInputChange}
                placeholder="Enter total seats"
                min="1"
              />
            </div>

            <div style={styles.formGroup}>
              <label>Show Type</label>
              <select
                name="show_type"
                value={formData.show_type}
                onChange={handleInputChange}
              >
                <option value="movie">Movie</option>
                <option value="bus">Bus Trip</option>
                <option value="doctor">Doctor Appointment</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                ...styles.button,
                opacity: loading ? 0.6 : 1,
              }}
            >
              {loading ? 'Creating...' : 'Create Show'}
            </button>
          </form>
        </div>

        {/* Shows List Section */}
        <div style={styles.listSection}>
          <h2>All Shows</h2>
          {shows.length === 0 ? (
            <p>No shows created yet</p>
          ) : (
            <div style={styles.showsList}>
              {shows.map((show) => (
                <div key={show.id} style={styles.showItem}>
                  <h4>{show.name}</h4>
                  <p>
                    <strong>Type:</strong> {show.show_type}
                  </p>
                  <p>
                    <strong>Available:</strong> {show.available_seats} /{' '}
                    {show.total_seats}
                  </p>
                  <p>
                    <strong>Start:</strong>{' '}
                    {new Date(show.start_time).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '40px 20px',
  } as React.CSSProperties,
  content: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '40px',
    marginTop: '30px',
  } as React.CSSProperties,
  formSection: {
    backgroundColor: 'white',
    padding: '30px',
    borderRadius: '8px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
  } as React.CSSProperties,
  listSection: {
    backgroundColor: 'white',
    padding: '30px',
    borderRadius: '8px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
  } as React.CSSProperties,
  form: {
    marginTop: '20px',
  } as React.CSSProperties,
  formGroup: {
    marginBottom: '20px',
  } as React.CSSProperties,
  button: {
    width: '100%',
    padding: '12px',
    backgroundColor: '#28a745',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    fontSize: '1rem',
    fontWeight: 'bold',
    cursor: 'pointer',
  } as React.CSSProperties,
  error: {
    backgroundColor: '#f8d7da',
    color: '#721c24',
    padding: '12px',
    borderRadius: '4px',
    marginBottom: '20px',
  } as React.CSSProperties,
  success: {
    backgroundColor: '#d4edda',
    color: '#155724',
    padding: '12px',
    borderRadius: '4px',
    marginBottom: '20px',
  } as React.CSSProperties,
  showsList: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '15px',
  } as React.CSSProperties,
  showItem: {
    padding: '15px',
    backgroundColor: '#f8f9fa',
    borderRadius: '4px',
    borderLeft: '4px solid #007bff',
  } as React.CSSProperties,
};
