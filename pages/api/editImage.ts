import type { NextApiRequest, NextApiResponse } from 'next';
import { GoogleGenAI, GenerateContentResponse, Modality } from '@google/genai';

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
    throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

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

    try {
        const { imagesBase64, imageMimeType, prompt } = req.body;
        if (!imagesBase64 || !imageMimeType || !prompt || !Array.isArray(imagesBase64)) {
            return res.status(400).json({ error: 'Missing required parameters' });
        }

        const imageParts = imagesBase64.map(img => fileToGenerativePart(img, imageMimeType));
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

        for (const part of response.candidates[0].content.parts) {
            if (part.inlineData) {
                newImageBase64 = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
            } else if (part.text) {
                textResponse = part.text;
            }
        }

        if (!newImageBase64) {
          return res.status(500).json({ error: "AI did not return an edited image." });
        }
        
        res.status(200).json({ newImageBase64, textResponse });

    } catch (error) {
        console.error("Error editing image:", error);
        res.status(500).json({ error: "Failed to edit the product image." });
    }
}
