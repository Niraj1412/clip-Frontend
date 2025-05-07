import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPaperPlane, faSmile, faStar } from '@fortawesome/free-solid-svg-icons';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';

const FeedbackPage = () => {
  const [feedback, setFeedback] = useState('');
  const [rating, setRating] = useState(0);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (feedback.trim() !== '') {
      // In a real app, you would send this feedback to your backend
      console.log('Feedback submitted:', { feedback, rating });
      setSubmitted(true);
      setFeedback('');
      setRating(0);
      
      // Reset the submitted state after 5 seconds
      setTimeout(() => {
        setSubmitted(false);
      }, 5000);
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
            <h1 className="text-3xl font-bold text-white mb-8">Give Feedback</h1>
            
            <div className="bg-[#1a1a2e]/60 backdrop-blur-xl rounded-2xl p-6 shadow-xl border border-[#ffffff1a] mb-8">
              <h2 className="text-2xl font-bold text-white mb-6">We Value Your Input</h2>
              
              <p className="text-gray-300 mb-6">
                Your feedback helps us improve ClipSmart AI. Tell us about your experience, suggest new features, or report any issues you've encountered.
              </p>
              
              {submitted ? (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-green-900/30 border border-green-500/30 text-green-400 rounded-lg p-4 mb-6 flex items-center"
                >
                  <FontAwesomeIcon icon={faSmile} className="text-xl mr-3" />
                  <p>Thank you for your feedback! We appreciate your input.</p>
                </motion.div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label className="block text-gray-300 mb-2">Rate your experience (optional)</label>
                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setRating(star)}
                          className="text-2xl focus:outline-none"
                        >
                          <FontAwesomeIcon 
                            icon={faStar} 
                            className={star <= rating ? 'text-yellow-400' : 'text-gray-600'} 
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <label htmlFor="feedback" className="block text-gray-300 mb-2">Your Feedback</label>
                    <textarea
                      id="feedback"
                      value={feedback}
                      onChange={(e) => setFeedback(e.target.value)}
                      placeholder="Tell us what you think about ClipSmart AI..."
                      rows="6"
                      required
                      className="w-full bg-[#2a2a2a] text-gray-200 border border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:border-purple-500"
                    ></textarea>
                  </div>
                  
                  <div className="flex justify-end">
                    <motion.button
                      type="submit"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="px-6 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-lg font-medium text-white flex items-center gap-2"
                    >
                      <FontAwesomeIcon icon={faPaperPlane} />
                      Submit Feedback
                    </motion.button>
                  </div>
                </form>
              )}
            </div>
            
            <div className="bg-[#1a1a2e]/60 backdrop-blur-xl rounded-2xl p-6 shadow-xl border border-[#ffffff1a]">
              <h2 className="text-2xl font-bold text-white mb-4">Contact Support</h2>
              <p className="text-gray-300 mb-4">
                Need direct assistance? Our support team is ready to help you.
              </p>
              <p className="text-gray-300">
                Email us at: <a href="mailto:support@clipsmart.ai" className="text-purple-400 hover:underline">support@clipsmart.ai</a>
              </p>
            </div>
          </motion.div>
        </main>
      </div>
    </>
  );
};

export default FeedbackPage; 