import React from 'react';
import { motion } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch, faHome, faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import { Link, useLocation } from 'react-router-dom';
import Navbar from '../components/Navbar';

const NotFoundPage = () => {
  const location = useLocation();
  const path = location.pathname;

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-[#121212] pt-20 pb-12 flex items-center justify-center">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-3xl mx-auto text-center"
          >
            <div className="mb-8">
              <div className="relative inline-block">
                <div className="text-[150px] font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-500 to-indigo-600">
                  404
                </div>
                <motion.div 
                  animate={{ 
                    y: [0, -10, 0],
                    rotate: [0, 5, 0, -5, 0]
                  }}
                  transition={{ 
                    duration: 4,
                    repeat: Infinity,
                    repeatType: "loop"
                  }}
                  className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
                >
                  <FontAwesomeIcon icon={faSearch} className="text-6xl text-purple-400/50" />
                </motion.div>
              </div>
            </div>
            
            <h1 className="text-4xl font-bold text-white mb-4">
              Page Not Found
            </h1>
            
            <p className="text-xl text-gray-300 mb-8">
              We couldn't find the page you're looking for: <span className="text-purple-400 font-mono">{path}</span>
            </p>
            
            <div className="bg-[#1a1a2e]/60 backdrop-blur-xl rounded-2xl p-6 shadow-xl border border-[#ffffff1a] mb-8">
              <p className="text-gray-300 mb-4">
                The page you are trying to access might have been removed, renamed, or is temporarily unavailable.
              </p>
              
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link to="/dashboard">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl font-medium text-white flex items-center gap-2"
                  >
                    <FontAwesomeIcon icon={faHome} />
                    Go to Dashboard
                  </motion.button>
                </Link>
                
                <button 
                  onClick={() => window.history.back()}
                  className="px-6 py-3 bg-[#2a2a2a] hover:bg-[#333] rounded-xl font-medium text-white flex items-center gap-2"
                >
                  <FontAwesomeIcon icon={faArrowLeft} />
                  Go Back
                </button>
              </div>
            </div>
            
            <div className="text-gray-500 text-sm">
              If you believe this is a mistake, please contact our support team at{' '}
              <a href="mailto:support@clipsmart.ai" className="text-purple-400 hover:underline">support@clipsmart.ai</a>
            </div>
          </motion.div>
        </div>
      </div>
    </>
  );
};

export default NotFoundPage; 