export const generateDescription = async (imagesBase64: string[], imageMimeType: string): Promise<string> => {
  try {
    const response = await fetch('/api/gemini/description', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        imagesBase64,
        imageMimeType
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.description;
  } catch (error) {
    console.error("Error generating description:", error);
    throw new Error("Failed to generate product description.");
  }
};

export const editImage = async (imagesBase64: string[], imageMimeType: string, prompt: string): Promise<{ newImageBase64: string; textResponse: string }> => {
  try {
    const response = await fetch('/api/gemini/edit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        imagesBase64,
        imageMimeType,
        prompt
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return {
      newImageBase64: data.newImageBase64,
      textResponse: data.textResponse
    };
  } catch (error) {
    console.error("Error editing image:", error);
    throw new Error("Failed to edit the product image.");
  }
};

export const generateSketch = async (imageBase64: string, imageMimeType: string): Promise<string> => {
  try {
    const response = await fetch('/api/gemini/sketch', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        imageBase64,
        imageMimeType
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.sketchBase64;
  } catch (error) {
    console.error("Error generating sketch:", error);
    throw new Error("Failed to generate product sketch.");
  }
};