import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const SignupPage = () => {
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleSignup = (e) => {
    e.preventDefault();
    // Dummy signup logic
    navigate('/verify-email');
  };

  const getPasswordStrength = (pass) => {
    if (pass.length === 0) return '';
    if (pass.length < 6) return 'Weak';
    if (pass.match(/[A-Z]/) && pass.match(/[0-9]/)) return 'Strong';
    return 'Medium';
  };

  return (
    <div className="signup-container">
      <h2>Create an Account</h2>
      <form onSubmit={handleSignup}>
        <div>
          <label>Name</label>
          <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
        </div>
        <div>
          <label>Email</label>
          <input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} required />
        </div>
        <div>
          <label>Password</label>
          <div style={{display: 'flex'}}>
            <input 
              type={showPassword ? 'text' : 'password'} 
              value={formData.password} 
              onChange={e => setFormData({...formData, password: e.target.value})} 
              required 
            />
            <button type="button" onClick={() => setShowPassword(!showPassword)}>
              {showPassword ? 'Hide' : 'Show'}
            </button>
          </div>
          <small>Strength: {getPasswordStrength(formData.password)}</small>
        </div>
        <button type="submit">Sign Up</button>
      </form>
      <p>Already have an account? <Link to="/login">Login</Link></p>
    </div>
  );
};

export default SignupPage;
