import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faPaperPlane, 
  faEnvelope, 
  faExclamationCircle,
  faSpinner 
} from '@fortawesome/free-solid-svg-icons';
import Navbar from '../components/Navbar';
import axios from 'axios';
import { CONTACT_API } from '../config';

const ContactPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null);
  const [error, setError] = useState('');
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    // Clear error when user starts typing
    if (error) setError('');
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    
    try {
      const response = await axios.post(`${CONTACT_API}/send`, formData);
      
      if (response.data.success) {
        setSubmitStatus('success');
        // Reset form after successful submission
        setFormData({
          name: '',
          email: '',
          subject: '',
          message: ''
        });
        
        // Clear success message after 5 seconds
        setTimeout(() => {
          setSubmitStatus(null);
        }, 5000);
      } else {
        throw new Error(response.data.message || 'Failed to send message');
      }
    } catch (err) {
      console.error('Error sending message:', err);
      setError(err.response?.data?.message || err.message || 'Failed to send message. Please try again.');
      setSubmitStatus('error');
      
      // Clear error after 5 seconds
      setTimeout(() => {
        setError('');
        setSubmitStatus(null);
      }, 5000);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-[#121212] pt-20 pb-12">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-5xl mx-auto"
          >
            <div className="text-center mb-12">
              <h1 className="text-4xl font-bold text-white mb-4">Get in Touch</h1>
              <p className="text-xl text-gray-300 max-w-3xl mx-auto">
                Have questions about ClipSmart AI? We're here to help. Reach out to our team and we'll get back to you as soon as possible.
              </p>
            </div>
            
            <div className="bg-[#1a1a2e]/60 backdrop-blur-xl rounded-2xl p-8 shadow-xl border border-[#ffffff1a]">
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-purple-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FontAwesomeIcon icon={faEnvelope} className="text-xl text-purple-400" />
                </div>
                <p className="text-gray-300">
                  Email us at: <a href="mailto:contact@clipsmart.ai" className="text-purple-400 hover:underline">contact@clipsmart.ai</a>
                </p>
              </div>
              
              <h2 className="text-2xl font-bold text-white mb-6">Send us a Message</h2>
              
              {submitStatus === 'success' && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-green-900/30 border border-green-500/30 text-green-400 rounded-lg p-4 mb-6"
                >
                  <p>Your message has been sent successfully! We'll get back to you soon.</p>
                </motion.div>
              )}
              
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-red-900/30 border border-red-500/30 text-red-400 rounded-lg p-4 mb-6 flex items-center gap-2"
                >
                  <FontAwesomeIcon icon={faExclamationCircle} />
                  <p>{error}</p>
                </motion.div>
              )}
              
              <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <label htmlFor="name" className="block text-gray-300 mb-2">Your Name</label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      className="w-full bg-[#2a2a2a] text-gray-200 border border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:border-purple-500"
                    />
                  </div>
                  <div>
                    <label htmlFor="email" className="block text-gray-300 mb-2">Your Email</label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      className="w-full bg-[#2a2a2a] text-gray-200 border border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:border-purple-500"
                    />
                  </div>
                </div>
                
                <div className="mb-6">
                  <label htmlFor="subject" className="block text-gray-300 mb-2">Subject</label>
                  <input
                    type="text"
                    id="subject"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    required
                    className="w-full bg-[#2a2a2a] text-gray-200 border border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:border-purple-500"
                  />
                </div>
                
                <div className="mb-6">
                  <label htmlFor="message" className="block text-gray-300 mb-2">Message</label>
                  <textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    required
                    rows="5"
                    className="w-full bg-[#2a2a2a] text-gray-200 border border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:border-purple-500"
                  ></textarea>
                </div>
                
                <div className="text-right">
                  <motion.button
                    type="submit"
                    disabled={isSubmitting}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={`px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-lg font-medium text-white flex items-center gap-2 ml-auto ${
                      isSubmitting ? 'opacity-75 cursor-not-allowed' : ''
                    }`}
                  >
                    {isSubmitting ? (
                      <>
                        <FontAwesomeIcon icon={faSpinner} className="animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        Send Message
                        <FontAwesomeIcon icon={faPaperPlane} />
                      </>
                    )}
                  </motion.button>
                </div>
              </form>
            </div>
          </motion.div>
        </div>
      </div>
    </>
  );
};

export default ContactPage; 