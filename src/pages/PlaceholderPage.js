import React from 'react';
import { motion } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTools, faExclamationTriangle, faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import { Link, useLocation } from 'react-router-dom';
import Navbar from '../components/Navbar';

const PlaceholderPage = () => {
  const location = useLocation();
  const pageName = location.pathname.substring(1).charAt(0).toUpperCase() + location.pathname.substring(2);

  return (
    <>
      <Navbar />
      <div className="flex min-h-screen bg-[#0f0f1a] pt-20">
        <div className="flex-1 flex items-center justify-center p-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-[#1a1a2e]/60 backdrop-blur-xl rounded-2xl p-8 shadow-xl border border-[#ffffff1a] max-w-2xl w-full"
          >
            <div className="flex items-center justify-center mb-6">
              <div className="w-20 h-20 bg-[#6c5ce7]/20 rounded-2xl flex items-center justify-center border border-[#6c5ce7]/30">
                <FontAwesomeIcon icon={faTools} className="text-4xl text-[#6c5ce7]" />
              </div>
            </div>
            
            <h1 className="text-3xl font-bold text-center text-white mb-4">
              {pageName} Page
            </h1>
            
            <div className="bg-[#6c5ce7]/10 border border-[#6c5ce7]/20 rounded-xl p-4 mb-6">
              <div className="flex items-start gap-3">
                <FontAwesomeIcon icon={faExclamationTriangle} className="text-[#6c5ce7] text-lg mt-1" />
                <p className="text-gray-300">
                  This page is currently under development and has not been implemented yet. 
                  Check back soon for updates!
                </p>
              </div>
            </div>
            
            <p className="text-gray-400 text-center mb-6">
              Our team is working hard to bring you this feature. In the meantime, 
              feel free to explore the rest of the application.
            </p>
            
            <div className="flex justify-center">
              <Link to="/dashboard">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-6 py-3 bg-gradient-to-r from-[#6c5ce7] to-[#a29bfe] rounded-xl font-medium text-white flex items-center gap-2 shadow-lg shadow-[#6c5ce7]/20"
                >
                  <FontAwesomeIcon icon={faArrowLeft} />
                  Back to Dashboard
                </motion.button>
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    </>
  );
};

export default PlaceholderPage; 