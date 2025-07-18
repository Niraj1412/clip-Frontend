import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faVideo, 
  faCut, 
  faFolder, 
  faCalendarAlt,
  faEye,
  faPlay,
  faPlus,
  faClock,
  faChevronRight,
  faChartBar,
  faCheck,
  faSpinner
} from '@fortawesome/free-solid-svg-icons';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import { API_URL, PROJECTS_API } from '../config';

const ExplorePage = () => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState({
    projects: true
  });
  const [error, setError] = useState(null);

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.4, ease: [0.25, 0.1, 0.25, 1.0] }
    }
  };

  // Added card hover animation
  const cardHoverAnimation = {
    rest: { 
      scale: 1,
      boxShadow: "0px 0px 0px rgba(124, 102, 255, 0)"
    },
    hover: { 
      scale: 1.03, 
      y: -10,
      boxShadow: "0px 15px 25px rgba(124, 102, 255, 0.2)",
      transition: { 
        duration: 0.3, 
        ease: "easeOut" 
      }
    }
  };

  // Added background particle effect
  const ParticleBackground = () => (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      {Array(15).fill(0).map((_, i) => (
        <motion.div
          key={`particle-${i}`}
          className="absolute rounded-full bg-[#7c66ff]/10"
          initial={{
            x: Math.random() * 100 + "%",
            y: Math.random() * 100 + "%",
            scale: Math.random() * 0.5 + 0.5,
            opacity: Math.random() * 0.5 + 0.1,
          }}
          animate={{
            x: [Math.random() * 100 + "%", Math.random() * 100 + "%", Math.random() * 100 + "%"],
            y: [Math.random() * 100 + "%", Math.random() * 100 + "%", Math.random() * 100 + "%"],
            opacity: [Math.random() * 0.3 + 0.1, Math.random() * 0.5 + 0.2, Math.random() * 0.3 + 0.1],
          }}
          transition={{
            duration: Math.random() * 20 + 30,
            repeat: Infinity,
            ease: "linear"
          }}
          style={{
            width: (Math.random() * 200 + 50) + "px",
            height: (Math.random() * 200 + 50) + "px",
            filter: "blur(" + (Math.random() * 50 + 50) + "px)"
          }}
        />
      ))}
    </div>
  );

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const userToken = localStorage.getItem('userToken') || localStorage.getItem('token');
    
    // Fetch projects
    try {
      const projectsResponse = await axios.get(PROJECTS_API, {
        headers: {
          Authorization: `Bearer ${userToken}`
        }
      });
      
      if (projectsResponse.data.success) {
        setProjects(projectsResponse.data.projects || []);
      } else {
        loadMockProjects();
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
      loadMockProjects();
    } finally {
      setLoading(prev => ({ ...prev, projects: false }));
    }
  };

  // Load mock projects when API fails
  const loadMockProjects = () => {
    // Check localStorage first
    const localProjects = localStorage.getItem('userProjects');
    if (localProjects) {
      try {
        const parsedProjects = JSON.parse(localProjects);
        if (Array.isArray(parsedProjects) && parsedProjects.length > 0) {
          setProjects(parsedProjects);
          return;
        }
      } catch (e) {
        console.error("Error parsing localStorage projects:", e);
      }
    }
    
    // Fallback to mock data
    setProjects([
      {
        id: '1',
        title: 'Marketing Video',
        createdAt: new Date().toISOString(),
        viewCount: 42,
        duration: 150,
        thumbnailUrl: 'https://via.placeholder.com/300x200/232323/6c5ce7?text=Marketing+Video'
      },
      {
        id: '2',
        title: 'Product Demo',
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        viewCount: 27,
        duration: 180,
        thumbnailUrl: 'https://via.placeholder.com/300x200/232323/0984e3?text=Product+Demo'
      },
      {
        id: '3',
        title: 'Tutorial Series',
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        viewCount: 105,
        duration: 320,
        thumbnailUrl: 'https://via.placeholder.com/300x200/232323/00b894?text=Tutorial+Series'
      },
      {
        id: '4',
        title: 'Company Update',
        createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
        viewCount: 62,
        duration: 210,
        thumbnailUrl: 'https://via.placeholder.com/300x200/232323/e84393?text=Company+Update'
      }
    ]);
  };

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    const remainingSeconds = Math.floor(seconds % 60);
    
    if (hours > 0) {
      return `${hours}:${String(remainingMinutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
    }
    return `${minutes}:${String(remainingSeconds).padStart(2, '0')}`;
  };

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Loading skeleton for projects
  const ProjectSkeleton = () => (
    <div className="bg-[#1A1A1A]/80 backdrop-blur-md rounded-xl overflow-hidden border border-[#2A2A2A] animate-pulse shadow-lg relative group">
      <div className="absolute inset-0 bg-gradient-to-br from-[#6c5ce7]/5 to-indigo-500/5 rounded-xl opacity-0 group-hover:opacity-100 transition-all duration-500"></div>
      <div className="aspect-video bg-[#252525]"></div>
      <div className="p-5">
        <div className="h-5 bg-[#252525] rounded mb-4 w-3/4"></div>
        <div className="flex justify-between">
          <div className="h-4 bg-[#252525] rounded w-1/4"></div>
          <div className="h-4 bg-[#252525] rounded w-1/6"></div>
        </div>
      </div>
    </div>
  );

  const SectionTitle = ({ title, viewMoreLink, action }) => (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
      <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white via-[#7c66ff]/90 to-white mb-3 sm:mb-0">{title}</h2>
      <div className="flex items-center gap-3">
        {action}
        {viewMoreLink && (
          <Link to={viewMoreLink} className="text-[#6c5ce7] hover:text-[#9d8fff] transition-colors flex items-center gap-1 text-sm group">
            <span className="border-b border-[#6c5ce7]/30 group-hover:border-[#9d8fff] transition-colors">View All</span>
            <FontAwesomeIcon icon={faChevronRight} className="text-xs group-hover:translate-x-1 transition-transform" />
          </Link>
        )}
      </div>
    </div>
  );

  // Enhanced Stat card component with improved design
  const StatCard = ({ icon, title, value, color }) => (
    <motion.div 
      whileHover={{ y: -5, transition: { duration: 0.2 } }}
      className="relative group"
    >
      <div className="absolute -inset-1 bg-gradient-to-br from-[#6c5ce7]/20 to-indigo-500/10 rounded-xl blur opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      <div className="bg-[#1A1A1A]/80 backdrop-blur-sm rounded-xl p-4 border border-[#2A2A2A] group-hover:border-[#6c5ce7]/40 transition-all duration-300 relative z-10 h-full shadow-xl">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-gray-400 text-xs mb-1">{title}</p>
            <h4 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-300 group-hover:from-white group-hover:to-[#7c66ff]/90 transition-all duration-300">
              <motion.span
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                {value}
              </motion.span>
            </h4>
          </div>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center relative">
            <div className="absolute inset-0 bg-gradient-to-br from-[#6c5ce7]/30 to-indigo-600/30 rounded-xl opacity-60 group-hover:opacity-100 transition-all duration-300"></div>
            <FontAwesomeIcon icon={icon} className="text-white text-lg relative z-10" />
          </div>
        </div>
      </div>
    </motion.div>
  );

  // Added feature card component
  const FeatureCard = ({ icon, title, description, onClick }) => (
    <motion.div
      initial="rest"
      animate="rest"
      variants={cardHoverAnimation}
      whileHover="hover"
      onClick={onClick}
      className="relative group"
    >
      <div className="absolute -inset-1 bg-gradient-to-br from-[#7c66ff]/30 to-indigo-600/20 rounded-xl blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      <div
        className="bg-[#151515]/80 backdrop-blur-sm rounded-xl p-5 cursor-pointer transition-all duration-500 border border-gray-800/40 hover:border-[#7c66ff]/40 shadow-xl relative z-10 h-full overflow-hidden"
      >
        <div className="absolute bottom-0 right-0 w-24 h-24 bg-gradient-to-br from-[#7c66ff]/5 to-indigo-600/5 rounded-tl-full opacity-0 group-hover:opacity-100 transition-all duration-700"></div>
        
        <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 relative">
          <div className="absolute inset-0 bg-gradient-to-br from-[#7c66ff]/20 to-indigo-600/20 rounded-xl opacity-60 group-hover:opacity-100 transition-all duration-300"></div>
          <FontAwesomeIcon icon={icon} className="text-[#7c66ff] text-xl relative z-10" />
        </div>
        <h3 className="text-white font-semibold text-lg mb-2 group-hover:text-[#7c66ff] transition-colors">{title}</h3>
        <p className="text-gray-400 text-sm">{description}</p>
        
        <motion.div 
          className="absolute bottom-0 right-0 w-8 h-8 flex items-center justify-center opacity-0 group-hover:opacity-100"
          initial={{ y: 20, opacity: 0 }}
          whileHover={{ scale: 1.2, rotate: 90 }}
          animate={{ y: 0, opacity: 1, transition: { delay: 0.2 } }}
        >
          <FontAwesomeIcon icon={faChevronRight} className="text-[#7c66ff]/70 text-sm" />
        </motion.div>
      </div>
    </motion.div>
  );

  return (
    <>
      <Navbar />
      <div className="flex h-screen overflow-hidden">
        <Sidebar />
        <main className="ml-[280px] mt-12 flex-1 bg-[#0a0a0a] overflow-y-auto h-full text-white relative">
          {/* Enhanced Background Elements */}
          <ParticleBackground />
          <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
            <div className="absolute top-20 left-1/4 w-[40rem] h-[40rem] bg-[#7c66ff]/8 rounded-full filter blur-[120px] animate-pulse-slow opacity-30"></div>
            <div className="absolute bottom-40 right-1/4 w-[45rem] h-[45rem] bg-indigo-500/8 rounded-full filter blur-[150px] animate-pulse-slower opacity-30"></div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full h-full bg-gradient-radial from-[#7c66ff]/5 to-transparent opacity-10"></div>
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiM3YzY2ZmYiIGZpbGwtb3BhY2l0eT0iMC4wMiI+PHBhdGggZD0iTTM2IDM0di00aC0ydjRoLTR2Mmg0djRoMnYtNGg0di0ySDZ6TTYgMzR2LTRINHY0SDB2Mmg0djRoMnYtNGg0di0ySDZ6TTYgNFYwSDR2NEgwdjJoNHY0aDJWNmg0VjRoLTR6TTYgMzR2LTRINHY0SDB2Mmg0djRoMnYtNGg0di0ySDZ6TTYgNFYwSDR2NEgwdjJoNHY0aDJWNmg0VjRINnoiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-20 bg-fixed"></div>
          </div>
          
          <div className="max-w-[1600px] mx-auto px-6 py-8 relative z-10">
            {/* Custom scrollbar styles */}
            <style jsx>{`
              main::-webkit-scrollbar {
                width: 6px;
                background-color: transparent;
              }
              main::-webkit-scrollbar-track {
                background-color: rgba(28, 28, 28, 0.3);
                border-radius: 10px;
                margin: 10px 0;
              }
              main::-webkit-scrollbar-thumb {
                background-color: #7c66ff;
                border-radius: 10px;
                border: 2px solid rgba(10, 10, 10, 0.2);
              }
              main::-webkit-scrollbar-thumb:hover {
                background-color: #9d8fff;
              }
              .animate-pulse-slow {
                animation: pulse-slow 3s cubic-bezier(0.4, 0, 0.6, 1) infinite;
              }
              .animate-pulse-slower {
                animation: pulse-slow 5s cubic-bezier(0.4, 0, 0.6, 1) infinite;
              }
              @keyframes pulse-slow {
                0%, 100% {
                  opacity: 0.3;
                }
                50% {
                  opacity: 0.8;
                }
              }
              
              /* Added animations */
              @keyframes float {
                0%, 100% {
                  transform: translateY(0);
                }
                50% {
                  transform: translateY(-10px);
                }
              }
              .animate-float {
                animation: float 6s ease-in-out infinite;
              }
              
              @keyframes gradient-shift {
                0% {
                  background-position: 0% 50%;
                }
                50% {
                  background-position: 100% 50%;
                }
                100% {
                  background-position: 0% 50%;
                }
              }
              .animate-gradient {
                background-size: 200% 200%;
                animation: gradient-shift 8s ease infinite;
              }
            `}</style>
            
            {/* Welcome section - Enhanced with more impressive visuals */}
            <motion.section 
              className="mb-8 relative"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <div className="absolute -inset-1 bg-gradient-to-r from-[#7c66ff]/20 via-[#a391ff]/10 to-[#7c66ff]/20 rounded-2xl blur-xl opacity-70 group-hover:opacity-100 transition-all duration-1000"></div>
              
              <div className="bg-[#151515]/80 backdrop-blur-sm rounded-2xl overflow-hidden shadow-2xl border border-[#7c66ff]/20 relative animate-gradient bg-gradient-to-r from-[#0a0a0a] via-[#121212] to-[#0a0a0a]">
                <div className="relative">
                  <motion.div 
                    className="absolute inset-0 w-full h-full bg-[url('https://images.unsplash.com/photo-1616763355548-1b606f439f86?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2340&q=80')] bg-cover bg-center"
                    initial={{ scale: 1.1, opacity: 0 }}
                    animate={{ scale: 1, opacity: 0.15 }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                  ></motion.div>
                  
                  <div className="absolute inset-0 bg-gradient-to-r from-[#151515] to-[#151515]/80 z-[1]"></div>
                  
                  <div className="absolute top-0 right-0 w-64 h-64 bg-[#7c66ff]/5 rounded-full filter blur-[80px] animate-float"></div>
                  <div className="absolute bottom-0 left-0 w-32 h-32 bg-indigo-500/5 rounded-full filter blur-[50px] animate-float" style={{ animationDelay: "-3s" }}></div>
                  
                  <div className="p-6 md:p-8 relative z-10">
                    <motion.div 
                      className="flex flex-col md:flex-row md:items-center justify-between gap-6"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.7, delay: 0.3 }}
                    >
                      <div className="max-w-2xl">
                        <h1 className="text-3xl md:text-4xl font-bold mb-3">
                          <motion.span 
                            className="bg-clip-text text-transparent bg-gradient-to-r from-white via-[#7c66ff]/90 to-white animate-gradient"
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5 }}
                          >
                            Welcome to ClipSmart AI
                          </motion.span>
                        </h1>
                        <motion.p 
                          className="text-gray-300 text-base leading-relaxed"
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.5, delay: 0.2 }}
                        >
                          Create compelling video projects, extract key insights, and transform your content into engaging narratives with our <span className="text-[#7c66ff]">AI-powered platform</span>.
                        </motion.p>
                      </div>
                      
                      <motion.div
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="relative group"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.5, delay: 0.4 }}
                      >
                        <div className="absolute -inset-1 bg-gradient-to-r from-[#7c66ff] to-indigo-600 rounded-xl blur opacity-70 group-hover:opacity-100 transition-all duration-500"></div>
                        <button 
                          onClick={() => navigate('/dashboard')}
                          className="relative bg-gradient-to-r from-[#7c66ff] to-indigo-600 px-6 py-3 text-white rounded-xl font-medium text-lg flex items-center gap-3 shadow-xl shadow-[#7c66ff]/20 overflow-hidden group"
                        >
                          <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl"></div>
                          <div className="absolute inset-0 scale-0 group-hover:scale-100 transition-transform duration-500 rounded-xl bg-white/10 origin-bottom-right"></div>
                          <FontAwesomeIcon icon={faPlus} className="relative z-10" />
                          <span className="relative z-10">New Project</span>
                        </button>
                      </motion.div>
                    </motion.div>
                  </div>
                </div>
                
                {/* Stats section */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-6 bg-[#151515]/60 backdrop-blur-sm border-t border-[#2A2A2A]/50">
                  <StatCard 
                    icon={faFolder} 
                    title="Total Projects" 
                    value={projects.length || 0} 
                    color="#7c66ff" 
                  />
                  <StatCard 
                    icon={faEye} 
                    title="Project Views" 
                    value={projects.reduce((total, project) => total + (project.viewCount || 0), 0)} 
                    color="#7c66ff" 
                  />
                  <StatCard 
                    icon={faChartBar} 
                    title="Completion Rate" 
                    value={`${projects.filter(p => p.status === 'completed').length ? Math.round((projects.filter(p => p.status === 'completed').length / projects.length) * 100) : 0}%`} 
                    color="#7c66ff" 
                  />
                </div>
              </div>
            </motion.section>
            
            {/* Create Section - Enhanced with better UI */}
            <motion.section 
              className="mb-8"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
            >
              <SectionTitle title="Create" />
              
              <motion.div 
                className="grid grid-cols-1 sm:grid-cols-3 gap-5"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
              >
                <FeatureCard 
                  icon={faVideo}
                  title="Create Narrative Video"
                  description="Generate professional videos from your content with AI assistance"
                  onClick={() => navigate('/dashboard')}
                />
                
                <FeatureCard 
                  icon={faCut}
                  title="Extract Key Points"
                  description="Pull insights and highlights from videos with intelligent analysis"
                  onClick={() => navigate('/dashboard')}
                />
                
                <FeatureCard 
                  icon={faFolder}
                  title="My Projects"
                  description="View and manage your saved projects in one centralized location"
                  onClick={() => navigate('/my-projects')}
                />
              </motion.div>
            </motion.section>
            
            {/* My Projects Section - Enhanced with more visuals */}
            <motion.section 
              className="mb-6"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
            >
              <SectionTitle 
                title="My Projects" 
                viewMoreLink="/profile"
                action={
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="text-sm bg-[#1A1A1A] text-white px-4 py-2 rounded-lg border border-[#2A2A2A] flex items-center gap-2 hover:bg-[#252525] transition-colors duration-300"
                    onClick={() => navigate('/dashboard')}
                  >
                    <FontAwesomeIcon icon={faPlus} className="text-[#7c66ff]" />
                    <span>Add New</span>
                  </motion.button>
                }
              />
              
              <AnimatePresence>
                {loading.projects ? (
                  // Show loading skeletons when loading
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                    {Array(4).fill(0).map((_, index) => (
                      <motion.div
                        key={`skeleton-${index}`}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.1 }}
                      >
                        <ProjectSkeleton />
                      </motion.div>
                    ))}
                  </div>
                ) : projects.length === 0 ? (
                  // Enhanced empty state with gradients and animations
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="relative group"
                  >
                    <div className="absolute -inset-1 bg-gradient-to-br from-[#7c66ff]/20 to-indigo-600/20 rounded-xl blur-lg opacity-30 transition-opacity duration-300"></div>
                    <div className="bg-[#151515]/80 backdrop-blur-sm rounded-xl p-10 text-center border border-gray-800/40 shadow-xl relative z-10">
                      <div className="w-20 h-20 mx-auto mb-5 relative">
                        <div className="absolute -inset-1 bg-gradient-to-r from-[#7c66ff]/30 to-indigo-600/30 rounded-full blur-md opacity-40"></div>
                        <div className="relative w-full h-full rounded-full bg-[#1a1a1a] flex items-center justify-center border border-gray-800/50">
                          <FontAwesomeIcon icon={faFolder} className="text-gray-500 text-3xl" />
                        </div>
                      </div>
                      <h3 className="text-xl font-bold text-white mb-3">No projects yet</h3>
                      <p className="text-gray-400 mb-6 max-w-md mx-auto text-sm">Start creating your first video project by uploading content or extracting clips</p>
                      <motion.div
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="relative inline-block group"
                      >
                        <div className="absolute -inset-0.5 bg-gradient-to-r from-[#7c66ff] to-indigo-600 rounded-xl blur opacity-70 group-hover:opacity-100 transition-all duration-500"></div>
                        <button 
                          onClick={() => navigate('/dashboard')}
                          className="relative bg-gradient-to-r from-[#7c66ff] to-indigo-600 px-6 py-3 text-white rounded-xl font-medium text-base flex items-center gap-3 shadow-xl shadow-[#7c66ff]/20"
                        >
                          <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl"></div>
                          <FontAwesomeIcon icon={faPlus} className="text-sm" />
                          <span>Create New Project</span>
                        </button>
                      </motion.div>
                    </div>
                  </motion.div>
                ) : (
                  // Enhanced Projects grid with glass effects and responsive design
                  <motion.div 
                    className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5"
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                  >
                    {projects.map((project, index) => (
                      <motion.div
                        key={project._id || project.id}
                        initial="rest"
                        animate="rest"
                        variants={cardHoverAnimation}
                        whileHover="hover"
                        className="relative group"
                        onClick={() => {
                          const projectId = project._id || project.id;
                          if (!projectId) {
                            console.error('Invalid project ID:', project);
                            return;
                          }
                          // Remove any potential /api/projects/ prefix from the ID
                          const cleanId = projectId.replace('/api/projects/', '');
                          navigate(`/project/${cleanId}`);
                        }}
                      >
                        <div className="absolute -inset-1 bg-gradient-to-br from-[#7c66ff]/20 to-indigo-600/10 rounded-xl blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        <div className="bg-[#151515]/80 backdrop-blur-sm rounded-xl overflow-hidden cursor-pointer transition-all duration-500 border border-gray-800/40 hover:border-[#7c66ff]/40 shadow-xl relative z-10 h-full">
                          {/* Enhanced Thumbnail with Glass Morphism */}
                          <div className="relative aspect-video bg-[#121212] overflow-hidden">
                            {project.thumbnailUrl ? (
                              <img 
                                src={project.thumbnailUrl} 
                                alt={project.title} 
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#1a1a1a] to-[#232323]">
                                <FontAwesomeIcon icon={faVideo} className="text-[#7c66ff]/40 text-4xl" />
                              </div>
                            )}
                            
                            {/* Duration Badge - Enhanced */}
                            <div className="absolute bottom-3 right-3 bg-black/60 backdrop-blur-md text-white text-xs px-3 py-1.5 rounded-full flex items-center gap-1.5 border border-white/10 shadow-lg group-hover:bg-[#7c66ff]/80 transition-colors duration-300">
                              <FontAwesomeIcon icon={faClock} className="text-xs" />
                              {formatTime(project.duration || 0)}
                            </div>
                            
                            {/* Status Badge - Enhanced */}
                            {project.status && (
                              <div className={`absolute top-3 left-3 text-white text-xs px-3 py-1.5 rounded-full flex items-center gap-1.5 backdrop-blur-sm shadow-lg transition-all duration-300 ${
                                project.status === 'completed' 
                                  ? 'bg-green-500/90 shadow-green-500/20 group-hover:bg-green-400/90' 
                                  : 'bg-yellow-500/90 shadow-yellow-500/20 group-hover:bg-yellow-400/90'
                              }`}>
                                <FontAwesomeIcon 
                                  icon={project.status === 'completed' ? faCheck : faSpinner} 
                                  className={`text-[10px] ${project.status !== 'completed' && 'animate-spin'}`} 
                                />
                                {project.status === 'completed' ? 'Completed' : 'In Progress'}
                              </div>
                            )}
                            
                            {/* Enhanced Play Overlay with Animated Gradient */}
                            <div className="absolute inset-0 bg-gradient-to-t from-[#151515] via-transparent to-transparent opacity-70"></div>
                            <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                              <motion.div 
                                initial={{ scale: 0.8, opacity: 0 }}
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                className="w-16 h-16 rounded-full bg-gradient-to-br from-[#7c66ff] to-indigo-600 flex items-center justify-center opacity-0 group-hover:opacity-100 shadow-lg shadow-[#7c66ff]/30 transition-all duration-500 overflow-hidden"
                              >
                                <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-full"></div>
                                <div className="absolute inset-0 bg-gradient-to-r from-[#7c66ff] via-indigo-600 to-[#7c66ff] opacity-0 group-hover:opacity-100 animate-gradient"></div>
                                <FontAwesomeIcon icon={faPlay} className="text-white text-xl ml-1 relative z-10" />
                              </motion.div>
                            </div>
                          </div>
                          
                          {/* Enhanced Project Info Section with Better Typography */}
                          <div className="p-4">
                            <h3 className="text-lg font-semibold mb-2 truncate bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-300 group-hover:from-white group-hover:to-[#7c66ff] transition-all duration-300">
                              {project.title}
                            </h3>
                            <div className="flex justify-between text-xs">
                              <div className="flex items-center gap-2 text-gray-400 group-hover:text-gray-300 transition-colors duration-300">
                                <div className="w-6 h-6 rounded-full bg-[#1A1A1A] flex items-center justify-center group-hover:bg-[#2A2A2A] transition-colors duration-300">
                                  <FontAwesomeIcon icon={faCalendarAlt} className="text-[#7c66ff] group-hover:text-[#9d8fff] transition-colors duration-300" />
                                </div>
                                <span>{formatDate(project.createdAt)}</span>
                              </div>
                              <div className="flex items-center gap-2 text-gray-400 group-hover:text-gray-300 transition-colors duration-300">
                                <div className="w-6 h-6 rounded-full bg-[#1A1A1A] flex items-center justify-center group-hover:bg-[#2A2A2A] transition-colors duration-300">
                                  <FontAwesomeIcon icon={faEye} className="text-[#7c66ff] group-hover:text-[#9d8fff] transition-colors duration-300" />
                                </div>
                                <span>{project.viewCount || 0}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.section>
          </div>
        </main>
      </div>
    </>
  );
};

export default ExplorePage; 