import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import InputComponent from '../components/InputComponent';
import authService from '../services/authService';

const HomePage = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Check if the user is authenticated
    if (!authService.isAuthenticated()) {
      navigate('/signin');
      return;
    }

    // Remove only videoIds from localStorage instead of clearing everything
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.includes('videoId') || key === 'videoIds') {
        localStorage.removeItem(key);
      }
    });
  }, [navigate]);

  return(
    <>
      <Navbar />
      <div className="flex">
        <Sidebar />
        <main className="ml-[280px] mt-7 flex-1 p-6">
          <InputComponent />
        </main>
      </div>
    </>
  )
}

export default HomePage;