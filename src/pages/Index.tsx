
import React, { useState } from "react";
import { Toaster } from "sonner";
import { toast } from "sonner";
import FileUploader from "@/components/FileUploader";
import HeaderEditor from "@/components/HeaderEditor";
import InfoModal from "@/components/InfoModal";
import { parseEdfHeader, type EdfHeader } from "@/utils/edfParser";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

const Index = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [edfHeader, setEdfHeader] = useState<EdfHeader | null>(null);
  const [originalBuffer, setOriginalBuffer] = useState<ArrayBuffer | null>(null);
  const [fileName, setFileName] = useState<string>("");

  const handleFileLoaded = async (file: File, buffer: ArrayBuffer) => {
    setIsLoading(true);
    try {
      // Check if the file is likely an EDF file
      if (buffer.byteLength < 256 || !(file.name.toLowerCase().endsWith('.edf'))) {
        toast.error("The file doesn't appear to be a valid EDF file");
        return;
      }
      
      const header = parseEdfHeader(buffer);
      setEdfHeader(header);
      setOriginalBuffer(buffer);
      setFileName(file.name);
      toast.success("EDF file successfully loaded");
    } catch (error) {
      console.error("Error parsing EDF header:", error);
      toast.error("Failed to parse EDF header. Is this a valid EDF file?");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="mb-6 text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">EDF Header Explorer</h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Upload, view, modify, and save EDF (European Data Format) file headers. 
            This tool allows you to inspect and edit all header fields without altering the actual data.
          </p>
          <div className="mt-4">
            <InfoModal />
          </div>
        </div>

        <Separator className="my-8" />

        {!edfHeader ? (
          <Card className="max-w-3xl mx-auto">
            <CardContent className="pt-6">
              <FileUploader 
                onFileLoaded={handleFileLoaded}
                isLoading={isLoading}
              />
            </CardContent>
          </Card>
        ) : (
          <div className="max-w-6xl mx-auto">
            <HeaderEditor 
              header={edfHeader} 
              originalBuffer={originalBuffer!}
              originalFileName={fileName}
            />

            <div className="flex justify-center mt-8">
              <button
                onClick={() => {
                  setEdfHeader(null);
                  setOriginalBuffer(null);
                  setFileName("");
                }}
                className="text-blue-500 hover:text-blue-700 text-sm underline"
              >
                Upload another file
              </button>
            </div>
          </div>
        )}
      </div>
      <Toaster position="bottom-right" />
    </div>
  );
};

export default Index;
