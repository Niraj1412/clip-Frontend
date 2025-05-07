import axios from 'axios';
import { API_URL, AUTH_API } from '../config';

// Create axios instance with default config
const api = axios.create({
  baseURL: AUTH_API,
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 10000 // 10 second timeout for all requests
});

// Add auth token to requests if available
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle auth errors globally
api.interceptors.response.use(
  response => {
    // If this is a login or registration response with a token, immediately update token
    if (response.config.url && 
        (response.config.url.includes('/login') || 
         response.config.url.includes('/signup') || 
         response.config.url.includes('/signin')) && 
        response.data.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response;
  },
  error => {
    // Check if this error is a network error or timeout
    if (error.code === 'ECONNABORTED' || !error.response || error.message.includes('Network Error')) {
      console.log('Network error detected:', error.message);
      
      // Store error information for the app to handle properly
      localStorage.setItem('authErrorType', 'network');
      localStorage.setItem('authErrorTimestamp', Date.now().toString());
      
      // Don't redirect on network errors, just let the app handle it
      return Promise.reject(error);
    }
    
    // Handle authentication errors
    if (error.response && error.response.status === 401) {
      console.log('Authentication error:', error.response.data);
      
      // Only redirect on auth errors if not already on auth pages
      if (!window.location.pathname.includes('/signin') && 
          !window.location.pathname.includes('/signup')) {
        // Store the current path for redirect after login
        if (!localStorage.getItem('redirectAfterLogin')) {
          localStorage.setItem('redirectAfterLogin', window.location.pathname);
        }
        
        // Store that we had an auth error
        localStorage.setItem('authErrorType', 'unauthorized');
        localStorage.setItem('authErrorTimestamp', Date.now().toString());
        
        // Clear tokens
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        
        // Instead of immediately redirecting, set a flag that can be used to show a modal
        window.dispatchEvent(new CustomEvent('auth:sessionExpired'));
      }
    }
    return Promise.reject(error);
  }
);

// Helper for decoding JWT tokens
const decodeToken = (token) => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(atob(base64));
  } catch (err) {
    console.error("Error decoding token:", err);
    return null;
  }
};

// Check if token is expired
const isTokenExpired = (token) => {
  if (!token) return true;
  
  try {
    const decoded = decodeToken(token);
    if (!decoded) return true;
    
    // Check if token has expiration and if it's expired
    if (decoded.exp) {
      const expirationDate = new Date(decoded.exp * 1000);
      return expirationDate < new Date();
    }
    
    // If no expiration date, assume token is valid for 1 hour from iat
    if (decoded.iat) {
      const issuedAt = new Date(decoded.iat * 1000);
      const expiresAt = new Date(issuedAt.getTime() + 60 * 60 * 1000); // 1 hour
      return expiresAt < new Date();
    }
    
    return false; // No way to determine expiration, assume valid
  } catch (err) {
    console.error("Error checking token expiration:", err);
    return true; // Assume expired if we can't verify
  }
};

