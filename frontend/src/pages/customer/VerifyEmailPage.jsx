import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const VerifyEmailPage = () => {
  const [code, setCode] = useState(new Array(6).fill(''));
  const [countdown, setCountdown] = useState(60);
  const navigate = useNavigate();

  useEffect(() => {
    const timer = countdown > 0 && setInterval(() => setCountdown(countdown - 1), 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  const handleChange = (element, index) => {
    if (isNaN(element.value)) return false;
    setCode([...code.map((d, idx) => (idx === index ? element.value : d))]);
    if (element.nextSibling) element.nextSibling.focus();
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData('text').slice(0, 6).split('');
    if (pasteData.length > 0) {
      setCode([...code.map((d, idx) => pasteData[idx] || '')]);
    }
  };

  const handleVerify = (e) => {
    e.preventDefault();
    // Dummy verification
    navigate('/');
  };

  return (
    <div>
      <h2>Verify Email</h2>
      <p>Enter the 6-digit code sent to your email.</p>
      <form onSubmit={handleVerify}>
        <div onPaste={handlePaste} style={{ display: 'flex', gap: '5px' }}>
          {code.map((data, index) => (
            <input
              className="code-input"
              type="text"
              name="code"
              maxLength="1"
              key={index}
              value={data}
              onChange={e => handleChange(e.target, index)}
              onFocus={e => e.target.select()}
            />
          ))}
        </div>
        <div style={{ marginTop: '10px' }}>
          <button type="submit">Verify</button>
        </div>
      </form>
      <p>Resend code in: {countdown}s</p>
    </div>
  );
};

export default VerifyEmailPage;
