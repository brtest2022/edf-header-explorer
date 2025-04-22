import React, { useState } from "react";
import { saveAs } from "file-saver";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { type EdfHeader, createModifiedEdfFile } from "@/utils/edfParser";
import { FilePen, Save } from "lucide-react";
import { toast } from "sonner";

interface HeaderEditorProps {
  header: EdfHeader;
  originalBuffer: ArrayBuffer;
  originalFileName: string;
}

const HeaderEditor: React.FC<HeaderEditorProps> = ({ 
  header: initialHeader, 
  originalBuffer,
  originalFileName
}) => {
  const [header, setHeader] = useState<EdfHeader>(initialHeader);
  const [isSaving, setIsSaving] = useState(false);
  const [fileName, setFileName] = useState(originalFileName);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const updateHeader = <K extends keyof EdfHeader>(
    field: K, 
    value: EdfHeader[K]
  ) => {
    setHeader(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const updateSignalField = <K extends keyof Pick<
    EdfHeader, 
    'labels' | 'transducerTypes' | 'physicalDimensions' | 
    'physicalMins' | 'physicalMaxs' | 'digitalMins' | 
    'digitalMaxs' | 'prefiltering' | 'samplesPerRecord' | 'reserved2'
  >>(
    field: K, 
    index: number, 
    value: any
  ) => {
    setHeader(prev => {
      const newArray = [...prev[field]];
      newArray[index] = value;
      return {
        ...prev,
        [field]: newArray
      };
    });
  };

  const handleSave = async (customFileName?: string) => {
    setIsSaving(true);
    try {
      const modifiedBuffer = createModifiedEdfFile(originalBuffer, header);
      const blob = new Blob([modifiedBuffer], { type: "application/octet-stream" });
      
      const filenameParts = (customFileName || originalFileName).split('.');
      const extension = filenameParts.pop();
      const baseName = filenameParts.join('.');
      const newFileName = `${baseName}_modified.${extension}`;
      
      saveAs(blob, newFileName);
      
      toast.success(`File salvato come ${newFileName}`);
      setIsDialogOpen(false);
    } catch (error) {
      console.error("Errore durante il salvataggio del file:", error);
      toast.error("Impossibile salvare il file");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <FilePen className="h-6 w-6" />
            Editor Header EDF
          </h2>
          <p className="text-gray-500 mt-1">
            Visualizza e modifica le informazioni dell'header del file EDF
          </p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              disabled={isSaving}
              className="gap-2"
            >
              <Save className="h-4 w-4" />
              Salva con nome
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Salva file modificato</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="saveFileName">Nome file</Label>
                <Input 
                  id="saveFileName"
                  value={fileName}
                  onChange={(e) => setFileName(e.target.value)}
                  placeholder="Inserisci nome file"
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button 
                  variant="outline" 
                  onClick={() => setIsDialogOpen(false)}
                >
                  Annulla
                </Button>
                <Button 
                  onClick={() => handleSave(fileName)}
                  disabled={!fileName.trim()}
                >
                  Salva
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      
      <Separator />
      
      <Tabs defaultValue="general">
        <TabsList className="mb-4">
          <TabsTrigger value="general">General Information</TabsTrigger>
          <TabsTrigger value="signals">Signal Information ({header.numSignals} Signals)</TabsTrigger>
        </TabsList>
        
        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>
                Edit the general EDF file information
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="version">Version</Label>
                  <Input
                    id="version"
                    value={header.version}
                    onChange={(e) => updateHeader("version", e.target.value)}
                    maxLength={8}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="patientId">Patient ID</Label>
                  <Input
                    id="patientId"
                    value={header.patientId}
                    onChange={(e) => updateHeader("patientId", e.target.value)}
                    maxLength={80}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="recordId">Record ID</Label>
                  <Input
                    id="recordId"
                    value={header.recordId}
                    onChange={(e) => updateHeader("recordId", e.target.value)}
                    maxLength={80}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="startDate">Start Date (dd.mm.yy)</Label>
                  <Input
                    id="startDate"
                    value={header.startDate}
                    onChange={(e) => updateHeader("startDate", e.target.value)}
                    maxLength={8}
                    placeholder="31.12.85"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="startTime">Start Time (hh.mm.ss)</Label>
                  <Input
                    id="startTime"
                    value={header.startTime}
                    onChange={(e) => updateHeader("startTime", e.target.value)}
                    maxLength={8}
                    placeholder="23.59.59"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="bytesInHeader">Bytes in Header</Label>
                  <Input
                    id="bytesInHeader"
                    type="number"
                    value={header.bytesInHeader}
                    onChange={(e) => updateHeader("bytesInHeader", parseInt(e.target.value))}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="reserved">Reserved</Label>
                  <Input
                    id="reserved"
                    value={header.reserved}
                    onChange={(e) => updateHeader("reserved", e.target.value)}
                    maxLength={44}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="numDataRecords">Number of Data Records</Label>
                  <Input
                    id="numDataRecords"
                    type="number"
                    value={header.numDataRecords}
                    onChange={(e) => updateHeader("numDataRecords", parseInt(e.target.value))}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="durationOfDataRecord">Duration of Data Record (s)</Label>
                  <Input
                    id="durationOfDataRecord"
                    type="number"
                    step="0.01"
                    value={header.durationOfDataRecord}
                    onChange={(e) => updateHeader("durationOfDataRecord", parseFloat(e.target.value))}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="numSignals">Number of Signals</Label>
                  <Input
                    id="numSignals"
                    type="number"
                    value={header.numSignals}
                    readOnly
                    disabled
                    title="Cannot be modified as it would change the file structure"
                  />
                  <p className="text-xs text-gray-500">This value cannot be modified</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="signals">
          <Card>
            <CardHeader>
              <CardTitle>Signal Information</CardTitle>
              <CardDescription>
                Edit information for each signal in the EDF file
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px] pr-4">
                {Array.from({ length: header.numSignals }).map((_, signalIndex) => (
                  <div key={signalIndex} className="mb-8">
                    <h3 className="text-lg font-semibold mb-4 bg-blue-50 p-2 rounded-md">
                      Signal #{signalIndex + 1}
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor={`label-${signalIndex}`}>Label</Label>
                        <Input
                          id={`label-${signalIndex}`}
                          value={header.labels[signalIndex] || ''}
                          onChange={(e) => updateSignalField("labels", signalIndex, e.target.value)}
                          maxLength={16}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor={`transducer-${signalIndex}`}>Transducer Type</Label>
                        <Input
                          id={`transducer-${signalIndex}`}
                          value={header.transducerTypes[signalIndex] || ''}
                          onChange={(e) => updateSignalField("transducerTypes", signalIndex, e.target.value)}
                          maxLength={80}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor={`dimension-${signalIndex}`}>Physical Dimension</Label>
                        <Input
                          id={`dimension-${signalIndex}`}
                          value={header.physicalDimensions[signalIndex] || ''}
                          onChange={(e) => updateSignalField("physicalDimensions", signalIndex, e.target.value)}
                          maxLength={8}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor={`physMin-${signalIndex}`}>Physical Minimum</Label>
                        <Input
                          id={`physMin-${signalIndex}`}
                          type="number"
                          step="any"
                          value={header.physicalMins[signalIndex] || 0}
                          onChange={(e) => updateSignalField("physicalMins", signalIndex, parseFloat(e.target.value))}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor={`physMax-${signalIndex}`}>Physical Maximum</Label>
                        <Input
                          id={`physMax-${signalIndex}`}
                          type="number"
                          step="any"
                          value={header.physicalMaxs[signalIndex] || 0}
                          onChange={(e) => updateSignalField("physicalMaxs", signalIndex, parseFloat(e.target.value))}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor={`digMin-${signalIndex}`}>Digital Minimum</Label>
                        <Input
                          id={`digMin-${signalIndex}`}
                          type="number"
                          value={header.digitalMins[signalIndex] || 0}
                          onChange={(e) => updateSignalField("digitalMins", signalIndex, parseInt(e.target.value))}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor={`digMax-${signalIndex}`}>Digital Maximum</Label>
                        <Input
                          id={`digMax-${signalIndex}`}
                          type="number"
                          value={header.digitalMaxs[signalIndex] || 0}
                          onChange={(e) => updateSignalField("digitalMaxs", signalIndex, parseInt(e.target.value))}
                        />
                      </div>
                      
                      <div className="space-y-2 md:col-span-2">
                        <Label htmlFor={`prefilter-${signalIndex}`}>Prefiltering</Label>
                        <Textarea
                          id={`prefilter-${signalIndex}`}
                          value={header.prefiltering[signalIndex] || ''}
                          onChange={(e) => updateSignalField("prefiltering", signalIndex, e.target.value)}
                          maxLength={80}
                          rows={2}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor={`samples-${signalIndex}`}>Samples per Record</Label>
                        <Input
                          id={`samples-${signalIndex}`}
                          type="number"
                          value={header.samplesPerRecord[signalIndex] || 0}
                          onChange={(e) => updateSignalField("samplesPerRecord", signalIndex, parseInt(e.target.value))}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor={`reserved2-${signalIndex}`}>Reserved</Label>
                        <Input
                          id={`reserved2-${signalIndex}`}
                          value={header.reserved2[signalIndex] || ''}
                          onChange={(e) => updateSignalField("reserved2", signalIndex, e.target.value)}
                          maxLength={32}
                        />
                      </div>
                    </div>
                    
                    {signalIndex < header.numSignals - 1 && (
                      <Separator className="my-6" />
                    )}
                  </div>
                ))}
              </ScrollArea>
            </CardContent>
            <CardFooter>
              <p className="text-sm text-gray-500">
                Changes to signal count are not supported as they would modify the file structure
              </p>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default HeaderEditor;
