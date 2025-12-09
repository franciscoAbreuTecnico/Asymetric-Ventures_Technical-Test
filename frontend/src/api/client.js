import axios from 'axios';

// Base URL for the API.  When running in Docker Compose this can be the
// service name of the backend container.  On EC2 you can set
// VITE_BACKEND_URL to the appropriate host (e.g. http://backend:3001).
const baseURL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

const api = axios.create({
  baseURL,
});

export default api;