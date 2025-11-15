import axios from 'axios';
import { Package, Release, RepoMetadata, AuthResponse } from '../types';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api/v1';

const api = axios.create({
  baseURL: API_BASE_URL,
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth API
export const authAPI = {
  register: async (username: string, email: string, password: string): Promise<AuthResponse> => {
    const response = await api.post('/auth/register', { username, email, password });
    return response.data;
  },

  login: async (username: string, password: string): Promise<AuthResponse> => {
    const response = await api.post('/auth/login', { username, password });
    return response.data;
  },
};

// Public API
export const publicAPI = {
  getPackages: async (search?: string, page: number = 1, limit: number = 20) => {
    const response = await api.get('/packages', {
      params: { search, page, limit },
    });
    return response.data;
  },

  getPackage: async (owner: string, name: string): Promise<Package> => {
    const response = await api.get(`/packages/${owner}/${name}`);
    return response.data;
  },

  getReleases: async (owner: string, name: string) => {
    const response = await api.get(`/packages/${owner}/${name}/releases`);
    return response.data;
  },

  getRelease: async (owner: string, name: string, version: string): Promise<Release> => {
    const response = await api.get(`/packages/${owner}/${name}/releases/${version}`);
    return response.data;
  },

  downloadAsset: (owner: string, name: string, version: string, assetId: number): string => {
    return `${API_BASE_URL}/packages/${owner}/${name}/releases/${version}/assets/${assetId}`;
  },

  getInstallScript: (owner: string, name: string, version: string, platform: string, arch: string): string => {
    return `${API_BASE_URL}/packages/${owner}/${name}/install/${version}/${platform}/${arch}`;
  },
};

// Admin API
export const adminAPI = {
  importRepo: async (repositoryUrl: string, token?: string): Promise<{ metadata: RepoMetadata }> => {
    const response = await api.post('/admin/import', { repositoryUrl, token });
    return response.data;
  },

  createPackage: async (data: {
    owner: string;
    name: string;
    description?: string;
    readme?: string;
    repositoryUrl?: string;
    homepageUrl?: string;
  }) => {
    const response = await api.post('/admin/packages', data);
    return response.data;
  },

  updatePackage: async (id: number, data: Partial<Package>) => {
    const response = await api.put(`/admin/packages/${id}`, data);
    return response.data;
  },

  createRelease: async (packageId: number, data: {
    version: string;
    releaseNotes?: string;
    status?: 'draft' | 'published';
  }) => {
    const response = await api.post(`/admin/packages/${packageId}/releases`, data);
    return response.data;
  },

  updateRelease: async (releaseId: number, data: {
    releaseNotes?: string;
    status?: 'draft' | 'published';
  }) => {
    const response = await api.put(`/admin/releases/${releaseId}`, data);
    return response.data;
  },

  uploadAsset: async (releaseId: number, file: File, metadata: {
    platform?: string;
    os?: string;
    arch?: string;
  }) => {
    const formData = new FormData();
    formData.append('file', file);
    if (metadata.platform) formData.append('platform', metadata.platform);
    if (metadata.os) formData.append('os', metadata.os);
    if (metadata.arch) formData.append('arch', metadata.arch);

    const response = await api.post(`/admin/releases/${releaseId}/assets`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  deleteAsset: async (assetId: number) => {
    const response = await api.delete(`/admin/assets/${assetId}`);
    return response.data;
  },

  getAuditLogs: async (page: number = 1, limit: number = 50) => {
    const response = await api.get('/admin/audit-logs', {
      params: { page, limit },
    });
    return response.data;
  },
};

export default api;
