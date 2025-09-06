import { NextApiRequest, NextApiResponse } from 'next';
import { GoogleGenAI, GenerateContentResponse, Modality } from "@google/genai";
import formidable from 'formidable';
import fs from 'fs';
import { promisify } from 'util';

const readFile = promisify(fs.readFile);
const unlink = promisify(fs.unlink);

export const config = {
  api: {
    bodyParser: false, // Disable body parser for FormData
  },
};

const API_KEY = process.env.GOOGLE_AI_API_KEY;

if (!API_KEY) {
  console.error("GOOGLE_AI_API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: API_KEY! });

const parseForm = (req: NextApiRequest): Promise<{ fields: formidable.Fields; files: formidable.Files }> => {
  return new Promise((resolve, reject) => {
    const form = formidable({ maxFileSize: 10 * 1024 * 1024 }); // 10MB max
    form.parse(req, (err, fields, files) => {
      if (err) reject(err);
      else resolve({ fields, files });
    });
  });
};

const fileToGenerativePart = async (file: formidable.File) => {
  const buffer = await readFile(file.filepath);
  return {
    inlineData: {
      data: buffer.toString('base64'),
      mimeType: file.mimetype || 'image/png'
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

  let tempFilePath: string | null = null;

  try {
    const { fields, files } = await parseForm(req);
    
    const imageFile = Array.isArray(files.image) ? files.image[0] : files.image;
    const description = Array.isArray(fields.description) ? fields.description[0] : fields.description;

    if (!imageFile) {
      return res.status(400).json({ error: 'No image provided' });
    }

    if (!description) {
      return res.status(400).json({ error: 'No description provided' });
    }

    tempFilePath = imageFile.filepath;
    const imagePart = await fileToGenerativePart(imageFile);
    
    const prompt = `Based on the provided product image and its description ("${description}"), generate a clean, black-and-white manufacturing specification sketch. This sketch should look like a technical line drawing, highlighting key components, dimensions, and materials callouts. It should be suitable for a tech pack.`;
    
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image-preview',
      contents: {
        parts: [
          imagePart,
          { text: prompt },
        ],
      },
      config: {
        responseModalities: [Modality.IMAGE, Modality.TEXT],
      },
    });
    
    let sketchBase64 = '';

    if (response.candidates && response.candidates.length > 0 && response.candidates[0].content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          sketchBase64 = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
          break;
        }
      }
    }

    if (!sketchBase64) {
      return res.status(500).json({ error: "AI did not return a sketch image" });
    }
    
    return res.status(200).json({ sketchBase64 });
  } catch (error) {
    console.error("Error generating final sketch:", error);
    return res.status(500).json({ error: "Failed to generate final sketch" });
  } finally {
    // Clean up temp file
    if (tempFilePath) {
      try {
        await unlink(tempFilePath);
      } catch (err) {
        console.error("Error deleting temp file:", err);
      }
    }
  }
}