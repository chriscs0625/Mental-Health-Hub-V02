import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const LoginPage = () => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [failedAttempts, setFailedAttempts] = useState(0);
  const { login } = useAuth();
  const navigate = useNavigate();

  const isEmail = identifier.includes('@');
  const icon = isEmail ? '📧' : (identifier ? '📱' : '👤');

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      // Dummy logic
      if (password !== 'password') throw new Error('Invalid credentials');
      await login({ email: identifier, role: 'customer' });
      navigate('/');
    } catch (err) {
      setFailedAttempts(prev => prev + 1);
    }
  };

  return (
    <div>
      <h2>Login</h2>
      {failedAttempts >= 5 && (
        <div className="mock-recaptcha" style={{ padding: '10px', border: '1px solid gray' }}>
          <label><input type="checkbox" required /> I am not a robot</label>
        </div>
      )}
      <form onSubmit={handleLogin}>
        <div>
          <label>Email or Phone {icon}</label>
          <input type="text" value={identifier} onChange={e => setIdentifier(e.target.value)} required />
        </div>
        <div>
          <label>Password</label>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} required />
        </div>
        <button type="submit">Login</button>
      </form>
      <p><Link to="/forgot-password">Forgot Password?</Link></p>
      <p>Don't have an account? <Link to="/signup">Sign Up</Link></p>
    </div>
  );
};

export default LoginPage;
