export interface ChatMessage {
  sender: 'user' | 'ai';
  text: string;
  images?: string[]; // base64 image data URLs
}