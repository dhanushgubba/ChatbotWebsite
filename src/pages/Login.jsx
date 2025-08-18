import React, { useState } from 'react';
import { useSignInEmailPassword } from '@nhost/react';
import { useNavigate } from 'react-router-dom';
import './Login.css';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { signInEmailPassword, isLoading, isError, error } =
    useSignInEmailPassword();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    const result = await signInEmailPassword(email, password);
    if (result.isSuccess) {
      navigate('/chats'); // redirect to chats page after login
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <h2 className="login-title">Welcome Back</h2>
          <p className="login-subtitle">Sign in to your account</p>
        </div>

        <form onSubmit={handleLogin} className="login-form">
          <div className="input-group">
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="login-input"
            />
          </div>

          <div className="input-group">
            <input
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="login-input"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className={`login-button ${isLoading ? 'loading' : ''}`}
          >
            {isLoading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>

        {isError && (
          <div className="error-message">
            <span className="error-icon">⚠️</span>
            {error?.message || 'Something went wrong. Please try again.'}
          </div>
        )}

        <div className="login-footer">
          <p>
            Don't have an account?
            <button onClick={() => navigate('/signup')} className="link-button">
              Sign up
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
