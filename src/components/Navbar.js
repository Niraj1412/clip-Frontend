import { useState, useEffect, useRef } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { 
  faWandMagicSparkles, 
  faTachometerAlt, 
  faFilm, 
  faPlus, 
  faUser,
  faChevronDown,
  faStar,
  faMagic,
  faUserCircle
} from "@fortawesome/free-solid-svg-icons";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useLocation, useNavigate } from "react-router-dom";
import logo from "../images/clipsmartAI-Icon1.webp";
import authService from "../services/authService";

const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const userMenuRef = useRef(null);
  const [userData, setUserData] = useState({
    name: "User",
    email: "user@example.com"
  });

  useEffect(() => {
    // Get current user data from auth service
    const currentUser = authService.getCurrentUser();
    if (currentUser) {
      setUserData({
        name: currentUser.name || "User",
        email: currentUser.email || "user@example.com"
      });
    }
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
    };
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Handle sign out
  const handleSignOut = () => {
    authService.logout();
    navigate('/signin');
    setShowUserMenu(false);
  };

  // Get first letter of name for avatar
  const getInitial = (name) => {
    return name ? name.charAt(0).toUpperCase() : 'U';
  };

  // Check if the current route matches a nav item route
  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <>
      {/* Decorative background element */}
      <div className="fixed top-0 left-0 w-full h-20 z-40">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#6c5ce7]/10 rounded-full filter blur-[80px] transform translate-x-1/3 -translate-y-1/2"></div>
        <div className="absolute top-0 left-1/4 w-32 h-32 bg-purple-500/10 rounded-full filter blur-[60px] transform -translate-y-1/2"></div>
      </div>

      <motion.nav
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="fixed top-0 left-0 w-full bg-[#1a1a1a]/80 backdrop-blur-xl flex items-center justify-between px-6 py-3 z-50 font-roboto shadow-lg border-b border-gray-800/30"
        style={{ zIndex: 1000 }}>
        
        {/* Subtle gradient line at the top */}
        <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-[#6c5ce7]/0 via-[#6c5ce7]/50 to-[#6c5ce7]/0"></div>
        
        {/* Animated sparkle elements */}
        <div className="absolute left-1/3 top-1/2 transform -translate-y-1/2 text-[#6c5ce7]/20 text-xs animate-pulse">
          <FontAwesomeIcon icon={faMagic} />
        </div>
        <div className="absolute right-1/4 top-1/3 transform -translate-y-1/2 text-[#6c5ce7]/10 text-xs animate-ping">
          <FontAwesomeIcon icon={faStar} />
        </div>

        {/* Logo Section */}
        <div className="flex items-center space-x-3">
          <Link to="/explore">
            <motion.div
              className="relative group"
              whileHover={{ scale: 1.1, rotate: 5 }}
              whileTap={{ scale: 0.95 }}
            >
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-[#6c5ce7] to-purple-600 opacity-70 blur-sm group-hover:opacity-100 group-hover:blur-md transition-all duration-300"></div>
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <img
                src={logo}
                alt="Logo"
                className="relative w-9 h-9 rounded-full border-2 border-[#6c5ce7]/30 shadow-xl shadow-[#6c5ce7]/20 group-hover:border-[#6c5ce7]/50 transition-all duration-300"
              />
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-gradient-to-r from-yellow-400 to-yellow-300 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 animate-pulse"></div>
            </motion.div>
          </Link>
          <Link to="/explore">
            <motion.span
              initial={{ opacity: 0, x: -5 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="text-white text-xl font-bold tracking-wide hover:text-transparent bg-clip-text bg-gradient-to-r from-[#6c5ce7] to-purple-400 transition-colors duration-300 flex items-center gap-2"
            >
              CLIPSMART <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#6c5ce7] to-purple-400">AI</span>
              <motion.div 
                initial={{ rotate: 0 }}
                animate={{ rotate: [0, 15, 0, -15, 0] }}
                transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 5 }}
              >
                <FontAwesomeIcon icon={faWandMagicSparkles} className="text-xs text-[#6c5ce7]" />
              </motion.div>
            </motion.span>
          </Link>
        </div>

        {/* Right Side Actions */}
        <div className="flex items-center space-x-4">
          {/* User Profile */}
          <div className="relative" ref={userMenuRef}>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 bg-[#1A1A1A]/70 backdrop-blur-sm border border-gray-700/30 hover:border-[#6c5ce7]/40 rounded-lg px-3 py-2 text-gray-300 hover:text-white transition-all duration-300 shadow-md group"
            >
              <div className="w-7 h-7 rounded-full bg-gradient-to-r from-[#6c5ce7]/80 to-purple-500/80 flex items-center justify-center text-white shadow-inner overflow-hidden relative">
                <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <span className="relative z-10 text-sm font-medium">{getInitial(userData.name)}</span>
              </div>
              <span className="hidden sm:inline group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-[#6c5ce7] group-hover:to-purple-400 transition-all duration-300">
                {userData.name}
              </span>
              <motion.div
                animate={showUserMenu ? { rotate: 180 } : { rotate: 0 }}
                transition={{ duration: 0.3 }}
              >
                <FontAwesomeIcon icon={faChevronDown} className="text-xs opacity-70" />
              </motion.div>
            </motion.button>

            {/* User Dropdown Menu */}
            <AnimatePresence>
              {showUserMenu && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className="absolute right-0 mt-2 w-48 bg-[#1a1a1a]/90 backdrop-blur-xl border border-gray-800/50 rounded-lg shadow-2xl py-1 z-50 overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-b from-[#6c5ce7]/5 to-transparent pointer-events-none"></div>
                  <div className="px-4 py-2 border-b border-gray-800/50 relative">
                    <p className="text-white font-medium">{userData.name}</p>
                    <p className="text-gray-400 text-xs">{userData.email}</p>
                    <div className="absolute top-0 right-0 w-12 h-12 bg-[#6c5ce7]/10 rounded-full blur-xl"></div>
                  </div>
                  <div className="py-1 relative z-10">
                    <Link to="/profile" className="block px-4 py-2 text-gray-300 hover:bg-[#6c5ce7]/10 hover:text-white transition-all">
                      <FontAwesomeIcon icon={faUserCircle} className="mr-2 text-sm" />
                      Profile
                    </Link>
                  </div>
                  <div className="border-t border-gray-800/50 py-1 relative z-10">
                    <button 
                      onClick={handleSignOut}
                      className="w-full text-left block px-4 py-2 text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-all"
                    >
                      Sign out
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.nav>
    </>
  );
};

export default Navbar;