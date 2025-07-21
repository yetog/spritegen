import { Persona, CreatePersonaRequest, UpdatePersonaRequest, PersonaStats } from '../types/persona';

const API_BASE_URL = 'http://localhost:5000';

export const createPersona = async (request: CreatePersonaRequest): Promise<{ id: string; name: string }> => {
  const response = await fetch(`${API_BASE_URL}/personas`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
  }

  return response.json();
};

export const fetchPersonas = async (filters?: {
  active_only?: boolean;
  sort_by?: 'created_at' | 'updated_at' | 'name' | 'usage_count' | 'average_rating';
  sort_order?: 'ASC' | 'DESC';
}): Promise<Persona[]> => {
  const params = new URLSearchParams();
  
  if (filters?.active_only) params.append('active_only', 'true');
  if (filters?.sort_by) params.append('sort_by', filters.sort_by);
  if (filters?.sort_order) params.append('sort_order', filters.sort_order);

  const response = await fetch(`${API_BASE_URL}/personas?${params.toString()}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(errorData.error || `Failed to fetch personas: ${response.status}`);
  }

  const data = await response.json();
  return data.personas;
};

export const fetchPersona = async (id: string): Promise<Persona> => {
  const response = await fetch(`${API_BASE_URL}/personas/${id}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(errorData.error || `Failed to fetch persona: ${response.status}`);
  }

  const data = await response.json();
  return data.persona;
};

export const updatePersona = async (id: string, request: UpdatePersonaRequest): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/personas/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(errorData.error || `Failed to update persona: ${response.status}`);
  }
};

export const deletePersona = async (id: string): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/personas/${id}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(errorData.error || `Failed to delete persona: ${response.status}`);
  }
};

export const togglePersonaStatus = async (id: string): Promise<{ is_active: boolean }> => {
  const response = await fetch(`${API_BASE_URL}/personas/${id}/toggle`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(errorData.error || `Failed to toggle persona status: ${response.status}`);
  }

  return response.json();
};

export const getPersonaStats = async (): Promise<PersonaStats> => {
  const response = await fetch(`${API_BASE_URL}/personas/stats`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(errorData.error || `Failed to fetch persona stats: ${response.status}`);
  }

  return response.json();
};