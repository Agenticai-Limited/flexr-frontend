import axios, { AxiosError, AxiosResponse } from "axios";
import {
  LoginCredentials,
  ChatRequest,
  ApiError,
  FeedbackRequest,
  ApiResponse,
  LoginResponse,
  LoginSuccessResponse,
  LoginErrorResponse,
  UserInfo,
} from "../types";

export const BASE_URL = import.meta.env.VITE_API_BASE_URL || "";
console.log("API Base URL:", BASE_URL);

const AUTH_TOKEN_KEY = "auth_token";
let authToken: string | null = null;

// Restore token from sessionStorage
const storedToken = sessionStorage.getItem(AUTH_TOKEN_KEY);
if (storedToken) {
  authToken = storedToken;
}

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add token to requests if available
api.interceptors.request.use((config) => {
  if (authToken) {
    config.headers.Authorization = `Bearer ${authToken}`;
  }
  return config;
});

// Handle 401 errors
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Clear auth info
      authToken = null;
      sessionStorage.removeItem(AUTH_TOKEN_KEY);
      localStorage.removeItem("isLoggedIn");
      localStorage.removeItem("userInfo");
      // Redirect to login page
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

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

export const login = async (
  credentials: LoginCredentials
): Promise<LoginResponse> => {
  try {
    const params = new URLSearchParams();
    params.append("username", credentials.username);
    params.append("password", credentials.password);

    const response: AxiosResponse<LoginResponse> = await api.post(
      "/api/login",
      params,
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        validateStatus: (status) =>
          (status >= 200 && status < 300) || status === 401,
      }
    );

    // Store token if login successful
    if (
      "success" in response.data &&
      response.data.success &&
      response.data.data.access_token
    ) {
      const token = response.data.data.access_token;
      authToken = token;
      sessionStorage.setItem(AUTH_TOKEN_KEY, token);
    }

    return response.data;
  } catch (error) {
    console.error("Login Error:", error);
    if (error instanceof Error) {
      throw { message: error.message, status: 400 };
    }
    throw handleApiError(error as AxiosError);
  }
};

export const getCurrentUser = async (): Promise<UserInfo | null> => {
  // Avoid making a request if there's no token
  if (!authToken) {
    return null;
  }

  try {
    const response = await api.get<UserInfo>("/api/me");
    return response.data;
  } catch (error) {
    // The interceptor will handle 401 errors
    // For other errors, we treat it as not authenticated
    return null;
  }
};

export const logout = () => {
  authToken = null;
  sessionStorage.removeItem(AUTH_TOKEN_KEY);
  window.location.href = "/login";
};

export const startQaTask = async (request: ChatRequest) => {
  try {
    const response = await api.post<{ message_id: string }>("/api/qa", request);
    return response.data;
  } catch (error) {
    console.error("API call error:", error);
    throw handleApiError(error as AxiosError);
  }
};

export const sendFeedback = async (request: FeedbackRequest) => {
  try {
    const response = await api.post<ApiResponse>("/api/feedback", request);
    return {
      status: response.data.status,
      message: response.data.message,
    };
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
