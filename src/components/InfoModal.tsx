
import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FileText } from "lucide-react";

const InfoModal = () => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <FileText className="h-4 w-4" />
          About EDF Format
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>About EDF (European Data Format)</DialogTitle>
          <DialogDescription>
            Information about the EDF file format and this application
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh]">
          <div className="space-y-4 p-1">
            <section>
              <h3 className="text-lg font-bold">What is EDF?</h3>
              <p>
                The European Data Format (EDF) is a standard file format for exchanging and storing medical time-series data. 
                It was developed by a group of European medical engineers and researchers to facilitate the exchange of medical data between different equipment and laboratories.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-bold">EDF Header Structure</h3>
              <p>
                The EDF file header consists of two parts:
              </p>
              <ul className="list-disc pl-6 mt-2 space-y-1">
                <li><strong>Fixed header</strong>: Contains general information about the recording (256 bytes)</li>
                <li><strong>Variable header</strong>: Contains information about each signal in the recording</li>
              </ul>
              
              <div className="mt-3">
                <h4 className="font-semibold">Fixed Header Fields:</h4>
                <ul className="list-disc pl-6 mt-1 space-y-1">
                  <li><strong>Version</strong>: Version of this data format (8 ASCII)</li>
                  <li><strong>Patient ID</strong>: Local patient identification (80 ASCII)</li>
                  <li><strong>Record ID</strong>: Local recording identification (80 ASCII)</li>
                  <li><strong>Start date</strong>: Start date of recording (dd.mm.yy) (8 ASCII)</li>
                  <li><strong>Start time</strong>: Start time of recording (hh.mm.ss) (8 ASCII)</li>
                  <li><strong>Bytes in header</strong>: Number of bytes in header record (8 ASCII)</li>
                  <li><strong>Reserved</strong>: Reserved (44 ASCII)</li>
                  <li><strong>Number of data records</strong>: Number of data records (-1 if unknown) (8 ASCII)</li>
                  <li><strong>Duration of data record</strong>: Duration of a data record, in seconds (8 ASCII)</li>
                  <li><strong>Number of signals</strong>: Number of signals in data record (4 ASCII)</li>
                </ul>
              </div>
              
              <div className="mt-3">
                <h4 className="font-semibold">Variable Header Fields (for each signal):</h4>
                <ul className="list-disc pl-6 mt-1 space-y-1">
                  <li><strong>Labels</strong>: Label of each signal (16 ASCII × ns)</li>
                  <li><strong>Transducer type</strong>: Transducer type (80 ASCII × ns)</li>
                  <li><strong>Physical dimension</strong>: Physical dimension (8 ASCII × ns)</li>
                  <li><strong>Physical minimum</strong>: Physical minimum (8 ASCII × ns)</li>
                  <li><strong>Physical maximum</strong>: Physical maximum (8 ASCII × ns)</li>
                  <li><strong>Digital minimum</strong>: Digital minimum (8 ASCII × ns)</li>
                  <li><strong>Digital maximum</strong>: Digital maximum (8 ASCII × ns)</li>
                  <li><strong>Prefiltering</strong>: Prefiltering (80 ASCII × ns)</li>
                  <li><strong>Samples per record</strong>: Number of samples in each data record (8 ASCII × ns)</li>
                  <li><strong>Reserved</strong>: Reserved (32 ASCII × ns)</li>
                </ul>
                <p className="text-sm text-gray-600 mt-1">(where ns = number of signals)</p>
              </div>
            </section>

            <section>
              <h3 className="text-lg font-bold">Using This Application</h3>
              <ol className="list-decimal pl-6 mt-2 space-y-2">
                <li>
                  <strong>Upload an EDF file</strong>: Click the upload area or drag and drop an EDF file.
                </li>
                <li>
                  <strong>View header information</strong>: Once uploaded, the application will display all header information.
                </li>
                <li>
                  <strong>Edit header fields</strong>: You can modify any editable header field.
                </li>
                <li>
                  <strong>Save modified file</strong>: Click the "Save Modified EDF" button to download the modified file.
                </li>
              </ol>
              <p className="mt-3 text-sm text-gray-600">
                <strong>Note</strong>: This application only modifies the header information. The actual data records in the EDF file remain unchanged.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-bold">Limitations</h3>
              <ul className="list-disc pl-6 mt-2 space-y-1">
                <li>The number of signals cannot be modified as it would change the file structure.</li>
                <li>This tool doesn't support EDF+ (annotated EDF) specific features.</li>
                <li>Very large EDF files may take longer to process in the browser.</li>
              </ul>
            </section>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default InfoModal;
