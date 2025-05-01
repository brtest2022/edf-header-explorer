
import React, { useState } from "react";
import { Toaster } from "sonner";
import { toast } from "sonner";
import FileUploader from "@/components/FileUploader";
import HeaderEditor from "@/components/HeaderEditor";
import InfoModal from "@/components/InfoModal";
import RespiratoryDataViewer from "@/components/RespiratoryDataViewer";
import { parseEdfHeader, type EdfHeader, extractRespiratoryData, updateRespiratoryDataInFile, type RespiratoryData } from "@/utils/edfParser";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Info } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Index = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [edfHeader, setEdfHeader] = useState<EdfHeader | null>(null);
  const [originalBuffer, setOriginalBuffer] = useState<ArrayBuffer | null>(null);
  const [fileName, setFileName] = useState<string>("");
  const [isVersionDialogOpen, setIsVersionDialogOpen] = useState(false);
  const [respiratoryData, setRespiratoryData] = useState<RespiratoryData[]>([]);
  
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
      
      // Extract respiratory data
      const respData = extractRespiratoryData(buffer, header);
      setRespiratoryData(respData);
      
      toast.success("EDF file successfully loaded");
    } catch (error) {
      console.error("Error parsing EDF header:", error);
      toast.error("Failed to parse EDF header. Is this a valid EDF file?");
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleRespiratoryDataUpdate = (channelIndex: number, newValues: number[]) => {
    if (!originalBuffer || !edfHeader) return;
    
    try {
      // Update the respiratory data in the file
      const updatedBuffer = updateRespiratoryDataInFile(
        originalBuffer,
        edfHeader,
        channelIndex,
        newValues
      );
      
      // Update state
      setOriginalBuffer(updatedBuffer);
      
      // Update the respiratory data display
      const updatedRespData = [...respiratoryData];
      updatedRespData[channelIndex] = {
        ...updatedRespData[channelIndex],
        values: newValues
      };
      setRespiratoryData(updatedRespData);
      
      toast.success("Dati respiratori aggiornati con successo");
    } catch (error) {
      console.error("Error updating respiratory data:", error);
      toast.error("Si è verificato un errore durante l'aggiornamento dei dati respiratori");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="mb-6 text-center relative">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">EDF Header Explorer</h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Upload, view, modify, and save EDF (European Data Format) file headers. 
            This tool allows you to inspect and edit all header fields without altering the actual data.
          </p>
          <div className="mt-4 flex justify-center items-center space-x-4">
            <InfoModal />
            <Dialog open={isVersionDialogOpen} onOpenChange={setIsVersionDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <Info className="h-4 w-4" />
                  Versione
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Dettagli Versione</DialogTitle>
                </DialogHeader>
                <div className="text-center space-y-2">
                  <p>Fabio developer - Fulvio Beta Tester - Versione 0.1</p>
                </div>
              </DialogContent>
            </Dialog>
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
            <Tabs defaultValue="header">
              <TabsList className="mb-6">
                <TabsTrigger value="header">Modifica Header</TabsTrigger>
                <TabsTrigger value="respiratory">Dati Respiratori</TabsTrigger>
              </TabsList>
              
              <TabsContent value="header">
                <HeaderEditor 
                  header={edfHeader} 
                  originalBuffer={originalBuffer!}
                  originalFileName={fileName}
                />
              </TabsContent>
              
              <TabsContent value="respiratory">
                <RespiratoryDataViewer 
                  respiratoryData={respiratoryData}
                  onDataUpdate={handleRespiratoryDataUpdate}
                />
              </TabsContent>
            </Tabs>

            <div className="flex justify-center mt-8">
              <button
                onClick={() => {
                  setEdfHeader(null);
                  setOriginalBuffer(null);
                  setFileName("");
                  setRespiratoryData([]);
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
