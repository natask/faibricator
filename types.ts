export interface ChatMessage {
  sender: 'user' | 'ai';
  text: string;
  images?: string[]; // base64 image data URLs
}

export interface User {
  id: string;
  email: string;
  name: string;
  avatar_url?: string;
  created_at: string;
}

export interface Supplier {
  id: string;
  name: string;
  location: string;
  logo_url?: string;
  created_at: string;
}

export interface Product {
  id: string;
  title: string;
  description: string;
  
  // Images
  product_image?: string; // Base64 or URL
  image_url?: string; // Fallback image URL for backward compatibility
  sketch_image?: string; // Base64 or URL of manufacturing sketch
  
  // Specifications
  tech_specs?: any; // Technical package from studio (JSONB)
  gemini_specs?: any; // Final Gemini-generated specifications (JSONB)
  
  // Suppliers
  supplier_list?: any[]; // List of potential suppliers (JSONB array)
  
  // Creator and ordering
  creator_id: string;
  min_order_quantity: number;
  current_votes: number;
  products_ordered: number;
  
  // Timestamps
  created_at: string;
  updated_at: string;
  
  // Relations
  creator?: User;
}

export interface Vote {
  id: string;
  product_id: string;
  user_id: string;
  quantity: number;
  created_at: string;
  // Relations
  product?: Product;
  user?: User;
}

// Specly types for the new studio functionality
export interface ImageFile {
  base64: string;
  mimeType: string;
  name: string;
}

export type SpeclyMessageSender = 'user' | 'ai';

export interface SpeclyMessage {
  sender: SpeclyMessageSender;
  text: string;
  image?: ImageFile;
}

export type TechPack = string;

export interface SpeclyProject {
  id: string;
  name: string;
  history: ImageFile[];
  chatHistory: SpeclyMessage[];
  createdAt: number;
  finalSketch?: ImageFile | null;
  techPack?: TechPack | null;
}