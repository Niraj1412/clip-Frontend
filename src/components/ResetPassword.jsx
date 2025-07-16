import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLock, faSpinner, faCheck, faExclamationCircle } from '@fortawesome/free-solid-svg-icons';
import authService from '../services/authService';

const ResetPassword = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const query = new URLSearchParams(location.search);
  const token = query.get('token');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setIsLoading(true);
    setError('');
    setMessage('');

    try {
      await authService.resetPassword(token, password);
      setMessage('Password reset successfully. Redirecting to sign in...');
      setTimeout(() => navigate('/signin'), 3000);
    } catch (err) {
      setError(err.message || 'An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center bg-[#0f0f1a] text-white">
        Invalid reset link
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen flex items-center justify-center bg-[#0f0f1a]">
      <motion.div
        className="w-full max-w-md mx-4 bg-[#1a1a2e]/70 backdrop-blur-lg rounded-2xl shadow-xl border border-[#ffffff0f] p-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h2 className="text-2xl font-bold text-white mb-6 text-center">Reset Password</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-5">
            <label htmlFor="password" className="block text-gray-300 text-sm font-medium mb-2 ml-1">
              New Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FontAwesomeIcon icon={faLock} className="text-gray-400" />
              </div>
              <input
                type="password"
                id="password"
                className="w-full pl-10 pr-4 py-3 bg-[#ffffff0a] border border-[#ffffff1a] rounded-lg focus:outline-none focus:border-[#6c5ce7] text-white"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>
          <div className="mb-5">
            <label htmlFor="confirmPassword" className="block text-gray-300 text-sm font-medium mb-2 ml-1">
              Confirm Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FontAwesomeIcon icon={faLock} className="text-gray-400" />
              </div>
              <input
                type="password"
                id="confirmPassword"
                className="w-full pl-10 pr-4 py-3 bg-[#ffffff0a] border border-[#ffffff1a] rounded-lg focus:outline-none focus:border-[#6c5ce7] text-white"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
          </div>
          <motion.button
            type="submit"
            className="w-full bg-gradient-to-r from-[#6c5ce7] to-[#a29bfe] text-white font-medium py-3 px-4 rounded-lg flex items-center justify-center disabled:opacity-70"
            disabled={isLoading}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {isLoading ? (
              <>
                <FontAwesomeIcon icon={faSpinner} className="animate-spin mr-2" />
                Resetting...
              </>
            ) : (
              'Reset Password'
            )}
          </motion.button>
        </form>
        {message && (
          <div className="mt-4 bg-green-500/20 border border-green-500/30 text-green-300 px-4 py-2 rounded-lg flex items-center gap-2">
            <FontAwesomeIcon icon={faCheck} />
            {message}
          </div>
        )}
        {error && (
          <div className="mt-4 bg-red-500/20 border border-red-500/30 text-red-300 px-4 py-2 rounded-lg flex items-center gap-2">
            <FontAwesomeIcon icon={faExclamationCircle} />
            {error}
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default ResetPassword;