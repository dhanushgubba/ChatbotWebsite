import React, { useState } from 'react';
import { useSignUpEmailPassword } from '@nhost/react';
import { useNavigate } from 'react-router-dom';
import './SignUp.css';

const SignUp = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { signUpEmailPassword, isLoading, isError, error } =
    useSignUpEmailPassword();
  const navigate = useNavigate();

  const handleSignup = async (e) => {
    e.preventDefault();
    const result = await signUpEmailPassword(email, password);
    if (result.isSuccess) {
      navigate('/');
    }
  };

  return (
    <div className="signup-container">
      <div className="signup-card">
        <div className="signup-header">
          <h2 className="signup-title">Create Account</h2>
          <p className="signup-subtitle">Join us and start your journey</p>
        </div>

        <form onSubmit={handleSignup} className="signup-form">
          <div className="input-group">
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="signup-input"
            />
          </div>

          <div className="input-group">
            <input
              type="password"
              placeholder="Create a password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="signup-input"
              minLength="6"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className={`signup-button ${isLoading ? 'loading' : ''}`}
          >
            {isLoading ? 'Creating Account...' : 'Sign Up'}
          </button>
        </form>

        {isError && (
          <div className="error-message">
            <span className="error-icon">⚠️</span>
            {error?.message || 'Something went wrong. Please try again.'}
          </div>
        )}

        <div className="signup-footer">
          <p>
            Already have an account?
            <button onClick={() => navigate('/')} className="link-button">
              Sign in
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignUp;
