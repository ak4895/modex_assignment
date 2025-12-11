import React, { useState, useEffect } from 'react';

export interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
}

// Global toast state management
let toastListeners: ((toast: Toast) => void)[] = [];
let toastQueue: Toast[] = [];
let nextId = 0;

export const showToast = (message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info', duration = 4000) => {
  const toast: Toast = {
    id: `toast-${nextId++}`,
    message,
    type,
    duration
  };
  
  toastQueue.push(toast);
  toastListeners.forEach(listener => listener(toast));
  
  if (duration > 0) {
    setTimeout(() => {
      dismissToast(toast.id);
    }, duration);
  }
};

export const dismissToast = (id: string) => {
  toastQueue = toastQueue.filter(t => t.id !== id);
};

export const ToastContainer: React.FC = () => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    const handleNewToast = (toast: Toast) => {
      setToasts(prev => [...prev, toast]);
    };

    toastListeners.push(handleNewToast);

    return () => {
      toastListeners = toastListeners.filter(l => l !== handleNewToast);
    };
  }, []);

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
    dismissToast(id);
  };

  return (
    <div style={styles.container}>
      {toasts.map(toast => (
        <ToastItem 
          key={toast.id} 
          toast={toast} 
          onClose={() => removeToast(toast.id)}
        />
      ))}
    </div>
  );
};

interface ToastItemProps {
  toast: Toast;
  onClose: () => void;
}

const ToastItem: React.FC<ToastItemProps> = ({ toast, onClose }) => {
  const getIcon = (type: string) => {
    switch (type) {
      case 'success': return '✓';
      case 'error': return '✕';
      case 'warning': return '⚠';
      case 'info': return 'ℹ';
      default: return '•';
    }
  };

  const getColor = (type: string) => {
    switch (type) {
      case 'success': return '#4CAF50';
      case 'error': return '#f44336';
      case 'warning': return '#ff9800';
      case 'info': return '#2196F3';
      default: return '#333';
    }
  };

  return (
    <div style={{
      ...styles.toast,
      borderLeft: `4px solid ${getColor(toast.type)}`,
      backgroundColor: getColor(toast.type) + '15',
    }}>
      <span style={{...styles.icon, color: getColor(toast.type)}}>
        {getIcon(toast.type)}
      </span>
      <span style={styles.message}>{toast.message}</span>
      <button 
        onClick={onClose}
        style={styles.closeButton}
      >
        ✕
      </button>
    </div>
  );
};

const styles = {
  container: {
    position: 'fixed' as const,
    top: '20px',
    right: '20px',
    zIndex: 9999,
    maxWidth: '400px',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '10px',
    pointerEvents: 'none' as const,
  },
  toast: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '14px 16px',
    borderRadius: '6px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
    backgroundColor: '#fff',
    fontSize: '14px',
    fontWeight: '500',
    animation: 'slideIn 0.3s ease-out',
    pointerEvents: 'auto' as const,
  },
  icon: {
    fontSize: '18px',
    fontWeight: 'bold',
    flexShrink: 0,
  },
  message: {
    flex: 1,
    color: '#333',
  },
  closeButton: {
    background: 'none',
    border: 'none',
    color: '#999',
    cursor: 'pointer',
    fontSize: '16px',
    padding: '0',
    flexShrink: 0,
  },
};
