import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faArrowLeft, 
  faPlay, 
  faPause, 
  faExpand,
  faCompress,
  faVolumeUp,
  faVolumeMute,
  faDownload,
  faShare,
  faCheck,
  faCopy,
  faExclamationTriangle,
  faQrcode,
  faSpinner,
  faLink,
  faShareAlt,
  faClock,
  faFilm,
  faTimes
} from '@fortawesome/free-solid-svg-icons';
import { motion } from 'framer-motion';
import { API_URL } from '../config';
import { QRCodeSVG } from 'qrcode.react';
import Navbar from '../components/Navbar';
import { faTwitter as fabTwitter, faFacebook as fabFacebook, faWhatsapp as fabWhatsapp, faLinkedin as fabLinkedin } from '@fortawesome/free-brands-svg-icons';

const VideoPreviewPage = () => {
  const { videoId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(true);
  const [videoData, setVideoData] = useState(null);
  const [error, setError] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [s3Url, setS3Url] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [showShareModal, setShowShareModal] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [qrError, setQrError] = useState(false);
  const [shareUrl, setShareUrl] = useState('');
  const videoRef = useRef(null);

  // Fetch video data when component mounts
  useEffect(() => {
    const fetchVideoData = async () => {
      setIsLoading(true);
      setError('');
      
      try {
        // First, check if the video exists and is ready
        const response = await axios.get(`${API_URL}/api/merge/video/${videoId}/status`);
        
        if (response.data.success && response.data.fileReady) {
          // Get video file information
          let videoFileUrl = '';
          let s3VideoUrl = '';
          let videoFileName = 'Video'; // Initialize videoFileName here
          
          // Try to get S3 URL first for better sharing experience
          try {
            const s3Response = await axios.get(`${API_URL}/api/merge/video/${videoId}/public-url`);
            if (s3Response.data.success && s3Response.data.s3Url) {
              s3VideoUrl = s3Response.data.s3Url;
              setS3Url(s3VideoUrl);
              setShareUrl(s3VideoUrl);
            }
          } catch (s3Error) {
            console.log("Could not get S3 URL, using local URL:", s3Error);
          }
          
          // Use local file as fallback
          if (!s3VideoUrl && response.data.files && response.data.files.length > 0) {
            videoFileName = response.data.files[0]; // Assign to already declared variable
            videoFileUrl = `${API_URL}/api/merge/video/${videoId}/${videoFileName}`;
            setVideoUrl(videoFileUrl);
            setShareUrl(videoFileUrl); // Fallback share URL (not ideal but better than nothing)
          } else if (s3VideoUrl) {
            // If we have an S3 URL, use that primarily
            videoFileUrl = s3VideoUrl;
            setVideoUrl(s3VideoUrl);
            
            // Try to extract a filename from the S3 URL for better title display
            const s3UrlParts = s3VideoUrl.split('/');
            if (s3UrlParts.length > 0) {
              const potentialFileName = s3UrlParts[s3UrlParts.length - 1].split('?')[0]; // Remove query params
              if (potentialFileName && potentialFileName.length > 0) {
                videoFileName = potentialFileName;
              }
            }
          }
          
          // Set video data
          setVideoData({
            id: videoId,
            title: videoFileName || 'Video',
            url: videoFileUrl,
            s3Url: s3VideoUrl,
            createdAt: new Date().toISOString()
          });
        } else {
          setError('The video is not ready or does not exist.');
        }
      } catch (error) {
        console.error('Error fetching video data:', error);
        setError('Could not load the video. It may have been removed or is not accessible.');
      } finally {
        setIsLoading(false);
      }
    };

    if (videoId) {
      fetchVideoData();
    } else {
      setError('No video ID provided.');
      setIsLoading(false);
    }
  }, [videoId]);

  // Add a useEffect to check for share query param
  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    if (queryParams.get('share') === 'true') {
      // Wait for video data to load before showing share modal
      if (!isLoading && !error && shareUrl) {
        setShowShareModal(true);
      }
    }
  }, [location.search, isLoading, error, shareUrl]);

  // Handle video playback controls
  const togglePlayPause = () => {
    if (!videoRef.current) return;
    
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
    
    setIsPlaying(!isPlaying);
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    
    const newMutedState = !isMuted;
    videoRef.current.muted = newMutedState;
    setIsMuted(newMutedState);
  };

  const handleVolumeChange = (e) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
      setIsMuted(newVolume === 0);
    }
  };

  const toggleFullscreen = () => {
    if (!videoRef.current) return;
    
    if (!isFullscreen) {
      if (videoRef.current.requestFullscreen) {
        videoRef.current.requestFullscreen();
      } else if (videoRef.current.webkitRequestFullscreen) {
        videoRef.current.webkitRequestFullscreen();
      } else if (videoRef.current.msRequestFullscreen) {
        videoRef.current.msRequestFullscreen();
      }
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      } else if (document.msExitFullscreen) {
        document.msExitFullscreen();
      }
      setIsFullscreen(false);
    }
  };

  const handleVideoTimeUpdate = (e) => {
    if (e.target.currentTime) {
      setCurrentTime(e.target.currentTime);
    }
  };

  const handleVideoDurationChange = (e) => {
    if (e.target.duration && !isNaN(e.target.duration)) {
      setDuration(e.target.duration);
    }
  };

  const handleVideoPlay = () => {
    setIsPlaying(true);
  };

  const handleVideoPause = () => {
    setIsPlaying(false);
  };

  const handleTimelineClick = (e) => {
    if (!videoRef.current || !duration) return;
    
    const timelineRect = e.currentTarget.getBoundingClientRect();
    const clickPosition = (e.clientX - timelineRect.left) / timelineRect.width;
    const newTime = clickPosition * duration;
    
    videoRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  // Format time for display (MM:SS)
  const formatTime = (timeInSeconds) => {
    if (!timeInSeconds) return '0:00';
    
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  // Handle downloading the video
  const handleDownload = () => {
    if (!videoUrl) return;
    
    const downloadUrl = `${videoUrl}${videoUrl.includes('?') ? '&' : '?'}download=true`;
    window.open(downloadUrl, '_blank');
  };

  // Handle sharing the video
  const handleShareVideo = () => {
    // Clear any previous errors when opening modal
    setError('');
    setQrError(false);
    setShowShareModal(true);
  };

  // Function to copy link to clipboard
  const copyToClipboard = () => {
    if (!shareUrl) return;
    
    navigator.clipboard.writeText(shareUrl)
      .then(() => {
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
      })
      .catch(err => {
        console.error('Failed to copy: ', err);
        setError('Failed to copy to clipboard');
      });
  };

  // Function to check if a string is a valid URL
  const isValidUrl = (string) => {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  };

  // Add social media sharing function after the isValidUrl function
  const shareOnSocial = (platform) => {
    if (!shareUrl) return;
    
    let shareLink = '';
    const encodedUrl = encodeURIComponent(shareUrl);
    const title = encodeURIComponent(videoData?.title || 'Shared Video');
    
    switch (platform) {
      case 'twitter':
        shareLink = `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${title}`;
        break;
      case 'facebook':
        shareLink = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
        break;
      case 'whatsapp':
        shareLink = `https://api.whatsapp.com/send?text=${title}%20${encodedUrl}`;
        break;
      case 'linkedin':
        shareLink = `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`;
        break;
      default:
        return;
    }
    
    window.open(shareLink, '_blank', 'width=600,height=400');
  };

  return (
    <div className="h-screen bg-[#121212] text-white flex flex-col overflow-hidden">
      <Navbar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Back button and title */}
        <div className="bg-[#1a1a1a] border-b border-gray-800 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center">
            <button 
              onClick={() => navigate(-1)}
              className="mr-4 w-8 h-8 rounded-full bg-gray-800 hover:bg-gray-700 flex items-center justify-center transition-colors"
            >
              <FontAwesomeIcon icon={faArrowLeft} className="text-white" />
            </button>
            <div>
              <h1 className="text-lg font-medium text-white">
                {videoData?.title || 'Video Preview'}
              </h1>
              <p className="text-xs text-gray-400 mt-0.5">
                {s3Url ? 'Stored in cloud - shareable with anyone' : 'Stored locally - limited access'}
              </p>
            </div>
          </div>
          <div className="hidden sm:block">
            <span className="text-xs text-gray-400 bg-gray-800/50 px-3 py-1 rounded-full">
              {videoId ? videoId.substring(0, 8) + '...' : 'Unknown ID'}
            </span>
          </div>
        </div>
        
        {/* Main content */}
        <div className="flex-1 flex flex-col bg-[#0f0f0f] relative">
          {isLoading ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="text-gray-300">Loading video...</p>
              </div>
            </div>
          ) : error ? (
            <div className="flex-1 flex items-center justify-center p-6">
              <div className="bg-[#1a1a1a] border border-gray-800 rounded-lg p-6 max-w-md w-full">
                <div className="flex items-start gap-3 mb-4">
                  <FontAwesomeIcon icon={faExclamationTriangle} className="text-amber-500 mt-1" />
                  <div>
                    <h3 className="text-lg font-medium text-white mb-1">Video Not Available</h3>
                    <p className="text-gray-400 text-sm">{error}</p>
                  </div>
                </div>
                <button
                  onClick={() => navigate(-1)}
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors mt-4"
                >
                  Go Back
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Video player */}
              <div className="flex-1 bg-black flex items-center justify-center group relative">
                <video
                  ref={videoRef}
                  src={videoUrl}
                  className="max-h-[calc(100vh-200px)] max-w-full"
                  onTimeUpdate={handleVideoTimeUpdate}
                  onDurationChange={handleVideoDurationChange}
                  onPlay={handleVideoPlay}
                  onPause={handleVideoPause}
                  playsInline
                  autoPlay
                  controls={false}
                ></video>
                
                {/* Big play button overlay - only show when video is paused */}
                {!isPlaying && (
                  <div 
                    className="absolute inset-0 flex items-center justify-center cursor-pointer"
                    onClick={togglePlayPause}
                  >
                    <div className="w-20 h-20 rounded-full bg-indigo-600/80 backdrop-blur-sm flex items-center justify-center shadow-lg shadow-black/30 hover:bg-indigo-500/90 transition-all">
                      <FontAwesomeIcon icon={faPlay} className="text-white text-2xl ml-1" />
                    </div>
                  </div>
                )}
                
                {/* Video controls overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-between p-4">
                  {/* Top controls */}
                  <div className="flex justify-end">
                    <div className="bg-black/40 backdrop-blur-sm rounded-full px-3 py-1 text-xs flex items-center">
                      <FontAwesomeIcon icon={faClock} className="mr-1.5 text-gray-400" />
                      <span>{formatTime(duration)}</span>
                    </div>
                  </div>
                  
                  {/* Bottom controls */}
                  <div>
                    {/* Timeline */}
                    <div 
                      className="w-full h-2 bg-gray-700/50 rounded-full overflow-hidden cursor-pointer mb-6"
                      onClick={handleTimelineClick}
                    >
                      <div 
                        className="h-full bg-indigo-600" 
                        style={{ width: `${(currentTime / duration) * 100}%` }}
                      ></div>
                    </div>
                    
                    {/* Control buttons */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        {/* Play/Pause button */}
                        <button 
                          onClick={togglePlayPause} 
                          className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center hover:bg-white/20 transition-colors"
                        >
                          <FontAwesomeIcon icon={isPlaying ? faPause : faPlay} className="text-white" />
                        </button>
                        
                        {/* Volume control */}
                        <div className="flex items-center gap-2">
                          <button onClick={toggleMute} className="text-gray-300 hover:text-white">
                            <FontAwesomeIcon icon={isMuted ? faVolumeMute : faVolumeUp} />
                          </button>
                          <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.05"
                            value={volume}
                            onChange={handleVolumeChange}
                            className="w-20 h-1 bg-white/20 rounded-full"
                          />
                        </div>
                        
                        {/* Time display */}
                        <div className="text-white text-sm">
                          {formatTime(currentTime)} / {formatTime(duration)}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        {/* Fullscreen button */}
                        <button 
                          onClick={toggleFullscreen} 
                          className="w-8 h-8 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center hover:bg-white/20 transition-colors"
                        >
                          <FontAwesomeIcon icon={isFullscreen ? faCompress : faExpand} className="text-white" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Action bar */}
              <div className="bg-[#1a1a1a] border-t border-gray-800 px-6 py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-medium text-white">
                      {videoData?.title || 'Video'}
                    </h2>
                    <p className="text-sm text-gray-400 mt-1">
                      {videoData?.createdAt ? new Date(videoData.createdAt).toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'short', 
                        day: 'numeric' 
                      }) : ''}
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    {/* Share button */}
                    <button 
                      onClick={handleShareVideo}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-sm flex items-center gap-1.5 transition-colors"
                    >
                      <FontAwesomeIcon icon={faShare} />
                      <span>Share</span>
                    </button>
                    
                    {/* Download button */}
                    <button 
                      onClick={handleDownload}
                      className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-md text-sm flex items-center gap-1.5 transition-colors"
                    >
                      <FontAwesomeIcon icon={faDownload} />
                      <span>Download</span>
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-[#1c1c1c] rounded-xl border border-gray-700 p-6 w-full max-w-md"
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-white">Share Video</h3>
              <button 
                onClick={() => setShowShareModal(false)}
                className="text-gray-400 hover:text-white"
              >
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>
            
            {/* Share URL input */}
            <div className="flex items-center gap-2 mb-6">
              <div className="flex-1 bg-[#0f0f0f] border border-gray-700 rounded-md px-3 py-2 text-sm text-gray-300 overflow-hidden text-ellipsis">
                {shareUrl || "No shareable link available"}
              </div>
              <button 
                onClick={copyToClipboard}
                disabled={!shareUrl}
                className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-sm transition-colors disabled:opacity-50 disabled:pointer-events-none flex items-center gap-1.5"
              >
                <FontAwesomeIcon icon={copySuccess ? faCheck : faCopy} />
                <span>{copySuccess ? "Copied!" : "Copy"}</span>
              </button>
            </div>
            
            {/* QR Code */}
            {shareUrl && isValidUrl(shareUrl) && (
              <div className="mb-6 flex flex-col items-center">
                <p className="text-sm text-gray-300 mb-3 flex items-center justify-center gap-2">
                  <FontAwesomeIcon icon={faQrcode} />
                  <span>Scan QR code to open on mobile</span>
                </p>
                
                {!qrError ? (
                  <div className="bg-white p-3 rounded-md">
                    <QRCodeSVG 
                      value={shareUrl}
                      size={180}
                      level={"H"}
                      includeMargin={true}
                      bgColor={"#ffffff"}
                      fgColor={"#000000"}
                      onError={() => setQrError(true)}
                    />
                  </div>
                ) : (
                  <div className="bg-white p-3 rounded-md">
                    <img 
                      src={`https://chart.googleapis.com/chart?cht=qr&chl=${encodeURIComponent(shareUrl)}&chs=180x180&chld=H|0`}
                      alt="QR code"
                      onError={() => setError("Could not generate QR code")}
                    />
                  </div>
                )}
              </div>
            )}
            
            {/* Social media sharing */}
            {shareUrl && (
              <div className="mb-6">
                <p className="text-sm text-gray-300 mb-3">Share on social media:</p>
                <div className="flex items-center justify-center gap-4">
                  <button 
                    onClick={() => shareOnSocial('twitter')}
                    className="w-10 h-10 rounded-full bg-[#1DA1F2] hover:bg-[#1a94df] text-white flex items-center justify-center transition-colors"
                  >
                    <FontAwesomeIcon icon={fabTwitter} />
                  </button>
                  <button 
                    onClick={() => shareOnSocial('facebook')}
                    className="w-10 h-10 rounded-full bg-[#4267B2] hover:bg-[#3b5998] text-white flex items-center justify-center transition-colors"
                  >
                    <FontAwesomeIcon icon={fabFacebook} />
                  </button>
                  <button 
                    onClick={() => shareOnSocial('whatsapp')}
                    className="w-10 h-10 rounded-full bg-[#25D366] hover:bg-[#22c15e] text-white flex items-center justify-center transition-colors"
                  >
                    <FontAwesomeIcon icon={fabWhatsapp} />
                  </button>
                  <button 
                    onClick={() => shareOnSocial('linkedin')}
                    className="w-10 h-10 rounded-full bg-[#0077b5] hover:bg-[#006699] text-white flex items-center justify-center transition-colors"
                  >
                    <FontAwesomeIcon icon={fabLinkedin} />
                  </button>
                </div>
              </div>
            )}
            
            <div className="flex justify-end">
              <button 
                onClick={() => setShowShareModal(false)}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-md text-sm"
              >
                Close
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default VideoPreviewPage; 