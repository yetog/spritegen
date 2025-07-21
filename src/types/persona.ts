export interface Persona {
  id: string;
  name: string;
  description: string;
  referenceImageBase64?: string;
  styleTags: string[];
  characterTags: string[];
  examplePrompts: string[];
  isActive: boolean;
  usageCount: number;
  averageRating: number;
  createdAt: string;
  updatedAt?: string;
}

export interface CreatePersonaRequest {
  name: string;
  description: string;
  reference_image_base64?: string;
  style_tags: string[];
  character_tags: string[];
  example_prompts: string[];
  is_active?: boolean;
}

export interface UpdatePersonaRequest extends CreatePersonaRequest {
  // Same as create but for updates
}

export interface PersonaStats {
  total: number;
  active: number;
  inactive: number;
  most_used?: {
    name: string;
    usage_count: number;
  };
  average_usage: number;
}