import { Link, useLocation, useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { 
  faSearch, 
  faVideo, 
  faAngleRight, 
  faInfoCircle, 
  faEnvelope, 
  faShieldAlt, 
  faNoteSticky, 
  faUser, 
  faSignOutAlt, 
  faHome,
  faCompass,
  faClipboard,
  faCog,
  faTachometerAlt,
  faPlus,
  faFilm,
  faObjectGroup
} from "@fortawesome/free-solid-svg-icons";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import authService from "../services/authService";

const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
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

  const handleLogout = () => {
    authService.logout();
    navigate('/signin');
  };

  // Get first letter of name for avatar
  const getInitial = (name) => {
    return name ? name.charAt(0).toUpperCase() : 'U';
  };

  return (
    <motion.div
      className="fixed top-0 left-0 w-[280px] bg-[#121212] shadow-xl flex flex-col items-center py-6 px-4 text-white mt-14 border-r border-[#2A2A2A] overflow-hidden"
      style={{ height: 'calc(100vh - 3.5rem)', zIndex: 900 }}
      initial={{ x: -100, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      {/* Animated background pattern */}
      <div className="absolute inset-0 overflow-hidden z-0">
        <motion.div 
          className="absolute -inset-[10%] opacity-[0.02] z-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.02 }}
          transition={{ duration: 2 }}
          style={{
            backgroundImage: `radial-gradient(circle at 25px 25px, #6c5ce7 2%, transparent 0%), radial-gradient(circle at 75px 75px, #6c5ce7 2%, transparent 0%)`,
            backgroundSize: '100px 100px',
          }}
        />
        <motion.div 
          className="absolute -inset-[10%] opacity-[0.01] z-0"
          initial={{ rotate: 0, opacity: 0 }}
          animate={{ rotate: 5, opacity: 0.01 }}
          transition={{ duration: 30, repeat: Infinity, repeatType: "reverse", ease: "linear" }}
          style={{
            backgroundImage: `radial-gradient(#6c5ce7 1px, transparent 0)`,
            backgroundSize: '40px 40px',
          }}
        />
      </div>

      <div className="flex flex-col items-center justify-center text-center mb-8 w-full mt-8 relative z-10">
        <div className="bg-gradient-to-br from-[#6c5ce7] to-[#a29bfe] p-4 rounded-full flex items-center justify-center shadow-lg shadow-[#6c5ce7]/20 mb-4 hover:shadow-[#6c5ce7]/40 transition-all duration-300 cursor-pointer relative group">
          <div className="absolute inset-0 rounded-full bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="w-16 h-16 rounded-full flex items-center justify-center text-white text-2xl font-bold relative z-10"
          >
            {getInitial(userData.name)}
          </motion.div>
        </div>

        <motion.h2 
          className="text-lg font-semibold text-white mb-1"
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.3 }}
        >
          {userData.name}
        </motion.h2>
        
        <motion.p 
          className="text-sm text-gray-400/80 mb-3"
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.3 }}
        >
          {userData.email}
        </motion.p>
        
        <motion.button
          onClick={handleLogout}
          className="text-xs flex items-center gap-1 text-gray-400 hover:text-[#6c5ce7] transition-all px-3 py-1 rounded-full border border-[#2A2A2A] hover:border-[#6c5ce7]/50 hover:bg-[#6c5ce7]/5"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.3 }}
        >
          <FontAwesomeIcon icon={faSignOutAlt} className="mr-1" />
          Sign Out
        </motion.button>
      </div>

      <ul className="w-full space-y-4 relative z-10">
        <AnimatePresence>
          <SidebarItem 
            to="/dashboard" 
            icon={faPlus} 
            text="Create" 
            isActive={location.pathname === '/dashboard'} 
            delay={0.1} 
          />
          
          <SidebarItem 
            to="/explore" 
            icon={faCompass} 
            text="Explore" 
            isActive={location.pathname === '/explore'} 
            delay={0.2} 
          />
          
          <SidebarItem 
            to="/my-projects" 
            icon={faNoteSticky} 
            text="Projects" 
            isActive={location.pathname === '/my-projects'} 
            delay={0.3} 
          />
        </AnimatePresence>
      </ul>

      <div className="mt-auto w-full relative z-10">
        <motion.ul 
          className="w-full space-y-2 border-t border-[#2A2A2A] pt-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.5 }}
        >
          <BottomLink 
            to="/about" 
            icon={faInfoCircle} 
            text="About" 
            isActive={location.pathname === '/about'} 
          />
          
          <BottomLink 
            to="/contact" 
            icon={faEnvelope} 
            text="Contact Us" 
            isActive={location.pathname === '/contact'} 
          />
          
          <BottomLink 
            to="/privacy" 
            icon={faShieldAlt} 
            text="Privacy Policy" 
            isActive={location.pathname === '/privacy'} 
          />
        </motion.ul>
      </div>
    </motion.div>
  );
};

const SidebarItem = ({ to, icon, text, isActive, delay = 0 }) => {
  return (
    <motion.li 
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: delay, duration: 0.3 }}
      whileHover={{ scale: 1.02 }} 
      whileTap={{ scale: 0.98 }}
    >
      <Link
        to={to}
        className={`flex items-center justify-between px-5 py-3 rounded-xl transition-all w-full
                   ${isActive 
                     ? 'bg-[#6c5ce7] text-white shadow-lg shadow-[#6c5ce7]/25' 
                     : 'bg-[#1A1A1A] hover:bg-[#252525] border border-[#2A2A2A] hover:border-[#6c5ce7]/50'}`}
      >
        <div className="flex items-center space-x-3">
          <FontAwesomeIcon icon={icon} className={`text-lg ${isActive ? 'text-white' : 'text-[#6c5ce7]'}`} />
          <span className="text-md font-medium">{text}</span>
        </div>
        <motion.div
          animate={isActive ? { x: [0, 5, 0] } : { x: 0 }}
          transition={isActive ? { duration: 0.5, delay: 0.3 } : {}}
        >
          <FontAwesomeIcon icon={faAngleRight} className={isActive ? 'text-white' : 'text-[#6c5ce7]'} />
        </motion.div>
      </Link>
    </motion.li>
  );
};

const BottomLink = ({ to, icon, text, isActive }) => {
  return (
    <motion.li whileHover={{ x: 3 }} transition={{ duration: 0.2 }}>
      <Link
        to={to}
        className={`flex items-center py-2 px-3 text-sm rounded-lg transition-all
                   ${isActive 
                     ? 'text-[#6c5ce7] font-medium bg-[#6c5ce7]/10'
                     : 'text-gray-400/80 hover:text-[#6c5ce7] hover:bg-[#1A1A1A]'}`}
      >
        <FontAwesomeIcon icon={icon} className="mr-2" />
        {text}
      </Link>
    </motion.li>
  );
};

export default Sidebar;
