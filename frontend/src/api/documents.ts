import { apiClient } from '../lib/api';
import type { Document, DocumentsResponse, DocumentSummary } from '../types/document.types';

export const documentsApi = {
  upload: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await apiClient.post('/documents/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  getAll: async (page = 1, limit = 20, search?: string): Promise<DocumentsResponse> => {
    const params = new URLSearchParams({ page: page.toString(), limit: limit.toString() });
    if (search) params.append('search', search);

    const response = await apiClient.get(`/documents?${params}`);
    return response.data;
  },

  getById: async (id: string): Promise<Document> => {
    const response = await apiClient.get(`/documents/${id}`);
    return response.data;
  },

  getSummary: async (id: string): Promise<DocumentSummary> => {
    const response = await apiClient.get(`/documents/${id}/summary`);
    return response.data;
  },

  download: async (id: string, filename: string) => {
    const response = await apiClient.get(`/documents/${id}/file`, {
      responseType: 'blob',
    });

    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
  },

  delete: async (id: string) => {
    const response = await apiClient.delete(`/documents/${id}`);
    return response.data;
  },
};

