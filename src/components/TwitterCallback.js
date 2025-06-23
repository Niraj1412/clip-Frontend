import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import authService from '../services/authService';

const TwitterCallback = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const oauthToken = params.get('oauth_token');
    const oauthVerifier = params.get('oauth_verifier');

    if (oauthToken && oauthVerifier) {
      authService.loginWithTwitter({ oauth_token: oauthToken, oauth_verifier: oauthVerifier })
        .then(() => navigate('/dashboard'))
        .catch((err) => {
          console.error('Twitter login failed:', err);
          navigate('/signin?error=twitter_login_failed');
        });
    } else {
      navigate('/signin?error=no_oauth_params');
    }
  }, [navigate, location]);

  return <div>Loading...</div>;
};

export default TwitterCallback;