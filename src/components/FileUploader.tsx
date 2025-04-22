
import React, { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { FileUp } from "lucide-react";

interface FileUploaderProps {
  onFileLoaded: (file: File, buffer: ArrayBuffer) => void;
  isLoading: boolean;
}

const FileUploader: React.FC<FileUploaderProps> = ({ 
  onFileLoaded, 
  isLoading 
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const processFile = async (file: File) => {
    try {
      const buffer = await file.arrayBuffer();
      onFileLoaded(file, buffer);
    } catch (error) {
      console.error("Error processing file:", error);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  return (
    <div 
      className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer
        ${dragActive ? "border-blue-500 bg-blue-50" : "border-gray-300 hover:border-blue-400"}`}
      onClick={openFileDialog}
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept=".edf"
        className="hidden"
        onChange={handleFileChange}
        disabled={isLoading}
      />
      
      <div className="flex flex-col items-center justify-center gap-4">
        <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center">
          <FileUp className="w-8 h-8 text-blue-500" />
        </div>
        
        <div>
          <p className="text-lg font-medium">
            {isLoading ? "Processing..." : "Drop your EDF file here"}
          </p>
          <p className="text-sm text-gray-500 mt-1">
            or click to browse files
          </p>
        </div>
        
        <Button
          variant="outline"
          disabled={isLoading}
          className="mt-2"
        >
          Select EDF File
        </Button>
      </div>
    </div>
  );
};

export default FileUploader;
