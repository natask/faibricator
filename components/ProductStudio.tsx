import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { Zap } from 'lucide-react';
import { SpeclyProject, ImageFile, SpeclyMessage } from '../types';
import * as studioService from '../services/studioService';
import StudioImageUploader from './StudioImageUploader';
import StudioSpinner from './StudioSpinner';
import { ArrowLeftIcon, MagicWandIcon, PlusIcon, TrashIcon, DocumentTextIcon } from './StudioIcons';

type View = 'dashboard' | 'editor' | 'techpack';
type ViewType = 'original' | 'latest' | 'sketch';

const ProductStudio: React.FC = () => {
  const router = useRouter();
  const [view, setView] = useState<View>('dashboard');
  const [projects, setProjects] = useState<SpeclyProject[]>([]);
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
  const [project, setProject] = useState<SpeclyProject | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [chatInput, setChatInput] = useState('');
  const [supplementalImages, setSupplementalImages] = useState<ImageFile[]>([]);
  const [currentView, setCurrentView] = useState<ViewType>('latest');

  const chatHistoryRef = useRef<HTMLDivElement>(null);
  const supplementalUploaderRef = useRef<HTMLInputElement>(null);

  const handleLogout = () => {
    router.push('/');
    };

    useEffect(() => {
    setProjects(studioService.getProjects());
  }, []);

  useEffect(() => {
    if (currentProjectId) {
      const foundProject = projects.find(p => p.id === currentProjectId) || null;
      setProject(foundProject);
      setCurrentView('latest');
      if (foundProject && foundProject.chatHistory.length === 0 && foundProject.history.length > 0) {
        handleGenerateInitialDescription(foundProject.history[0], foundProject);
      }
    } else {
      setProject(null);
    }
  }, [currentProjectId, projects]);

  useEffect(() => {
    if (chatHistoryRef.current) {
      chatHistoryRef.current.scrollTop = chatHistoryRef.current.scrollHeight;
    }
  }, [project?.chatHistory]);

  const handleGenerateInitialDescription = async (image: ImageFile, existingProject: SpeclyProject) => {
    setIsLoading(true);
    setLoadingMessage('Analyzing your concept...');
    try {
      const desc = await studioService.generateDescription(image);
      updateProjectState(existingProject, {
        chatHistory: [{ sender: 'ai', text: desc }],
      });
    } catch (error) {
      console.error("Failed to generate description:", error);
      alert("There was an error generating the description. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewProject = () => {
    setCurrentProjectId(null);
    setProject(null);
    setView('editor');
  };

  const handleSelectProject = (id: string) => {
    setCurrentProjectId(id);
    setView('editor');
  };
  
  const handleDeleteProject = (id: string) => {
    studioService.deleteProject(id);
    setProjects(studioService.getProjects());
  };

  const handleBackToDashboard = () => {
    setProjects(studioService.getProjects());
    setView('dashboard');
    setCurrentProjectId(null);
    setProject(null);
  };
  
  const updateProjectState = (currentProject: SpeclyProject, updates: Partial<SpeclyProject>) => {
    const newProject = { ...currentProject, ...updates };
    setProject(newProject);
    studioService.saveProject(newProject);
    setProjects(prevProjects => {
      const existingIndex = prevProjects.findIndex(p => p.id === newProject.id);
      if (existingIndex > -1) {
        const newProjects = [...prevProjects];
        newProjects[existingIndex] = newProject;
        return newProjects;
      }
      return [newProject, ...prevProjects];
    });
  };

  const handleInitialUpload = async (file: File) => {
        setIsLoading(true);
    setLoadingMessage('Analyzing your concept...');
    try {
      const base64 = await studioService.fileToBase64(file);
      const newImage: ImageFile = { base64, mimeType: file.type, name: file.name };
      
      const desc = await studioService.generateDescription(newImage);

      const newProject: SpeclyProject = {
        id: `proj_${Date.now()}`,
        name: file.name.split('.').slice(0, -1).join('.') || 'New Project',
        history: [newImage],
        chatHistory: [{ sender: 'ai', text: desc }],
        createdAt: Date.now(),
      };

      setProject(newProject);
      setCurrentProjectId(newProject.id);
      studioService.saveProject(newProject);
      const updatedProjects = [newProject, ...projects.filter(p => p.id !== newProject.id)];
      setProjects(updatedProjects);
    } catch (error) {
      console.error("Failed to upload image and create project:", error);
      alert("There was an error processing your image. Please try again.");
        } finally {
            setIsLoading(false);
        }
  };

    const handleEditPrompt = async (e: React.FormEvent) => {
        e.preventDefault();
    if (!chatInput.trim() || !project || !project.history.length) return;

    const mainImage = project.history[0];
    const userMessage: SpeclyMessage = { sender: 'user', text: chatInput };
    const updatedChatHistory = [...project.chatHistory, userMessage];
    updateProjectState(project, { chatHistory: updatedChatHistory });
    setChatInput('');
    setIsLoading(true);
    setLoadingMessage('Reimagining your design...');

    try {
      const { image: newImage, text: aiText } = await studioService.editImage(mainImage, supplementalImages, chatInput);
      const newHistory = [newImage, ...project.history];
      setCurrentView('latest');
      
      let finalChatHistory = updatedChatHistory;
      if (aiText) {
        finalChatHistory = [...finalChatHistory, { sender: 'ai', text: aiText }];
      } else {
        // Add a simple confirmation message when AI doesn't provide text
        finalChatHistory = [...finalChatHistory, { sender: 'ai', text: "I've updated your design based on your request." }];
      }

      updateProjectState(project, {
        history: newHistory,
        chatHistory: finalChatHistory,
      });

    } catch (error) {
      console.error("Failed to edit image:", error);
      const errorChat: SpeclyMessage = { sender: 'ai', text: "Sorry, I couldn't edit the image. Please try a different prompt." };
      updateProjectState(project, { chatHistory: [...updatedChatHistory, errorChat] });
    } finally {
      setSupplementalImages([]);
      setIsLoading(false);
    }
  };
  
  const handleGenerateFinalSketch = async () => {
    if (!project || !project.history.length) return;
    
    const mainImage = project.history[0];
    const initialDescription = project.chatHistory.find(m => m.sender === 'ai')?.text || '';

    if (!initialDescription) {
      alert("Could not find the initial product description to generate the sketch.");
      return;
    }
        
        setIsLoading(true);
    setLoadingMessage('Generating final manufacturing sketch...');
    
    try {
      const finalSketch = await studioService.generateFinalSketch(mainImage, initialDescription);
      
      const sketchMessage: SpeclyMessage = {
        sender: 'ai',
        text: 'Here is the manufacturing specification sketch you requested:',
        image: finalSketch,
      };

      updateProjectState(project, {
        finalSketch: finalSketch,
        chatHistory: [...project.chatHistory, sketchMessage]
      });
      setCurrentView('sketch');
      
    } catch (error) {
      console.error("Failed to generate final sketch:", error);
      alert(`There was an error generating the final sketch. The AI reported: ${error instanceof Error ? error.message : 'Unknown error'}`);
        } finally {
            setIsLoading(false);
    }
  };

  const handleGenerateTechPack = async () => {
    if (!project || !project.finalSketch) return;
    
    const initialDescription = project.chatHistory.find(m => m.sender === 'ai')?.text || '';

    setIsLoading(true);
    setLoadingMessage('Generating manufacturing tech pack...');
    try {
      const techPack = await studioService.generateTechPack(project.finalSketch, initialDescription);
      updateProjectState(project, { techPack });
      handleViewTechPack(project.id);
    } catch (error) {
      console.error("Failed to generate tech pack:", error);
      alert(`There was an error generating the tech pack: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFindSuppliers = async () => {
    if (!project || !project.techPack) return;
    
    setIsLoading(true);
    setLoadingMessage('Searching for suppliers...');
    try {
      // Extract a summary from the tech pack for supplier search
      const techPackSummary = project.techPack.replace(/<[^>]*>/g, ' ').substring(0, 1000);
      const suppliersHtml = await studioService.findSuppliers(techPackSummary);
      
      // Add suppliers section to the tech pack
      const updatedTechPack = project.techPack + `
        <div style="margin-top: 40px; page-break-before: always;">
          <h2>Potential Suppliers</h2>
          <p>Based on your product specifications, here are potential suppliers to consider:</p>
          ${suppliersHtml}
        </div>
      `;
      
      updateProjectState(project, { techPack: updatedTechPack });
    } catch (error) {
      console.error("Failed to find suppliers:", error);
      alert(`There was an error finding suppliers: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleSupplementalImageUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setIsLoading(true);
    setLoadingMessage('Processing images...');
    try {
      const newImages: ImageFile[] = await Promise.all(
        Array.from(files).map(async (file) => {
          const base64 = await studioService.fileToBase64(file);
          return { base64, mimeType: file.type, name: file.name };
        })
      );
      setSupplementalImages(prev => [...prev, ...newImages]);
    } catch (error) {
      console.error("Error processing supplemental images:", error);
      alert("There was an error adding your reference images.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveSupplementalImage = (index: number) => {
    setSupplementalImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleViewTechPack = (projectId: string) => {
    setCurrentProjectId(projectId);
    setView('techpack');
  };
  
  const handleBackToEditor = () => {
    setView('editor');
  };

  const getDisplayedImage = (): ImageFile | null => {
    if (!project) return null;
    switch (currentView) {
      case 'original':
        return project.history[project.history.length - 1];
      case 'sketch':
        return project.finalSketch || project.history[0];
      case 'latest':
      default:
        return project.history[0];
    }
  };

  const renderNavigation = () => (
    <nav className="sticky top-0 z-30 w-full border-b border-gray-200 bg-white/80 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-8">
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 bg-black rounded-sm flex items-center justify-center">
                <Zap className="w-4 h-4 text-white" />
              </div>
              <h1 className="text-lg font-semibold text-black">
                Fabricator
              </h1>
            </div>
            <div className="hidden md:flex space-x-1">
              <Link
                href="/dashboard"
                className="px-3 py-2 text-sm font-medium rounded-md transition-colors text-gray-600 hover:text-black hover:bg-gray-50"
              >
                Dashboard
              </Link>
              <Link
                href="/studio"
                className="px-3 py-2 text-sm font-medium rounded-md transition-colors bg-gray-100 text-black"
              >
                Product Studio
              </Link>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={handleLogout}
              className="px-3 py-2 text-sm font-medium text-gray-600 hover:text-black transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  );

  // Dashboard View
  if (view === 'dashboard') {
    return (
      <div className="min-h-screen bg-white text-black font-sans">
        {renderNavigation()}
        <div className="w-full animate-fade-in p-8">
          {isLoading && <StudioSpinner message={loadingMessage} />}
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-4xl font-bold tracking-tight text-black">
              Your Product Ideas
            </h1>
            <button
              onClick={handleNewProject}
              className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition"
            >
              <PlusIcon className="w-5 h-5" />
              New Project
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {projects.length > 0 ? (
              projects.map(proj => (
                <div
                  key={proj.id}
                  onClick={() => handleSelectProject(proj.id)}
                  className="bg-white rounded-xl shadow-md overflow-hidden cursor-pointer group transform hover:-translate-y-1 transition-all duration-300 border border-gray-200 hover:shadow-xl hover:border-blue-500"
                >
                  <div className="relative">
                    <img 
                      src={`data:${proj.history[0].mimeType};base64,${proj.history[0].base64}`} 
                      alt={proj.name} 
                      className="w-full h-48 object-cover" 
                    />
                        <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if(window.confirm('Are you sure you want to delete this project?')) {
                          handleDeleteProject(proj.id);
                        }
                      }}
                      className="absolute top-2 right-2 bg-red-600/80 hover:bg-red-700 rounded-full p-2 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                      aria-label="Delete project"
                    >
                      <TrashIcon className="w-4 h-4" />
                        </button>
                  </div>
                  <div className="p-4">
                    <h3 className="font-bold text-lg truncate text-black">{proj.name}</h3>
                    <p className="text-sm text-gray-500 mt-1">
                      {new Date(proj.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                    </div>
              ))
            ) : (
              <div className="col-span-full text-center py-16 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                <h2 className="text-2xl font-semibold text-black">No projects yet!</h2>
                <p className="text-gray-500 mt-2">Click "New Project" to start transforming your first idea.</p>
                              </div>
                          )}
                        </div>
        </div>
      </div>
    );
  }

  // Tech Pack View
  if (view === 'techpack' && project && project.techPack) {
    return (
      <div className="min-h-screen bg-white text-black font-sans">
        {renderNavigation()}
        <div className="animate-fade-in h-full flex flex-col p-8">
          {isLoading && <StudioSpinner message={loadingMessage} />}
          <div className="flex items-center justify-between mb-4 shrink-0">
            <button onClick={handleBackToEditor} className="flex items-center gap-2 text-sm text-gray-500 hover:text-black transition">
              <ArrowLeftIcon className="w-4 h-4" />
              Back to Editor
            </button>
            <h1 className="text-2xl font-bold text-black text-center">
              Tech Pack: {project.name}
            </h1>
            <button
              onClick={handleFindSuppliers}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg transition text-sm"
              title="Find Suppliers"
            >
              <MagicWandIcon className="w-5 h-5"/>
              <span>Find Suppliers</span>
            </button>
          </div>
        
          <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-8 overflow-y-auto flex-grow max-w-none">
            <div dangerouslySetInnerHTML={{ __html: project.techPack }} />
          </div>
        </div>
      </div>
    );
  }

  // Editor View
  const displayedImage = getDisplayedImage();

  return (
    <div className="min-h-screen bg-white text-black font-sans">
      {renderNavigation()}
      <div className="flex flex-col h-full animate-fade-in min-h-0">
        {isLoading && <StudioSpinner message={loadingMessage} />}
        
        {!project ? (
          <div className="flex-grow flex flex-col justify-center items-center p-8">
            <div className="w-full max-w-lg">
              <StudioImageUploader 
                onImageUpload={handleInitialUpload}
                title="Upload your first product sketch"
                subtitle="Drag & drop or click to upload a PNG, JPG, or WEBP file."
              />
            </div>
            <button onClick={handleBackToDashboard} className="mt-8 text-sm text-gray-500 hover:text-blue-600">
              Or go back to dashboard
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-4 shrink-0 p-4">
              <button onClick={handleBackToDashboard} className="flex items-center gap-2 text-sm text-gray-500 hover:text-black transition">
                <ArrowLeftIcon className="w-4 h-4" />
                Back to Dashboard
              </button>
              <div className="flex items-center gap-2">
                {project.techPack && (
                  <button
                    onClick={() => handleViewTechPack(project.id)}
                    className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white font-bold py-2 px-4 rounded-lg transition text-sm"
                    title="View Tech Pack"
                  >
                    <DocumentTextIcon className="w-5 h-5"/>
                    <span>View Tech Pack</span>
                  </button>
                )}
                <button 
                  onClick={handleGenerateFinalSketch} 
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold p-2 rounded-full transition duration-300 shadow-sm hover:shadow-md"
                  title="Generate Specs"
                >
                  <MagicWandIcon className="w-5 h-5"/>
                </button>
                            </div>
                          </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 flex-grow min-h-0 px-4">
              {/* Left Pane */}
              <div className="md:col-span-5 flex flex-col min-h-0 space-y-4">
                <div className="bg-gray-100 rounded-xl flex flex-col p-4 border border-gray-200 flex-grow min-h-0">
                  <div className="flex items-center justify-between mb-3 shrink-0">
                    <h2 className="text-lg font-bold">{project.name}</h2>
                    <div className="flex items-center gap-2">
                      <button onClick={() => setCurrentView('original')} className={`px-3 py-1 text-xs rounded-full transition ${currentView === 'original' ? 'bg-blue-600 text-white' : 'bg-gray-300 hover:bg-gray-400'}`}>Original</button>
                      <button onClick={() => setCurrentView('latest')} className={`px-3 py-1 text-xs rounded-full transition ${currentView === 'latest' ? 'bg-blue-600 text-white' : 'bg-gray-300 hover:bg-gray-400'}`}>Latest</button>
                      {project.finalSketch && (
                        <button onClick={() => setCurrentView('sketch')} className={`px-3 py-1 text-xs rounded-full transition ${currentView === 'sketch' ? 'bg-blue-600 text-white' : 'bg-gray-300 hover:bg-gray-400'}`}>Sketch</button>
                        )}
                    </div>
                  </div>
                  <div className="flex-grow flex items-center justify-center relative min-h-0">
                    {displayedImage && (
                      <img 
                        src={`data:${displayedImage.mimeType};base64,${displayedImage.base64}`} 
                        alt={`Product design - ${currentView}`}
                        className="max-w-full max-h-full object-contain rounded-lg"
                      />
                )}
            </div>
                </div>

                <div className="bg-gray-100 rounded-xl p-4 border border-gray-200 shrink-0">
                  <h3 className="font-bold mb-3">Reference Images</h3>
                  <div className="grid grid-cols-3 gap-2">
                    {supplementalImages.map((img, index) => (
                      <div key={index} className="relative group">
                        <img src={`data:${img.mimeType};base64,${img.base64}`} alt={`supplemental ${index}`} className="w-full h-20 object-cover rounded-md"/>
                        <button onClick={() => handleRemoveSupplementalImage(index)} className="absolute top-1 right-1 bg-red-600/80 hover:bg-red-700 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <TrashIcon className="w-3 h-3"/>
                        </button>
                      </div>
                    ))}
                    <button 
                      onClick={() => supplementalUploaderRef.current?.click()}
                      className="w-full h-20 border-2 border-dashed border-gray-300 rounded-md flex flex-col items-center justify-center text-gray-400 hover:text-blue-600 hover:border-blue-600 transition">
                      <PlusIcon className="w-6 h-6"/>
                      <span className="text-xs mt-1">Add Image</span>
                    </button>
                    <input 
                      type="file"
                      ref={supplementalUploaderRef}
                      className="hidden"
                      accept="image/png, image/jpeg, image/webp"
                      multiple
                      onChange={(e) => handleSupplementalImageUpload(e.target.files)}
                    />
                  </div>
                </div>
              </div>

              {/* Right Pane */}
              <div className="md:col-span-7 flex flex-col bg-gray-100 rounded-xl border border-gray-200 min-h-0">
                <div className="p-4 border-b border-gray-200 shrink-0">
                  <h3 className="font-bold text-lg">AI Design Assistant</h3>
                        </div>

                <div ref={chatHistoryRef} className="flex-grow p-4 overflow-y-auto space-y-6">
                  {project.chatHistory.map((msg, index) => (
                    <div key={index} className={`flex gap-3 items-start ${msg.sender === 'user' ? 'flex-row-reverse' : ''}`}>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 font-bold text-white ${msg.sender === 'ai' ? 'bg-teal-600' : 'bg-blue-600'}`}>
                        {msg.sender === 'ai' ? 'AI' : 'You'}
                      </div>
                      <div className={`p-3 rounded-xl max-w-lg ${msg.sender === 'user' ? 'bg-blue-100 text-black' : 'bg-white text-black'}`}>
                        {msg.text && <p className="text-sm whitespace-pre-wrap">{msg.text}</p>}
                        {msg.image && (
                          <div className="mt-2">
                            <img
                              src={`data:${msg.image.mimeType};base64,${msg.image.base64}`}
                              alt="AI generated sketch"
                              className="rounded-lg max-w-xs"
                            />
                            {project.finalSketch?.base64 === msg.image.base64 && (
                              <button 
                                onClick={handleGenerateTechPack}
                                className="mt-3 w-full text-sm bg-teal-600 hover:bg-teal-700 text-white font-bold py-2 px-4 rounded-lg transition"
                              >
                                Generate Manufacturing Spec
                              </button>
                            )}
                                              </div>
                                            )}
                                        </div>
                                            </div>
                                        ))}
                                    </div>

                <div className="p-4 border-t border-gray-200 shrink-0 bg-white/50 rounded-b-xl">
                  <form onSubmit={handleEditPrompt} className="flex gap-2 items-center">
                                <input
                                    type="text"
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      placeholder="e.g., 'Change the color to midnight blue'"
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
                                    disabled={isLoading}
                                />
                    <button type="submit" className="bg-blue-600 text-white font-semibold px-6 py-3 rounded-lg hover:bg-blue-700 transition disabled:bg-gray-300 disabled:cursor-not-allowed" disabled={isLoading || !chatInput.trim()}>
                      Send
                                </button>
                             </form>
                        </div>
                    </div>
            </div>
          </>
        )}
            </div>
        </div>
    );
};

export default ProductStudio;