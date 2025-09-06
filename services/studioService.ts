import { ImageFile, SpeclyProject } from '../types';

// Utility function to convert File to base64
export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      // Remove "data:image/jpeg;base64," part
      resolve(result.split(',')[1]);
    };
    reader.onerror = error => reject(error);
  });
};

// Generate initial product description
export const generateDescription = async (image: ImageFile): Promise<string> => {
  try {
    const response = await fetch('/api/gemini/description', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        imagesBase64: [`data:${image.mimeType};base64,${image.base64}`],
        imageMimeType: image.mimeType
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

// Edit image with prompt and supplemental images
export const editImage = async (
  mainImage: ImageFile,
  supplementalImages: ImageFile[],
  prompt: string
): Promise<{ image: ImageFile; text: string | null }> => {
  try {
    // Prepare all images for the API call
    const allImages = [
      `data:${mainImage.mimeType};base64,${mainImage.base64}`,
      ...supplementalImages.map(img => `data:${img.mimeType};base64,${img.base64}`)
    ];

    let fullPrompt = `Edit the primary image based on this instruction: "${prompt}".`;
    if (supplementalImages.length > 0) {
      fullPrompt += ` Use the additional reference images provided.`;
    }

    const response = await fetch('/api/gemini/edit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        imagesBase64: allImages,
        imageMimeType: mainImage.mimeType,
        prompt: fullPrompt
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    // Convert the returned base64 data URL back to our ImageFile format
    const base64Data = data.newImageBase64.split(',')[1];
    const mimeType = data.newImageBase64.split(';')[0].split(':')[1];
    
    const newImage: ImageFile = {
      base64: base64Data,
      mimeType: mimeType,
      name: `edited_${Date.now()}.png`,
    };

    return { 
      image: newImage, 
      text: data.textResponse && data.textResponse !== "No text response from AI." ? data.textResponse : null
    };
  } catch (error) {
    console.error("Error editing image:", error);
    throw new Error("Failed to edit the product image.");
  }
};

// Helper function to convert base64 to Blob
const base64ToBlob = (base64: string, mimeType: string): Blob => {
  const byteCharacters = atob(base64);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  return new Blob([byteArray], { type: mimeType });
};

// Generate final manufacturing sketch
export const generateFinalSketch = async (
  mainImage: ImageFile,
  description: string
): Promise<ImageFile> => {
  try {
    // Convert base64 to Blob
    const imageBlob = base64ToBlob(mainImage.base64, mainImage.mimeType);
    
    // Create FormData
    const formData = new FormData();
    formData.append('image', imageBlob, 'image.png');
    formData.append('description', description);
    
    const response = await fetch('/api/gemini/final-sketch', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    // Convert the returned base64 data URL back to our ImageFile format
    const base64Data = data.sketchBase64.split(',')[1];
    const mimeType = data.sketchBase64.split(';')[0].split(':')[1];
    
    return {
      base64: base64Data,
      mimeType: mimeType,
      name: `sketch_${Date.now()}.png`,
    };
  } catch (error) {
    console.error("Error generating final sketch:", error);
    throw new Error("Failed to generate final sketch.");
  }
};

// Generate tech pack document
export const generateTechPack = async (
  sketch: ImageFile,
  description: string
): Promise<string> => {
  try {
    const response = await fetch('/api/gemini/tech-pack', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sketchBase64: `data:${sketch.mimeType};base64,${sketch.base64}`,
        sketchMimeType: sketch.mimeType,
        description: description
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.techPackHtml;
  } catch (error) {
    console.error("Error generating tech pack:", error);
    throw new Error("Failed to generate tech pack.");
  }
};

// Project management functions
const PROJECTS_KEY = 'studio_projects';

export const getProjects = (): SpeclyProject[] => {
  try {
    const projectsJson = localStorage.getItem(PROJECTS_KEY);
    if (projectsJson) {
      const projects = JSON.parse(projectsJson) as SpeclyProject[];
      // Sort by newest first
      return projects.sort((a, b) => b.createdAt - a.createdAt);
    }
  } catch (error) {
    console.error("Failed to parse projects from localStorage", error);
  }
  return [];
};

export const saveProject = (project: SpeclyProject): void => {
  const projects = getProjects();
  const existingIndex = projects.findIndex(p => p.id === project.id);
  
  // Create a clone to avoid mutating the state object directly
  const projectToSave = { ...project };

  // If history is too long, only keep the latest and the original images
  if (projectToSave.history.length > 2) {
    projectToSave.history = [
      projectToSave.history[0], // Latest
      projectToSave.history[projectToSave.history.length - 1] // Original
    ];
  }
  
  if (existingIndex > -1) {
    projects[existingIndex] = projectToSave;
  } else {
    projects.unshift(projectToSave); // Add to beginning
  }
  
  try {
    localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects));
  } catch (error) {
    console.error("Failed to save project to localStorage", error);
    if (error instanceof DOMException && error.name === 'QuotaExceededError') {
      alert("Could not save project. The browser storage is full. Please try deleting older projects.");
    }
  }
};

export const deleteProject = (id: string): void => {
  let projects = getProjects();
  projects = projects.filter(p => p.id !== id);
  
  try {
    localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects));
  } catch (error) {
    console.error("Failed to delete project from localStorage", error);
  }
};

// Find potential suppliers based on tech pack summary
export const findSuppliers = async (techPackSummary: string): Promise<string> => {
  try {
    const response = await fetch('/api/gemini/suppliers', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        techPackSummary: techPackSummary
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.suppliersHtml;
  } catch (error) {
    console.error("Error finding suppliers:", error);
    throw new Error("Failed to find suppliers.");
  }
};
