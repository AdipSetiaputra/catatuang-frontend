import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * Handles the Google OAuth callback.
 * Extracts token from query param and logs user in.
 */
export default function AuthCallbackPage() {
  const { loginWithToken } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const token = searchParams.get('token');
    const error = searchParams.get('error');

    if (error) {
      navigate('/login?error=' + error);
      return;
    }

    if (token) {
      loginWithToken(token)
        .then(() => navigate('/'))
        .catch(() => navigate('/login?error=token_invalid'));
    } else {
      navigate('/login');
    }
  }, []);

  return (
    <div className="auth-page">
      <div className="auth-container" style={{ textAlign: 'center' }}>
        <div className="auth-logo">
          <h1>CatatUang</h1>
        </div>
        <div className="loading-dots">
          <span /><span /><span />
        </div>
        <p style={{ color: 'var(--text-muted)', marginTop: '12px' }}>
          Memproses login...
        </p>
      </div>
    </div>
  );
}
