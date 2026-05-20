// ============================================
// CutMaster Pro - API Client
// ============================================
const APP_BASE = window.location.protocol === 'http:' || window.location.protocol === 'https:'
  ? window.location.origin
  : 'http://localhost:5000';
const API_BASE = APP_BASE + '/api';

const api = {
  // Get stored token
  getToken: () => localStorage.getItem('cm_token'),
  getUser: () => JSON.parse(localStorage.getItem('cm_user') || 'null'),
  isLoggedIn: () => !!localStorage.getItem('cm_token'),

  // Auth headers
  headers: (extra = {}) => ({
    'Content-Type': 'application/json',
    ...(localStorage.getItem('cm_token') ? { Authorization: `Bearer ${localStorage.getItem('cm_token')}` } : {}),
    ...extra
  }),

  // Generic request
  async request(endpoint, options = {}) {
    try {
      const res = await fetch(`${API_BASE}${endpoint}`, {
        headers: this.headers(),
        ...options
      });
      const data = await res.json();
      if (res.status === 401) {
        localStorage.removeItem('cm_token');
        localStorage.removeItem('cm_user');
        window.location.href = APP_BASE + '/frontend/pages/login.html';
        return;
      }
      return { ok: res.ok, status: res.status, ...data };
    } catch (err) {
      return { ok: false, message: 'Network error. Is the server running?' };
    }
  },

  // Auth
  async register(name, email, password) {
    const res = await this.request('/auth/register', {
      method: 'POST', body: JSON.stringify({ name, email, password })
    });
    if (res?.ok) { localStorage.setItem('cm_token', res.token); localStorage.setItem('cm_user', JSON.stringify(res.user)); }
    return res;
  },
  async login(email, password) {
    const res = await this.request('/auth/login', {
      method: 'POST', body: JSON.stringify({ email, password })
    });
    if (res?.ok) { localStorage.setItem('cm_token', res.token); localStorage.setItem('cm_user', JSON.stringify(res.user)); }
    return res;
  },
  async me() { return this.request('/auth/me'); },
  logout() { localStorage.removeItem('cm_token'); localStorage.removeItem('cm_user'); window.location.href = APP_BASE + '/frontend/pages/login.html'; },

  // Dashboard
  async dashboard() { return this.request('/users/dashboard'); },

  // Projects
  async getProjects() { return this.request('/projects'); },
  async createProject(data) { return this.request('/projects', { method: 'POST', body: JSON.stringify(data) }); },
  async getProject(id) { return this.request(`/projects/${id}`); },
  async saveProject(id, data) { return this.request(`/projects/${id}`, { method: 'PUT', body: JSON.stringify(data) }); },
  async deleteProject(id) { return this.request(`/projects/${id}`, { method: 'DELETE' }); },
  async duplicateProject(id) { return this.request(`/projects/${id}/duplicate`, { method: 'POST' }); },

  // Videos
  async getVideos() { return this.request('/videos'); },
  async uploadVideo(formData) {
    const res = await fetch(`${API_BASE}/videos/upload`, {
      method: 'POST', headers: { Authorization: `Bearer ${this.getToken()}` }, body: formData
    });
    return res.json();
  },
  async deleteVideo(id) { return this.request(`/videos/${id}`, { method: 'DELETE' }); },

  // Templates
  async getTemplates(params = {}) {
    const q = new URLSearchParams(params).toString();
    return this.request(`/templates?${q}`);
  },
  async getFeaturedTemplates() { return this.request('/templates/featured'); },
  async useTemplate(id) { return this.request(`/templates/${id}`); },

  // Utils
  formatBytes(bytes) {
    if (!bytes) return '0 B';
    const k = 1024, sizes = ['B','KB','MB','GB','TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  },
  timeAgo(date) {
    const diff = (Date.now() - new Date(date)) / 1000;
    if (diff < 60) return 'just now';
    if (diff < 3600) return Math.floor(diff/60) + 'm ago';
    if (diff < 86400) return Math.floor(diff/3600) + 'h ago';
    return Math.floor(diff/86400) + 'd ago';
  }
};

window.api = api;
