import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { PYTHON_API } from '../config';
import { 
    faPlayCircle, 
    faClosedCaptioning, 
    faClock, 
    faCalendarAlt,
    faChevronDown,
    faSpinner
} from '@fortawesome/free-solid-svg-icons';
import axios from 'axios';
import { YOUTUBE_API } from '../config';

const VideoDetailsPage = () => {
    const { videoId } = useParams();
    const [videoDetails, setVideoDetails] = useState(null);
    const [transcript, setTranscript] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expandedSegments, setExpandedSegments] = useState([]);

    const containerVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: {
            opacity: 1,
            y: 0,
            transition: { duration: 0.6, ease: "easeOut" }
        }
    };

    const cardVariants = {
        hidden: { opacity: 0, scale: 0.95 },
        visible: {
            opacity: 1,
            scale: 1,
            transition: { duration: 0.5, ease: "easeOut" }
        }
    };

    const toggleSegment = (index) => {
        setExpandedSegments(prev => 
            prev.includes(index) 
                ? prev.filter(i => i !== index)
                : [...prev, index]
        );
    };

    useEffect(() => {
        const fetchVideoDetails = async () => {
            try {
                setLoading(true);
                console.log(`Fetching video details for ${videoId}...`);
                
                const response = await axios.get(YOUTUBE_API + `/video/${videoId}`);
                console.log('Response data:', response.data);
                
                if (response.data.status) {
                    setVideoDetails(response.data.data);
                    
                    if (response.data.data && Array.isArray(response.data.data.transcript)) {
                        console.log(`Found ${response.data.data.transcript.length} transcript segments`);
                        setTranscript(response.data.data.transcript);
                    } else if (Array.isArray(response.data.data)) {
                        // The API might be returning the transcript directly
                        console.log(`Found ${response.data.data.length} transcript segments (direct array)`);
                        setTranscript(response.data.data);
                    } else {
                        console.warn('Transcript data not found in the expected format:', response.data);
                        setTranscript([]);
                    }
                } else {
                    console.error('API returned unsuccessful status:', response.data);
                    setVideoDetails(null);
                    setTranscript([]);
                }
            } catch (error) {
                console.error('Error fetching video details:', error);
                setVideoDetails(null);
                setTranscript([]);
            } finally {
                setLoading(false);
            }
        };

        if (videoId) {
            fetchVideoDetails();
        }
    }, [videoId]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <FontAwesomeIcon icon={faSpinner} className="text-[#6c5ce7] text-4xl animate-spin" />
            </div>
        );
    }

    return (
        <motion.div 
            className="min-h-screen pt-14 pb-6 px-6"
            initial="hidden"
            animate="visible"
            variants={containerVariants}
        >
            {/* Background Pattern */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute inset-0 opacity-[0.03]" style={{
                    backgroundImage: `
                        radial-gradient(#6c5ce7 1.5px, transparent 1.5px),
                        radial-gradient(#8b7cf7 1.5px, transparent 1.5px)
                    `,
                    backgroundSize: '50px 50px, 25px 25px',
                    backgroundPosition: '0 0, 25px 25px',
                    animation: 'backgroundMove 60s linear infinite'
                }}></div>
            </div>

            <div className="max-w-[1120px] mx-auto space-y-6">
                {/* Video Details Card */}
                <motion.div 
                    className="backdrop-blur-xl bg-[#1a1a1a]/90 rounded-2xl shadow-2xl border border-gray-800/50 overflow-hidden p-6"
                    variants={cardVariants}
                >
                    {videoDetails && (
                        <div className="space-y-6">
                            <div className="aspect-video rounded-xl overflow-hidden">
                                <iframe
                                    width="100%"
                                    height="100%"
                                    src={`https://www.youtube.com/embed/${videoId}`}
                                    title={videoDetails.title}
                                    frameBorder="0"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                ></iframe>
                            </div>
                            
                            <div className="space-y-4">
                                <h1 className="text-2xl font-semibold text-white">{videoDetails.title}</h1>
                                <div className="flex flex-wrap gap-4 text-sm text-gray-400">
                                    <span className="flex items-center gap-2">
                                        <FontAwesomeIcon icon={faPlayCircle} className="text-[#6c5ce7]" />
                                        {videoDetails.views} views
                                    </span>
                                    <span className="flex items-center gap-2">
                                        <FontAwesomeIcon icon={faClock} className="text-[#6c5ce7]" />
                                        {videoDetails.duration}
                                    </span>
                                    <span className="flex items-center gap-2">
                                        <FontAwesomeIcon icon={faCalendarAlt} className="text-[#6c5ce7]" />
                                        {new Date(videoDetails.publishedAt).toLocaleDateString()}
                                    </span>
                                </div>
                                <p className="text-gray-300 text-sm leading-relaxed">{videoDetails.description}</p>
                            </div>
                        </div>
                    )}
                </motion.div>

                {/* Transcript Card */}
                <motion.div 
                    className="backdrop-blur-xl bg-[#1a1a1a]/90 rounded-2xl shadow-2xl border border-gray-800/50 overflow-hidden p-6"
                    variants={cardVariants}
                >
                    <div className="flex items-center gap-2 mb-6">
                        <FontAwesomeIcon icon={faClosedCaptioning} className="text-[#6c5ce7] text-xl" />
                        <h2 className="text-xl font-semibold text-white">Video Transcript</h2>
                    </div>

                    <div className="space-y-4">
                        {transcript.map((segment, index) => (
                            <motion.div
                                key={index}
                                className="border border-gray-800/50 rounded-xl overflow-hidden"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                            >
                                <button
                                    className="w-full flex items-center justify-between p-4 bg-gray-800/30 hover:bg-gray-800/50 transition-all"
                                    onClick={() => toggleSegment(index)}
                                >
                                    <span className="text-gray-300 text-sm">
                                        {new Date(segment.startTime * 1000).toISOString().substr(11, 8)}
                                    </span>
                                    <FontAwesomeIcon
                                        icon={faChevronDown}
                                        className={`text-[#6c5ce7] transition-transform ${
                                            expandedSegments.includes(index) ? 'rotate-180' : ''
                                        }`}
                                    />
                                </button>
                                {expandedSegments.includes(index) && (
                                    <div className="p-4 bg-gray-800/20">
                                        <p className="text-gray-300 text-sm leading-relaxed">
                                            {segment.text}
                                        </p>
                                    </div>
                                )}
                            </motion.div>
                        ))}
                    </div>
                </motion.div>
            </div>

            <style>
                {`
                @keyframes backgroundMove {
                    0% { background-position: 0 0, 25px 25px; }
                    100% { background-position: 50px 50px, 75px 75px; }
                }
                `}
            </style>
        </motion.div>
    );
};

export default VideoDetailsPage; 