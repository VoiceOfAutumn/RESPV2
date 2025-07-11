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
    console.log(`Making API request to: ${url}`);
    const response = await fetch(url, mergedOptions);
    
    console.log(`API response status: ${response.status} for ${endpoint}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`API error for ${endpoint}:`, errorText);
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
    }

    // Try to parse as JSON, fall back to text if it fails
    try {
      const data = await response.json();
      console.log(`API success for ${endpoint}:`, data);
      return data;
    } catch {
      const text = await response.text();
      console.log(`API success (text) for ${endpoint}:`, text);
      return text;
    }
  } catch (error) {
    console.error(`API request failed for ${endpoint}:`, error);
    throw error;
  }
}
