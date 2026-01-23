const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

async function request(endpoint, options = {}) {
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

// Streaming chat request using Server-Sent Events style response
async function streamingRequest(endpoint, body, onChunk) {
  const url = `${API_BASE_URL}${endpoint}`;
  const token = localStorage.getItem('authToken');

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Request failed with status ${response.status}`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });

    // Parse SSE data lines
    const lines = buffer.split('\n');
    buffer = lines.pop(); // Keep incomplete line in buffer

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const jsonStr = line.slice(6);
        if (jsonStr.trim()) {
          try {
            const data = JSON.parse(jsonStr);
            onChunk(data);
          } catch (e) {
            console.warn('Failed to parse SSE data:', jsonStr);
          }
        }
      }
    }
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
  generateApiKey: (keyData) => request('/keys', { method: 'POST', body: JSON.stringify(keyData) }),
  deleteApiKey: (id) => request(`/keys/${id}`, { method: 'DELETE' }),

  // Data Sources (Knowledge Base)
  getDataSources: () => request('/data'),
  uploadFile: (formData) => request('/data/upload', { method: 'POST', body: formData }),
  ingestUrl: (url) => request('/data/ingest-url', { method: 'POST', body: JSON.stringify({ url }) }),
  deleteDataSource: (id) => request(`/data/${id}`, { method: 'DELETE' }),

  // Chat (RAG) - Non-streaming
  sendMessageToRAG: (chatData) => request('/chat', { method: 'POST', body: JSON.stringify(chatData) }),

  // Chat (RAG) - Streaming
  streamMessageToRAG: (chatData, onChunk) => streamingRequest('/chat/stream', chatData, onChunk),

  // Analytics
  getAnalytics: (range = '7d') => request(`/analytics?range=${range}`),

  // User Profile
  getProfile: () => request('/users/profile'),
};