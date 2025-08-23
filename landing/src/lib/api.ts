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
      
      // Try to parse the error response as JSON to extract the actual message
      try {
        const errorJson = JSON.parse(errorText);
        const errorMessage = errorJson.message || errorJson.error || 'An error occurred';
        throw new Error(errorMessage);
      } catch (parseError) {
        // If JSON parsing fails, try to extract message from string if it looks like JSON
        if (errorText.includes('"message"') && errorText.includes('{')) {
          const messageMatch = errorText.match(/"message"\s*:\s*"([^"]+)"/);
          if (messageMatch) {
            throw new Error(messageMatch[1]);
          }
        }
        if (errorText.includes('"error"') && errorText.includes('{')) {
          const errorMatch = errorText.match(/"error"\s*:\s*"([^"]+)"/);
          if (errorMatch) {
            throw new Error(errorMatch[1]);
          }
        }
        // Fallback to status-based message or generic error
        throw new Error(`Request failed with status ${response.status}`);
      }
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
