import type { NextApiRequest, NextApiResponse } from 'next';
import { GoogleGenAI, GenerateContentResponse } from '@google/genai';

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  throw new Error('API_KEY environment variable not set');
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

const fileToGenerativePart = (base64: string, mimeType: string) => {
  return {
    inlineData: {
      data: base64.split(',')[1],
      mimeType,
    },
  };
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { imagesBase64, imageMimeType } = req.body;

    if (!imagesBase64 || !imageMimeType || !Array.isArray(imagesBase64)) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }
    
    const imageParts = imagesBase64.map((img) => fileToGenerativePart(img, imageMimeType));
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
          ...imageParts,
          {
            text: 'Describe the product shown in these images in a concise paragraph, focusing on its key visual features and potential materials.',
          },
        ],
      },
    });

    res.status(200).json({ description: response.text });
  } catch (error) {
    console.error('Error generating description:', error);
    res.status(500).json({ error: 'Failed to generate product description.' });
  }
}
