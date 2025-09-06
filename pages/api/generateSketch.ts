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
        const { imageBase64, imageMimeType } = req.body;
        if (!imageBase64 || !imageMimeType) {
            return res.status(400).json({ error: 'Missing required parameters' });
        }

        const imagePart = fileToGenerativePart(imageBase64, imageMimeType);
        const prompt = "Generate a clean, black and white technical line drawing of this product. The sketch should be suitable for a manufacturing specification sheet. Focus on clear outlines, form, and key details. Remove all color, shading, and background elements. The output should be a single, clear product sketch.";
        
        const response: GenerateContentResponse = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image-preview',
            contents: {
                parts: [
                    imagePart,
                    { text: prompt },
                ],
            },
            config: {
                responseModalities: [Modality.IMAGE],
            },
        });

        const imagePartResponse = response.candidates[0].content.parts.find(part => part.inlineData);

        if (imagePartResponse && imagePartResponse.inlineData) {
            const sketch = `data:${imagePartResponse.inlineData.mimeType};base64,${imagePartResponse.inlineData.data}`;
            return res.status(200).json({ sketch });
        }

        res.status(500).json({ error: "AI did not return a sketch." });
    } catch (error) {
        console.error("Error generating sketch:", error);
        res.status(500).json({ error: "Failed to generate product sketch." });
    }
}
