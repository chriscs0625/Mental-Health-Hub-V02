import React, { useState } from 'react';

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div>
      <h2>Forgot Password</h2>
      {submitted ? (
        <p>If an account exists, a reset link has been sent.</p>
      ) : (
        <form onSubmit={handleSubmit}>
          <label>Email</label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} required />
          <button type="submit">Send Reset Link</button>
        </form>
      )}
    </div>
  );
};

export default ForgotPasswordPage;
