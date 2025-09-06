const handleResponse = async (response: Response) => {
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'An unknown error occurred.' }));
        throw new Error(errorData.error || `Request failed with status ${response.status}`);
    }
    return response.json();
};

export const generateDescription = async (imagesBase64: string[], imageMimeType: string): Promise<string> => {
    const response = await fetch('/api/generateDescription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imagesBase64, imageMimeType }),
    });
    const data = await handleResponse(response);
    return data.description;
};

export const editImage = async (imagesBase64: string[], imageMimeType: string, prompt: string): Promise<{ newImageBase64: string; textResponse: string }> => {
    const response = await fetch('/api/editImage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imagesBase64, imageMimeType, prompt }),
    });
    return await handleResponse(response);
};

export const generateSketch = async (imageBase64: string, imageMimeType: string): Promise<string> => {
    const response = await fetch('/api/generateSketch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64, imageMimeType }),
    });
    const data = await handleResponse(response);
    return data.sketch;
};
