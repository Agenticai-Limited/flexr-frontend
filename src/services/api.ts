import axios, { AxiosError } from 'axios';
import { LoginCredentials, AuthResponse, ChatRequest, ApiError, FeedbackRequest } from '../types';

const BASE_URL = 'http://localhost:8000';

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle API errors
const handleApiError = (error: AxiosError): ApiError => {
  if (error.response) {
    const responseData = error.response.data as { message?: string };
    return {
      message: responseData.message || 'An error occurred',
      status: error.response.status,
    };
  }
  return {
    message: error.message || 'Network error',
    status: 500,
  };
};

export const login = async (credentials: LoginCredentials): Promise<AuthResponse> => {
  try {
    const response = await api.post<AuthResponse>('/api/login', credentials);
    localStorage.setItem('token', response.data.token);
    return response.data;
  } catch (error) {
    throw handleApiError(error as AxiosError);
  }
};

export const sendMessage = async (serviceType: string, request: ChatRequest) => {
  try {
    const response = await api.post(`/api/${serviceType}`, request);    
    return response.data;
  } catch (error) {
    throw handleApiError(error as AxiosError);
  }
};

export const sendFeedback = async (request: FeedbackRequest) => {
  try {
    const response = await api.post('/api/feedback', request);
    return response.data;
  } catch (error) {
    throw handleApiError(error as AxiosError);
  }
};

export const uploadFile = async (file: File) => {
  try {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post('/api/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    throw handleApiError(error as AxiosError);
  }
};