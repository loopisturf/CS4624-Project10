import React, { useState, useContext } from 'react';
import '../login/Login.css';
import './Signup.css'
import UserIcon from '../../components/UserIcon.js';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../components/security/AuthContext.js';

function SignUpPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
  
    const signUpData = { username, password };
  
    try {
      const response = await fetch('/api/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(signUpData),
      });
  
      const data = await response.json();
  
      if (response.ok) {
        login(data.user_id, data.username);  
        navigate('/collections');
      } else {
        setErrorMessage(data.error || 'Sign Up failed');
      }
    } catch (error) {
      setErrorMessage('An error occurred during sign up');
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-form">
          <h2 className='signup-header h2'>Sign Up</h2>
          <p className='login-header'>Create an account to start using our services.</p>
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
            <button className="login-button orange-button" onClick={handleSubmit}>Sign Up Now</button>
          </form>
          {errorMessage && <p className="error-message">{errorMessage}</p>}
          {successMessage && <p className="success-message">{successMessage}</p>}

         
          <a href="/login" className="login-link">Login</a>
        </div>

        <div className="signup-image">
          <img src="/images/signup.jpg" alt="VTTI Automated Shuttle" />
        </div>
      </div>
    </div>
  );
}

export default SignUpPage;
