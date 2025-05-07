import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faLock, faBell, faDesktop, faSave, faTrash } from '@fortawesome/free-solid-svg-icons';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';

const SettingsPage = () => {
  const [activeTab, setActiveTab] = useState('profile');
  
  const [profileForm, setProfileForm] = useState({
    name: '',
    email: '',
    jobTitle: '',
    company: '',
    bio: ''
  });
  
  const [securityForm, setSecurityForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    projectUpdates: true,
    newFeatures: true
  });
  
  const [appearanceSettings, setAppearanceSettings] = useState({
    theme: 'dark',
    fontSize: 'medium'
  });
  
  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileForm({
      ...profileForm,
      [name]: value
    });
  };
  
  const handleSecurityChange = (e) => {
    const { name, value } = e.target;
    setSecurityForm({
      ...securityForm,
      [name]: value
    });
  };
  
  const handleNotificationChange = (e) => {
    const { name, checked } = e.target;
    setNotificationSettings({
      ...notificationSettings,
      [name]: checked
    });
  };
  
  const handleAppearanceChange = (e) => {
    const { name, value, type, checked } = e.target;
    setAppearanceSettings({
      ...appearanceSettings,
      [name]: type === 'checkbox' ? checked : value
    });
  };
  
  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };
  
  const renderTabContent = () => {
    switch (activeTab) {
      case 'profile':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white mb-6">Profile Settings</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="name" className="block text-gray-300 mb-2">Full Name</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={profileForm.name}
                  onChange={handleProfileChange}
                  placeholder="Enter your full name"
                  className="w-full bg-[#2a2a2a] text-gray-200 border border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:border-purple-500"
                />
              </div>
              <div>
                <label htmlFor="email" className="block text-gray-300 mb-2">Email Address</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={profileForm.email}
                  onChange={handleProfileChange}
                  placeholder="Enter your email"
                  className="w-full bg-[#2a2a2a] text-gray-200 border border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="jobTitle" className="block text-gray-300 mb-2">Job Title</label>
                <input
                  type="text"
                  id="jobTitle"
                  name="jobTitle"
                  value={profileForm.jobTitle}
                  onChange={handleProfileChange}
                  placeholder="Enter your job title"
                  className="w-full bg-[#2a2a2a] text-gray-200 border border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:border-purple-500"
                />
              </div>
              <div>
                <label htmlFor="company" className="block text-gray-300 mb-2">Company</label>
                <input
                  type="text"
                  id="company"
                  name="company"
                  value={profileForm.company}
                  onChange={handleProfileChange}
                  placeholder="Enter your company"
                  className="w-full bg-[#2a2a2a] text-gray-200 border border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>
            
            <div>
              <label htmlFor="bio" className="block text-gray-300 mb-2">Bio</label>
              <textarea
                id="bio"
                name="bio"
                value={profileForm.bio}
                onChange={handleProfileChange}
                placeholder="Tell us about yourself"
                rows="4"
                className="w-full bg-[#2a2a2a] text-gray-200 border border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:border-purple-500"
              ></textarea>
            </div>
            
            <div className="flex justify-end">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-6 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-lg font-medium text-white flex items-center gap-2"
              >
                <FontAwesomeIcon icon={faSave} />
                Save Changes
              </motion.button>
            </div>
          </div>
        );
        
      case 'security':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white mb-6">Security Settings</h2>
            
            <div className="bg-[#1e1e1e] rounded-xl p-6 border border-gray-800 mb-6">
              <h3 className="text-xl font-semibold text-white mb-4">Change Password</h3>
              
              <div className="space-y-4">
                <div>
                  <label htmlFor="currentPassword" className="block text-gray-300 mb-2">Current Password</label>
                  <input
                    type="password"
                    id="currentPassword"
                    name="currentPassword"
                    value={securityForm.currentPassword}
                    onChange={handleSecurityChange}
                    className="w-full bg-[#2a2a2a] text-gray-200 border border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:border-purple-500"
                  />
                </div>
                
                <div>
                  <label htmlFor="newPassword" className="block text-gray-300 mb-2">New Password</label>
                  <input
                    type="password"
                    id="newPassword"
                    name="newPassword"
                    value={securityForm.newPassword}
                    onChange={handleSecurityChange}
                    className="w-full bg-[#2a2a2a] text-gray-200 border border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:border-purple-500"
                  />
                </div>
                
                <div>
                  <label htmlFor="confirmPassword" className="block text-gray-300 mb-2">Confirm New Password</label>
                  <input
                    type="password"
                    id="confirmPassword"
                    name="confirmPassword"
                    value={securityForm.confirmPassword}
                    onChange={handleSecurityChange}
                    className="w-full bg-[#2a2a2a] text-gray-200 border border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>
              
              <div className="mt-4 flex justify-end">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-6 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-lg font-medium text-white flex items-center gap-2"
                >
                  <FontAwesomeIcon icon={faSave} />
                  Update Password
                </motion.button>
              </div>
            </div>
            
            <div className="bg-[#1e1e1e] rounded-xl p-6 border border-gray-800">
              <h3 className="text-xl font-semibold text-white mb-4">Delete Account</h3>
              <p className="text-gray-300 mb-4">
                Once you delete your account, there is no going back. Please be certain.
              </p>
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-6 py-2 bg-red-600/80 hover:bg-red-600 rounded-lg font-medium text-white flex items-center gap-2"
              >
                <FontAwesomeIcon icon={faTrash} />
                Delete Account
              </motion.button>
            </div>
          </div>
        );
        
      case 'notifications':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white mb-6">Notification Settings</h2>
            
            <div className="bg-[#1e1e1e] rounded-xl p-6 border border-gray-800">
              <h3 className="text-xl font-semibold text-white mb-4">Email Notifications</h3>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label htmlFor="emailNotifications" className="text-gray-300">
                    Email Notifications
                  </label>
                  <div className="relative inline-block w-12 h-6">
                    <input 
                      type="checkbox" 
                      id="emailNotifications" 
                      name="emailNotifications"
                      checked={notificationSettings.emailNotifications}
                      onChange={handleNotificationChange}
                      className="sr-only"
                    />
                    <div className={`w-12 h-6 rounded-full ${notificationSettings.emailNotifications ? 'bg-purple-600' : 'bg-gray-600'} transition-colors duration-200`}></div>
                    <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform duration-200 ${notificationSettings.emailNotifications ? 'transform translate-x-6' : ''}`}></div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <label htmlFor="projectUpdates" className="text-gray-300">
                    Project Updates
                  </label>
                  <div className="relative inline-block w-12 h-6">
                    <input 
                      type="checkbox" 
                      id="projectUpdates" 
                      name="projectUpdates"
                      checked={notificationSettings.projectUpdates}
                      onChange={handleNotificationChange}
                      className="sr-only"
                    />
                    <div className={`w-12 h-6 rounded-full ${notificationSettings.projectUpdates ? 'bg-purple-600' : 'bg-gray-600'} transition-colors duration-200`}></div>
                    <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform duration-200 ${notificationSettings.projectUpdates ? 'transform translate-x-6' : ''}`}></div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <label htmlFor="newFeatures" className="text-gray-300">
                    New Features & Updates
                  </label>
                  <div className="relative inline-block w-12 h-6">
                    <input 
                      type="checkbox" 
                      id="newFeatures" 
                      name="newFeatures"
                      checked={notificationSettings.newFeatures}
                      onChange={handleNotificationChange}
                      className="sr-only"
                    />
                    <div className={`w-12 h-6 rounded-full ${notificationSettings.newFeatures ? 'bg-purple-600' : 'bg-gray-600'} transition-colors duration-200`}></div>
                    <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform duration-200 ${notificationSettings.newFeatures ? 'transform translate-x-6' : ''}`}></div>
                  </div>
                </div>
              </div>
              
              <div className="mt-6 flex justify-end">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-6 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-lg font-medium text-white flex items-center gap-2"
                >
                  <FontAwesomeIcon icon={faSave} />
                  Save Preferences
                </motion.button>
              </div>
            </div>
          </div>
        );
        
      case 'appearance':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white mb-6">Appearance Settings</h2>
            
            <div className="bg-[#1e1e1e] rounded-xl p-6 border border-gray-800">
              <div className="space-y-6">
                <div>
                  <label htmlFor="theme" className="block text-gray-300 mb-2">Theme</label>
                  <select
                    id="theme"
                    name="theme"
                    value={appearanceSettings.theme}
                    onChange={handleAppearanceChange}
                    className="w-full bg-[#2a2a2a] text-gray-200 border border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:border-purple-500"
                  >
                    <option value="dark">Dark Mode</option>
                    <option value="light">Light Mode</option>
                    <option value="system">System Default</option>
                  </select>
                </div>
                
                <div>
                  <label htmlFor="fontSize" className="block text-gray-300 mb-2">Font Size</label>
                  <select
                    id="fontSize"
                    name="fontSize"
                    value={appearanceSettings.fontSize}
                    onChange={handleAppearanceChange}
                    className="w-full bg-[#2a2a2a] text-gray-200 border border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:border-purple-500"
                  >
                    <option value="small">Small</option>
                    <option value="medium">Medium</option>
                    <option value="large">Large</option>
                  </select>
                </div>
              </div>
              
              <div className="mt-6 flex justify-end">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-6 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-lg font-medium text-white flex items-center gap-2"
                >
                  <FontAwesomeIcon icon={faSave} />
                  Save Preferences
                </motion.button>
              </div>
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <>
      <Navbar />
      <div className="flex">
        <Sidebar />
        <main className="ml-[280px] flex-1 p-6 bg-[#121212] min-h-screen">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-3xl font-bold text-white mb-8">Settings</h1>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="md:col-span-1">
                <div className="bg-[#1e1e1e] rounded-xl overflow-hidden sticky top-6">
                  <ul>
                    <li>
                      <button
                        onClick={() => handleTabChange('profile')}
                        className={`w-full flex items-center gap-3 px-4 py-3 text-left ${
                          activeTab === 'profile' 
                            ? 'bg-purple-900/30 text-purple-400 border-l-4 border-purple-500' 
                            : 'text-gray-300 hover:bg-[#252525]'
                        }`}
                      >
                        <FontAwesomeIcon icon={faUser} />
                        Profile
                      </button>
                    </li>
                    <li>
                      <button
                        onClick={() => handleTabChange('security')}
                        className={`w-full flex items-center gap-3 px-4 py-3 text-left ${
                          activeTab === 'security' 
                            ? 'bg-purple-900/30 text-purple-400 border-l-4 border-purple-500' 
                            : 'text-gray-300 hover:bg-[#252525]'
                        }`}
                      >
                        <FontAwesomeIcon icon={faLock} />
                        Security
                      </button>
                    </li>
                    <li>
                      <button
                        onClick={() => handleTabChange('notifications')}
                        className={`w-full flex items-center gap-3 px-4 py-3 text-left ${
                          activeTab === 'notifications' 
                            ? 'bg-purple-900/30 text-purple-400 border-l-4 border-purple-500' 
                            : 'text-gray-300 hover:bg-[#252525]'
                        }`}
                      >
                        <FontAwesomeIcon icon={faBell} />
                        Notifications
                      </button>
                    </li>
                    <li>
                      <button
                        onClick={() => handleTabChange('appearance')}
                        className={`w-full flex items-center gap-3 px-4 py-3 text-left ${
                          activeTab === 'appearance' 
                            ? 'bg-purple-900/30 text-purple-400 border-l-4 border-purple-500' 
                            : 'text-gray-300 hover:bg-[#252525]'
                        }`}
                      >
                        <FontAwesomeIcon icon={faDesktop} />
                        Appearance
                      </button>
                    </li>
                  </ul>
                </div>
              </div>
              
              <div className="md:col-span-3">
                <div className="bg-[#1a1a2e]/60 backdrop-blur-xl rounded-2xl p-6 shadow-xl border border-[#ffffff1a]">
                  {renderTabContent()}
                </div>
              </div>
            </div>
          </motion.div>
        </main>
      </div>
    </>
  );
};

export default SettingsPage; 