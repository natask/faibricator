import { NextApiRequest, NextApiResponse } from 'next';
import { GoogleGenAI, GenerateContentResponse, Modality } from "@google/genai";

const API_KEY = process.env.API_KEY || process.env.GOOGLE_AI_API_KEY;

if (!API_KEY) {
  console.error("API_KEY environment variable not set");
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
    return res.status(500).json({ error: 'API key not configured' });
  }

  try {
    const { imagesBase64, imageMimeType, prompt } = req.body;

    if (!imagesBase64 || !Array.isArray(imagesBase64) || imagesBase64.length === 0) {
      return res.status(400).json({ error: 'No images provided' });
    }

    if (!prompt) {
      return res.status(400).json({ error: 'No prompt provided' });
    }

    const imageParts = imagesBase64.map((img: string) => fileToGenerativePart(img, imageMimeType));
    
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image-preview',
      contents: {
        parts: [
          ...imageParts,
          { text: prompt },
        ],
      },
      config: {
        responseModalities: [Modality.IMAGE, Modality.TEXT],
      },
    });
    
    let newImageBase64 = '';
    let textResponse = "No text response from AI.";

    if (response.candidates && response.candidates.length > 0 && response.candidates[0].content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          newImageBase64 = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
        } else if (part.text) {
          textResponse = part.text;
        }
      }
    }

    if (!newImageBase64) {
      return res.status(500).json({ error: "AI did not return an edited image" });
    }
    
    return res.status(200).json({ 
      newImageBase64, 
      textResponse 
    });
  } catch (error) {
    console.error("Error editing image:", error);
    return res.status(500).json({ error: "Failed to edit the product image" });
  }
}
