import { GenerateRequest, GenerateResponse, Sprite } from '../types/sprite';

// Use relative URL or detect protocol automatically
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 
  (window.location.protocol === 'https:' ? 'https://localhost:5000' : 'http://localhost:5000');

// Helper function to handle fetch with better error messages
const fetchWithErrorHandling = async (url: string, options?: RequestInit) => {
  try {
    const response = await fetch(url, {
      ...options,
      // Add timeout
      signal: AbortSignal.timeout(10000), // 10 second timeout
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }
    
    return response;
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === 'AbortError' || error.name === 'TimeoutError') {
        throw new Error('Request timed out. Please check if the backend server is running.');
      }
      if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        throw new Error('Cannot connect to backend server. Please ensure the backend is running on http://localhost:5000');
      }
    }
    throw error;
  }
};

export const generateSprite = async (request: GenerateRequest): Promise<GenerateResponse> => {
  const prompt = `Generate a sprite of ${request.character}${request.pose ? ` in ${request.pose} pose` : ''}${request.style ? ` with ${request.style} style` : ''}. High quality, detailed sprite art, game character design.`;
  
  const response = await fetchWithErrorHandling(`${API_BASE_URL}/image`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ prompt }),
  });

  const data = await response.json();
  return data;
};

export const enhancePrompt = async (prompt: string): Promise<string> => {
  const response = await fetchWithErrorHandling(`${API_BASE_URL}/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ 
      prompt: `Enhance this sprite generation prompt to be more detailed and specific for better AI art generation: "${prompt}". Return only the enhanced prompt.`
    }),
  });

  const data = await response.json();
  return data.output || prompt;
};

// New chat function for the integrated chatbot
export const sendChat = async (message: string): Promise<string> => {
  const response = await fetchWithErrorHandling(`${API_BASE_URL}/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ 
      prompt: `You are a helpful AI assistant specialized in sprite generation for games and animations. Help the user with their sprite creation needs. User message: "${message}". 

When suggesting specific values for character, pose, or style, format them like this:
[CHARACTER: suggested_character_name]
[POSE: suggested_pose_description]  
[STYLE: suggested_style_description]

This will help the user apply your suggestions directly to their sprite parameters.`
    }),
  });

  const data = await response.json();
  return data.output || 'Sorry, I could not process your request.';
};

// New sprite management functions

export const saveSprite = async (sprite: Sprite): Promise<void> => {
  const response = await fetchWithErrorHandling(`${API_BASE_URL}/sprites`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      id: sprite.id,
      character: sprite.character,
      pose: sprite.pose,
      style: sprite.style,
      image_base64: sprite.imageBase64,
      rating: sprite.rating,
      feedback: sprite.feedback
    }),
  });
};

export const fetchSprites = async (filters?: {
  character?: string;
  rating?: number;
  sortBy?: 'created_at' | 'updated_at' | 'rating' | 'character';
  sortOrder?: 'ASC' | 'DESC';
}): Promise<Sprite[]> => {
  const params = new URLSearchParams();
  
  if (filters?.character) params.append('character', filters.character);
  if (filters?.rating) params.append('rating', filters.rating.toString());
  if (filters?.sortBy) params.append('sort_by', filters.sortBy);
  if (filters?.sortOrder) params.append('sort_order', filters.sortOrder);

  const response = await fetchWithErrorHandling(`${API_BASE_URL}/sprites?${params.toString()}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  const data = await response.json();
  return data.sprites;
};

export const updateSpriteRating = async (id: string, rating: number, feedback?: string): Promise<void> => {
  const response = await fetchWithErrorHandling(`${API_BASE_URL}/sprites/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ rating, feedback }),
  });
};

export const deleteSprite = async (id: string): Promise<void> => {
  const response = await fetchWithErrorHandling(`${API_BASE_URL}/sprites/${id}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
    },
  });
};

export const getSpriteStats = async (): Promise<{
  total: number;
  rated: number;
  characters: number;
  average_rating: number;
}> => {
  const response = await fetchWithErrorHandling(`${API_BASE_URL}/sprites/stats`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  return response.json();
};

// Health check function to test backend connectivity
export const checkBackendHealth = async (): Promise<boolean> => {
  try {
    const response = await fetchWithErrorHandling(`${API_BASE_URL}/health`);
    const data = await response.json();
    return data.status === 'healthy';
  } catch (error) {
    console.error('Backend health check failed:', error);
    return false;
  }
};