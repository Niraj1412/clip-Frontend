import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import InputComponent from '../components/InputComponent';
import authService from '../services/authService';
import { useState } from "react";

const HomePage = () => {
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Add click-outside-to-close functionality  
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isSidebarOpen && window.innerWidth < 1024) {
        const sidebar = document.querySelector('[data-sidebar]');
        const navbar = document.querySelector('nav');
        
        if (sidebar && navbar && 
            !sidebar.contains(event.target) && 
            !navbar.contains(event.target)) {
          console.log('Clicked outside sidebar - closing (HomePage)');
          setIsSidebarOpen(false);
        }
      }
    };

    if (isSidebarOpen) {
      document.addEventListener('click', handleClickOutside, true);
    }

    return () => {
      document.removeEventListener('click', handleClickOutside, true);
    };
  }, [isSidebarOpen]);

  useEffect(() => {
    if (!authService.isAuthenticated()) {
      navigate('/signin');
      return;
    }

    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.includes('videoId') || key === 'videoIds') {
        localStorage.removeItem(key);
      }
    });
  }, [navigate]);

  return (
    <>
      <Navbar setSidebarOpen={setIsSidebarOpen} isSidebarOpen={isSidebarOpen} /> {/* Pass both props to Navbar */}
      <div className="flex">
        <Sidebar isOpen={isSidebarOpen} toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
        <main className="ml-0 lg:ml-[280px] mt-7 flex-1 p-3 sm:p-4 lg:p-6">
          <InputComponent />
        </main>
      </div>
    </>
  );
};

export default HomePage;