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
      data: base64.includes(',') ? base64.split(',')[1] : base64,
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
    const { sketchBase64, sketchMimeType, description } = req.body;

    if (!sketchBase64) {
      return res.status(400).json({ error: 'No sketch image provided' });
    }

    if (!description) {
      return res.status(400).json({ error: 'No description provided' });
    }

    const imagePart = fileToGenerativePart(sketchBase64, sketchMimeType);
    
    const techPackPrompt = `Based on this manufacturing sketch and product description ("${description}"), generate a comprehensive technical package (tech pack) in HTML format. Include:

1. **Product Overview** - Brief description and intended use
2. **Technical Specifications** - Detailed measurements, materials, colors, and finishes
3. **Manufacturing Requirements** - Production methods, quality standards, and tolerances
4. **Bill of Materials (BOM)** - List of all components and materials needed
5. **Assembly Instructions** - Step-by-step manufacturing process
6. **Quality Control** - Testing requirements and acceptance criteria
7. **Packaging & Shipping** - Requirements for product packaging

Format the response as clean HTML with proper styling using inline CSS. Use professional formatting suitable for manufacturing documentation. Include the placeholder {{SKETCH_IMAGE_HTML}} where the sketch image should be inserted.`;

    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
          imagePart,
          { text: techPackPrompt },
        ],
      },
    });

    if (!response.text) {
      return res.status(500).json({ error: "AI did not return a tech pack" });
    }

    // Insert the sketch image HTML
    const sketchHtml = `
      <div style="text-align: center; margin: 20px 0; padding: 20px; border: 1px solid #ddd; border-radius: 8px; background-color: #f9f9f9;">
        <figure>
          <img src="${sketchBase64}" alt="Manufacturing Sketch" style="max-width: 100%; height: auto; border: 1px solid #ccc; border-radius: 4px;" />
          <figcaption style="margin-top: 10px; font-style: italic; color: #666;">Manufacturing Specification Sketch</figcaption>
        </figure>
      </div>
    `;

    const finalHtml = response.text.replace('{{SKETCH_IMAGE_HTML}}', sketchHtml);
    
    return res.status(200).json({ techPackHtml: finalHtml });
  } catch (error) {
    console.error("Error generating tech pack:", error);
    return res.status(500).json({ error: "Failed to generate tech pack" });
  }
}
