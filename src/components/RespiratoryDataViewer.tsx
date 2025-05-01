
import React, { useState, useEffect } from "react";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { RespiratoryData } from "@/utils/edfParser";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { CartesianGrid, Line, LineChart, XAxis, YAxis, ResponsiveContainer } from "recharts";
import { toast } from "sonner";

interface RespiratoryDataViewerProps {
  respiratoryData: RespiratoryData[];
  onDataUpdate: (channelIndex: number, newValues: number[]) => void;
}

const RespiratoryDataViewer: React.FC<RespiratoryDataViewerProps> = ({ 
  respiratoryData,
  onDataUpdate
}) => {
  const [selectedChannelIndex, setSelectedChannelIndex] = useState<number>(0);
  const [editMode, setEditMode] = useState<boolean>(false);
  const [modifiedValues, setModifiedValues] = useState<number[]>([]);
  const [editPointIndex, setEditPointIndex] = useState<number | null>(null);
  const [editPointValue, setEditPointValue] = useState<number>(0);
  
  useEffect(() => {
    if (respiratoryData.length > 0) {
      setModifiedValues([...respiratoryData[selectedChannelIndex].values]);
    }
  }, [respiratoryData, selectedChannelIndex]);
  
  const handleUpdateData = () => {
    onDataUpdate(selectedChannelIndex, modifiedValues);
    setEditMode(false);
    toast.success("Dati respiratori aggiornati con successo");
  };
  
  const handleCancelEdit = () => {
    setModifiedValues([...respiratoryData[selectedChannelIndex].values]);
    setEditMode(false);
    setEditPointIndex(null);
  };
  
  const handleValueChange = (index: number, value: number) => {
    const newValues = [...modifiedValues];
    newValues[index] = value;
    setModifiedValues(newValues);
  };
  
  const handleEditPoint = (index: number) => {
    setEditPointIndex(index);
    setEditPointValue(modifiedValues[index]);
  };
  
  const handleConfirmPointEdit = () => {
    if (editPointIndex !== null) {
      handleValueChange(editPointIndex, editPointValue);
      setEditPointIndex(null);
    }
  };
  
  const getChartData = () => {
    const values = editMode ? modifiedValues : respiratoryData[selectedChannelIndex]?.values || [];
    const times = respiratoryData[selectedChannelIndex]?.times || [];
    
    return times.map((time, index) => ({
      time,
      value: values[index] || 0
    }));
  };
  
  // Handle case when no respiratory data is available
  if (respiratoryData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Dati Respiratori</CardTitle>
          <CardDescription>
            Nessun dato respiratorio trovato nel file EDF
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }
  
  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle>Dati Respiratori</CardTitle>
        <CardDescription>
          Visualizza e modifica i dati respiratori dal file EDF
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="graph">
          <div className="flex justify-between items-center mb-4">
            <TabsList>
              <TabsTrigger value="graph">Grafico</TabsTrigger>
              <TabsTrigger value="data">Dati</TabsTrigger>
            </TabsList>
            
            <div className="flex items-center gap-2">
              <Select
                value={selectedChannelIndex.toString()}
                onValueChange={(value) => setSelectedChannelIndex(parseInt(value))}
              >
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Seleziona canale" />
                </SelectTrigger>
                <SelectContent>
                  {respiratoryData.map((channel, index) => (
                    <SelectItem key={index} value={index.toString()}>
                      {channel.label || `Canale ${index + 1}`} ({channel.unit})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              {!editMode ? (
                <Button onClick={() => setEditMode(true)}>Modifica</Button>
              ) : (
                <div className="flex gap-2">
                  <Button variant="outline" onClick={handleCancelEdit}>Annulla</Button>
                  <Button onClick={handleUpdateData}>Salva</Button>
                </div>
              )}
            </div>
          </div>
          
          <TabsContent value="graph">
            <div className="h-[400px] border rounded-md p-4">
              <ChartContainer
                config={{
                  resp: {
                    label: respiratoryData[selectedChannelIndex]?.label || "Respirazione",
                    color: "#8B5CF6"  // Purple color
                  }
                }}
              >
                <LineChart data={getChartData()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="time" 
                    name="Tempo"
                    label={{ value: "Tempo (s)", position: "insideBottomRight", offset: -5 }}
                  />
                  <YAxis 
                    name="Valore"
                    label={{ 
                      value: respiratoryData[selectedChannelIndex]?.unit || "Unità", 
                      angle: -90, 
                      position: "insideLeft" 
                    }}
                  />
                  <ChartTooltip
                    content={
                      <ChartTooltipContent />
                    }
                  />
                  <Line 
                    type="monotone" 
                    dataKey="value" 
                    name="resp"
                    stroke="#8B5CF6" 
                    activeDot={{ r: 8, onClick: (data) => editMode && handleEditPoint(data.index) }} 
                  />
                </LineChart>
              </ChartContainer>
            </div>
            
            {editMode && editPointIndex !== null && (
              <div className="mt-4 p-4 border rounded-md">
                <h4 className="font-medium mb-2">Modifica Punto</h4>
                <div className="flex items-end gap-4">
                  <div className="flex-grow">
                    <Label htmlFor="point-value">Valore</Label>
                    <div className="flex gap-4 items-center">
                      <Slider
                        id="point-value"
                        value={[editPointValue]}
                        min={respiratoryData[selectedChannelIndex]?.physicalMins || -100}
                        max={respiratoryData[selectedChannelIndex]?.physicalMaxs || 100}
                        step={0.1}
                        onValueChange={([value]) => setEditPointValue(value)}
                        className="flex-grow"
                      />
                      <Input
                        type="number"
                        value={editPointValue}
                        onChange={(e) => setEditPointValue(Number(e.target.value))}
                        className="w-24"
                      />
                    </div>
                  </div>
                  <Button onClick={handleConfirmPointEdit}>Applica</Button>
                </div>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="data">
            <div className="border rounded-md overflow-auto h-[400px]">
              <table className="w-full">
                <thead className="sticky top-0 bg-background">
                  <tr className="border-b">
                    <th className="px-4 py-2 text-left">Tempo (s)</th>
                    <th className="px-4 py-2 text-left">
                      Valore ({respiratoryData[selectedChannelIndex]?.unit})
                    </th>
                    {editMode && <th className="px-4 py-2 text-left">Azioni</th>}
                  </tr>
                </thead>
                <tbody>
                  {getChartData().map((point, index) => (
                    <tr key={index} className="border-b">
                      <td className="px-4 py-2">{point.time.toFixed(2)}</td>
                      <td className="px-4 py-2">
                        {editMode ? (
                          <Input
                            type="number"
                            value={point.value}
                            onChange={(e) => handleValueChange(index, Number(e.target.value))}
                            className="w-24 h-8"
                          />
                        ) : (
                          point.value.toFixed(2)
                        )}
                      </td>
                      {editMode && (
                        <td className="px-4 py-2">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleEditPoint(index)}
                          >
                            Modifica
                          </Button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default RespiratoryDataViewer;
