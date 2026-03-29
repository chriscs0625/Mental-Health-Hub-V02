import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';

const ResetPasswordPage = () => {
  const [searchParams] = useSearchParams();
  const [isValidToken, setIsValidToken] = useState(false);
  const [password, setPassword] = useState('');
  const navigate = useNavigate();
  const token = searchParams.get('token');

  useEffect(() => {
    // Mount to check token first
    if (token && token.length > 10) {
      setIsValidToken(true);
    } else {
      setIsValidToken(false);
    }
  }, [token]);

  const handleSubmit = (e) => {
    e.preventDefault();
    alert('Password reset successfully!');
    navigate('/login');
  };

  if (!isValidToken) return <div>Invalid or expired token.</div>;

  return (
    <div>
      <h2>Reset Password</h2>
      <form onSubmit={handleSubmit}>
        <label>New Password</label>
        <input type="password" value={password} onChange={e => setPassword(e.target.value)} required />
        <button type="submit">Reset Password</button>
      </form>
    </div>
  );
};

export default ResetPasswordPage;
