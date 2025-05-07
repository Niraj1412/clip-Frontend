import React from 'react';
import { motion } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faShield, 
  faUserShield, 
  faLock, 
  faGlobe,
  faEnvelope,
  faCookie,
  faHistory
} from '@fortawesome/free-solid-svg-icons';
import Navbar from '../components/Navbar';

const PrivacyPage = () => {
  const privacySections = [
    {
      title: 'Information We Collect',
      icon: faUserShield,
      content: `
        <p class="mb-3">We collect several types of information from and about users of our Website, including:</p>
        <ul class="list-disc pl-5 mb-3">
          <li>Personal information you provide when creating an account (name, email, etc.)</li>
          <li>Information about your videos and usage patterns</li>
          <li>Technical data (IP address, browser type, device information)</li>
          <li>Usage details and preferences</li>
        </ul>
        <p>We use this information to improve our services, personalize your experience, and ensure the security of our platform.</p>
      `
    },
    {
      title: 'How We Use Your Information',
      icon: faGlobe,
      content: `
        <p class="mb-3">We use the information we collect for various purposes, including:</p>
        <ul class="list-disc pl-5 mb-3">
          <li>Providing, operating, and maintaining our services</li>
          <li>Improving and personalizing your experience</li>
          <li>Understanding how you use our platform</li>
          <li>Developing new features and services</li>
          <li>Communicating with you about updates and offerings</li>
          <li>Preventing fraud and enhancing security</li>
        </ul>
      `
    },
    {
      title: 'Data Security',
      icon: faLock,
      content: `
        <p class="mb-3">We implement appropriate security measures to protect your personal information, including:</p>
        <ul class="list-disc pl-5 mb-3">
          <li>Encryption of sensitive data</li>
          <li>Regular security assessments</li>
          <li>Access controls and authentication procedures</li>
          <li>Physical and environmental safeguards</li>
        </ul>
        <p>However, no method of transmission over the Internet or electronic storage is 100% secure. While we strive to use commercially acceptable means to protect your personal information, we cannot guarantee its absolute security.</p>
      `
    }
  ];

  const lastUpdated = 'March 24, 2025';

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-[#121212] pt-20 pb-12">
        {/* Background patterns */}
        <div className="absolute inset-0 overflow-hidden z-0">
          <motion.div 
            className="absolute -inset-[10%] opacity-[0.03] z-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.03 }}
            transition={{ duration: 2 }}
            style={{
              backgroundImage: `radial-gradient(circle at 25px 25px, #6c5ce7 2%, transparent 0%), radial-gradient(circle at 75px 75px, #6c5ce7 2%, transparent 0%)`,
              backgroundSize: '100px 100px',
            }}
          />
        </div>
        
        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-4xl mx-auto"
          >
            <div className="text-center mb-12">
              <div className="w-16 h-16 bg-purple-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <FontAwesomeIcon icon={faShield} className="text-2xl text-purple-400" />
              </div>
              <h1 className="text-4xl font-bold text-white mb-4">Privacy Policy</h1>
              <p className="text-gray-400">Last Updated: {lastUpdated}</p>
            </div>
            
            <motion.div 
              className="bg-[#1a1a2e]/60 backdrop-blur-xl rounded-2xl p-8 shadow-xl border border-[#ffffff1a] mb-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <p className="text-gray-300 mb-4">
                At ClipSmart AI, we are committed to protecting your privacy and ensuring the security of your personal information. 
                This Privacy Policy explains how we collect, use, and safeguard your data when you use our website and services.
              </p>
              <p className="text-gray-300">
                By using ClipSmart AI, you agree to the collection and use of information in accordance with this policy.
                We will not use or share your information with anyone except as described in this Privacy Policy.
              </p>
            </motion.div>
            
            {privacySections.map((section, index) => (
              <motion.div
                key={section.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 + index * 0.1 }}
                className="bg-[#1a1a2e]/60 backdrop-blur-xl rounded-xl p-6 border border-[#ffffff1a] hover:border-purple-500/30 transition-all duration-300 mb-6"
              >
                <div className="flex items-center mb-4">
                  <div className="w-10 h-10 bg-purple-900/30 rounded-lg flex items-center justify-center mr-4">
                    <FontAwesomeIcon icon={section.icon} className="text-lg text-purple-400" />
                  </div>
                  <h2 className="text-2xl font-semibold text-white">{section.title}</h2>
                </div>
                <div 
                  className="text-gray-300 prose prose-invert max-w-none"
                  dangerouslySetInnerHTML={{ __html: section.content }}
                />
              </motion.div>
            ))}
            
            <motion.div 
              className="bg-[#1a1a2e]/60 backdrop-blur-xl rounded-xl p-6 border border-[#ffffff1a] hover:border-purple-500/30 transition-all duration-300 mb-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.6 }}
            >
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 bg-purple-900/30 rounded-lg flex items-center justify-center mr-4">
                  <FontAwesomeIcon icon={faCookie} className="text-lg text-purple-400" />
                </div>
                <h2 className="text-2xl font-semibold text-white">Cookie Policy</h2>
              </div>
              <p className="text-gray-300 mb-3">
                We use cookies and similar tracking technologies to track activity on our website and store certain information. 
                Cookies are files with a small amount of data which may include an anonymous unique identifier.
              </p>
              <p className="text-gray-300">
                You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent. However, 
                if you do not accept cookies, you may not be able to use some portions of our service.
              </p>
            </motion.div>
            
            <motion.div 
              className="bg-[#1a1a2e]/60 backdrop-blur-xl rounded-xl p-6 border border-[#ffffff1a] hover:border-purple-500/30 transition-all duration-300 mb-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.7 }}
            >
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 bg-purple-900/30 rounded-lg flex items-center justify-center mr-4">
                  <FontAwesomeIcon icon={faHistory} className="text-lg text-purple-400" />
                </div>
                <h2 className="text-2xl font-semibold text-white">Changes to This Privacy Policy</h2>
              </div>
              <p className="text-gray-300">
                We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page
                and updating the "Last Updated" date at the top of this page. You are advised to review this Privacy Policy periodically for any changes.
              </p>
            </motion.div>
            
            <motion.div 
              className="bg-[#1a1a2e]/60 backdrop-blur-xl rounded-xl p-6 border border-[#ffffff1a] hover:border-purple-500/30 transition-all duration-300"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.8 }}
            >
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 bg-purple-900/30 rounded-lg flex items-center justify-center mr-4">
                  <FontAwesomeIcon icon={faEnvelope} className="text-lg text-purple-400" />
                </div>
                <h2 className="text-2xl font-semibold text-white">Contact Us</h2>
              </div>
              <p className="text-gray-300">
                If you have any questions about this Privacy Policy, please contact us at:
                <a href="mailto:privacy@clipsmart.ai" className="text-purple-400 ml-2 hover:text-purple-300 transition-colors">privacy@clipsmart.ai</a>
              </p>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </>
  );
};

export default PrivacyPage; 