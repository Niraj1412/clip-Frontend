import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faArrowLeft,
  faCalendarAlt,
  faVideo,
  faEdit,
  faTrash,
  faExternalLinkAlt,
  faExclamationTriangle,
  faSpinner,
  faInfoCircle,
  faLink,
  faEye,
  faClock,
  faCheckCircle,
  faFilm,
  faUser,
  faEnvelope,
  faTag,
  faList,
  faChartLine,
  faPlay,
  faPause,
  faExpand,
  faVolumeMute,
  faVolumeUp,
  faDownload,
  faExclamationCircle
} from '@fortawesome/free-solid-svg-icons';
import axios from 'axios';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import { PROJECTS_API } from '../config';

const ProjectDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activeClip, setActiveClip] = useState(null);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const videoRef = useRef(null);
  const videoContainerRef = useRef(null);
  const [userInfo, setUserInfo] = useState({
    name: null,
    email: null,
    isGuest: true
  });
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    fetchProjectDetails();
  }, [id]);

  const fetchProjectDetails = async () => {
    if (!id) {
      setError('Invalid project ID');
      setLoading(false);
      return;
    }

    try {
      const token = localStorage.getItem('userToken') || localStorage.getItem('token');
      const isGuest = !token;

      const headers = {
        'Content-Type': 'application/json'
      };

      if (!isGuest) {
        headers.Authorization = `Bearer ${token}`;
      }

      const cleanId = id.replace('/api/projects/', '');
      const response = await axios.get(`${PROJECTS_API}/${cleanId}`, { headers });

      if (response.data?.success && response.data?.project) {
        setProject(response.data.project);
        setUserInfo({
          name: response.data.project.userName || 'Anonymous',
          email: response.data.project.userEmail || null,
          isGuest: isGuest
        });
        setError(null);
      } else {
        throw new Error('Project not found');
      }
    } catch (err) {
      console.error('Error fetching project:', err);
      const errorMessage = err.response?.status === 404
        ? 'Project not found. It may have been deleted or you may not have permission to view it.'
        : 'Failed to load project details. Please try again later.';
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const formatDuration = (seconds) => {
    if (!seconds) return '0:00';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleDelete = async () => {
    setDeleteLoading(true);
    try {
      const token = localStorage.getItem('userToken') || localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication token not found. Please log in again.');
      }

      const cleanId = id.replace('/api/projects/', '');
      const response = await axios.delete(`${PROJECTS_API}/${cleanId}`, {
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        }
      });

      if (response.data?.success) {
        // Close modal first
        setShowDeleteModal(false);
        
        // Navigate with success message
        navigate('/my-projects', { 
          replace: true,
          state: { 
            notification: {
              type: 'success',
              message: response.data?.message || 'Project deleted successfully'
            }
          }
        });
      } else {
        throw new Error(response.data?.message || 'Failed to delete project');
      }
    } catch (err) {
      console.error('Error deleting project:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Failed to delete project. Please try again.';
      setError(errorMessage);
      // Keep the modal open on error
      setTimeout(() => setError(null), 5000); // Clear error after 5 seconds
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleVideoPlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  const handleVideoEnded = () => {
    setIsPlaying(false);
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
    }
  };

  const handleMuteToggle = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleFullscreenToggle = () => {
    if (!document.fullscreenElement) {
      videoContainerRef.current.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const handleClipClick = (clip) => {
    setActiveClip(clip);
    setShowVideoModal(true);
    if (videoRef.current) {
      videoRef.current.currentTime = clip.startTime;
      videoRef.current.play();
      setIsPlaying(true);
    }
  };

  const formatProgress = (time) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

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
      transition: { duration: 0.4 }
    }
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="flex h-screen overflow-hidden">
          <Sidebar />
          <main className="ml-[280px] flex-1 p-8 bg-[#121212] min-h-screen">
            <div className="max-w-6xl mx-auto">
              <div className="animate-pulse space-y-6">
                <div className="h-8 w-48 bg-[#252525] rounded"></div>
                <div className="grid grid-cols-3 gap-6">
                  <div className="col-span-2">
                    <div className="h-[400px] bg-[#252525] rounded-lg"></div>
                  </div>
                  <div className="space-y-4">
                    <div className="h-24 bg-[#252525] rounded-lg"></div>
                    <div className="h-24 bg-[#252525] rounded-lg"></div>
                  </div>
                </div>
              </div>
            </div>
          </main>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Navbar />
        <div className="flex h-screen overflow-hidden">
          <Sidebar />
          <main className="ml-[280px] flex-1 p-8 bg-[#121212] min-h-screen">
            <div className="max-w-6xl mx-auto">
              <div className="bg-red-900/30 border border-red-500/30 rounded-lg p-8 text-center">
                <FontAwesomeIcon icon={faExclamationTriangle} className="text-4xl text-red-400 mb-4" />
                <h2 className="text-xl font-semibold text-white mb-3">Error Loading Project</h2>
                <p className="text-red-400 mb-6">{error}</p>
                <button
                  onClick={() => navigate('/my-projects')}
                  className="px-6 py-2 bg-red-500/20 text-red-400 rounded-lg flex items-center gap-2 hover:bg-red-500/30 mx-auto"
                >
                  <FontAwesomeIcon icon={faArrowLeft} />
                  Back to Projects
                </button>
              </div>
            </div>
          </main>
        </div>
      </>
    );
  }

  if (!project) {
    return null;
  }

  return (
    <>
      <Navbar />
      <div className="flex h-screen overflow-hidden">
        <Sidebar />
        <main className="ml-[280px] flex-1 p-8 bg-[#121212] min-h-screen overflow-y-auto mt-14">
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
            className="max-w-6xl mx-auto relative z-10"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {/* Navigation */}
            <motion.nav 
              className="mb-8"
              variants={itemVariants}
            >
              <button
                onClick={() => navigate('/my-projects')}
                className="text-gray-400 hover:text-white flex items-center gap-2 text-sm group transition-all duration-300"
              >
                <FontAwesomeIcon icon={faArrowLeft} className="transform group-hover:-translate-x-1 transition-transform duration-300" />
                Back to Projects
              </button>
            </motion.nav>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Main Content */}
              <motion.div className="lg:col-span-2 space-y-6" variants={itemVariants}>
                {/* Preview Section */}
                <section className="bg-[#1A1A1A] rounded-xl overflow-hidden border border-[#2A2A2A] shadow-lg hover:border-purple-500/30 transition-all duration-300">
                  <div className="relative aspect-video bg-[#252525] group" ref={videoContainerRef}>
                    {project?.s3Url ? (
                      <>
                        <video
                          ref={videoRef}
                          className="w-full h-full object-contain bg-black"
                          src={project.s3Url}
                          poster={project.thumbnailUrl}
                          onTimeUpdate={handleTimeUpdate}
                          onLoadedMetadata={handleLoadedMetadata}
                          onEnded={handleVideoEnded}
                          playsInline
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={handleVideoPlay}
                            className="w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center shadow-lg"
                          >
                            <FontAwesomeIcon 
                              icon={isPlaying ? faPause : faPlay} 
                              className="text-white text-xl ml-1"
                            />
                          </motion.button>
                        </div>
                        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                          <div className="flex items-center gap-4 text-white">
                            <div className="flex-1">
                              <div className="h-1 bg-[#333] rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-purple-600" 
                                  style={{ width: `${(currentTime / duration) * 100}%` }}
                                />
                              </div>
                              <div className="flex justify-between text-sm mt-2">
                                <span>{formatProgress(currentTime)}</span>
                                <span>{formatProgress(duration)}</span>
                              </div>
                            </div>
                            <button 
                              onClick={handleMuteToggle}
                              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                            >
                              <FontAwesomeIcon icon={isMuted ? faVolumeMute : faVolumeUp} />
                            </button>
                            <button 
                              onClick={handleFullscreenToggle}
                              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                            >
                              <FontAwesomeIcon icon={faExpand} />
                            </button>
                          </div>
                        </div>
                      </>
                    ) : project?.thumbnailUrl ? (
                      <img 
                        src={project.thumbnailUrl} 
                        alt={project.title} 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <FontAwesomeIcon icon={faVideo} className="text-gray-600 text-4xl" />
                      </div>
                    )}
                  </div>
                  <div className="p-6 bg-gradient-to-b from-[#1A1A1A] to-[#1A1A1A]/95">
                    <h1 className="text-2xl font-bold text-white mb-4 hover:text-purple-400 transition-colors">
                      {project?.title}
                    </h1>
                    <div className="flex flex-wrap items-center gap-6 text-gray-400 text-sm">
                      <div className="flex items-center gap-2 bg-[#252525] px-3 py-1.5 rounded-full">
                        <FontAwesomeIcon icon={faCalendarAlt} className="text-purple-400" />
                        {formatDate(project?.createdAt)}
                      </div>
                      <div className="flex items-center gap-2 bg-[#252525] px-3 py-1.5 rounded-full">
                        <FontAwesomeIcon icon={faClock} className="text-purple-400" />
                        {formatDuration(project?.duration)}
                      </div>
                      <div className="flex items-center gap-2 bg-[#252525] px-3 py-1.5 rounded-full">
                        <FontAwesomeIcon icon={faFilm} className="text-purple-400" />
                        {project?.stats?.totalClips || 0} clips
                      </div>
                    </div>
                  </div>
                </section>

                {/* Description Section */}
                {project?.description && (
                  <motion.section 
                    className="bg-[#1A1A1A] rounded-xl p-6 border border-[#2A2A2A] shadow-lg hover:border-purple-500/30 transition-all duration-300"
                    variants={itemVariants}
                  >
                    <h2 className="flex items-center gap-2 text-white font-medium mb-4">
                      <FontAwesomeIcon icon={faInfoCircle} className="text-purple-400" />
                      Description
                    </h2>
                    <p className="text-gray-300 leading-relaxed">
                      {project.description}
                    </p>
                  </motion.section>
                )}

                {/* Source Clips Section */}
                {project?.sourceClips && project.sourceClips.length > 0 && (
                  <motion.section 
                    className="bg-[#1A1A1A] rounded-xl p-4 border border-[#2A2A2A] shadow-lg hover:border-purple-500/30 transition-all duration-300"
                    variants={itemVariants}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="flex items-center gap-2 text-white font-medium">
                        <FontAwesomeIcon icon={faList} className="text-purple-400" />
                        Source Clips
                      </h2>
                      <span className="text-sm text-gray-400 bg-[#252525] px-2 py-0.5 rounded-full">
                        {project.sourceClips.length} clips
                      </span>
                    </div>
                    <div className="grid grid-cols-1 gap-2">
                      {project.sourceClips.map((clip, index) => (
                        <motion.div 
                          key={clip._id || index}
                          className="bg-[#252525] rounded-lg overflow-hidden hover:bg-[#2a2a2a] transition-all duration-300 group cursor-pointer border border-transparent hover:border-purple-500/30"
                          whileHover={{ scale: 1.01 }}
                          whileTap={{ scale: 0.99 }}
                          onClick={() => handleClipClick(clip)}
                        >
                          <div className="p-3 flex items-center justify-between">
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="w-8 h-8 bg-purple-600/10 rounded-lg flex items-center justify-center">
                                <FontAwesomeIcon icon={faPlay} className="text-purple-400 text-xs" />
                              </div>
                              <div className="min-w-0">
                                <h3 className="text-white text-sm font-medium group-hover:text-purple-400 transition-colors truncate">
                                  {clip.title}
                                </h3>
                                <div className="flex items-center gap-3 mt-1">
                                  <span className="text-xs text-gray-400 flex items-center gap-1">
                                    <FontAwesomeIcon icon={faClock} className="text-[8px]" />
                                    {formatDuration(clip.duration)}
                                  </span>
                                  <span className="text-xs text-gray-400">
                                    {clip.startTime}s - {clip.endTime}s
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </motion.section>
                )}
              </motion.div>

              {/* Sidebar Content */}
              <motion.div className="space-y-6" variants={itemVariants}>
                {/* Project Info Card */}
                <section className="bg-[#1A1A1A] rounded-xl p-6 border border-[#2A2A2A] shadow-lg hover:border-purple-500/30 transition-all duration-300">
                  <h2 className="text-white font-medium mb-4">Project Information</h2>
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-gray-300 bg-[#252525] p-3 rounded-lg hover:bg-[#2a2a2a] transition-colors">
                      <FontAwesomeIcon icon={faUser} className="text-purple-400" />
                      <span>{userInfo.name}</span>
                    </div>
                    {userInfo.email && !userInfo.isGuest && (
                      <div className="flex items-center gap-2 text-gray-300 bg-[#252525] p-3 rounded-lg hover:bg-[#2a2a2a] transition-colors">
                        <FontAwesomeIcon icon={faEnvelope} className="text-purple-400" />
                        <span className="truncate">{userInfo.email}</span>
                      </div>
                    )}
                    {project?.jobId && (
                      <div className="flex items-center gap-2 text-gray-300 bg-[#252525] p-3 rounded-lg hover:bg-[#2a2a2a] transition-colors">
                        <FontAwesomeIcon icon={faTag} className="text-purple-400" />
                        <span className="truncate">Job ID: {project.jobId}</span>
                      </div>
                    )}
                  </div>
                </section>

                {/* Stats Card */}
                <section className="bg-[#1A1A1A] rounded-xl p-6 border border-[#2A2A2A] shadow-lg hover:border-purple-500/30 transition-all duration-300">
                  <h2 className="flex items-center gap-2 text-white font-medium mb-4">
                    <FontAwesomeIcon icon={faChartLine} className="text-purple-400" />
                    Project Stats
                  </h2>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 bg-[#252525] rounded-lg hover:bg-[#2a2a2a] transition-colors">
                      <span className="text-gray-400">Total Clips</span>
                      <span className="font-medium text-white">{project?.stats?.totalClips || 0}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-[#252525] rounded-lg hover:bg-[#2a2a2a] transition-colors">
                      <span className="text-gray-400">Total Duration</span>
                      <span className="font-medium text-white">{formatDuration(project?.stats?.totalDuration)}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-[#252525] rounded-lg hover:bg-[#2a2a2a] transition-colors">
                      <span className="text-gray-400">Processing Time</span>
                      <span className="font-medium text-white">{project?.stats?.processingTime || 0}s</span>
                    </div>
                  </div>
                </section>

                {/* Actions Card */}
                <section className="bg-[#1A1A1A] rounded-xl p-6 border border-[#2A2A2A] shadow-lg hover:border-purple-500/30 transition-all duration-300">
                  <h2 className="text-white font-medium mb-4">Project Actions</h2>
                  <div className="space-y-3">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      disabled={deleteLoading}
                      onClick={() => setShowDeleteModal(true)}
                      className={`w-full px-4 py-3 bg-red-500/10 text-red-400 rounded-xl flex items-center justify-center gap-2 transition-all duration-300 hover:bg-red-500/20 hover:shadow-lg hover:shadow-red-500/20 ${
                        deleteLoading ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                    >
                      <FontAwesomeIcon icon={deleteLoading ? faSpinner : faTrash} className={deleteLoading ? 'animate-spin' : ''} />
                      {deleteLoading ? 'Deleting...' : 'Delete Project'}
                    </motion.button>
                  </div>
                </section>

                {/* Source Link Card */}
                {project?.s3Url && (
                  <section className="bg-[#1A1A1A] rounded-xl p-6 border border-[#2A2A2A] shadow-lg hover:border-purple-500/30 transition-all duration-300">
                    <h2 className="flex items-center gap-2 text-white font-medium mb-4">
                      <FontAwesomeIcon icon={faLink} className="text-purple-400" />
                      Source Video
                    </h2>
                    <div className="space-y-3">
                      <motion.a
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        href={project.s3Url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full inline-flex items-center justify-center gap-2 text-purple-400 hover:text-purple-300 transition-all duration-300 bg-[#252525] px-4 py-2 rounded-lg hover:bg-[#2a2a2a]"
                      >
                        <FontAwesomeIcon icon={faPlay} />
                        Play in New Tab
                      </motion.a>
                      <motion.a
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        href={project.s3Url}
                        download
                        className="w-full inline-flex items-center justify-center gap-2 text-purple-400 hover:text-purple-300 transition-all duration-300 bg-[#252525] px-4 py-2 rounded-lg hover:bg-[#2a2a2a]"
                      >
                        <FontAwesomeIcon icon={faDownload} />
                        Download Video
                      </motion.a>
                    </div>
                  </section>
                )}
              </motion.div>
            </div>
          </motion.div>
        </main>
      </div>

      {/* Video Modal for Clips */}
      <AnimatePresence>
        {showVideoModal && activeClip && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
            onClick={() => setShowVideoModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#1A1A1A] rounded-xl overflow-hidden max-w-4xl w-full"
              onClick={e => e.stopPropagation()}
            >
              <div className="p-4 border-b border-[#2A2A2A]">
                <h3 className="text-white font-medium">{activeClip.title}</h3>
              </div>
              <div className="aspect-video relative">
                <video
                  className="w-full h-full"
                  src={project.s3Url}
                  controls
                  autoPlay
                  playsInline
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#1A1A1A] rounded-xl overflow-hidden max-w-md w-full border border-[#2A2A2A] shadow-xl"
            >
              <div className="p-6 bg-red-500/10">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center">
                    <FontAwesomeIcon icon={faTrash} className="text-red-400 text-xl" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-white">Delete Project</h3>
                    <p className="text-gray-400 text-sm">This action cannot be undone</p>
                  </div>
                </div>
              </div>
              
              <div className="p-6">
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm flex items-center gap-2"
                  >
                    <FontAwesomeIcon icon={faExclamationCircle} />
                    <p>{error}</p>
                  </motion.div>
                )}
                
                <p className="text-gray-300 mb-6">
                  Are you sure you want to delete <span className="text-white font-medium">{project?.title}</span>? 
                  All associated data will be permanently removed.
                </p>
                
                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => setShowDeleteModal(false)}
                    className="px-4 py-2 bg-[#252525] text-gray-300 rounded-lg hover:bg-[#2A2A2A] transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={deleteLoading}
                    className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {deleteLoading ? (
                      <>
                        <FontAwesomeIcon icon={faSpinner} className="animate-spin" />
                        Deleting...
                      </>
                    ) : (
                      <>
                        <FontAwesomeIcon icon={faTrash} />
                        Delete Project
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default ProjectDetailsPage; 