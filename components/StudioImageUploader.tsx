import React, { useState, useCallback, useRef, useEffect } from 'react';
import { UploadIcon } from './StudioIcons';

interface StudioImageUploaderProps {
  onImageUpload: (file: File) => void;
  title: string;
  subtitle: string;
}

const StudioImageUploader: React.FC<StudioImageUploaderProps> = ({ onImageUpload, title, subtitle }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [cameraFacing, setCameraFacing] = useState<'user' | 'environment'>('user');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onImageUpload(e.target.files[0]);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onImageUpload(e.dataTransfer.files[0]);
    }
  }, [onImageUpload]);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };
  
  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const stopCamera = () => {
    try {
      streamRef.current?.getTracks?.().forEach((t) => t.stop());
    } catch {}
    streamRef.current = null;
  };

  const startCamera = async (facing: 'user' | 'environment') => {
    setCameraError(null);
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        setCameraError('Camera not supported in this browser.');
        return;
      }
      const constraints: MediaStreamConstraints = {
        video: { facingMode: facing },
        audio: false,
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await (videoRef.current as HTMLVideoElement).play().catch(() => {});
      }
    } catch (err: any) {
      setCameraError(err?.message || 'Unable to access camera');
    }
  };

  const openCamera = async (facing: 'user' | 'environment' = 'user') => {
    setCameraFacing(facing);
    setIsCameraOpen(true);
    await startCamera(facing);
  };

  const closeCamera = () => {
    stopCamera();
    setIsCameraOpen(false);
  };

  const flipCamera = async () => {
    const nextFacing = cameraFacing === 'user' ? 'environment' : 'user';
    setCameraFacing(nextFacing);
    stopCamera();
    await startCamera(nextFacing);
  };

  const capturePhoto = async () => {
    const video = videoRef.current as HTMLVideoElement | null;
    const canvas = canvasRef.current as HTMLCanvasElement | null;
    if (!video || !canvas) return;
    const width = video.videoWidth || 1280;
    const height = video.videoHeight || 720;
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, width, height);
    canvas.toBlob(async (blob) => {
      if (!blob) return;
      const file = new File([blob], `camera-capture-${Date.now()}.jpg`, { type: 'image/jpeg' });
      onImageUpload(file);
      closeCamera();
    }, 'image/jpeg', 0.92);
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  return (
    <div className="space-y-3">
      <div
        className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300
          ${isDragging ? 'border-blue-500 bg-blue-50 scale-105 shadow-lg' : 'border-gray-300 bg-gray-50 hover:border-blue-500'}`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
      >
        <input
          type="file"
          id="file-upload"
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          accept="image/png, image/jpeg, image/webp"
          onChange={handleFileChange}
        />
        <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center justify-center">
          <UploadIcon className="w-12 h-12 text-gray-400 mb-4" />
          <p className="text-xl font-semibold text-black">{title}</p>
          <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
        </label>
      </div>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => openCamera('user')}
          className="inline-flex items-center px-3 py-2 rounded-md text-sm font-medium bg-white text-gray-700 border border-gray-300 hover:bg-gray-100 transition"
        >
          Use Front Camera
        </button>
        <button
          type="button"
          onClick={() => openCamera('environment')}
          className="inline-flex items-center px-3 py-2 rounded-md text-sm font-medium bg-white text-gray-700 border border-gray-300 hover:bg-gray-100 transition"
        >
          Use Back Camera
        </button>
      </div>

      {isCameraOpen && (
        <div className="relative border rounded-lg p-3 bg-black">
          {cameraError ? (
            <div className="text-red-600 text-sm bg-white rounded p-2">{cameraError}</div>
          ) : (
            <div className="w-full flex flex-col items-center gap-3">
              <video ref={videoRef} playsInline autoPlay muted className="w-full max-h-80 object-contain rounded" />
              <canvas ref={canvasRef} className="hidden" />
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={capturePhoto}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Capture
                </button>
                <button
                  type="button"
                  onClick={flipCamera}
                  className="px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-md hover:bg-gray-100"
                >
                  Flip Camera
                </button>
                <button
                  type="button"
                  onClick={closeCamera}
                  className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default StudioImageUploader;
