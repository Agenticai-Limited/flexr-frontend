import axios, { AxiosError } from "axios";
import {
  LoginCredentials,
  ChatRequest,
  ApiError,
  FeedbackRequest,
  ApiResponse,
  LoginResponse,
} from "../types";

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "";
console.log("API Base URL:", BASE_URL);

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add token to requests if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle API errors
const handleApiError = (error: AxiosError): ApiError => {
  if (error.response) {
    const responseData = error.response.data as ApiResponse;
    return {
      message: responseData.message || "An error occurred",
      status: error.response.status,
    };
  }
  return {
    message: error.message || "Network error",
    status: 500,
  };
};

export const login = async (credentials: LoginCredentials) => {
  try {
    const response = await api.post<ApiResponse<LoginResponse>>(
      "/api/login",
      credentials
    );
    console.log("API Response:", response);
    console.log("Response Data:", response.data);

    if (!response.data.is_success) {
      throw new Error(response.data.message || "Login failed");
    }

    localStorage.setItem("token", credentials.username);

    return {
      name: credentials.username,
      email: credentials.username,
      token: credentials.username,
    };
  } catch (error) {
    console.error("Login Error:", error);
    if (error instanceof Error) {
      throw { message: error.message, status: 400 };
    }
    throw handleApiError(error as AxiosError);
  }
};

export const sendMessage = async (
  serviceType: string,
  request: ChatRequest
) => {
  try {
    console.log("Sending message to API:", { serviceType, request });
    const response = await api.post<any>(`/api/${serviceType}`, request);
    console.log("Raw API Response:", response);
    console.log("API Response data:", response.data);
    return response.data;
  } catch (error) {
    console.error("API call error:", error);
    throw handleApiError(error as AxiosError);
  }
};

export const sendFeedback = async (request: FeedbackRequest) => {
  try {
    const response = await api.post<ApiResponse>("/api/feedback", request);

    if (!response.data.is_success) {
      throw new Error(response.data.message || "Failed to send feedback");
    }

    return response.data.data;
  } catch (error) {
    throw handleApiError(error as AxiosError);
  }
};

export const uploadFile = async (file: File) => {
  try {
    const formData = new FormData();
    formData.append("file", file);

    const response = await api.post<ApiResponse>("/api/upload", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    if (!response.data.is_success) {
      throw new Error(response.data.message || "Failed to upload file");
    }

    return response.data.data;
  } catch (error) {
    throw handleApiError(error as AxiosError);
  }
};
