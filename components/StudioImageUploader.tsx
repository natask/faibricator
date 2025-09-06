import React, { useState, useCallback } from 'react';
import { UploadIcon } from './StudioIcons';

interface StudioImageUploaderProps {
  onImageUpload: (file: File) => void;
  title: string;
  subtitle: string;
}

const StudioImageUploader: React.FC<StudioImageUploaderProps> = ({ onImageUpload, title, subtitle }) => {
  const [isDragging, setIsDragging] = useState(false);

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

  return (
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
  );
};

export default StudioImageUploader;
