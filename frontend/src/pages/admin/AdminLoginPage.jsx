import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import toast from 'react-hot-toast';

const AdminLoginPage = () => {
  const [step, setStep] = useState(1); // 1 = credentials, 2 = pin
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [pin, setPin] = useState('');
  const [tempToken, setTempToken] = useState(null);
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleStep1 = async (e) => {
    e.preventDefault();
    try {
      const { data } = await api.post('/admin/auth/login', { email, password });
      setTempToken(data.tempToken);
      setStep(2);
      toast.success('Credentials verified. Enter PIN.');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Login failed');
    }
  };

  const handleStep2 = async (e) => {
    e.preventDefault();
    try {
      const { data } = await api.post('/admin/auth/verify-pin', {
        tempToken,
        pin,
      });
      
      // Store token and redirect
      login(data.token, { role: 'admin' });
      toast.success('Welcome back, Admin.');
      navigate('/admin/dashboard');
      
    } catch (error) {
      if (error.response?.data?.attemptsRemaining !== undefined) {
         toast.error(`Wrong PIN. ${error.response.data.attemptsRemaining} attempts left.`);
      } else {
         toast.error(error.response?.data?.message || 'PIN verification failed');
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white px-4">
      <div className="max-w-md w-full space-y-8 bg-gray-800 p-8 rounded-xl shadow-lg border border-gray-700">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold pb-4">
            {step === 1 ? 'Admin Portal Login' : 'Enter Security PIN'}
          </h2>
        </div>
        
        {step === 1 ? (
          <form className="mt-8 space-y-6" onSubmit={handleStep1}>
            <div className="rounded-md shadow-sm space-y-4">
              <div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none rounded relative block w-full px-3 py-2 border border-gray-600 bg-gray-700 placeholder-gray-400 text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                  placeholder="Admin Email Address"
                />
              </div>
              <div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none rounded relative block w-full px-3 py-2 border border-gray-600 bg-gray-700 placeholder-gray-400 text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                  placeholder="Password"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none"
              >
                Continue
              </button>
            </div>
          </form>
        ) : (
          <form className="mt-8 space-y-6" onSubmit={handleStep2}>
            <div className="rounded-md shadow-sm space-y-4">
              <div>
                <input
                  type="password"
                  required
                  value={pin}
                  maxLength="6"
                  pattern="\d{6}"
                  onChange={(e) => setPin(e.target.value)}
                  className="appearance-none rounded relative block w-full px-3 py-2 border border-gray-600 bg-gray-700 placeholder-gray-400 text-white text-center tracking-widest text-2xl focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                  placeholder="• • • • • •"
                />
                <p className="text-xs text-gray-400 mt-2 text-center">6-digit security PIN</p>
              </div>
            </div>

            <div>
              <button
                type="submit"
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none"
              >
                Verify & Login
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default AdminLoginPage;
