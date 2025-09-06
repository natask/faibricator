import { GoogleGenAI, GenerateContentResponse, Modality } from "@google/genai";

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

export const generateDescription = async (imagesBase64: string[], imageMimeType: string): Promise<string> => {
  try {
    const imageParts = imagesBase64.map(img => fileToGenerativePart(img, imageMimeType));
    const response: GenerateContentResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { parts: [...imageParts, {text: "Describe the product shown in these images in a concise paragraph, focusing on its key visual features and potential materials."}] },
    });
    return response.text;
  } catch (error) {
    console.error("Error generating description:", error);
    throw new Error("Failed to generate product description.");
  }
};

export const editImage = async (imagesBase64: string[], imageMimeType: string, prompt: string): Promise<{ newImageBase64: string; textResponse: string }> => {
  try {
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
      throw new Error("AI did not return an edited image.");
    }
    
    return { newImageBase64, textResponse };
  } catch (error) {
    console.error("Error editing image:", error);
    throw new Error("Failed to edit the product image.");
  }
};

export const generateSketch = async (imageBase64: string, imageMimeType: string): Promise<string> => {
    try {
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
            return `data:${imagePartResponse.inlineData.mimeType};base64,${imagePartResponse.inlineData.data}`;
        }

        throw new Error("AI did not return a sketch.");
    } catch (error) {
        console.error("Error generating sketch:", error);
        throw new Error("Failed to generate product sketch.");
    }
};