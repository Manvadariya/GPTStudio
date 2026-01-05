import { createContext, useContext, useState, useCallback } from 'react';
import { apiService } from '../lib/apiService';
import { toast } from 'sonner';

const AppContext = createContext();

export const useAppContext = () => {
  return useContext(AppContext);
};

export const AppProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isInitializing, setIsInitializing] = useState(true);
  
  // All other states initialized as empty
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [projects, setProjects] = useState([]);
  const [dataSources, setDataSources] = useState([]);
  const [playgroundMessages, setPlaygroundMessages] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [settings, setSettings] = useState({
    notifications: { email: true, browser: true, weekly: true, marketing: false },
    security: { twoFactor: false, sessionTimeout: '24h' },
    appearance: { theme: 'light', language: 'en' }
  });
  const [apiKeys, setApiKeys] = useState([]);

  // --- NEW: Central function to fetch all data for a logged-in user ---
  const fetchInitialData = async () => {
    try {
      // Fetch projects and data sources in parallel for speed
      const [fetchedProjects, fetchedDataSources] = await Promise.all([
        apiService.getProjects(),
        apiService.getDataSources()
      ]);
      
      // Mongoose uses _id, but our frontend often uses id. We map it here.
      setProjects(fetchedProjects.map(p => ({ ...p, id: p._id })));
      // The backend API for data sources already returns a mapped 'id' field.
      setDataSources(fetchedDataSources);

      // You would add fetches for team, notifications, etc. here in the future
      
    } catch (error) {
      toast.error("Failed to load your dashboard data. Please try logging in again.");
      console.error("Data fetching error:", error);
      // If fetching data fails, it's safest to log the user out.
      handleLogout(); 
    }
  };

  // This function now runs on initial app load if a token exists
  const loadUserFromToken = useCallback(async () => {
    const token = localStorage.getItem('authToken');
    if (token) {
      try {
        const userData = await apiService.getProfile();
        setUser(userData);
        // --- THE CRITICAL FIX ---
        await fetchInitialData(); // Fetch all data after confirming user identity
      } catch (error) {
        console.error("Session expired or token invalid:", error);
        localStorage.removeItem('authToken');
        setUser(null);
      }
    }
    setIsInitializing(false);
  }, []);

  // This function now runs only when a user actively signs in or signs up
  const handleAuth = async (authenticatedUser) => {
    setUser(authenticatedUser);
    // --- THE CRITICAL FIX ---
    await fetchInitialData(); // Also fetch all data after a fresh login
  };
  
  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('authToken');
    // Reset all states to prevent data from a previous session from flashing
    setProjects([]);
    setDataSources([]);
    setPlaygroundMessages([]);
    setNotifications([]);
    setApiKeys([]);
  };

  const value = {
    user, setUser,
    isInitializing,
    loadUserFromToken,
    handleAuth,
    handleLogout,
    sidebarCollapsed, setSidebarCollapsed,
    projects, setProjects,
    dataSources, setDataSources,
    playgroundMessages, setPlaygroundMessages,
    notifications, setNotifications,
    settings, setSettings,
    apiKeys, setApiKeys,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};