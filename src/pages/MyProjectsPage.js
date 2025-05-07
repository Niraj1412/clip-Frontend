import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faFolderOpen, 
  faPlus, 
  faVideo,
  faCalendarAlt,
  faEye,
  faPlay,
  faClock,
  faSpinner,
  faChartLine,
  faFilm,
  faSearch,
  faFilter,
  faBrain,
  faCheck
} from '@fortawesome/free-solid-svg-icons';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import { PROJECTS_API } from '../config';

const MyProjectsPage = () => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('date');
  const [processingStage, setProcessingStage] = useState(null);

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

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    setLoading(true);
    const userToken = localStorage.getItem('userToken') || localStorage.getItem('token');
    
    try {
      const response = await axios.get(PROJECTS_API, {
        headers: {
          Authorization: `Bearer ${userToken}`
        }
      });
      
      if (response.data.success) {
        setProjects(response.data.projects || []);
      } else {
        loadMockProjects();
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
      setError('Failed to load projects. Please try again later.');
      loadMockProjects();
    } finally {
      setLoading(false);
    }
  };

  const loadMockProjects = () => {
    const mockProjects = [
      {
        id: '1',
        title: 'Marketing Campaign Video',
        createdAt: new Date().toISOString(),
        viewCount: 42,
        duration: 150,
        thumbnailUrl: 'https://via.placeholder.com/300x200/232323/6c5ce7?text=Marketing+Video',
        category: 'marketing'
      },
      {
        id: '2',
        title: 'Product Demo Reel',
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        viewCount: 27,
        duration: 180,
        thumbnailUrl: 'https://via.placeholder.com/300x200/232323/0984e3?text=Product+Demo',
        category: 'product'
      }
    ];
    setProjects(mockProjects);
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

  const filteredProjects = projects
    .filter(project => {
      const matchesSearch = project.title.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesFilter = filter === 'all' || project.category === filter;
      return matchesSearch && matchesFilter;
    })
    .sort((a, b) => {
      if (sortBy === 'date') {
        return new Date(b.createdAt) - new Date(a.createdAt);
      } else if (sortBy === 'views') {
        return b.viewCount - a.viewCount;
      }
      return 0;
    });

  // Loading skeleton for projects
  const ProjectSkeleton = () => (
    <div className="bg-[#1A1A1A] rounded-xl overflow-hidden border border-[#2A2A2A] animate-pulse">
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

  // Stats Section
  const StatsSection = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
      <motion.div
        whileHover={{ scale: 1.02 }}
        className="bg-gradient-to-br from-purple-600/20 to-indigo-600/20 rounded-xl p-6 border border-purple-500/20"
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-purple-900/30 rounded-lg flex items-center justify-center">
            <FontAwesomeIcon icon={faFilm} className="text-2xl text-purple-400" />
          </div>
          <div>
            <h3 className="text-gray-400 text-sm">Total Projects</h3>
            <p className="text-2xl font-bold text-white">{projects.length}</p>
          </div>
        </div>
      </motion.div>

      <motion.div
        whileHover={{ scale: 1.02 }}
        className="bg-gradient-to-br from-emerald-600/20 to-teal-600/20 rounded-xl p-6 border border-emerald-500/20"
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-900/30 rounded-lg flex items-center justify-center">
            <FontAwesomeIcon icon={faChartLine} className="text-2xl text-emerald-400" />
          </div>
          <div>
            <h3 className="text-gray-400 text-sm">Avg. Duration</h3>
            <p className="text-2xl font-bold text-white">
              {formatTime(projects.reduce((sum, project) => sum + (project.duration || 0), 0) / Math.max(projects.length, 1))}
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );

  // Create a component to track processing stages
  const ProcessingIndicator = () => {
    if (!processingStage) return null;
    
    const stages = [
      { id: 'transcript', label: 'Processing Transcript', icon: faVideo },
      { id: 'analysis', label: 'Analyzing Content', icon: faBrain },
      { id: 'clips', label: 'Generating Clips', icon: faFilm },
      { id: 'rendering', label: 'Rendering Final Video', icon: faSpinner }
    ];
    
    const currentStageIndex = stages.findIndex(stage => stage.id === processingStage);
    
    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-[#1A1A1A]/80 backdrop-blur-xl rounded-xl p-6 border border-purple-500/30 mb-8 shadow-lg"
      >
        <h3 className="text-xl font-semibold text-white mb-4">Processing Your Latest Project</h3>
        <div className="space-y-4">
          {stages.map((stage, index) => (
            <div key={stage.id} className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 ${
                index < currentStageIndex ? 'bg-green-500/20 text-green-400' : 
                index === currentStageIndex ? 'bg-purple-500/20 text-purple-400 animate-pulse' : 
                'bg-gray-500/20 text-gray-500'
              }`}>
                <FontAwesomeIcon icon={stage.icon} className={index === currentStageIndex ? 'animate-spin' : ''} />
              </div>
              <span className={`${
                index < currentStageIndex ? 'text-green-400' : 
                index === currentStageIndex ? 'text-white' : 
                'text-gray-500'
              }`}>
                {stage.label}
              </span>
              {index < currentStageIndex && (
                <FontAwesomeIcon icon={faCheck} className="ml-2 text-green-400" />
              )}
            </div>
          ))}
        </div>
        <p className="text-gray-400 mt-4 text-sm">
          This process may take a few minutes. You can continue to browse while we work on your content.
        </p>
      </motion.div>
    );
  };

  return (
    <>
      <Navbar />
      <div className="flex h-screen overflow-hidden">
        <Sidebar />
        <main className="ml-[280px] flex-1 p-6 bg-[#121212] min-h-screen overflow-y-auto mt-16">
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

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="relative z-10"
          >
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
              <div>
                <h1 className="text-3xl font-bold text-white mb-2">My Projects</h1>
                <p className="text-gray-400">Manage and organize your video projects</p>
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/dashboard')}
                className="px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl font-medium text-white flex items-center gap-2 shadow-lg shadow-purple-600/20"
              >
                <FontAwesomeIcon icon={faPlus} />
                Create New Project
              </motion.button>
            </div>

            <ProcessingIndicator />

            <StatsSection />

            <div className="bg-[#1A1A1A]/60 backdrop-blur-xl rounded-xl p-6 border border-[#2A2A2A] mb-8">
              <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="relative flex-1 w-full">
                  <FontAwesomeIcon icon={faSearch} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search projects..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-[#252525] text-gray-200 border border-[#3A3A3A] rounded-lg pl-12 pr-4 py-2 focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div className="flex gap-4 w-full md:w-auto">
                  <select
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    className="bg-[#252525] text-gray-200 border border-[#3A3A3A] rounded-lg px-4 py-2 focus:outline-none focus:border-purple-500"
                  >
                    <option value="all">All Categories</option>
                    <option value="marketing">Marketing</option>
                    <option value="product">Product</option>
                    <option value="social">Social Media</option>
                  </select>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="bg-[#252525] text-gray-200 border border-[#3A3A3A] rounded-lg px-4 py-2 focus:outline-none focus:border-purple-500"
                  >
                    <option value="date">Sort by Date</option>
                    <option value="views">Sort by Views</option>
                  </select>
                </div>
              </div>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-red-900/30 border border-red-500/30 text-red-400 rounded-xl p-4 mb-6"
              >
                {error}
              </motion.div>
            )}

            <AnimatePresence>
              {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[1, 2, 3, 4, 5, 6].map((index) => (
                    <ProjectSkeleton key={index} />
                  ))}
                </div>
              ) : filteredProjects.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-[#1A1A1A]/60 backdrop-blur-xl rounded-xl p-12 text-center border border-[#2A2A2A]"
                >
                  <FontAwesomeIcon icon={faFolderOpen} className="text-5xl text-gray-600 mb-4" />
                  <h2 className="text-xl font-semibold text-white mb-3">No Projects Found</h2>
                  <p className="text-gray-400 mb-8">
                    {searchTerm ? 'No projects match your search criteria.' : 'Start creating your first video project by clicking the button below.'}
                  </p>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => navigate('/dashboard')}
                    className="px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl font-medium text-white inline-flex items-center gap-2 shadow-lg shadow-purple-600/20"
                  >
                    <FontAwesomeIcon icon={faPlus} />
                    Create New Project
                  </motion.button>
                </motion.div>
              ) : (
                <motion.div
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                  className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                >
                  {filteredProjects.map((project) => (
                    <motion.div
                      key={project._id || project.id}
                      variants={itemVariants}
                      whileHover={{ y: -8, transition: { duration: 0.2 } }}
                      className="group cursor-pointer"
                      onClick={() => {
                        const projectId = project._id || project.id;
                        if (!projectId) {
                          console.error('Invalid project ID:', project);
                          return;
                        }
                        const cleanId = projectId.replace('/api/projects/', '');
                        navigate(`/project/${cleanId}`);
                      }}
                    >
                      <div className="bg-[#1A1A1A]/60 backdrop-blur-xl rounded-xl overflow-hidden border border-[#2A2A2A] hover:border-purple-500/30 transition-all duration-300 shadow-lg hover:shadow-purple-600/10">
                        <div className="relative aspect-video bg-[#252525] overflow-hidden">
                          {project.thumbnailUrl ? (
                            <img 
                              src={project.thumbnailUrl} 
                              alt={project.title} 
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-[#252525]">
                              <FontAwesomeIcon icon={faVideo} className="text-gray-600 text-3xl" />
                            </div>
                          )}
                          
                          <div className="absolute bottom-3 right-3 bg-black/80 text-white text-xs px-2 py-1 rounded-md flex items-center gap-1.5">
                            <FontAwesomeIcon icon={faClock} className="text-xs" />
                            {formatTime(project.duration || 0)}
                          </div>
                          
                          <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <div className="bg-purple-600 w-14 h-14 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transform scale-75 group-hover:scale-100 transition-all duration-300 shadow-lg">
                              <FontAwesomeIcon icon={faPlay} className="text-white text-xl ml-1" />
                            </div>
                          </div>
                        </div>
                        
                        <div className="p-5">
                          <h3 className="text-white font-medium text-lg mb-3 truncate group-hover:text-purple-400 transition-colors">
                            {project.title}
                          </h3>
                          <div className="flex justify-between text-sm text-gray-400">
                            <div className="flex items-center gap-1.5">
                              <FontAwesomeIcon icon={faCalendarAlt} className="text-xs" />
                              <span>{formatDate(project.createdAt)}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <FontAwesomeIcon icon={faEye} className="text-xs" />
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
          </motion.div>
        </main>
      </div>
    </>
  );
};

export default MyProjectsPage; 