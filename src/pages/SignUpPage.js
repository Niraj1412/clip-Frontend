import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faUserPlus,
  faEnvelope,
  faLock,
  faUser,
  faArrowLeft,
  faExclamationCircle,
  faCheckCircle,
  faSpinner,
  faCheck,
} from "@fortawesome/free-solid-svg-icons";
import { faGoogle, faGithub, faTwitter } from "@fortawesome/free-brands-svg-icons";
import authService from "../services/authService";

const SignUpPage = () => {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [formErrors, setFormErrors] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    terms: "",
  });

  // Navigation handlers for terms and privacy
  const handleTerms = () => navigate("/terms");
  const handlePrivacy = () => navigate("/privacy");

  // Check if user is already logged in and initialize Google Sign-In
  useEffect(() => {
    if (authService.isAuthenticated()) {
      navigate("/dashboard");
      return;
    }

    // Initialize Google Sign-In for sign-up
    if (window.google && window.google.accounts) {
      window.google.accounts.id.initialize({
        client_id: process.env.REACT_APP_GOOGLE_CLIENT_ID,
        callback: handleGoogleSignUp,
      });

      window.google.accounts.id.renderButton(
        document.getElementById("google-signup-button"),
        {
          theme: "outline",
          size: "large",
          text: "signup_with",
        }
      );
    } else {
      console.error("Google API not loaded");
      setError("Google API failed to load. Please try again later.");
    }
  }, [navigate]);

  const validateForm = () => {
    let isValid = true;
    const errors = {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
      terms: "",
    };

    if (!name.trim()) {
      errors.name = "Name is required";
      isValid = false;
    } else if (name.trim().length < 3) {
      errors.name = "Name must be at least 3 characters";
      isValid = false;
    }

    if (!email) {
      errors.email = "Email is required";
      isValid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = "Please enter a valid email address";
      isValid = false;
    }

    if (!password) {
      errors.password = "Password is required";
      isValid = false;
    } else if (password.length < 6) {
      errors.password = "Password must be at least 6 characters";
      isValid = false;
    }

    if (!confirmPassword) {
      errors.confirmPassword = "Please confirm your password";
      isValid = false;
    } else if (password !== confirmPassword) {
      errors.confirmPassword = "Passwords do not match";
      isValid = false;
    }

    if (!agreedToTerms) {
      errors.terms = "You must agree to the Terms of Service";
      isValid = false;
    }

    setFormErrors(errors);
    return isValid;
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const response = await authService.register(name, email, password);
      if (response.status) {
        setSuccess("Account created successfully! Redirecting to login page...");
        setIsLoading(false);
        setName("");
        setEmail("");
        setPassword("");
        setConfirmPassword("");
        setAgreedToTerms(false);

        const params = new URLSearchParams(window.location.search);
        const redirectPath = params.get("redirect");
        const redirectParam = redirectPath
          ? `?redirect=${redirectPath}&fromSignup=success`
          : "?fromSignup=success";

        setTimeout(() => {
          navigate(`/signin${redirectParam}`);
        }, 2000);
      }
    } catch (err) {
      setIsLoading(false);
      setError(err.message || "Registration failed. Please try again.");
      if (err.message.includes("email already exists")) {
        setError("This email is already registered. Please try signing in instead.");
      }
    }
  };

  const handleGoogleSignUp = async (response) => {
    const idToken = response.credential;
    setIsLoading(true);
    setError("");

    try {
      const result = await authService.signupWithGoogle({ token: idToken });
      if (result.status) {
        setSuccess("Account created successfully! Redirecting...");
        setTimeout(() => {
          navigate("/dashboard");
        }, 2000);
      }
    } catch (err) {
      setError(err.message || "Google signup failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialSignUp = (provider) => {
    if (provider === "Google") {
      // Handled by Google button, no action needed here
      return;
    }
    setError(`${provider} signup is not implemented yet.`);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.5,
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.5 },
    },
  };

  return (
    <div className="w-full min-h-screen flex items-center justify-center bg-[#0f0f1a] py-8 sm:py-12">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0f0f1a] via-[#1a1a2e] to-[#0f0f1a]" />
        {[...Array(3)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full bg-gradient-to-br from-[#6c5ce7]/10 to-[#a29bfe]/10"
            initial={{
              width: Math.random() * 200 + 60, // smaller on mobile
              height: Math.random() * 200 + 60,
              x: Math.random() * (window.innerWidth < 640 ? window.innerWidth * 0.7 : window.innerWidth),
              y: Math.random() * (window.innerHeight < 640 ? window.innerHeight * 0.7 : window.innerHeight),
              opacity: 0.1,
            }}
            animate={{
              x: Math.random() * (window.innerWidth < 640 ? window.innerWidth * 0.7 : window.innerWidth),
              y: Math.random() * (window.innerHeight < 640 ? window.innerHeight * 0.7 : window.innerHeight),
              opacity: [0.1, 0.2, 0.1],
              scale: [1, 1.2, 1],
            }}
            transition={{
              duration: Math.random() * 10 + 10,
              repeat: Infinity,
              repeatType: "reverse",
              ease: "easeInOut",
            }}
          />
        ))}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "linear-gradient(rgba(108, 92, 231, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(108, 92, 231, 0.05) 1px, transparent 1px)",
            backgroundSize: "32px 32px", // smaller grid for mobile
          }}
        />
      </div>

      <motion.div
        className="fixed top-2 left-2 sm:top-6 sm:left-6 z-50"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Link
          to="/"
          className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors px-2 py-1 sm:px-3 sm:py-2 rounded-lg hover:bg-white/5 text-sm sm:text-base"
        >
          <FontAwesomeIcon icon={faArrowLeft} />
          <span>Back to Home</span>
        </Link>
      </motion.div>

      <motion.div
        className="relative w-full max-w-xs sm:max-w-md mx-2 sm:mx-4 z-10"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div
          className="bg-[#1a1a2e]/70 backdrop-blur-lg rounded-2xl shadow-xl border border-[#ffffff0f] overflow-hidden"
          variants={itemVariants}
        >
          <div className="relative px-4 sm:px-8 pt-8 sm:pt-10 pb-4 sm:pb-6 text-center">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#6c5ce7] to-[#a29bfe]"></div>
            <motion.div
              className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 mb-3 sm:mb-4 rounded-full bg-[#6c5ce7]/10 border border-[#6c5ce7]/20"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, type: "spring" }}
            >
              <FontAwesomeIcon icon={faUserPlus} className="text-[#a29bfe] text-xl sm:text-2xl" />
            </motion.div>
            <h1 className="text-xl sm:text-2xl font-bold text-white mb-1 sm:mb-2">Create Account</h1>
            <p className="text-gray-400 text-xs sm:text-sm max-w-xs mx-auto">
              Join ClipSmart AI and start creating amazing videos in minutes
            </p>
          </div>

          <AnimatePresence>
            {error && (
              <motion.div
                className="bg-red-500/20 border border-red-500/30 text-red-300 px-6 py-3 mx-6 mb-6 rounded-lg flex items-start gap-3"
                initial={{ opacity: 0, y: -10, height: 0 }}
                animate={{ opacity: 1, y: 0, height: "auto" }}
                exit={{ opacity: 0, y: -10, height: 0 }}
              >
                <FontAwesomeIcon icon={faExclamationCircle} className="mt-1" />
                <p className="text-sm">{error}</p>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {success && (
              <motion.div
                className="bg-green-500/20 border border-green-500/30 text-green-300 px-6 py-3 mx-6 mb-6 rounded-lg flex items-start gap-3"
                initial={{ opacity: 0, y: -10, height: 0 }}
                animate={{ opacity: 1, y: 0, height: "auto" }}
                exit={{ opacity: 0, y: -10, height: 0 }}
              >
                <FontAwesomeIcon icon={faCheckCircle} className="mt-1" />
                <p className="text-sm">{success}</p>
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleSignUp} className="px-4 sm:px-8 pb-6 sm:pb-8">
            <div className="mb-4 sm:mb-5">
              <label htmlFor="name" className="block text-gray-300 text-xs sm:text-sm font-medium mb-1 sm:mb-2 ml-1">
                Full Name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-2 sm:pl-3 flex items-center pointer-events-none">
                  <FontAwesomeIcon icon={faUser} className="text-gray-400 text-sm sm:text-base" />
                </div>
                <input
                  type="text"
                  id="name"
                  className={`w-full pl-8 sm:pl-10 pr-3 sm:pr-4 py-2 sm:py-3 bg-[#ffffff0a] border ${
                    formErrors.name ? "border-red-500/50" : "border-[#ffffff1a]"
                  } rounded-lg focus:outline-none focus:border-[#6c5ce7] text-white text-sm sm:text-base transition-colors`}
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

            <div className="mb-4 sm:mb-5">
              <label htmlFor="email" className="block text-gray-300 text-xs sm:text-sm font-medium mb-1 sm:mb-2 ml-1">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-2 sm:pl-3 flex items-center pointer-events-none">
                  <FontAwesomeIcon icon={faEnvelope} className="text-gray-400 text-sm sm:text-base" />
                </div>
                <input
                  type="email"
                  id="email"
                  className={`w-full pl-8 sm:pl-10 pr-3 sm:pr-4 py-2 sm:py-3 bg-[#ffffff0a] border ${
                    formErrors.email ? "border-red-500/50" : "border-[#ffffff1a]"
                  } rounded-lg focus:outline-none focus:border-[#6c5ce7] text-white text-sm sm:text-base transition-colors`}
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

            <div className="mb-4 sm:mb-5">
              <label htmlFor="password" className="block text-gray-300 text-xs sm:text-sm font-medium mb-1 sm:mb-2 ml-1">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-2 sm:pl-3 flex items-center pointer-events-none">
                  <FontAwesomeIcon icon={faLock} className="text-gray-400 text-sm sm:text-base" />
                </div>
                <input
                  type="password"
                  id="password"
                  className={`w-full pl-8 sm:pl-10 pr-3 sm:pr-4 py-2 sm:py-3 bg-[#ffffff0a] border ${
                    formErrors.password ? "border-red-500/50" : "border-[#ffffff1a]"
                  } rounded-lg focus:outline-none focus:border-[#6c5ce7] text-white text-sm sm:text-base transition-colors`}
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

            <div className="mb-4 sm:mb-5">
              <label htmlFor="confirmPassword" className="block text-gray-300 text-xs sm:text-sm font-medium mb-1 sm:mb-2 ml-1">
                Confirm Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-2 sm:pl-3 flex items-center pointer-events-none">
                  <FontAwesomeIcon icon={faLock} className="text-gray-400 text-sm sm:text-base" />
                </div>
                <input
                  type="password"
                  id="confirmPassword"
                  className={`w-full pl-8 sm:pl-10 pr-3 sm:pr-4 py-2 sm:py-3 bg-[#ffffff0a] border ${
                    formErrors.confirmPassword ? "border-red-500/50" : "border-[#ffffff1a]"
                  } rounded-lg focus:outline-none focus:border-[#6c5ce7] text-white text-sm sm:text-base transition-colors`}
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

            <div className="mb-6 sm:mb-8">
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
                <div className="ml-2 sm:ml-3 text-xs sm:text-sm">
                  <label htmlFor="terms" className={`text-gray-300 ${formErrors.terms ? "text-red-400" : ""}`}>
                    I agree to the{" "}
                    <a
                      onClick={(e) => {
                        e.preventDefault();
                        handleTerms();
                      }}
                      href="/privacy"
                      className="text-[#a29bfe] hover:text-[#6c5ce7] transition-colors"
                    >
                      Terms of Service
                    </a>{" "}
                    and{" "}
                    <a
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

            <motion.button
              type="submit"
              className="w-full bg-gradient-to-r from-[#6c5ce7] to-[#a29bfe] text-white font-medium py-2 sm:py-3 px-3 sm:px-4 rounded-lg flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed relative overflow-hidden group text-sm sm:text-base"
              disabled={isLoading}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <motion.div
                className="absolute inset-0 bg-white/20"
                initial={{ x: "-100%" }}
                animate={{ x: "200%" }}
                transition={{ repeat: Infinity, duration: 2, ease: "linear", repeatDelay: 1 }}
                style={{ width: "50%" }}
              />
              {isLoading ? (
                <>
                  <FontAwesomeIcon icon={faSpinner} className="animate-spin mr-2" />
                  <span>Creating Account...</span>
                </>
              ) : (
                <span className="relative z-10">Create Account</span>
              )}
            </motion.button>

            <div className="mt-6 sm:mt-8 mb-4 sm:mb-6 flex items-center">
              <div className="flex-1 h-px bg-[#ffffff1a]"></div>
              <span className="px-2 sm:px-4 text-xs sm:text-sm text-gray-400">or sign up with</span>
              <div className="flex-1 h-px bg-[#ffffff1a]"></div>
            </div>

            <div className="flex justify-center space-x-2 sm:space-x-4">
              <div id="google-signup-button" className="flex items-center justify-center"></div>
              {["GitHub", "Twitter"].map((provider) => (
                <motion.button
                  key={provider}
                  type="button"
                  onClick={() => handleSocialSignUp(provider)}
                  className="bg-[#ffffff0a] hover:bg-[#ffffff15] border border-[#ffffff1a] p-2 sm:p-3 rounded-lg text-white transition-colors"
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  disabled={isLoading}
                >
                  <FontAwesomeIcon
                    icon={provider === "GitHub" ? faGithub : faTwitter}
                    className="text-base sm:text-lg"
                  />
                </motion.button>
              ))}
            </div>
          </form>
        </motion.div>

        <motion.div className="mt-4 sm:mt-6 text-center" variants={itemVariants}>
          <p className="text-gray-400 text-xs sm:text-sm">
            Already have an account?{" "}
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