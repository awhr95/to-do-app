import { useState } from 'react';
import { FiMail, FiLock, FiUser, FiLogIn, FiUserPlus } from 'react-icons/fi';
import { login, signup, setToken } from '../utils/api';
import '../styles/Auth.css';

export default function AuthForms({ onLogin }) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = isLogin
        ? await login(email, password)
        : await signup(email, password, name);

      setToken(data.token);
      onLogin(data.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1>DoNext</h1>
        <h2>{isLogin ? 'Login' : 'Sign Up'}</h2>

        <form onSubmit={handleSubmit} className="auth-form">
          {!isLogin && (
            <div className="auth-input-group">
              <FiUser className="auth-input-icon" size={18} />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Name"
                className="auth-input"
              />
            </div>
          )}
          <div className="auth-input-group">
            <FiMail className="auth-input-icon" size={18} />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              className="auth-input"
              required
            />
          </div>
          <div className="auth-input-group">
            <FiLock className="auth-input-icon" size={18} />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="auth-input"
              required
              minLength={6}
            />
          </div>

          {error && <p className="auth-error">{error}</p>}

          <button type="submit" className="auth-submit icon-btn" disabled={loading}>
            {loading ? (
              'Please wait...'
            ) : isLogin ? (
              <><FiLogIn size={18} /> Login</>
            ) : (
              <><FiUserPlus size={18} /> Sign Up</>
            )}
          </button>
        </form>

        <p className="auth-switch">
          {isLogin ? "Don't have an account? " : 'Already have an account? '}
          <button
            onClick={() => { setIsLogin(!isLogin); setError(''); }}
            className="auth-switch-btn"
          >
            {isLogin ? 'Sign Up' : 'Login'}
          </button>
        </p>
      </div>
    </div>
  );
}
