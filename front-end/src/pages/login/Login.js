import React, { useState, useContext } from 'react';
import './Login.css';
import UserIcon from '../../components/UserIcon.js';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../components/security/AuthContext.js';

function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const { login, logout } = useContext(AuthContext); // Correct extraction of `login` and `logout`
  const navigate = useNavigate();

  // Remove unnecessary `useEffect` hook
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Optional: Log out previous session before new login attempt
    logout();

    const loginData = { username, password };

    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginData),
      });

      const data = await response.json();

      if (response.ok) {
        // Use the API response data to set authentication context
        login(data.username, data.is_admin);

        // Redirect based on admin status
        if (data.is_admin) {
          navigate('/admin/dashboard');
        } else {
          navigate('/collections');
        }
      } else {
        setErrorMessage(data.message || 'Login failed');
      }
    } catch (error) {
      setErrorMessage('An error occurred during login');
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-form">
          <h2 className='login-header h2'>Login</h2>
          <p className='login-header'>To get started with adding data we need to verify your credentials.</p>
          <form className='form'>
            <div className="input-field">
              <UserIcon fillColor="black" strokeColor="black" className="username-icon" alt="user icon" />
              <input
                type="username"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
            <div className="input-field">
              <img src="/images/password-icon.svg" alt="Password" />
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <button className="login-button maroon-button" onClick={handleSubmit}>Login Now</button>
          </form>
          {errorMessage && <p className="error-message">{errorMessage}</p>}
        </div>

        <div className="login-image">
          <img src="/images/hokie-bird.png" alt="Hokie Bird" />
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
