import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faUserPlus, 
  faEnvelope, 
  faLock,
  faUser,
  faArrowLeft,
  faExclamationCircle,
  faCheckCircle,
  faSpinner,
  faCheck
} from '@fortawesome/free-solid-svg-icons';
import {
  faGoogle,
  faGithub,
  faTwitter
} from '@fortawesome/free-brands-svg-icons';
import authService from '../services/authService';

const SignUpPage = () => {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [formErrors, setFormErrors] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    terms: ''
  });

  // Navigation handlers for terms and privacy
  const handleTerms = () => navigate('/terms');
  const handlePrivacy = () => navigate('/privacy');

  // Check if user is already logged in
  useEffect(() => {
    if (authService.isAuthenticated()) {
      navigate('/dashboard');
    }
  }, [navigate]);

  const validateForm = () => {
    // Reset error state
    let isValid = true;
    const errors = {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      terms: ''
    };

    // Validate name
    if (!name.trim()) {
      errors.name = 'Name is required';
      isValid = false;
    } else if (name.trim().length < 3) {
      errors.name = 'Name must be at least 3 characters';
      isValid = false;
    }

    // Validate email with regex
    if (!email) {
      errors.email = 'Email is required';
      isValid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = 'Please enter a valid email address';
      isValid = false;
    }

    // Validate password
    if (!password) {
      errors.password = 'Password is required';
      isValid = false;
    } else if (password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
      isValid = false;
    }

    // Validate password match
    if (!confirmPassword) {
      errors.confirmPassword = 'Please confirm your password';
      isValid = false;
    } else if (password !== confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
      isValid = false;
    }

    // Check terms agreement
    if (!agreedToTerms) {
      errors.terms = 'You must agree to the Terms of Service';
      isValid = false;
    }

    setFormErrors(errors);
    return isValid;
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    
    // Clear previous error/success
    setError('');
    setSuccess('');
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    
    try {
      // Call the register method from our auth service
      const response = await authService.register(name, email, password);
      
      if (response.status) {
        setSuccess('Account created successfully!');
        
        // Check if there's a redirect parameter in the URL
        const params = new URLSearchParams(window.location.search);
        const redirectPath = params.get('redirect');
        
        // If auto-login is desired, log the user in immediately
        try {
          await authService.login(email, password);
          
          // Clear form after successful registration and login
          setName('');
          setEmail('');
          setPassword('');
          setConfirmPassword('');
          setAgreedToTerms(false);
          
          // Redirect to the specified path or dashboard
          navigate(redirectPath || '/dashboard');
          return;
        } catch (loginErr) {
          console.error('Auto-login failed:', loginErr);
          // Continue with regular success flow if auto-login fails
        }
      }
      
      setSuccess('Account created successfully! Redirecting to login page...');
      setIsLoading(false);
      
      // Clear form after successful registration
      setName('');
      setEmail('');
      setPassword('');
      setConfirmPassword('');
      setAgreedToTerms(false);
      
      // Check if there's a redirect parameter to pass along
      const params = new URLSearchParams(window.location.search);
      const redirectPath = params.get('redirect');
      const redirectParam = redirectPath ? `?redirect=${redirectPath}&fromSignup=success` : '?fromSignup=success';
      
      // Redirect to sign in after a short delay
      setTimeout(() => {
        navigate(`/signin${redirectParam}`);
      }, 2000);
    } catch (err) {
      setIsLoading(false);
      setError(err.message || 'Registration failed. Please try again.');
      
      // Check for specific errors to give more helpful messages
      if (err.message.includes('email already exists')) {
        setError('This email is already registered. Please try signing in instead.');
      }
    }
  };

  const handleSocialSignUp = (provider) => {
    // This would typically redirect to OAuth flow
    setError(`${provider} signup is not implemented yet.`);
  };

  // Animation variants
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
    <div className="w-full min-h-screen flex items-center justify-center bg-[#0f0f1a] py-12">
      {/* Animated background elements */}
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

      {/* Back to home link */}
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

      {/* Main content */}
      <motion.div 
        className="relative w-full max-w-md mx-4 z-10"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Form card with improved visual design */}
        <motion.div 
          className="bg-[#1a1a2e]/70 backdrop-blur-lg rounded-2xl shadow-xl border border-[#ffffff0f] overflow-hidden"
          variants={itemVariants}
        >
          {/* Card header */}
          <div className="relative px-8 pt-10 pb-6 text-center">
            {/* Visual accent */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#6c5ce7] to-[#a29bfe]"></div>
            
            <motion.div
              className="inline-flex items-center justify-center w-16 h-16 mb-4 rounded-full bg-[#6c5ce7]/10 border border-[#6c5ce7]/20"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, type: "spring" }}
            >
              <FontAwesomeIcon icon={faUserPlus} className="text-[#a29bfe] text-2xl" />
            </motion.div>
            
            <h1 className="text-2xl font-bold text-white mb-2">Create Account</h1>
            <p className="text-gray-400 text-sm max-w-xs mx-auto">
              Join ClipSmart AI and start creating amazing videos in minutes
            </p>
          </div>
          
          {/* Error message */}
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
          
          {/* Success message */}
          <AnimatePresence>
            {success && (
              <motion.div 
                className="bg-green-500/20 border border-green-500/30 text-green-300 px-6 py-3 mx-6 mb-6 rounded-lg flex items-start gap-3"
                initial={{ opacity: 0, y: -10, height: 0 }}
                animate={{ opacity: 1, y: 0, height: 'auto' }}
                exit={{ opacity: 0, y: -10, height: 0 }}
              >
                <FontAwesomeIcon icon={faCheckCircle} className="mt-1" />
                <p className="text-sm">{success}</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Form */}
          <form onSubmit={handleSignUp} className="px-8 pb-8">
            {/* Name field */}
            <div className="mb-5">
              <label 
                htmlFor="name" 
                className="block text-gray-300 text-sm font-medium mb-2 ml-1"
              >
                Full Name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FontAwesomeIcon icon={faUser} className="text-gray-400" />
                </div>
                <input
                  type="text"
                  id="name"
                  className={`w-full pl-10 pr-4 py-3 bg-[#ffffff0a] border ${formErrors.name ? 'border-red-500/50' : 'border-[#ffffff1a]'} rounded-lg focus:outline-none focus:border-[#6c5ce7] text-white text-base transition-colors`}
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              {formErrors.name && (
                <p className="mt-1 text-sm text-red-400 flex items-center gap-1 ml-1">
                  <FontAwesomeIcon icon={faExclamationCircle} className="text-xs" />
                  {formErrors.name}
                </p>
              )}
            </div>
            
            {/* Email field */}
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
                  <FontAwesomeIcon icon={faExclamationCircle} className="text-xs" />
                  {formErrors.email}
                </p>
              )}
            </div>
            
            {/* Password field */}
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
                  <FontAwesomeIcon icon={faExclamationCircle} className="text-xs" />
                  {formErrors.password}
                </p>
              )}
            </div>
            
            {/* Confirm Password field */}
            <div className="mb-5">
              <label 
                htmlFor="confirmPassword" 
                className="block text-gray-300 text-sm font-medium mb-2 ml-1"
              >
                Confirm Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FontAwesomeIcon icon={faLock} className="text-gray-400" />
                </div>
                <input
                  type="password"
                  id="confirmPassword"
                  className={`w-full pl-10 pr-4 py-3 bg-[#ffffff0a] border ${formErrors.confirmPassword ? 'border-red-500/50' : 'border-[#ffffff1a]'} rounded-lg focus:outline-none focus:border-[#6c5ce7] text-white text-base transition-colors`}
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
              {formErrors.confirmPassword && (
                <p className="mt-1 text-sm text-red-400 flex items-center gap-1 ml-1">
                  <FontAwesomeIcon icon={faExclamationCircle} className="text-xs" />
                  {formErrors.confirmPassword}
                </p>
              )}
            </div>
            
            {/* Terms and conditions checkbox */}
            <div className="mb-8">
              <div className="flex items-start">
                <div className="flex items-center h-5">
                  <input
                    id="terms"
                    type="checkbox"
                    checked={agreedToTerms}
                    onChange={(e) => setAgreedToTerms(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-[#6c5ce7] focus:ring-[#6c5ce7]"
                  />
                </div>
                <div className="ml-3 text-sm">
                  <label htmlFor="terms" className={`text-gray-300 ${formErrors.terms ? 'text-red-400' : ''}`}>
                    I agree to the <a 
                      onClick={(e) => {
                        e.preventDefault();
                        handleTerms();
                      }}
                      href="/privacy" 
                      className="text-[#a29bfe] hover:text-[#6c5ce7] transition-colors"
                    >
                      Terms of Service
                    </a> and <a 
                      onClick={(e) => {
                        e.preventDefault();
                        handlePrivacy();
                      }}
                      href="/privacy" 
                      className="text-[#a29bfe] hover:text-[#6c5ce7] transition-colors"
                    >
                      Privacy Policy
                    </a>
                  </label>
                  {formErrors.terms && (
                    <p className="mt-1 text-sm text-red-400 flex items-center gap-1">
                      <FontAwesomeIcon icon={faExclamationCircle} className="text-xs" />
                      {formErrors.terms}
                    </p>
                  )}
                </div>
              </div>
            </div>
            
            {/* Sign up button */}
            <motion.button
              type="submit"
              className="w-full bg-gradient-to-r from-[#6c5ce7] to-[#a29bfe] text-white font-medium py-3 px-4 rounded-lg flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed relative overflow-hidden group"
              disabled={isLoading}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {/* Shine effect */}
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
                  <span>Creating Account...</span>
                </>
              ) : (
                <>
                  <span className="relative z-10">Create Account</span>
                </>
              )}
            </motion.button>
            
            {/* Or divider */}
            <div className="mt-8 mb-6 flex items-center">
              <div className="flex-1 h-px bg-[#ffffff1a]"></div>
              <span className="px-4 text-sm text-gray-400">or sign up with</span>
              <div className="flex-1 h-px bg-[#ffffff1a]"></div>
            </div>
            
            {/* Social signup buttons */}
            <div className="flex justify-center space-x-4">
              {['Google', 'GitHub', 'Twitter'].map((provider) => (
                <motion.button
                  key={provider}
                  type="button"
                  onClick={() => handleSocialSignUp(provider)}
                  className="bg-[#ffffff0a] hover:bg-[#ffffff15] border border-[#ffffff1a] p-3 rounded-lg text-white transition-colors"
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  disabled={isLoading}
                >
                  <FontAwesomeIcon 
                    icon={
                      provider === 'Google' ? faGoogle :
                      provider === 'GitHub' ? faGithub :
                      faTwitter
                    } 
                    className="text-lg" 
                  />
                </motion.button>
              ))}
            </div>
          </form>
        </motion.div>
        
        {/* Sign in link */}
        <motion.div 
          className="mt-6 text-center"
          variants={itemVariants}
        >
          <p className="text-gray-400">
            Already have an account?{' '}
            <Link 
              to="/signin" 
              className="text-[#a29bfe] hover:text-[#6c5ce7] transition-colors font-medium"
            >
              Sign in instead
            </Link>
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default SignUpPage; 