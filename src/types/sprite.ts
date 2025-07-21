export interface Sprite {
  id: string;
  character: string;
  pose: string;
  style: string;
  imageBase64: string;
  rating: number;
  feedback?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface GenerateRequest {
  character: string;
  pose: string;
  style: string;
}

export interface GenerateResponse {
  image_base64: string;
}