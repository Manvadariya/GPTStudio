const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

async function request(endpoint, options = {}) {
  // ... (request function remains the same as before)
  const url = `${API_BASE_URL}${endpoint}`;
  const token = localStorage.getItem('authToken');
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  if (token) { headers['Authorization'] = `Bearer ${token}`; }
  if (options.body instanceof FormData) { delete headers['Content-Type']; }
  const config = { ...options, headers };
  try {
    const response = await fetch(url, config);
    if (response.status === 204) return null;
    const responseData = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(responseData.message || `Request failed with status ${response.status}`);
    return responseData;
  } catch (error) {
    console.error(`API Error on ${endpoint}:`, error);
    throw error;
  }
}

export const apiService = {
  // Auth
  login: (credentials) => request('/auth/login', { method: 'POST', body: JSON.stringify(credentials) }),
  signup: (userData) => request('/auth/signup', { method: 'POST', body: JSON.stringify(userData) }),

  // Projects
  getProjects: () => request('/projects'),
  createProject: (projectData) => request('/projects', { method: 'POST', body: JSON.stringify(projectData) }),
  updateProject: (id, projectData) => request(`/projects/${id}`, { method: 'PUT', body: JSON.stringify(projectData) }),
  deleteProject: (id) => request(`/projects/${id}`, { method: 'DELETE' }),

  // User Profile & Settings
  getUserProfile: () => request('/users/profile'),
  updateUserProfile: (profileData) => request('/users/profile', { method: 'PUT', body: JSON.stringify(profileData) }),

  // API Keys
  getApiKeys: () => request('/keys'),
  // The body of generateApiKey now includes name and projectId
  generateApiKey: (keyData) => request('/keys', { method: 'POST', body: JSON.stringify(keyData) }),
  deleteApiKey: (id) => request(`/keys/${id}`, { method: 'DELETE' }),
  
  // Data Sources (Knowledge Base)
  getDataSources: () => request('/data'),
  uploadFile: (formData) => request('/data/upload', { method: 'POST', body: formData }), // Corrected Endpoint
  deleteDataSource: (id) => request(`/data/${id}`, { method: 'DELETE' }),
  
  // Chat (RAG)
  sendMessageToRAG: (chatData) => request('/chat', { method: 'POST', body: JSON.stringify(chatData) }), // Corrected Endpoint
  
  // Analytics
  getAnalytics: (range = '7d') => request(`/analytics?range=${range}`),

  // --- NEW: User Profile ---
  getProfile: () => request('/users/profile'), 

};