import React, { useState, useRef, useCallback, useEffect } from 'react';
import type { ChatMessage } from '@/types';
import { generateDescription, editImage, generateSketch } from '../services/geminiService';
import { UploadIcon } from './icons/UploadIcon';
import { MagicWandIcon } from './icons/MagicWandIcon';
import { SpinnerIcon } from './icons/SpinnerIcon';
import { PaperclipIcon } from './icons/PaperclipIcon';
import { UserIcon } from './icons/UserIcon';
import { BotIcon } from './icons/BotIcon';

const ProductStudio: React.FC = () => {
    const [originalFiles, setOriginalFiles] = useState<File[]>([]);
    const [currentImages, setCurrentImages] = useState<string[]>([]);
    const [activeImageIndex, setActiveImageIndex] = useState(0);
    const [sketchImage, setSketchImage] = useState<string | null>(null);
    const [productDescription, setProductDescription] = useState<string>('');
    const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
    const [userInput, setUserInput] = useState('');
    const [stagedFiles, setStagedFiles] = useState<File[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [loadingMessage, setLoadingMessage] = useState<string>('');
    const [error, setError] = useState<string>('');
    const [activeView, setActiveView] = useState<'edit' | 'sketch'>('edit');
    const [isPasting, setIsPasting] = useState<boolean>(false);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const chatFileInputRef = useRef<HTMLInputElement>(null);
    const chatEndRef = useRef<HTMLDivElement>(null);
    const uploadAreaRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    // Utility function to convert clipboard data to File objects
    const clipboardDataToFiles = async (clipboardData: DataTransfer): Promise<File[]> => {
        const files: File[] = [];
        
        // Check for files in clipboard
        if (clipboardData.files && clipboardData.files.length > 0) {
            const imageFiles = Array.from(clipboardData.files).filter(file => file.type.startsWith('image/'));
            files.push(...imageFiles);
        }
        
        // Check for image data in clipboard items
        const items = Array.from(clipboardData.items);
        for (const item of items) {
            if (item.type.startsWith('image/')) {
                const file = item.getAsFile();
                if (file) {
                    files.push(file);
                }
            }
        }
        
        return files;
    };

    // Handle clipboard paste events
    const handlePaste = useCallback(async (event: React.ClipboardEvent<HTMLDivElement>) => {
        console.log('Paste event triggered!', event);
        event.preventDefault();
        
        if (!event.clipboardData) {
            console.log('No clipboard data found');
            return;
        }
        
        console.log('Clipboard data:', event.clipboardData);
        console.log('Files in clipboard:', event.clipboardData.files);
        console.log('Items in clipboard:', event.clipboardData.items);
        
        setIsPasting(true);
        setError('');
        
        try {
            const files = await clipboardDataToFiles(event.clipboardData);
            console.log('Files extracted from clipboard:', files);
            
            if (files.length === 0) {
                console.log('No valid image files found in clipboard');
                setError('No valid image data found in clipboard.');
                setIsPasting(false);
                return;
            }
            
            // Use the same logic as file upload
            setOriginalFiles(files);
            setError('');
            setSketchImage(null);
            setChatHistory([]);
            setProductDescription('');
            setActiveView('edit');
            
            const readerPromises = files.map(file => {
                return new Promise<string>((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onloadend = () => resolve(reader.result as string);
                    reader.onerror = reject;
                    reader.readAsDataURL(file);
                });
            });

            Promise.all(readerPromises).then(base64Strings => {
                setCurrentImages(base64Strings);
                setActiveImageIndex(0);
                if (files.length > 0) {
                    fetchDescription(base64Strings, files[0].type);
                }
                setIsPasting(false);
            }).catch(err => {
                console.error(err);
                setError("Failed to read clipboard data.");
                setIsPasting(false);
            });
        } catch (err) {
            console.error('Error handling paste:', err);
            setError('Failed to process clipboard data.');
            setIsPasting(false);
        }
    }, []);

    useEffect(() => {
        scrollToBottom();
    }, [chatHistory]);

    // Add global paste event listener
    useEffect(() => {
        const handleGlobalPaste = (event: ClipboardEvent) => {
            console.log('Global paste event triggered!', event);
            console.log('Current images length:', currentImages.length);
            
            // Check if the paste is happening in an input field or textarea
            const target = event.target as HTMLElement;
            const isInputField = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.contentEditable === 'true';
            
            if (isInputField) {
                console.log('Paste in input field, ignoring for image upload');
                return;
            }
            
            console.log('Processing global paste event');
            // Convert native ClipboardEvent to React ClipboardEvent
            const reactEvent = event as unknown as React.ClipboardEvent<HTMLDivElement>;
            handlePaste(reactEvent);
        };

        document.addEventListener('paste', handleGlobalPaste);
        return () => {
            document.removeEventListener('paste', handleGlobalPaste);
        };
    }, [handlePaste]);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;
        if (files && files.length > 0) {
            const imageFiles = Array.from(files).filter(file => file.type.startsWith('image/'));
            if (imageFiles.length === 0) {
                setError('Please upload valid image files.');
                return;
            }

            setOriginalFiles(imageFiles);
            setError('');
            setSketchImage(null);
            setChatHistory([]);
            setProductDescription('');
            setActiveView('edit');
            
            const readerPromises = imageFiles.map(file => {
                return new Promise<string>((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onloadend = () => resolve(reader.result as string);
                    reader.onerror = reject;
                    reader.readAsDataURL(file);
                });
            });

            Promise.all(readerPromises).then(base64Strings => {
                setCurrentImages(base64Strings);
                setActiveImageIndex(0);
                if (imageFiles.length > 0) {
                  fetchDescription(base64Strings, imageFiles[0].type);
                }
            }).catch(err => {
                console.error(err);
                setError("Failed to read files.");
            });
        }
    };
    
    const handleStagedFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      const files = event.target.files;
      if (files && files.length > 0) {
        const imageFiles = Array.from(files).filter(file => file.type.startsWith('image/'));
        setStagedFiles(prev => [...prev, ...imageFiles]);
      }
    };

    const removeStagedFile = (index: number) => {
      setStagedFiles(prev => prev.filter((_, i) => i !== index));
    };

    const fetchDescription = useCallback(async (imagesBase64: string[], imageMimeType: string) => {
        setIsLoading(true);
        setLoadingMessage('Analyzing product...');
        setError('');
        try {
            const description = await generateDescription(imagesBase64, imageMimeType);
            setProductDescription(description);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unknown error occurred.');
            setProductDescription('');
        } finally {
            setIsLoading(false);
            setLoadingMessage('');
        }
    }, []);

    const handleEditPrompt = async (e: React.FormEvent) => {
        e.preventDefault();
        if ((!userInput.trim() && stagedFiles.length === 0) || currentImages.length === 0) return;

        let newImagesBase64: string[] = [];
        const readerPromises = stagedFiles.map(file => {
            return new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result as string);
                reader.onerror = reject;
                reader.readAsDataURL(file);
            });
        });

        if (stagedFiles.length > 0) {
            newImagesBase64 = await Promise.all(readerPromises);
        }

        const newUserMessage: ChatMessage = { sender: 'user', text: userInput, images: newImagesBase64 };
        setChatHistory(prev => [...prev, newUserMessage]);
        setUserInput('');
        setStagedFiles([]);
        
        setIsLoading(true);
        setLoadingMessage('Applying edits...');
        setError('');
        setActiveView('edit');

        const allImages = [...currentImages, ...newImagesBase64];
        const allFiles = [...originalFiles, ...stagedFiles];

        try {
            const { newImageBase64, textResponse } = await editImage(allImages, allFiles[0].type, userInput);
            
            const updatedImages = [...currentImages, newImageBase64];
            setCurrentImages(updatedImages);
            setOriginalFiles(prev => [...prev, ...stagedFiles]); 
            setActiveImageIndex(updatedImages.length - 1);

            const newAiMessage: ChatMessage = { sender: 'ai', text: textResponse, images: [newImageBase64] };
            setChatHistory(prev => [...prev, newAiMessage]);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unknown error occurred.');
            const errorAiMessage: ChatMessage = { sender: 'ai', text: `Sorry, I couldn't apply that edit. ${err instanceof Error ? err.message : ''}` };
            setChatHistory(prev => [...prev, errorAiMessage]);
        } finally {
            setIsLoading(false);
            setLoadingMessage('');
        }
    };

    const handleGenerateSketch = async () => {
        if (currentImages.length === 0) return;

        setIsLoading(true);
        setLoadingMessage('Generating product sketch...');
        setError('');
        try {
            const sketch = await generateSketch(currentImages[activeImageIndex], originalFiles[activeImageIndex].type);
            setSketchImage(sketch);
            setActiveView('sketch');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unknown error occurred.');
        } finally {
            setIsLoading(false);
            setLoadingMessage('');
        }
    };

    const triggerFileInput = () => fileInputRef.current?.click();
    const triggerChatFileInput = () => chatFileInputRef.current?.click();
    
    const displayedImage = activeView === 'sketch' ? sketchImage : currentImages[activeImageIndex];

    return (
        <div className="flex h-screen bg-slate-900 text-slate-100 font-sans relative">
            <div className="flex-1 flex flex-col items-center justify-center p-4 md:p-8 bg-black/20">
                {!displayedImage && (
                    <div className="text-center">
                        <div
                            ref={uploadAreaRef}
                            className={`flex flex-col items-center justify-center w-80 h-80 border-2 border-dashed rounded-2xl text-slate-400 transition-all duration-300 cursor-pointer ${
                                isPasting 
                                    ? 'border-cyan-500 bg-cyan-500/10' 
                                    : 'border-slate-700 hover:bg-slate-800/50 hover:border-slate-600'
                            }`}
                            onClick={triggerFileInput}
                            onPaste={handlePaste}
                        >
                            {isPasting ? (
                                <>
                                    <SpinnerIcon className="w-16 h-16 mb-4 text-cyan-500 animate-spin" />
                                    <span className="text-xl font-semibold text-cyan-400">Processing pasted image...</span>
                                </>
                            ) : (
                                <>
                                    <UploadIcon className="w-16 h-16 mb-4 text-slate-500" />
                                    <span className="text-xl font-semibold">Upload Product Image(s)</span>
                                    <span className="mt-1 text-sm text-slate-500">PNG, JPG, WEBP</span>
                                    <span className="mt-2 text-xs text-slate-600">or paste from clipboard (Ctrl+V)</span>
                                    <div className="mt-3 px-3 py-1 bg-slate-800/50 rounded-full text-xs text-slate-500 border border-slate-700">
                                        💡 Try copying an image and pressing Ctrl+V
                                    </div>
                                </>
                            )}
                        </div>
                        <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" multiple />
                    </div>
                )}
                {displayedImage && (
                    <div className="relative w-full h-full flex flex-col items-center justify-center gap-4">
                        <div className="relative w-full flex-1 flex items-center justify-center">
                          <img src={displayedImage} alt="Product" className="max-w-full max-h-[70vh] object-contain rounded-lg shadow-2xl bg-white/5 border border-slate-700/50"/>
                          {(isLoading && loadingMessage) && (
                              <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center rounded-lg backdrop-blur-sm">
                                  <SpinnerIcon className="w-12 h-12 text-cyan-500" />
                                  <p className="mt-4 text-lg font-medium">{loadingMessage}</p>
                              </div>
                          )}
                        </div>
                        {currentImages.length > 0 && (
                          <div className="w-full flex-shrink-0">
                             <div className="flex justify-center items-center gap-3 p-2 bg-slate-800/50 rounded-xl border border-slate-700">
                              {currentImages.map((img, index) => (
                                <img
                                  key={index}
                                  src={img}
                                  alt={`Product thumbnail ${index + 1}`}
                                  onClick={() => { setActiveImageIndex(index); setActiveView('edit'); }}
                                  className={`w-16 h-16 object-cover rounded-md cursor-pointer border-2 transition-all ${index === activeImageIndex && activeView === 'edit' ? 'border-cyan-500 scale-110' : 'border-transparent hover:border-slate-500'}`}
                                />
                              ))}
                              {sketchImage && (
                                <>
                                  <div className="w-[1px] h-16 bg-slate-700 mx-2"></div>
                                  <img
                                    src={sketchImage}
                                    alt="Product sketch thumbnail"
                                    onClick={() => setActiveView('sketch')}
                                    className={`w-16 h-16 object-cover rounded-md cursor-pointer border-2 transition-all bg-white ${activeView === 'sketch' ? 'border-cyan-500 scale-110' : 'border-transparent hover:border-slate-500'}`}
                                  />
                                </>
                              )}
                            </div>
                          </div>
                        )}
                    </div>
                )}
            </div>

            <div className="w-[450px] bg-slate-800 flex flex-col border-l border-slate-700">
                <div className="p-6 border-b border-slate-700">
                    <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400">Product Idea Lab</h1>
                </div>

                {!currentImages.length && <div className="flex-1 flex items-center justify-center text-slate-500 p-8 text-center">Upload an image to begin your creative process.</div>}

                {currentImages.length > 0 && (
                    <div className="flex-1 flex flex-col overflow-hidden">
                        {isPasting && (
                            <div className="p-3 bg-cyan-500/20 border-b border-cyan-500/50 text-center">
                                <p className="text-cyan-400 text-sm font-medium">📋 Processing pasted image...</p>
                            </div>
                        )}
                        <div className="p-6 border-b border-slate-700">
                            <h2 className="text-lg font-semibold text-cyan-400 mb-2">AI Product Analysis</h2>
                            {isLoading && !productDescription ? <p className="text-slate-400">Analyzing...</p> : <p className="text-slate-300 text-sm leading-relaxed">{productDescription}</p>}
                        </div>

                        <div className="flex-1 p-6 overflow-y-auto">
                             <div className="space-y-6">
                                {chatHistory.map((msg, index) => (
                                    <div key={index} className={`flex items-start gap-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                                        {msg.sender === 'ai' && <div className="w-8 h-8 flex-shrink-0 rounded-full bg-slate-700 flex items-center justify-center"><BotIcon className="w-5 h-5 text-cyan-400" /></div>}
                                        <div className={`max-w-xs md:max-w-sm rounded-xl px-4 py-3 ${msg.sender === 'user' ? 'bg-cyan-600 text-white rounded-br-none' : 'bg-slate-700 text-slate-200 rounded-bl-none'}`}>
                                            <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                                            {msg.images && msg.images.length > 0 && (
                                              <div className="mt-2 flex flex-wrap gap-2">
                                                {msg.images.map((img, i) => <img key={i} src={img} className="w-16 h-16 rounded-md object-cover" />)}
                                              </div>
                                            )}
                                        </div>
                                        {msg.sender === 'user' && <div className="w-8 h-8 flex-shrink-0 rounded-full bg-slate-600 flex items-center justify-center"><UserIcon className="w-5 h-5 text-slate-300" /></div>}
                                    </div>
                                ))}
                                <div ref={chatEndRef} />
                            </div>
                        </div>

                        <div className="p-6 border-t border-slate-700 bg-slate-800/50">
                             {error && <p className="text-red-400 text-sm mb-4">{error}</p>}
                             {stagedFiles.length > 0 && (
                                <div className="mb-4 p-2 bg-slate-700/50 rounded-lg">
                                    <p className="text-xs text-slate-400 mb-2">Attachments:</p>
                                    <div className="flex flex-wrap gap-2">
                                        {stagedFiles.map((file, index) => (
                                            <div key={index} className="relative">
                                                <img src={URL.createObjectURL(file)} alt={file.name} className="w-12 h-12 rounded-md object-cover" />
                                                <button onClick={() => removeStagedFile(index)} className="absolute -top-1 -right-1 bg-red-500 text-white w-4 h-4 rounded-full text-xs leading-none">&times;</button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                             )}
                             <form onSubmit={handleEditPrompt} className="flex items-center space-x-3">
                                <input type="file" ref={chatFileInputRef} onChange={handleStagedFileChange} className="hidden" accept="image/*" multiple />
                                <button type="button" onClick={triggerChatFileInput} disabled={isLoading} className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-full transition-colors disabled:opacity-50" title="Upload images or paste from clipboard">
                                  <PaperclipIcon className="w-5 h-5" />
                                </button>
                                <input
                                    type="text"
                                    value={userInput}
                                    onChange={(e) => setUserInput(e.target.value)}
                                    onPaste={async (e) => {
                                        e.preventDefault();
                                        if (!e.clipboardData) return;
                                        
                                        try {
                                            const files = await clipboardDataToFiles(e.clipboardData);
                                            if (files.length > 0) {
                                                setStagedFiles(prev => [...prev, ...files]);
                                            }
                                        } catch (err) {
                                            console.error('Error handling paste in chat:', err);
                                        }
                                    }}
                                    placeholder="e.g., 'make it metallic red' or paste images"
                                    className="flex-1 bg-slate-700 border border-slate-600 rounded-full shadow-sm px-4 py-2 placeholder-slate-500 focus:outline-none focus:ring-cyan-500 focus:border-cyan-500 sm:text-sm"
                                    disabled={isLoading}
                                />
                                <button type="submit" disabled={isLoading || (!userInput.trim() && stagedFiles.length === 0)} className="px-5 py-2 bg-cyan-600 text-white rounded-full hover:bg-cyan-700 disabled:bg-slate-600 disabled:cursor-not-allowed transition-colors font-semibold">
                                    Edit
                                </button>
                             </form>
                             <button onClick={handleGenerateSketch} disabled={isLoading} className="mt-4 w-full flex justify-center items-center py-2.5 px-4 border border-transparent rounded-full shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-green-500 transition-colors duration-200 disabled:bg-slate-600">
                                <MagicWandIcon className="w-5 h-5 mr-2"/>
                                Generate Product Sketch
                            </button>
                        </div>
                    </div>
                )}
            </div>
            
            {/* Toast notification for paste detection */}
            {isPasting && (
                <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 bg-cyan-500 text-white px-6 py-3 rounded-lg shadow-lg border border-cyan-400">
                    <div className="flex items-center gap-2">
                        <SpinnerIcon className="w-5 h-5 animate-spin" />
                        <span className="font-medium">Processing pasted image...</span>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProductStudio;
