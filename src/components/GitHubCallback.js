import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import authService from '../../services/authService';

const GitHubCallback = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const code = params.get('code');

    if (code) {
      authService.loginWithGithub(code)
        .then(() => navigate('/dashboard'))
        .catch((err) => {
          console.error('GitHub login failed:', err);
          navigate('/signin?error=github_login_failed');
        });
    } else {
      navigate('/signin?error=no_code');
    }
  }, [navigate, location]);

  return <div>Loading...</div>;
};

export default GitHubCallback;