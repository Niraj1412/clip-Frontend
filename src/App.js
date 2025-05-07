import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { library } from '@fortawesome/fontawesome-svg-core';
import { fas } from '@fortawesome/free-solid-svg-icons';
import { UserLoggedinProvider } from './context/UserLoggedin';

import { ThemeProvider } from './context/ThemeContext';
import { AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import './styles/App.css';
import { ClipsDataProvider } from './context/clipsData';
import ProtectedRoute from './components/ProtectedRoute';

import HomePage from './pages/HomePage';
import ExplorePage from './pages/ExplorePage';
import LandingPage from './pages/LandingPage';
import SignInPage from './pages/SignInPage';
import SignUpPage from './pages/SignUpPage';
import ClipsPreviewerDemo from './pages/ClipsPreviewerDemo';
import ClipsPreviewerDemoImproved from './pages/ClipsPreviewerDemoImproved';
import InputPage from './pages/InputPage';
import TranscriptGridPage from './pages/TranscriptGridPage';
import MergeClipsPage from './pages/MergeClipsPage';
import TestTranscriptPage from './pages/TestTranscriptPage';
import VideoPreviewPage from './pages/VideoPreviewPage';
import ProfilePage from './pages/ProfilePage';
import ProjectDetailsPage from './pages/ProjectDetailsPage';
import OutputPage from './pages/OutputPage';

// Import new pages
import MyProjectsPage from './pages/MyProjectsPage';
import AboutPage from './pages/AboutPage';
import ContactPage from './pages/ContactPage';
import PrivacyPage from './pages/PrivacyPage';
import SettingsPage from './pages/SettingsPage';
import FeedbackPage from './pages/BillingPage';
import NotFoundPage from './pages/NotFoundPage';

import { VideoIdsProvider } from './context/videoIds';
import { PromptProvider } from './context/promptContext';
library.add(fas);

function App() {
  return (
    <ClipsDataProvider>
      <ThemeProvider>
        <UserLoggedinProvider>
          <PromptProvider>
            <VideoIdsProvider>
              <Router future={{ v7_relativeSplatPath: true }}>
                <div className="w-full h-screen bg-[#121212]">
                  <AnimatePresence mode="wait">
                    <Routes>
                      {/* Public routes */}
                      <Route path="/" element={<LandingPage />} />
                      <Route path="/signin" element={<SignInPage />} />
                      <Route path="/signup" element={<SignUpPage />} />
                      <Route path="/about" element={<AboutPage />} />
                      <Route path="/contact" element={<ContactPage />} />
                      <Route path="/privacy" element={<PrivacyPage />} />
                      
                      {/* Protected routes */}
                      <Route path="/dashboard" element={
                        <ProtectedRoute>
                          <HomePage />
                        </ProtectedRoute>
                      } />
                      <Route path="/explore" element={
                        <ProtectedRoute>
                          <ExplorePage />
                        </ProtectedRoute>
                      } />
                      <Route path="/create" element={
                        <ProtectedRoute>
                          <ClipsPreviewerDemoImproved />
                        </ProtectedRoute>
                      } />
              
                      <Route path="/input" element={
                        <ProtectedRoute>
                          <InputPage />
                        </ProtectedRoute>
                      } />
                      <Route path="/transcripts" element={
                        <ProtectedRoute>
                          <TranscriptGridPage />
                        </ProtectedRoute>
                      } />
                      {/* <Route path="/merge" element={
                        <ProtectedRoute>
                          <MergeClipsPage />
                        </ProtectedRoute>
                      } /> */}
                      
                      <Route path="/merge" element={
                        <ProtectedRoute>
                          <OutputPage />
                        </ProtectedRoute>
                      } />
                      
                      <Route path="/my-projects" element={
                        <ProtectedRoute>
                          <MyProjectsPage />
                        </ProtectedRoute>
                      } />
                      
                      <Route path="/profile" element={
                        <ProtectedRoute>
                          <ProfilePage />
                        </ProtectedRoute>
                      } />
                      <Route path="/settings" element={
                        <ProtectedRoute>
                          <SettingsPage />
                        </ProtectedRoute>
                      } />
                      <Route path="/feedback" element={
                        <ProtectedRoute>
                          <FeedbackPage />
                        </ProtectedRoute>
                      } />
                      
                      {/* Test route for transcript debugging */}
                      <Route path="/test-transcript" element={<TestTranscriptPage />} />
                      
                      {/* Project details route */}
                      <Route path="/project/:id" element={
                        <ProtectedRoute>
                          <ProjectDetailsPage />
                        </ProtectedRoute>
                      } />
                      
                      {/* Video preview route */}
                      <Route path="/video/:videoId" element={
                        <ProtectedRoute>
                          <VideoPreviewPage />
                        </ProtectedRoute>
                      } />
                      
                      {/* Catch-all route for any undefined routes */}
                      <Route path="*" element={<NotFoundPage />} />
                    </Routes>
                  </AnimatePresence>
                </div>
              </Router>
            </VideoIdsProvider>
          </PromptProvider>
        </UserLoggedinProvider>
      </ThemeProvider>
    </ClipsDataProvider>
  );
}

export default App;