// Auth service object
const authService = {
  // Login user with email and password
  login: async (email, password) => {
    try {
      console.log('Login attempt for:', email);
      
      // Before making the request, clear any previous auth errors
      localStorage.removeItem('authErrorType');
      localStorage.removeItem('authErrorTimestamp');
      
      const response = await api.post('/login', { email, password });
      console.log('Login response:', response.data);
      
      if (response.data.status && response.data.token) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        
        // Dispatch event for successful login
        window.dispatchEvent(new CustomEvent('auth:loggedIn'));
        return response.data;
      } else {
        throw new Error(response.data.message || 'Login failed');
      }
    } catch (error) {
      console.error('Login error:', error.response?.data || error.message);
      let message = 'Login failed';
      
      // Check for network errors first
      if (error.code === 'ECONNABORTED' || !error.response || error.message.includes('Network Error')) {
        message = 'Server not found. Please check your connection. You can try using the local demo mode.';
        localStorage.setItem('authErrorType', 'network');
        localStorage.setItem('authErrorTimestamp', Date.now().toString());
      } else if (error.response?.data?.message) {
        message = error.response.data.message;
      } else if (error.response?.status === 404) {
        message = 'Server not found. Please check your connection or use demo mode.';
      } else if (error.response?.status === 500) {
        message = 'Server error. Please try again later or use demo mode.';
      }
      
      throw new Error(message);
    }
  },

  // Register new user
  register: async (name, email, password) => {
    try {
      console.log('Registration attempt for:', email);
      
      // Before making the request, clear any previous auth errors
      localStorage.removeItem('authErrorType');
      localStorage.removeItem('authErrorTimestamp');
      
      const response = await api.post('/signup', { name, email, password });
      console.log('Registration response:', response.data);
      
      if (response.data.status && response.data.token) {
        // Don't automatically log in - return the response for the component to handle
        return response.data;
      } else {
        throw new Error(response.data.message || 'Registration failed');
      }
    } catch (error) {
      console.error('Registration error:', error.response?.data || error.message);
      let message = 'Registration failed';
      
      // Check for network errors first
      if (error.code === 'ECONNABORTED' || !error.response || error.message.includes('Network Error')) {
        message = 'Server not found. Please check your connection.';
        localStorage.setItem('authErrorType', 'network');
        localStorage.setItem('authErrorTimestamp', Date.now().toString());
      } else if (error.response?.data?.message) {
        message = error.response.data.message;
      } else if (error.response?.status === 404) {
        message = 'Server not found. Please check your connection.';
      } else if (error.response?.status === 409 || 
                (error.response?.data?.message && error.response?.data?.message.includes('exists'))) {
        message = 'A user with this email already exists.';
      }
      
      throw new Error(message);
    }
  },

  // Logout user (clear storage)
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    localStorage.removeItem('authErrorType');
    localStorage.removeItem('authErrorTimestamp');
    console.log('User logged out');
    
    // Clear demo mode if active
    if (authService.isDemoMode()) {
      authService.clearDemoMode();
    }
    
    // Dispatch event for successful logout
    window.dispatchEvent(new CustomEvent('auth:loggedOut'));
  },

  // Get current user from storage
  getCurrentUser: () => {
    const userStr = localStorage.getItem('user');
    if (!userStr) return null;
    
    try {
      return JSON.parse(userStr);
    } catch (error) {
      console.error('Error parsing user data:', error);
      localStorage.removeItem('user');
      return null;
    }
  },

  // Check if user is logged in
  isAuthenticated: () => {
    const token = localStorage.getItem('token');
    const hasToken = !!token;
    
    // If in demo mode, always return true
    if (authService.isDemoMode()) {
      return true;
    }
    
    // If we have a token, check if it's expired
    if (hasToken) {
      const expired = isTokenExpired(token);
      console.log('Authentication check:', hasToken, 'Token expired:', expired);
      
      // If token is expired, treat as not authenticated
      if (expired) {
        console.log('Token is expired, treating as not authenticated');
        
        // Store information about the expired token
        localStorage.setItem('authErrorType', 'expired');
        localStorage.setItem('authErrorTimestamp', Date.now().toString());
        
        // Don't remove the token here, let the app handle it with a proper UI
        return false;
      }
      return true;
    }
    
    return false;
  },
  
  // Refresh the current token (not implemented yet)
  refreshToken: async () => {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) {
      return false;
    }
    
    try {
      const response = await api.post('/users/refresh-token', { refreshToken });
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Token refresh failed:', error);
      return false;
    }
  },
  
  // Activate demo mode
  activateDemoMode: () => {
    // Generate a demo user
    const demoUser = {
      name: 'Demo User',
      email: 'demo@example.com',
      id: 'demo_' + Date.now(),
      role: 'Demo User'
    };
    
    // Store demo user
    localStorage.setItem('demoUser', JSON.stringify(demoUser));
    localStorage.setItem('isDemoMode', 'true');
    
    // Clear any auth errors
    localStorage.removeItem('authErrorType');
    localStorage.removeItem('authErrorTimestamp');
    
    // Dispatch event for demo mode
    window.dispatchEvent(new CustomEvent('auth:demoModeActivated'));
    
    return demoUser;
  },
  
  // Check if demo mode is active
  isDemoMode: () => {
    return localStorage.getItem('isDemoMode') === 'true';
  },
  
  // Clear demo mode
  clearDemoMode: () => {
    localStorage.removeItem('demoUser');
    localStorage.removeItem('isDemoMode');
  },

  // Add this method to the authService object
  getBaseUrl: () => {
    return API_URL;
  },

  // Social media authentication methods
  loginWithGoogle: async (googleToken) => {
    try {
      const response = await api.post('/signin/google', { token: googleToken });
      
      if (response.data.status && response.data.token) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        
        // Dispatch event for successful login
        window.dispatchEvent(new CustomEvent('auth:loggedIn'));
        return response.data;
      } else {
        throw new Error(response.data.message || 'Google login failed');
      }
    } catch (error) {
      console.error('Google login error:', error.response?.data || error.message);
      let message = 'Google login failed';
      
      if (error.response?.data?.message) {
        message = error.response.data.message;
      }
      
      throw new Error(message);
    }
  },

  loginWithGithub: async (code) => {
    try {
      const response = await api.post('/signin/github', { code });
      
      if (response.data.status && response.data.token) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        
        // Dispatch event for successful login
        window.dispatchEvent(new CustomEvent('auth:loggedIn'));
        return response.data;
      } else {
        throw new Error(response.data.message || 'GitHub login failed');
      }
    } catch (error) {
      console.error('GitHub login error:', error.response?.data || error.message);
      throw new Error(error.response?.data?.message || 'GitHub login failed');
    }
  },

  loginWithTwitter: async (oauthToken, oauthVerifier) => {
    try {
      const response = await api.post('/signin/twitter', { 
        oauth_token: oauthToken, 
        oauth_verifier: oauthVerifier 
      });
      
      if (response.data.status && response.data.token) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        
        // Dispatch event for successful login
        window.dispatchEvent(new CustomEvent('auth:loggedIn'));
        return response.data;
      } else {
        throw new Error(response.data.message || 'Twitter login failed');
      }
    } catch (error) {
      console.error('Twitter login error:', error.response?.data || error.message);
      throw new Error(error.response?.data?.message || 'Twitter login failed');
    }
  }
};

export default authService; 