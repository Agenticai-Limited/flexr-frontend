// API Response types
export interface ApiResponse<T = any> {
  status: "success" | "error";
  message: string | null;
  data?: T;
}

export interface LoginResponse {
  token: string;
  name: string;
  email: string;
  phone?: string;
}

// Types for user authentication
export interface LoginCredentials {
  username: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  name: string;
  email: string;
  phone?: string;
}

// Types for user information
export interface UserInfo {
  name: string;
  email: string;
  phone?: string;
}

// Types for chat messages
export interface Message {
  id: string;
  role: "assistant" | "user";
  content: string;
  timestamp: string;
  renderHTML?: boolean;
  optFeedback?: boolean;
  metadata?: any;
  onClick?: (e: React.MouseEvent) => void;
}

// Types for file upload
export interface UploadedFile {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
  base64: string;
  thumbnailUrl?: string;
}

// Types for API requests
export interface ChatRequest {
  query?: string;
  file_path?: string;
}

// Service types
export type ServiceType = "reception" | "sales" | "qa" | "img" | "aftersales";

// API error type
export interface ApiError {
  message: string;
  status: number;
}

// Feedback request type
export interface FeedbackRequest {
  messageId: string;
  liked: boolean;
  reason?: string;
  content?: string;
  metadata?: any;
}
