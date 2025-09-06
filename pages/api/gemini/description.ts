import { NextApiRequest, NextApiResponse } from 'next';
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb', // Increase body size limit to handle base64 images
    },
  },
};

const API_KEY = process.env.GOOGLE_AI_API_KEY;

if (!API_KEY) {
  console.error("GOOGLE_AI_API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: API_KEY! });

const fileToGenerativePart = (base64: string, mimeType: string) => {
  return {
    inlineData: {
      data: base64.split(',')[1],
      mimeType
    },
  };
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!API_KEY) {
    return res.status(500).json({ error: 'GOOGLE_AI_API_KEY not configured' });
  }

  try {
    const { imagesBase64, imageMimeType } = req.body;

    if (!imagesBase64 || !Array.isArray(imagesBase64) || imagesBase64.length === 0) {
      return res.status(400).json({ error: 'No images provided' });
    }

    const imageParts = imagesBase64.map((img: string) => fileToGenerativePart(img, imageMimeType));
    
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: { 
        parts: [
          ...imageParts, 
          { text: "Describe the product shown in these images in a concise paragraph, focusing on its key visual features and potential materials." }
        ] 
      },
    });

    return res.status(200).json({ description: response.text });
  } catch (error) {
    console.error("Error generating description:", error);
    return res.status(500).json({ error: "Failed to generate product description" });
  }
}
