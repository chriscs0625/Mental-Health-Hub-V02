import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import api from '../../../services/api';
import toast from 'react-hot-toast';

const VerifyEmailPage = () => {
  const [otp, setOtp] = useState(new Array(6).fill(""));
  const [countdown, setCountdown] = useState(60);
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const inputRefs = useRef([]);
  
  // Passed from SignupPage router state e.g., navigate('/verify-email', { state: { userId } })
  const userId = location.state?.userId; 
  
  useEffect(() => {
    if (!userId) {
      toast.error("User context missing, please sign up again.");
      navigate('/signup');
    }
  }, [userId, navigate]);

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => setCountdown(prev => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  const handleChange = (element, index) => {
    if (isNaN(element.value)) return false;
    
    setOtp([...otp.map((d, idx) => (index === idx ? element.value : d))]);
    
    // Focus next input automatically
    if (element.value && element.nextSibling) {
      element.nextSibling.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text/plain").slice(0, 6).split("");
    if (pastedData.length > 0) {
      const newOtp = [...otp];
      let lastIndex = 0;
      pastedData.forEach((char, index) => {
        if (!isNaN(char) && index < 6) {
          newOtp[index] = char;
          lastIndex = index;
        }
      });
      setOtp(newOtp);
      if (inputRefs.current[lastIndex] && inputRefs.current[lastIndex].nextSibling) {
         inputRefs.current[lastIndex].nextSibling.focus();
      } else if (lastIndex === 5 && inputRefs.current[5]) {
         inputRefs.current[5].focus();
      }
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === "Backspace" && !otp[index] && inputRefs.current[index - 1]) {
      inputRefs.current[index - 1].focus();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const code = otp.join("");
    if (code.length < 6) return toast.error("Please enter the 6-digit code.");
    
    try {
      setLoading(true);
      const { data } = await api.post('/auth/verify-email', { userId, code });
      
      // Get the full user object since the verify endpoint just sends back a token
      // Temporarily log them in to fetch the user profile
      localStorage.setItem('token', data.token);
      const userRes = await api.get('/auth/me', { headers: { Authorization: `Bearer ${data.token}` }});
      
      login(data.token, userRes.data.user); 
      toast.success("Email verified successfully!");
      
      const redirectPath = location.state?.redirect || '/dashboard';
      navigate(redirectPath);
      
    } catch (err) {
      toast.error(err.response?.data?.message || "Verification failed");
      setOtp(new Array(6).fill(""));
      inputRefs.current[0].focus();
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    try {
      setCountdown(60);
      await api.post('/auth/resend-otp', { userId });
      toast.success("Verification code resent.");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to resend code.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-lg border border-gray-100">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">Verify your email</h2>
          <p className="mt-2 text-sm text-gray-600">
            We sent a 6-digit code. Enter it below to confirm your account.
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="flex justify-center gap-3">
            {otp.map((data, index) => (
              <input
                key={index}
                type="text"
                maxLength="1"
                ref={(el) => (inputRefs.current[index] = el)}
                className="w-12 h-14 text-center text-2xl font-semibold border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                value={data}
                onChange={(e) => handleChange(e.target, index)}
                onKeyDown={(e) => handleKeyDown(e, index)}
                onPaste={handlePaste}
                disabled={loading}
              />
            ))}
          </div>
          
          <div>
            <button
              type="submit"
              disabled={loading || otp.join("").length < 6}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-all"
            >
              {loading ? "Verifying..." : "Verify Email"}
            </button>
          </div>
        </form>
        
        <div className="text-center text-sm text-gray-600 mt-6">
          {countdown > 0 ? (
            <p className="font-medium">Resend code in <span className="text-blue-600">{countdown}s</span></p>
          ) : (
            <button 
              onClick={handleResend}
              className="font-medium text-blue-600 hover:text-blue-500 hover:underline"
              disabled={loading}
            >
              Resend Verification Code
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default VerifyEmailPage;
