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

// Client-side image compression using Canvas
export const compressImage = async (
  image: ImageFile,
  options?: { maxWidth?: number; maxHeight?: number; quality?: number; targetMimeType?: string }
): Promise<ImageFile> => {
  const maxWidth = options?.maxWidth ?? 1600;
  const maxHeight = options?.maxHeight ?? 1600;
  const quality = options?.quality ?? 0.85;
  const targetMimeType = options?.targetMimeType ?? 'image/webp';

  const dataUrl = `data:${image.mimeType};base64,${image.base64}`;
  const imgEl = new Image();
  imgEl.crossOrigin = 'anonymous';

  await new Promise<void>((resolve, reject) => {
    imgEl.onload = () => resolve();
    imgEl.onerror = (e) => reject(e);
    imgEl.src = dataUrl;
  });

  let targetWidth = imgEl.width;
  let targetHeight = imgEl.height;
  const widthRatio = maxWidth / targetWidth;
  const heightRatio = maxHeight / targetHeight;
  const ratio = Math.min(1, widthRatio, heightRatio);
  targetWidth = Math.round(targetWidth * ratio);
  targetHeight = Math.round(targetHeight * ratio);

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return image;
  canvas.width = targetWidth;
  canvas.height = targetHeight;
  ctx.drawImage(imgEl, 0, 0, targetWidth, targetHeight);

  const outDataUrl = canvas.toDataURL(targetMimeType, quality);
  const base64Data = outDataUrl.split(',')[1];
  const mime = outDataUrl.split(';')[0].split(':')[1];
  return {
    base64: base64Data,
    mimeType: mime,
    name: image.name.replace(/(\.[a-zA-Z0-9]+)?$/, '_cmp$1')
  };
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
      // Attempt progressive fallback saves: compress and trim
      (async () => {
        // Step 1: compress history images and trim chat history
        try {
          const fallbackProjects = [...projects];
          const idx = fallbackProjects.findIndex(p => p.id === projectToSave.id);
          if (idx > -1) {
            const p = { ...fallbackProjects[idx] } as SpeclyProject;
            p.history = await Promise.all(p.history.map(img => compressImage(img, { maxWidth: 1400, maxHeight: 1400, quality: 0.8 })));
            p.chatHistory = p.chatHistory.slice(-30);
            fallbackProjects[idx] = p;
          }
          localStorage.setItem(PROJECTS_KEY, JSON.stringify(fallbackProjects));
          return;
        } catch (e1) {}

        // Step 2: drop large fields and compress further
        try {
          const fallbackProjects2 = [...projects];
          const idx2 = fallbackProjects2.findIndex(p => p.id === projectToSave.id);
          if (idx2 > -1) {
            const p2 = { ...fallbackProjects2[idx2] } as SpeclyProject;
            p2.history = await Promise.all(p2.history.map(img => compressImage(img, { maxWidth: 1000, maxHeight: 1000, quality: 0.65 })));
            p2.chatHistory = p2.chatHistory.slice(-15);
            // Large HTML can blow quota; store lazily by removing it from the list item
            if (p2.techPack && p2.techPack.length > 200_000) {
              p2.techPack = undefined as any;
            }
            fallbackProjects2[idx2] = p2;
          }
          localStorage.setItem(PROJECTS_KEY, JSON.stringify(fallbackProjects2));
          return;
        } catch (e2) {}

        // Step 3: keep only latest and original heavily compressed, minimal chat
        try {
          const fallbackProjects3 = [...projects];
          const idx3 = fallbackProjects3.findIndex(p => p.id === projectToSave.id);
          if (idx3 > -1) {
            const p3 = { ...fallbackProjects3[idx3] } as SpeclyProject;
            const orig = p3.history[p3.history.length - 1];
            const latest = p3.history[0];
            const cLatest = await compressImage(latest, { maxWidth: 800, maxHeight: 800, quality: 0.55 });
            const cOrig = await compressImage(orig, { maxWidth: 800, maxHeight: 800, quality: 0.55 });
            p3.history = [cLatest, cOrig];
            p3.chatHistory = p3.chatHistory.slice(-10);
            p3.techPack = undefined as any;
            p3.finalSketch = p3.finalSketch ? await compressImage(p3.finalSketch, { maxWidth: 800, maxHeight: 800, quality: 0.55 }) : null;
            fallbackProjects3[idx3] = p3;
          }
          localStorage.setItem(PROJECTS_KEY, JSON.stringify(fallbackProjects3));
          return;
        } catch (e3) {}

        alert("Storage is full and automatic compression couldn't save your latest changes. Please delete older projects or reduce image sizes.");
      })();
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

// Generate product usage video via FAL Veo 3
export const generateProductVideo = async (
  prompt: string,
  options?: { aspectRatio?: '16:9' | '9:16'; duration?: number; audioEnabled?: boolean }
): Promise<{ url: string | any; requestId: string }> => {
  try {
    const response = await fetch('/api/video/veo3', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt,
        aspectRatio: options?.aspectRatio ?? '16:9',
        duration: options?.duration ?? 5,
        audioEnabled: options?.audioEnabled ?? true,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return { url: data.data, requestId: data.requestId };
  } catch (error) {
    console.error('Error generating product video:', error);
    throw new Error('Failed to generate product video.');
  }
};
