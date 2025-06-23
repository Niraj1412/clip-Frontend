import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faUser, 
  faEnvelope, 
  faLock, 
  faRightToBracket,
  faArrowLeft,
  faExclamationCircle,
  faExclamationTriangle,
  faWifi,
  faSpinner,
  faDatabase,
  faCloud,
  faInfoCircle,
  faCheck
} from '@fortawesome/free-solid-svg-icons';
import {
  faGithub,
  faTwitter
} from '@fortawesome/free-brands-svg-icons';
import authService from '../services/authService';

const SignInPage = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [serverStatus, setServerStatus] = useState('checking'); // 'checking', 'online', 'offline'
  const [showDemoModal, setShowDemoModal] = useState(false);
  const [formErrors, setFormErrors] = useState({ email: '', password: '' });
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (authService.isAuthenticated()) {
      navigate('/dashboard');
      return;
    }

    // Check if there's a redirect message in the URL
    const params = new URLSearchParams(window.location.search);
    const fromSignup = params.get('fromSignup');
    if (fromSignup === 'success') {
      setSuccess('Account created successfully! Please sign in to continue.');
    }

    // Check server status
    checkServerStatus();

    // Initialize GIS
    if (window.google && window.google.accounts) {
      window.google.accounts.id.initialize({
        client_id: process.env.REACT_APP_GOOGLE_CLIENT_ID,
        callback: handleCredentialResponse,
      });

      window.google.accounts.id.renderButton(
        document.getElementById('google-signin-button'),
        {
          theme: 'outline',
          size: 'large',
        }
      );
    } else {
      console.error('Google API not loaded');
      setError('Google API failed to load. Please try again later.');
    }
  }, [navigate]);

  const checkServerStatus = async () => {
    setServerStatus('checking');
    try {
      await fetch(`${authService.getBaseUrl()}/api/v1/health/ping`, { 
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
        cache: 'no-cache',
        timeout: 5000 
      });
      setServerStatus('online');
    } catch (error) {
      console.log('Server appears to be offline:', error);
      setServerStatus('offline');
      
      const authError = localStorage.getItem('authErrorType');
      if (authError === 'network') {
        setShowDemoModal(true);
      }
    }
  };

  const validateForm = () => {
    let valid = true;
    const errors = { email: '', password: '' };
    
    if (!email) {
      errors.email = 'Email is required';
      valid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = 'Invalid email format';
      valid = false;
    }
    
    if (!password) {
      errors.password = 'Password is required';
      valid = false;
    }
    
    setFormErrors(errors);
    return valid;
  };

  const handleSignIn = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setError('');
    setIsLoading(true);
    
    try {
      await authService.login(email, password);
      setIsLoading(false);
      
      const params = new URLSearchParams(window.location.search);
      const redirectPath = params.get('redirect') || localStorage.getItem('redirectAfterLogin');
      
      if (redirectPath) {
        localStorage.removeItem('redirectAfterLogin');
        navigate(redirectPath);
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      setIsLoading(false);
      setError(err.message || 'Login failed. Please check your credentials.');
      
      if (err.message.includes('Server not found') || err.message.includes('Network Error')) {
        setShowDemoModal(true);
      }
    }
  };

  const handleDemoMode = () => {
    const demoUser = authService.activateDemoMode();
    setShowDemoModal(false);
    navigate('/dashboard');
  };

  const handleCredentialResponse = (response) => {
    const idToken = response.credential;
    authService.loginWithGoogle({ token: idToken })
      .then(() => {
        navigate('/dashboard');
      })
      .catch((err) => {
        console.error('Google login failed:', err);
        setError('Google login failed. Please try again.');
      });
  };

  const handleSocialLogin = async (provider) => {
    setError('');
    setIsLoading(true);

    try {
      switch (provider) {
        case 'GitHub':
          const githubClientId = process.env.REACT_APP_GITHUB_CLIENT_ID;
          if (!githubClientId) {
            throw new Error('GitHub authentication is not configured.');
          }
          const githubRedirectUri = `${window.location.origin}/auth/github/callback`;
          const githubScope = 'user:email';
          window.location.href = `https://github.com/login/oauth/authorize?client_id=${githubClientId}&redirect_uri=${githubRedirectUri}&scope=${githubScope}`;
          return;

        case 'Twitter':
          const twitterClientId = process.env.REACT_APP_TWITTER_CLIENT_ID;
          if (!twitterClientId) {
            throw new Error('Twitter authentication is not configured.');
          }
          const twitterRedirectUri = `${window.location.origin}/auth/twitter/callback`;
          window.location.href = `https://api.twitter.com/oauth/authenticate?oauth_token=${twitterClientId}&redirect_uri=${twitterRedirectUri}`;
          return;

        default:
          throw new Error(`Unsupported provider: ${provider}`);
      }
    } catch (err) {
      console.error(`${provider} login error:`, err);
      setError(err.message || `${provider} login failed. Please try again.`);
      setIsLoading(false);
    }
  };

  const handleForgotPassword = () => navigate('/forgot-password');

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        duration: 0.5,
        staggerChildren: 0.1 
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { 
      y: 0, 
      opacity: 1,
      transition: { duration: 0.5 }
    }
  };

  return (
    <div className="w-full min-h-screen flex items-center justify-center bg-[#0f0f1a] overflow-hidden">
      <div className="fixed top-6 right-6 z-50">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`px-4 py-2 rounded-full flex items-center gap-2 text-sm backdrop-blur-md shadow-lg ${
            serverStatus === 'checking' ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30' :
            serverStatus === 'online' ? 'bg-green-500/20 text-green-300 border border-green-500/30' :
            'bg-red-500/20 text-red-300 border border-red-500/30'
          }`}
        >
          <FontAwesomeIcon 
            icon={serverStatus === 'checking' ? faSpinner : faWifi}
            className={`${
              serverStatus === 'checking' ? 'animate-spin' : 
              serverStatus === 'offline' ? 'opacity-50' : ''
            }`}
          />
          <span>
            {serverStatus === 'checking' ? 'Checking Connection...' :
             serverStatus === 'online' ? 'Server Online' :
             'Server Offline'}
          </span>
        </motion.div>
      </div>

      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0f0f1a] via-[#1a1a2e] to-[#0f0f1a]" />
        {[...Array(3)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full bg-gradient-to-br from-[#6c5ce7]/10 to-[#a29bfe]/10"
            initial={{ 
              width: Math.random() * 300 + 100,
              height: Math.random() * 300 + 100,
              x: Math.random() * window.innerWidth,
              y: Math.random() * window.innerHeight,
              opacity: 0.1
            }}
            animate={{
              x: Math.random() * window.innerWidth,
              y: Math.random() * window.innerHeight,
              opacity: [0.1, 0.2, 0.1],
              scale: [1, 1.2, 1]
            }}
            transition={{
              duration: Math.random() * 10 + 10,
              repeat: Infinity,
              repeatType: "reverse",
              ease: "easeInOut"
            }}
          />
        ))}
        <div className="absolute inset-0" style={{
          backgroundImage: 'linear-gradient(rgba(108, 92, 231, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(108, 92, 231, 0.05) 1px, transparent 1px)',
          backgroundSize: '50px 50px'
        }} />
      </div>

      <motion.div 
        className="fixed top-6 left-6 z-50"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Link 
          to="/"
          className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors px-3 py-2 rounded-lg hover:bg-white/5"
        >
          <FontAwesomeIcon icon={faArrowLeft} />
          <span>Back to Home</span>
        </Link>
      </motion.div>

      <motion.div 
        className="relative w-full max-w-md mx-4 z-10"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div 
          className="bg-[#1a1a2e]/70 backdrop-blur-lg rounded-2xl shadow-xl border border-[#ffffff0f] overflow-hidden"
          variants={itemVariants}
        >
          <div className="relative px-8 pt-10 pb-6 text-center">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#6c5ce7] to-[#a29bfe]"></div>
            <motion.div
              className="inline-flex items-center justify-center w-16 h-16 mb-4 rounded-full bg-[#6c5ce7]/10 border border-[#6c5ce7]/20"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, type: "spring" }}
            >
              <FontAwesomeIcon icon={faRightToBracket} className="text-[#a29bfe] text-2xl" />
            </motion.div>
            <h1 className="text-2xl font-bold text-white mb-2">Welcome Back</h1>
            <p className="text-gray-400 text-sm max-w-xs mx-auto">
              Sign in to your account to continue your video creation journey
            </p>
          </div>
          
          <AnimatePresence>
            {success && (
              <motion.div 
                className="bg-green-500/20 border border-green-500/30 text-green-300 px-6 py-3 mx-6 mb-6 rounded-lg flex items-start gap-3"
                initial={{ opacity: 0, y: -10, height: 0 }}
                animate={{ opacity: 1, y: 0, height: 'auto' }}
                exit={{ opacity: 0, y: -10, height: 0 }}
              >
                <FontAwesomeIcon icon={faCheck} className="mt-1" />
                <p className="text-sm">{success}</p>
              </motion.div>
            )}
          </AnimatePresence>
          
          <AnimatePresence>
            {error && (
              <motion.div 
                className="bg-red-500/20 border border-red-500/30 text-red-300 px-6 py-3 mx-6 mb-6 rounded-lg flex items-start gap-3"
                initial={{ opacity: 0, y: -10, height: 0 }}
                animate={{ opacity: 1, y: 0, height: 'auto' }}
                exit={{ opacity: 0, y: -10, height: 0 }}
              >
                <FontAwesomeIcon icon={faExclamationCircle} className="mt-1" />
                <p className="text-sm">{error}</p>
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleSignIn} className="px-8 pb-8">
            <div className="mb-5">
              <label 
                htmlFor="email" 
                className="block text-gray-300 text-sm font-medium mb-2 ml-1"
              >
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FontAwesomeIcon icon={faEnvelope} className="text-gray-400" />
                </div>
                <input
                  type="email"
                  id="email"
                  className={`w-full pl-10 pr-4 py-3 bg-[#ffffff0a] border ${formErrors.email ? 'border-red-500/50' : 'border-[#ffffff1a]'} rounded-lg focus:outline-none focus:border-[#6c5ce7] text-white text-base transition-colors`}
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              {formErrors.email && (
                <p className="mt-1 text-sm text-red-400 flex items-center gap-1 ml-1">
                  <FontAwesomeIcon icon={faExclamationTriangle} className="text-xs" />
                  {formErrors.email}
                </p>
              )}
            </div>
            
            <div className="mb-5">
              <label 
                htmlFor="password" 
                className="block text-gray-300 text-sm font-medium mb-2 ml-1"
              >
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FontAwesomeIcon icon={faLock} className="text-gray-400" />
                </div>
                <input
                  type="password"
                  id="password"
                  className={`w-full pl-10 pr-4 py-3 bg-[#ffffff0a] border ${formErrors.password ? 'border-red-500/50' : 'border-[#ffffff1a]'} rounded-lg focus:outline-none focus:border-[#6c5ce7] text-white text-base transition-colors`}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              {formErrors.password && (
                <p className="mt-1 text-sm text-red-400 flex items-center gap-1 ml-1">
                  <FontAwesomeIcon icon={faExclamationTriangle} className="text-xs" />
                  {formErrors.password}
                </p>
              )}
            </div>
            
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  type="checkbox"
                  className="h-4 w-4 rounded border-gray-300 text-[#6c5ce7] focus:ring-[#6c5ce7]"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-300">
                  Remember me
                </label>
              </div>
              <div className="text-sm">
                <a 
                  href="/forgot-password" 
                  onClick={(e) => {
                    e.preventDefault();
                    handleForgotPassword();
                  }}
                  className="text-[#a29bfe] hover:text-[#6c5ce7] transition-colors"
                >
                  Forgot password?
                </a>
              </div>
            </div>
            
            <motion.button
              type="submit"
              className="w-full bg-gradient-to-r from-[#6c5ce7] to-[#a29bfe] text-white font-medium py-3 px-4 rounded-lg flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed relative overflow-hidden group"
              disabled={isLoading}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <motion.div 
                className="absolute inset-0 bg-white/20"
                initial={{ x: '-100%' }}
                animate={{ x: '200%' }}
                transition={{ repeat: Infinity, duration: 2, ease: 'linear', repeatDelay: 1 }}
                style={{ width: '50%' }}
              />
              {isLoading ? (
                <>
                  <FontAwesomeIcon icon={faSpinner} className="animate-spin mr-2" />
                  <span>Signing In...</span>
                </>
              ) : (
                <span className="relative z-10">Sign In</span>
              )}
            </motion.button>
            
            <div className="mt-8 text-center">
              <p className="text-gray-400 text-sm mb-4">Or sign in with</p>
              <div className="flex justify-center space-x-4">
                <div id="google-signin-button" className="flex items-center justify-center"></div>
                <motion.button
                  type="button"
                  onClick={() => handleSocialLogin('GitHub')}
                  className="bg-[#ffffff0a] hover:bg-[#ffffff15] border border-[#ffffff1a] p-3 rounded-lg text-white transition-colors"
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  disabled={isLoading}
                >
                  <FontAwesomeIcon icon={faGithub} className="text-lg" />
                </motion.button>
                <motion.button
                  type="button"
                  onClick={() => handleSocialLogin('Twitter')}
                  className="bg-[#ffffff0a] hover:bg-[#ffffff15] border border-[#ffffff1a] p-3 rounded-lg text-white transition-colors"
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  disabled={isLoading}
                >
                  <FontAwesomeIcon icon={faTwitter} className="text-lg" />
                </motion.button>
              </div>
            </div>
          </form>
        </motion.div>
        
        <motion.div 
          className="mt-6 text-center"
          variants={itemVariants}
        >
          <p className="text-gray-400">
            Don't have an account?{' '}
            <Link 
              to="/signup" 
              className="text-[#a29bfe] hover:text-[#6c5ce7] transition-colors font-medium"
            >
              Sign up now
            </Link>
          </p>
        </motion.div>
      </motion.div>
      
      <AnimatePresence>
        {showDemoModal && (
          <motion.div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-[#1a1a2e] border border-[#ffffff1a] rounded-xl shadow-xl w-full max-w-md overflow-hidden"
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
            >
              <div className="p-6">
                <div className="flex items-center justify-center w-16 h-16 mx-auto mb-6 rounded-full bg-[#6c5ce7]/20">
                  <FontAwesomeIcon icon={faDatabase} className="text-[#a29bfe] text-2xl" />
                </div>
                <h3 className="text-xl font-bold text-white text-center mb-2">Server Connection Issue</h3>
                <p className="text-gray-300 text-center mb-6">
                  We couldn't connect to our servers. Would you like to use Demo Mode to explore the app without an account?
                </p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <motion.button
                    className="flex-1 py-3 px-4 bg-[#ffffff0a] hover:bg-[#ffffff15] rounded-lg text-white border border-[#ffffff1a] transition-colors"
                    onClick={() => setShowDemoModal(false)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Cancel
                  </motion.button>
                  <motion.button
                    className="flex-1 py-3 px-4 bg-gradient-to-r from-[#6c5ce7] to-[#a29bfe] rounded-lg text-white font-medium transition-all"
                    onClick={handleDemoMode}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Use Demo Mode
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SignInPage;