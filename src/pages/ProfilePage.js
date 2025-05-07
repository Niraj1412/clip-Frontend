import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faUser, 
  faFilm, 
  faTrash, 
  faDownload, 
  faShare, 
  faPlay, 
  faExclamationTriangle,
  faCalendarAlt,
  faEnvelope,
  faEye,
  faPen,
  faChartLine,
  faCheck,
  faShieldAlt,
  faArrowUp,
  faVideo,
  faGem,
  faDatabase,
  faCloud,
  faXmark,
  faSpinner,
  faPlus,
  faEdit,
  faArrowRight
} from '@fortawesome/free-solid-svg-icons';
import axios from 'axios';
import { motion } from 'framer-motion';
import { API_URL, PROJECTS_API } from '../config';
import Navbar from '../components/Navbar';
import '../styles/ProfilePage.css';
import authService from '../services/authService';

const ProfilePage = () => {
  const [user, setUser] = useState(null);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('all'); // all, recent, popular
  const [notification, setNotification] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        
        // Get current user data from localStorage
        const userDataFromStorage = JSON.parse(localStorage.getItem('user') || '{}');
        const userId = userDataFromStorage?.id;
        
        // Check if user data exists in localStorage
        if (!userDataFromStorage || !userId) {
          // No user data in localStorage, try get from auth service
          const authUser = authService.getCurrentUser();
          if (!authUser) {
            throw new Error("User not authenticated. Please log in.");
          }
          setUser(authUser);
        } else {
          // Use user data from localStorage
          setUser({
            ...userDataFromStorage,
            createdAt: userDataFromStorage.createdAt || new Date().toISOString() // Default createdAt if not present
          });
        }

        // Get projects using the PROJECTS_API from config
        try {
          const token = localStorage.getItem('token');
          const response = await axios.get(PROJECTS_API, {
            headers: {
              Authorization: `Bearer ${token}`
            }
          });
          
          if (response.data && response.data.success && response.data.projects) {
            setProjects(response.data.projects);
          } else {
            // Fallback to mock data for development
            setProjects([
              {
                _id: '1',
                title: 'Marketing Video',
                description: 'A promotional video for our new product line',
                createdAt: new Date().toISOString(),
                viewCount: 42,
                status: 'completed',
                thumbnailUrl: 'https://via.placeholder.com/300x200/232323/7c66ff?text=Marketing+Video'
              },
              {
                _id: '2',
                title: 'Product Demo',
                description: 'Step-by-step demonstration of key features',
                createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
                viewCount: 18,
                status: 'in-progress',
                thumbnailUrl: 'https://via.placeholder.com/300x200/232323/7c66ff?text=Product+Demo'
              },
              {
                _id: '3',
                title: 'Tutorial Video',
                description: 'Learn how to use our advanced editing tools',
                createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
                viewCount: 85,
                status: 'completed',
                thumbnailUrl: 'https://via.placeholder.com/300x200/232323/7c66ff?text=Tutorial+Video'
              }
            ]);
          }
        } catch (projectErr) {
          console.error('Error fetching projects:', projectErr);
          // Fallback to mock projects for development
          setProjects([
            {
              _id: '1',
              title: 'Marketing Video',
              description: 'A promotional video for our new product line',
              createdAt: new Date().toISOString(),
              viewCount: 42,
              status: 'completed',
              thumbnailUrl: 'https://via.placeholder.com/300x200/232323/7c66ff?text=Marketing+Video'
            },
            {
              _id: '2',
              title: 'Product Demo',
              description: 'Step-by-step demonstration of key features',
              createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
              viewCount: 18,
              status: 'in-progress',
              thumbnailUrl: 'https://via.placeholder.com/300x200/232323/7c66ff?text=Product+Demo'
            },
            {
              _id: '3',
              title: 'Tutorial Video',
              description: 'Learn how to use our advanced editing tools',
              createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
              viewCount: 85,
              status: 'completed',
              thumbnailUrl: 'https://via.placeholder.com/300x200/232323/7c66ff?text=Tutorial+Video'
            }
          ]);
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError(err.message || 'Failed to load profile data');
        setLoading(false);
      }
    };
    
    fetchUserData();
  }, []);

  /* Auto-dismiss notification after timeout */
  useEffect(() => {
    let timeoutId;
    if (notification) {
      timeoutId = setTimeout(() => {
        setNotification(null);
      }, 3000);
    }
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [notification]);

  /* Ensure proper scrolling behavior */
  useEffect(() => {
    // Remove any overflow restrictions from body and html
    document.body.style.overflow = 'auto';
    document.documentElement.style.overflow = 'auto';
    document.body.style.height = 'auto';
    document.documentElement.style.height = 'auto';

    return () => {
      // Clean up when component unmounts
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
      document.body.style.height = '';
      document.documentElement.style.height = '';
    };
  }, []);

  const showNotification = (type, message) => {
    setNotification({ type, message });
  };

  const handleViewProject = (project) => {
    // Check if this is a local/demo project
    if (project.isLocalOnly || project.source === 'localStorage') {
      if (project.s3Url) {
        // Open the video URL directly in a new tab
        window.open(project.s3Url, '_blank');
      } else {
        alert('This project was saved locally and the video URL is no longer accessible. Please create a new merge.');
      }
      return;
    }
    
    // Navigate to the video preview page with the project ID
    if (project.jobId) {
      if (project.jobId.startsWith('demo')) {
        // For demo projects, just show a message
        alert('This is a demo project. In a real environment, you would be able to view this video.');
      } else {
      navigate(`/video/${project.jobId}`);
      }
    } else {
      alert('Project video not available');
    }
  };

  const handleShareProject = (project) => {
    // Handle local projects
    if (project.isLocalOnly || project.source === 'localStorage') {
      if (project.s3Url) {
        // Create a temporary input to copy the URL
        const tempInput = document.createElement('input');
        document.body.appendChild(tempInput);
        tempInput.value = project.s3Url;
        tempInput.select();
        document.execCommand('copy');
        document.body.removeChild(tempInput);
        
        alert('Video URL copied to clipboard! You can share this link directly.');
      } else {
        alert('This project was saved locally and cannot be shared. Please create a new merge and publish it to get a shareable link.');
      }
      return;
    }
    
    // Navigate to video preview with sharing enabled
    if (project.jobId) {
      if (project.jobId.startsWith('demo')) {
        // For demo projects, just show a message
        alert('Sharing is not available for demo projects.');
      } else {
      navigate(`/video/${project.jobId}?share=true`);
      }
    } else {
      alert('Cannot share this project at this time');
    }
  };

  const handleDownloadProject = async (projectId) => {
    try {
      // Use the PROJECTS_API with the /download endpoint
      const token = localStorage.getItem('token');
      const response = await axios.get(`${PROJECTS_API}/${projectId}/download`, {
        headers: {
          Authorization: `Bearer ${token}`
        },
        responseType: 'blob'
      });
      
      // Create a download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `project-${projectId}.mp4`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      console.log('Project download initiated');
    } catch (error) {
      console.error('Error downloading project:', error);
      
      // Fallback for development - if project has thumbnail, use it as a mock for download
      const project = projects.find(p => p._id === projectId);
      if (project && project.thumbnailUrl) {
        // Create a download link to the thumbnail as a fallback
        const link = document.createElement('a');
        link.href = project.thumbnailUrl;
        link.setAttribute('download', `project-${projectId}-thumbnail.jpg`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        console.log('Fallback download used (thumbnail only)');
      } else {
        alert('Download failed. API endpoint not available in development mode.');
      }
    }
  };

  const confirmDeleteProject = (projectId) => {
    setProjectToDelete(projectId);
    setShowDeleteModal(true);
  };

  const handleDeleteProject = async () => {
    if (!projectToDelete) return;
    
    setDeleteLoading(true);
    try {
      // Use the PROJECTS_API endpoint with the project ID
      const token = localStorage.getItem('token');
      const response = await axios.delete(`${PROJECTS_API}/${projectToDelete}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      if (response.data && response.data.success) {
        // Remove the deleted project from the state
        setProjects(projects.filter(project => project._id !== projectToDelete));
        setShowDeleteModal(false);
        setProjectToDelete(null);
        // Show success message (could implement a toast notification here)
        console.log('Project deleted successfully');
        showNotification('success', 'Project deleted successfully');
      } else {
        throw new Error(response.data?.message || 'Failed to delete project');
      }
    } catch (error) {
      console.error('Error deleting project:', error);
      // For development, allow deletion from state even if API fails
      setProjects(projects.filter(project => project._id !== projectToDelete));
      setShowDeleteModal(false);
      setProjectToDelete(null);
      showNotification('error', 'Failed to delete project');
    } finally {
      setDeleteLoading(false);
    }
  };

  // Format date helper
  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  // Filter projects based on active tab
  const getFilteredProjects = () => {
    if (activeTab === 'all') {
      return projects;
    } else if (activeTab === 'recent') {
      return [...projects].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } else if (activeTab === 'popular') {
      return [...projects].sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0));
    }
    return projects;
  };

  // If there's an error, display it
  if (error) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-[#0a0a0a]">
          <main className="mt-12 p-6 md:p-8 bg-gradient-to-br from-[#0a0a0a] to-[#141414] min-h-[calc(100vh-3.5rem)] text-white flex items-center justify-center">
            <div className="bg-[#151515] rounded-xl p-6 max-w-md w-full">
              <div className="text-red-400 mb-4 flex items-center">
                <FontAwesomeIcon icon={faExclamationTriangle} className="mr-2 text-xl" />
                <h3 className="text-xl font-semibold">Error Loading Profile</h3>
              </div>
              <p className="text-gray-300 mb-4">{error}</p>
              <button 
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-[#7c66ff] text-white rounded-lg hover:bg-[#6c5ce7] transition-colors"
              >
                Try Again
              </button>
            </div>
          </main>
        </div>
      </>
    );
  }

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-[#0a0a0a]">
          <main className="mt-12 p-6 md:p-8 bg-gradient-to-br from-[#0a0a0a] to-[#141414] min-h-[calc(100vh-3.5rem)] text-white flex items-center justify-center">
            <div className="relative">
              {/* Animated loading background elements */}
              <div className="absolute -top-20 -left-20 w-40 h-40 bg-[#7c66ff]/10 rounded-full filter blur-[50px] animate-pulse"></div>
              <div className="absolute -bottom-20 -right-20 w-40 h-40 bg-[#7c66ff]/10 rounded-full filter blur-[50px] animate-pulse"></div>
              
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="flex flex-col items-center p-10 rounded-xl bg-[#151515] backdrop-blur-md border border-gray-800/30 shadow-xl"
              >
                <div className="relative w-20 h-20 mb-5">
                  <div className="absolute top-0 left-0 w-full h-full border-4 border-[#7c66ff]/20 rounded-full"></div>
                  <div className="absolute top-0 left-0 w-full h-full border-4 border-t-[#7c66ff] rounded-full animate-spin"></div>
                </div>
                <h3 className="text-xl font-semibold mb-2 text-white">Loading Your Profile</h3>
                <p className="text-gray-400 text-sm">Preparing your dashboard experience...</p>
              </motion.div>
            </div>
          </main>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      {/* Enhanced background elements with dynamic gradients */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-20 left-1/4 w-[40rem] h-[40rem] bg-[#7c66ff]/8 rounded-full filter blur-[120px] animate-pulse-slow opacity-50"></div>
        <div className="absolute bottom-40 right-1/4 w-[45rem] h-[45rem] bg-indigo-500/8 rounded-full filter blur-[150px] animate-pulse-slower opacity-40"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full h-full bg-gradient-radial from-[#7c66ff]/5 to-transparent opacity-30"></div>
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiM3YzY2ZmYiIGZpbGwtb3BhY2l0eT0iMC4wMiI+PHBhdGggZD0iTTM2IDM0di00aC0ydjRoLTR2Mmg0djRoMnYtNGg0di0ySDZ6TTYgMzR2LTRINHY0SDB2Mmg0djRoMnYtNGg0di0ySDZ6TTYgNFYwSDR2NEgwdjJoNHY0aDJWNmg0VjRoLTR6TTYgMzR2LTRINHY0SDB2Mmg0djRoMnYtNGg0di0ySDZ6TTYgNFYwSDR2NEgwdjJoNHY0aDJWNmg0VjRINnoiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-40 bg-fixed"></div>
      </div>
      
      <main className="mt-16 p-6 md:p-10 bg-gradient-to-br from-[#0a0a0a] to-[#141414] text-white min-h-screen">
        <div className="max-w-[1440px] mx-auto pb-12">
          {/* Redesigned Profile Header Section */}
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-16 relative"
          >

            <div className="absolute -inset-4 bg-gradient-to-r from-[#7c66ff]/10 via-indigo-500/5 to-[#7c66ff]/10 rounded-3xl blur-xl opacity-70 group-hover:opacity-100 transition duration-1000 group-hover:duration-200 animate-gradient-xy"></div>

            <div className="relative bg-[#151515]/80 backdrop-blur-sm border border-[#7c66ff]/20 rounded-2xl p-8 overflow-hidden shadow-xl">
              {/* Decorative elements */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-[#7c66ff]/5 rounded-full filter blur-[80px]"></div>
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-indigo-500/5 rounded-full filter blur-[50px]"></div>
              
              <div className="flex flex-col md:flex-row md:items-center gap-8 relative z-10">
                <div className="relative group">
                  <div className="absolute -inset-1 bg-gradient-to-r from-[#7c66ff] to-indigo-600 rounded-full blur opacity-70 group-hover:opacity-100 transition duration-700 group-hover:duration-200 animate-gradient-xy"></div>
                  <div className="relative w-28 h-28 md:w-36 md:h-36 bg-black rounded-full flex items-center justify-center ring-[6px] ring-[#151515]">
                    <div className="w-full h-full rounded-full bg-gradient-to-br from-[#7c66ff] to-indigo-600 p-1">
                      <div className="w-full h-full rounded-full flex items-center justify-center bg-[#151515] overflow-hidden">
                        <FontAwesomeIcon icon={faUser} className="text-[#7c66ff] text-4xl md:text-5xl transform group-hover:scale-110 transition-transform duration-300" />
                      </div>
                    </div>
                    <div className="absolute bottom-1 right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-[#151515] z-10 animate-pulse"></div>
                  </div>
                </div>
                
                <div className="flex-1">
                  <div className="flex flex-col gap-4">
                    <div>
                      <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
                        <span className="bg-clip-text text-transparent bg-gradient-to-r from-white via-[#7c66ff]/90 to-white">
                          {user?.name || 'User Profile'}
                        </span>
                      </h1>
                      <p className="text-gray-400 mt-2 text-base md:text-lg">Manage your creative video projects</p>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-5 mt-6 md:mt-8">
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 rounded-full bg-[#7c66ff]/10 flex items-center justify-center">
                        <FontAwesomeIcon icon={faEnvelope} className="text-[#7c66ff]" />
                      </div>
                      <span className="text-gray-300 text-base">{user?.email || 'email@example.com'}</span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 rounded-full bg-[#7c66ff]/10 flex items-center justify-center">
                        <FontAwesomeIcon icon={faCalendarAlt} className="text-[#7c66ff]" />
                      </div>
                      <span className="text-gray-300 text-base">Joined {user?.createdAt ? formatDate(user.createdAt) : 'N/A'}</span>
                    </div>
                    
                    <div className="flex items-center gap-2 ml-auto">
                      <span className="px-4 py-1.5 rounded-full text-sm font-medium bg-gradient-to-r from-[#7c66ff]/20 to-indigo-500/20 text-[#7c66ff] border border-[#7c66ff]/20 shadow-lg shadow-[#7c66ff]/5">
                        User
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Projects Section - Enhanced with better spacing and organization */}
          <div className="mb-16">
            <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center mb-12">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5 }}
                className="mb-8 lg:mb-0"
              >
                <div className="flex items-center">
                  <div className="relative mr-6">
                    <div className="absolute -inset-1 bg-gradient-to-r from-[#7c66ff]/60 to-indigo-500/60 rounded-full blur opacity-60"></div>
                    <div className="relative bg-gradient-to-br from-[#7c66ff] to-indigo-600 w-16 h-16 rounded-full flex items-center justify-center shadow-xl">
                      <FontAwesomeIcon icon={faVideo} className="text-white text-2xl" />
                    </div>
                  </div>
                  <div>
                    <h2 className="text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white via-[#7c66ff]/90 to-white">Your Projects</h2>
                    <p className="text-gray-400 mt-3 md:text-lg">Create, manage and edit your professional video projects</p>
                  </div>
                </div>
              </motion.div>
              
              {/* Filter tabs - optimized for better spacing */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5 }}
                className="bg-[#151515]/60 backdrop-blur-sm p-2 rounded-2xl border border-gray-800/30 shadow-xl relative"
              >
                <div className="absolute -inset-px bg-gradient-to-r from-[#7c66ff]/10 via-transparent to-[#7c66ff]/10 rounded-2xl opacity-0 hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                <div className="flex space-x-1 relative z-10">
                  <button 
                    onClick={() => setActiveTab('all')}
                    className={`px-6 py-3 rounded-xl text-sm font-medium transition-all duration-300 ${
                      activeTab === 'all' 
                        ? 'bg-gradient-to-r from-[#7c66ff] to-indigo-600 text-white shadow-lg shadow-[#7c66ff]/20' 
                        : 'bg-transparent text-gray-400 hover:bg-[#232323] hover:text-gray-300'
                    }`}
                  >
                    All Projects
                  </button>
                  <button 
                    onClick={() => setActiveTab('recent')}
                    className={`px-6 py-3 rounded-xl text-sm font-medium transition-all duration-300 ${
                      activeTab === 'recent' 
                        ? 'bg-gradient-to-r from-[#7c66ff] to-indigo-600 text-white shadow-lg shadow-[#7c66ff]/20' 
                        : 'bg-transparent text-gray-400 hover:bg-[#232323] hover:text-gray-300'
                    }`}
                  >
                    Recent
                  </button>
                </div>
              </motion.div>
            </div>
            
            {/* Projects Grid - Enhanced with optimized grid columns for better use of space */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {getFilteredProjects().length > 0 ? (
                getFilteredProjects().map((project, index) => (
                  <motion.div
                    key={project._id}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: index * 0.1 }}
                    whileHover={{ y: -10, transition: { duration: 0.2 } }}
                    className="relative group"
                  >
                    <div className="absolute -inset-2 bg-gradient-to-br from-[#7c66ff]/20 to-indigo-500/5 rounded-2xl blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10"></div>
                    <div className="bg-[#151515]/80 backdrop-blur-sm rounded-2xl overflow-hidden border border-gray-800/40 shadow-xl hover:border-[#7c66ff]/30 transition-all duration-500 h-full relative z-10">
                      {/* Thumbnail with enhanced hover effects */}
                      <div className="relative h-52 overflow-hidden bg-[#0a0a0a]">
                        {project.thumbnailUrl ? (
                          <img 
                            src={project.thumbnailUrl} 
                            alt={project.title}
                            className="w-full h-full object-cover scale-105 group-hover:scale-110 transition-transform duration-700 ease-in-out"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#1a1a1a] to-[#232323]">
                            <FontAwesomeIcon icon={faVideo} className="text-[#7c66ff]/40 text-4xl" />
                          </div>
                        )}
                        
                        {/* Dark gradient overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-[#151515] to-transparent opacity-70"></div>
                        
                        {/* Hover overlay with actions */}
                        <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-4 backdrop-blur-sm z-10">
                          <motion.button
                            whileHover={{ scale: 1.15 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleViewProject(project)}
                            className="w-12 h-12 rounded-full bg-gradient-to-br from-[#7c66ff] to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-[#7c66ff]/30 relative"
                          >
                            <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-full"></div>
                            <FontAwesomeIcon icon={faPlay} className="text-lg relative z-10 ml-1" />
                          </motion.button>
                          
                          <motion.button
                            whileHover={{ scale: 1.15 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDownloadProject(project._id);
                            }}
                            className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center text-white shadow-lg hover:bg-white/20 transition-all border border-white/10"
                          >
                            <FontAwesomeIcon icon={faDownload} />
                          </motion.button>
                          
                          <motion.button
                            whileHover={{ scale: 1.15 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleShareProject(project);
                            }}
                            className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center text-white shadow-lg hover:bg-white/20 transition-all border border-white/10"
                          >
                            <FontAwesomeIcon icon={faShare} />
                          </motion.button>
                          
                          <motion.button
                            whileHover={{ scale: 1.15 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={(e) => {
                              e.stopPropagation();
                              confirmDeleteProject(project._id);
                            }}
                            className="w-10 h-10 rounded-full bg-red-500/80 flex items-center justify-center text-white shadow-lg hover:bg-red-600/90 transition-all"
                          >
                            <FontAwesomeIcon icon={faTrash} />
                          </motion.button>
                        </div>
                        
                        {/* Status badges */}
                        {project.status === 'completed' && (
                          <div className="absolute top-3 left-3 px-3 py-1.5 rounded-full bg-green-500/90 text-white text-xs font-medium shadow-lg shadow-green-500/20 backdrop-blur-sm flex items-center z-20 border border-white/10">
                            <FontAwesomeIcon icon={faCheck} className="mr-1.5 text-[10px]" />
                            Completed
                          </div>
                        )}
                        {project.status === 'in-progress' && (
                          <div className="absolute top-3 left-3 px-3 py-1.5 rounded-full bg-yellow-500/90 text-white text-xs font-medium shadow-lg shadow-yellow-500/20 backdrop-blur-sm flex items-center z-20 border border-white/10">
                            <FontAwesomeIcon icon={faSpinner} className="mr-1.5 text-[10px] animate-spin" />
                            In Progress
                          </div>
                        )}
                      </div>
                      
                      {/* Project Info */}
                      <div className="p-6">
                        <h3 className="font-bold text-xl mb-3 truncate bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-300 group-hover:from-white group-hover:to-[#7c66ff] transition-all duration-300">{project.title}</h3>
                        <p className="text-gray-400 text-sm mb-5 line-clamp-2 min-h-[40px]">
                          {project.description || 'No description provided'}
                        </p>
                        
                        {/* Stats */}
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex flex-wrap gap-2">
                            <span className="inline-flex items-center bg-[#1a1a1a]/80 backdrop-blur-sm px-3 py-1.5 rounded-full border border-gray-800/40">
                              <FontAwesomeIcon icon={faEye} className="mr-1.5 text-[#7c66ff]" />
                              {project.viewCount || 0}
                            </span>
                            <span className="inline-flex items-center bg-[#1a1a1a]/80 backdrop-blur-sm px-3 py-1.5 rounded-full border border-gray-800/40">
                              <FontAwesomeIcon icon={faCalendarAlt} className="mr-1.5 text-[#7c66ff]" />
                              {formatDate(project.createdAt)}
                            </span>
                          </div>
                          
                          <motion.div 
                            whileHover={{ x: 3 }} 
                            className="group-hover:opacity-100 opacity-70 transition-opacity"
                          >
                            <Link 
                              to={`/project/${project._id}`}
                              className="flex items-center text-[#7c66ff] hover:text-white transition-colors text-sm"
                            >
                              View
                              <FontAwesomeIcon icon={faArrowRight} className="ml-1.5 text-[10px]" />
                            </Link>
                          </motion.div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))
              ) : (
                /* No projects state with improved visuals */
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5 }}
                  className="col-span-full relative group"
                >
                  <div className="absolute -inset-1 bg-gradient-to-br from-[#7c66ff]/20 to-indigo-600/20 rounded-xl blur-lg opacity-30 transition-opacity duration-300"></div>
                  <div className="bg-[#151515]/80 backdrop-blur-sm rounded-2xl border border-gray-800/40 p-16 flex flex-col items-center justify-center text-center shadow-xl relative z-10">
                    <div className="relative w-28 h-28 mb-8">
                      <div className="absolute -inset-1 bg-gradient-to-r from-[#7c66ff]/30 to-indigo-600/30 rounded-full blur-md opacity-40"></div>
                      <div className="relative w-full h-full rounded-full bg-[#1a1a1a] flex items-center justify-center border border-gray-800/50">
                        <FontAwesomeIcon icon={faVideo} className="text-gray-600 text-4xl" />
                      </div>
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-4">No Projects Found</h3>
                    <p className="text-gray-400 text-lg mb-10 max-w-lg">
                      {activeTab === 'all' 
                        ? "You haven't created any projects yet. Start by creating your first video project." 
                        : `No ${activeTab} projects found. Try another filter or create new projects.`}
                    </p>
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="relative inline-block"
                    >
                      <div className="absolute -inset-0.5 bg-gradient-to-r from-[#7c66ff] to-indigo-600 rounded-xl blur opacity-70 group-hover:opacity-100 transition-all duration-500"></div>
                      <Link 
                        to="/dashboard" 
                        className="relative bg-gradient-to-r from-[#7c66ff] to-indigo-600 px-8 py-4 text-white rounded-xl hover:shadow-lg hover:shadow-[#7c66ff]/20 transition-all font-medium flex items-center gap-3 text-lg"
                      >
                        <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl"></div>
                        <FontAwesomeIcon icon={faPlus} />
                        <span>Create New Project</span>
                      </Link>
                    </motion.div>
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </main>
      
      {/* Enhanced Delete Confirmation Modal with more professional styling */}
      {showDeleteModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center px-4"
        >
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowDeleteModal(false)}></div>
          
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="bg-[#151515] w-full max-w-md rounded-2xl overflow-hidden z-10 border border-gray-800/50 shadow-2xl relative"
          >
            <div className="bg-gradient-to-r from-red-500/10 to-red-600/10 p-6 relative">
              <div className="absolute top-0 right-0 p-4">
                <button 
                  onClick={() => setShowDeleteModal(false)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <FontAwesomeIcon icon={faXmark} />
                </button>
              </div>
              
              <div className="flex items-center gap-5">
                <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center border border-red-500/30">
                  <FontAwesomeIcon icon={faTrash} className="text-red-500" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Delete Project</h3>
                  <p className="text-gray-400 text-sm">This action cannot be undone</p>
                </div>
              </div>
            </div>
            
            <div className="p-6">
              <p className="text-gray-300 mb-6">
                Are you sure you want to delete 
                <span className="text-white font-semibold mx-1">
                  "{projectToDelete ? (
                    projects.find(p => p._id === projectToDelete)?.title || 'this project'
                  ) : 'this project'}"
                </span>?
                All associated data will be permanently removed.
              </p>
              
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="px-5 py-2.5 bg-gray-800/80 hover:bg-gray-700 text-gray-300 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                
                <button
                  onClick={handleDeleteProject}
                  disabled={deleteLoading}
                  className="px-5 py-2.5 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:from-red-600 hover:to-red-700 transition-all flex items-center justify-center min-w-[100px]"
                >
                  {deleteLoading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin mr-2"></div>
                      <span>Deleting...</span>
                    </>
                  ) : (
                    <>
                      <FontAwesomeIcon icon={faTrash} className="mr-2" />
                      <span>Delete</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Success/Error notification toast */}
      {notification && (
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          className={`fixed bottom-4 right-4 px-6 py-3 rounded-lg shadow-2xl z-50 flex items-center gap-3 ${
            notification.type === 'success' 
              ? 'bg-green-500/90 text-white' 
              : 'bg-red-500/90 text-white'
          } backdrop-blur-sm border border-white/10`}
        >
          <FontAwesomeIcon 
            icon={notification.type === 'success' ? faCheck : faExclamationTriangle} 
            className="text-white"
          />
          <span>{notification.message}</span>
        </motion.div>
      )}

      {/* Add animations for more professional look */}
      <style jsx>{`
        .animate-gradient-xy {
          background-size: 200% 200%;
          animation: gradient-xy 15s ease infinite;
        }
        
        @keyframes gradient-xy {
          0% {
            background-position: 0% 0%;
          }
          50% {
            background-position: 100% 100%;
          }
          100% {
            background-position: 0% 0%;
          }
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
        
        /* Custom scrollbar styles */
        ::-webkit-scrollbar {
          width: 6px;
          background-color: transparent;
        }
        
        ::-webkit-scrollbar-track {
          background-color: rgba(28, 28, 28, 0.3);
          border-radius: 10px;
          margin: 8px 0;
        }
        
        ::-webkit-scrollbar-thumb {
          background-color: #7c66ff;
          border-radius: 10px;
          border: 2px solid rgba(10, 10, 10, 0.2);
        }
        
        ::-webkit-scrollbar-thumb:hover {
          background-color: #9d8fff;
        }
      `}</style>
    </>
  );
};

export default ProfilePage; 