import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { YOUTUBE_API } from '../config';

const TestTranscriptPage = () => {
  const [videoId, setVideoId] = useState('');
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState(null);
  const [error, setError] = useState(null);

  const fetchTranscript = async () => {
    if (!videoId) return;
    
    setLoading(true);
    setError(null);
    setResponse(null);
    
    try {
      // First, try the GET endpoint used in VideoDetailsPage
      console.log(`Testing GET endpoint: ${YOUTUBE_API}/video/${videoId}`);
      const getResponse = await axios.get(`${YOUTUBE_API}/video/${videoId}`);
      console.log('GET Response:', getResponse.data);
      
      // Then, try the POST endpoint used in TranscriptGridPage
      console.log(`Testing POST endpoint: ${YOUTUBE_API}/video/${videoId}`);
      const postResponse = await axios.post(`${YOUTUBE_API}/video/${videoId}`);
      console.log('POST Response:', postResponse.data);
      
      // Set the response data for display
      setResponse({
        getResponse: getResponse.data,
        postResponse: postResponse.data
      });
    } catch (err) {
      console.error('Error fetching transcript:', err);
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <h1 className="text-2xl font-bold mb-4">Transcript API Test Page</h1>
      
      <div className="mb-6">
        <label className="block mb-2">YouTube Video ID:</label>
        <div className="flex">
          <input 
            type="text" 
            value={videoId} 
            onChange={(e) => setVideoId(e.target.value)} 
            className="px-4 py-2 bg-gray-800 rounded-l text-white w-full"
            placeholder="Enter YouTube Video ID (e.g., dQw4w9WgXcQ)"
          />
          <button 
            onClick={fetchTranscript} 
            disabled={loading || !videoId}
            className="bg-blue-600 px-4 py-2 rounded-r font-medium disabled:bg-gray-600"
          >
            {loading ? 'Loading...' : 'Test API'}
          </button>
        </div>
        <p className="text-xs text-gray-400 mt-1">
          Enter the YouTube video ID (the part after v= in a YouTube URL)
        </p>
      </div>
      
      {error && (
        <div className="p-4 mb-4 bg-red-900/50 border border-red-700 rounded">
          <h2 className="font-bold mb-2">Error:</h2>
          <pre className="whitespace-pre-wrap text-sm">{error}</pre>
        </div>
      )}
      
      {response && (
        <div className="space-y-6">
          <div className="p-4 bg-gray-800 rounded border border-gray-700">
            <h2 className="font-bold mb-2">GET Response:</h2>
            <pre className="whitespace-pre-wrap text-sm overflow-auto max-h-[300px]">
              {JSON.stringify(response.getResponse, null, 2)}
            </pre>
          </div>
          
          <div className="p-4 bg-gray-800 rounded border border-gray-700">
            <h2 className="font-bold mb-2">POST Response:</h2>
            <pre className="whitespace-pre-wrap text-sm overflow-auto max-h-[300px]">
              {JSON.stringify(response.postResponse, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};

export default TestTranscriptPage; 