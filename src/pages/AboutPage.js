import React from 'react';
import { motion } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faVideo, 
  faBrain, 
  faArrowRight, 
  faRocket,
  faUsers,
  faShieldAlt,
  faGlobe
} from '@fortawesome/free-solid-svg-icons';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';

const AboutPage = () => {
  const features = [
    {
      icon: faVideo,
      title: "Smart Video Clipping",
      description: "Our AI-powered technology automatically identifies the most engaging segments from your videos, saving you hours of manual editing work."
    },
    {
      icon: faBrain,
      title: "AI Insights",
      description: "Get intelligent recommendations for clips that will best resonate with your audience, based on content analysis and engagement patterns."
    },
    {
      icon: faRocket,
      title: "Fast Processing",
      description: "Process your videos quickly and efficiently with our optimized AI algorithms, getting your content ready in minutes."
    },
    {
      icon: faUsers,
      title: "Community Driven",
      description: "Join a growing community of content creators who are revolutionizing their video content strategy with ClipSmart AI."
    }
  ];

  const stats = [
    { value: "10K+", label: "Active Users" },
    { value: "1M+", label: "Videos Processed" },
    { value: "5M+", label: "Clips Generated" },
    { value: "99.9%", label: "Uptime" }
  ];

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
            {/* Hero Section */}
            <div className="text-center mb-16">
              <motion.h1 
                className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-purple-500 to-indigo-600 bg-clip-text text-transparent mb-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                About ClipSmart AI
              </motion.h1>
              <motion.p 
                className="text-xl text-gray-300 max-w-3xl mx-auto"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                We're revolutionizing video content creation with AI-powered clip generation technology that helps content creators, marketers, and businesses create engaging short-form videos in minutes.
              </motion.p>
            </div>

            {/* Mission Section */}
            <motion.div 
              className="bg-[#1a1a2e]/60 backdrop-blur-xl rounded-2xl p-8 shadow-xl border border-[#ffffff1a] mb-16"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <h2 className="text-3xl font-bold text-white mb-6">Our Mission</h2>
              <p className="text-lg text-gray-300 mb-4">
                At ClipSmart AI, we believe in the power of video to communicate, engage, and inspire. Our mission is to make professional video editing accessible to everyone by leveraging the latest advancements in artificial intelligence.
              </p>
              <p className="text-lg text-gray-300">
                We're dedicated to helping content creators save time and maximize their reach by transforming long-form content into powerful, shareable clips that capture attention and drive engagement.
              </p>
            </motion.div>

            {/* Features Grid */}
            <motion.div 
              className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
            >
              {features.map((feature, index) => (
                <motion.div
                  key={feature.title}
                  className="bg-[#1a1a2e]/60 backdrop-blur-xl rounded-xl p-6 border border-[#ffffff1a] hover:border-purple-500/30 transition-all duration-300"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.1 * index }}
                >
                  <div className="w-12 h-12 bg-purple-900/30 rounded-lg flex items-center justify-center mb-4">
                    <FontAwesomeIcon icon={feature.icon} className="text-xl text-purple-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-3">{feature.title}</h3>
                  <p className="text-gray-300">{feature.description}</p>
                </motion.div>
              ))}
            </motion.div>

            {/* Stats Section */}
            <motion.div 
              className="bg-[#1a1a2e]/60 backdrop-blur-xl rounded-2xl p-8 shadow-xl border border-[#ffffff1a] mb-16"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.6 }}
            >
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {stats.map((stat, index) => (
                  <motion.div
                    key={stat.label}
                    className="text-center"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 * index }}
                  >
                    <div className="text-3xl font-bold text-purple-400 mb-2">{stat.value}</div>
                    <div className="text-gray-300">{stat.label}</div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* CTA Section */}
            <motion.div 
              className="text-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.7 }}
            >
              <Link to="/signup">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-8 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl font-medium text-white flex items-center gap-2 mx-auto"
                >
                  Get Started Today
                  <FontAwesomeIcon icon={faArrowRight} />
                </motion.button>
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </>
  );
};

export default AboutPage; 