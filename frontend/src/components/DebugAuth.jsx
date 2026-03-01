import { useAuthStore } from '../stores/authStore';

export default function DebugAuth() {
  const { user } = useAuthStore();
  const token = localStorage.getItem('access_token');

  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      background: 'white',
      padding: '15px',
      border: '2px solid #3b82f6',
      borderRadius: '8px',
      boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
      zIndex: 9999,
      maxWidth: '300px',
      fontSize: '12px'
    }}>
      <h3 style={{ margin: '0 0 10px 0', fontSize: '14px', fontWeight: 'bold' }}>
        🔍 Auth Debug Info
      </h3>
      <div style={{ marginBottom: '8px' }}>
        <strong>User:</strong> {user?.username || 'Not logged in'}
      </div>
      <div style={{ marginBottom: '8px' }}>
        <strong>Role:</strong> {user?.role || 'N/A'}
      </div>
      <div style={{ marginBottom: '8px' }}>
        <strong>Token:</strong> {token ? '✅ Present' : '❌ Missing'}
      </div>
      <div style={{ marginBottom: '8px' }}>
        <strong>Token Length:</strong> {token?.length || 0}
      </div>
    </div>
  );
}
