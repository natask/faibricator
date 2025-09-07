import { NextApiRequest, NextApiResponse } from 'next';
import { GoogleGenAI, GenerateContentResponse, Modality } from "@google/genai";

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
    const { imageBase64, imageMimeType } = req.body;

    if (!imageBase64) {
      return res.status(400).json({ error: 'No image provided' });
    }

    const imagePart = fileToGenerativePart(imageBase64, imageMimeType);
    const prompt = "Create a manufacturing-spec technical line drawing from this exact image. STRICT REQUIREMENTS: 1) Exactly preserve pose, silhouette, proportions, perspective, and component layout; do not add/remove/reinterpret parts. 2) Pure black lines on white; no shading, gradients, colors, textures, text, arrows, dimensions, or background. 3) Use slightly thicker outer contour lines and thinner interior detail lines. 4) Output a single, centered, clean technical sketch suitable for a tech pack.";
    
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

    const imagePartResponse = response.candidates && response.candidates.length > 0 && response.candidates[0].content?.parts
      ? response.candidates[0].content.parts.find(part => part.inlineData)
      : null;

    if (imagePartResponse && imagePartResponse.inlineData) {
      return res.status(200).json({ 
        sketchBase64: `data:${imagePartResponse.inlineData.mimeType};base64,${imagePartResponse.inlineData.data}`
      });
    }

    return res.status(500).json({ error: "AI did not return a sketch" });
  } catch (error) {
    console.error("Error generating sketch:", error);
    return res.status(500).json({ error: "Failed to generate product sketch" });
  }
}
