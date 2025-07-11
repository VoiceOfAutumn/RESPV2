// API configuration for frontend
// This will use the environment variable or fallback to localhost for development

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://backend-6wqj.onrender.com';

// Helper function for making API requests with proper error handling
export async function apiRequest(endpoint: string, options: RequestInit = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const defaultOptions: RequestInit = {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  };

  const mergedOptions = { ...defaultOptions, ...options };

  try {
    const response = await fetch(url, mergedOptions);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    // Try to parse as JSON, fall back to text if it fails
    try {
      return await response.json();
    } catch {
      return await response.text();
    }
  } catch (error) {
    console.error(`API request failed for ${endpoint}:`, error);
    throw error;
  }
}
