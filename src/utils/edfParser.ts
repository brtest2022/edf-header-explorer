
/**
 * Utility functions for parsing and manipulating EDF (European Data Format) files
 */

// Define the structure of an EDF header
export interface EdfHeader {
  version: string;
  patientId: string;
  recordId: string;
  startDate: string;
  startTime: string;
  bytesInHeader: number;
  reserved: string;
  numDataRecords: number;
  durationOfDataRecord: number;
  numSignals: number;
  labels: string[];
  transducerTypes: string[];
  physicalDimensions: string[];
  physicalMins: number[];
  physicalMaxs: number[];
  digitalMins: number[];
  digitalMaxs: number[];
  prefiltering: string[];
  samplesPerRecord: number[];
  reserved2: string[];
}

/**
 * Parse an EDF file header from an ArrayBuffer
 */
export const parseEdfHeader = (buffer: ArrayBuffer): EdfHeader => {
  const dataView = new DataView(buffer);
  const decoder = new TextDecoder('ascii');
  
  // Function to read ASCII string from buffer
  const readAsciiString = (offset: number, length: number): string => {
    const bytes = new Uint8Array(buffer.slice(offset, offset + length));
    return decoder.decode(bytes).trim();
  };
  
  // Parse fixed header fields
  const version = readAsciiString(0, 8);
  const patientId = readAsciiString(8, 80);
  const recordId = readAsciiString(88, 80);
  const startDate = readAsciiString(168, 8);
  const startTime = readAsciiString(176, 8);
  const bytesInHeader = parseInt(readAsciiString(184, 8), 10);
  const reserved = readAsciiString(192, 44);
  const numDataRecords = parseInt(readAsciiString(236, 8), 10);
  const durationOfDataRecord = parseFloat(readAsciiString(244, 8));
  const numSignals = parseInt(readAsciiString(252, 4), 10);
  
  // Parse variable header fields based on number of signals
  let offset = 256;
  
  // Initialize arrays for variable header fields
  const labels: string[] = [];
  const transducerTypes: string[] = [];
  const physicalDimensions: string[] = [];
  const physicalMins: number[] = [];
  const physicalMaxs: number[] = [];
  const digitalMins: number[] = [];
  const digitalMaxs: number[] = [];
  const prefiltering: string[] = [];
  const samplesPerRecord: number[] = [];
  const reserved2: string[] = [];
  
  // Read label information
  for (let i = 0; i < numSignals; i++) {
    labels.push(readAsciiString(offset, 16));
    offset += 16;
  }
  
  // Read transducer types
  for (let i = 0; i < numSignals; i++) {
    transducerTypes.push(readAsciiString(offset, 80));
    offset += 80;
  }
  
  // Read physical dimensions
  for (let i = 0; i < numSignals; i++) {
    physicalDimensions.push(readAsciiString(offset, 8));
    offset += 8;
  }
  
  // Read physical minimums
  for (let i = 0; i < numSignals; i++) {
    physicalMins.push(parseFloat(readAsciiString(offset, 8)));
    offset += 8;
  }
  
  // Read physical maximums
  for (let i = 0; i < numSignals; i++) {
    physicalMaxs.push(parseFloat(readAsciiString(offset, 8)));
    offset += 8;
  }
  
  // Read digital minimums
  for (let i = 0; i < numSignals; i++) {
    digitalMins.push(parseInt(readAsciiString(offset, 8), 10));
    offset += 8;
  }
  
  // Read digital maximums
  for (let i = 0; i < numSignals; i++) {
    digitalMaxs.push(parseInt(readAsciiString(offset, 8), 10));
    offset += 8;
  }
  
  // Read prefiltering information
  for (let i = 0; i < numSignals; i++) {
    prefiltering.push(readAsciiString(offset, 80));
    offset += 80;
  }
  
  // Read samples per record
  for (let i = 0; i < numSignals; i++) {
    samplesPerRecord.push(parseInt(readAsciiString(offset, 8), 10));
    offset += 8;
  }
  
  // Read reserved area
  for (let i = 0; i < numSignals; i++) {
    reserved2.push(readAsciiString(offset, 32));
    offset += 32;
  }
  
  return {
    version,
    patientId,
    recordId,
    startDate,
    startTime,
    bytesInHeader,
    reserved,
    numDataRecords,
    durationOfDataRecord,
    numSignals,
    labels,
    transducerTypes,
    physicalDimensions,
    physicalMins,
    physicalMaxs,
    digitalMins,
    digitalMaxs,
    prefiltering,
    samplesPerRecord,
    reserved2
  };
};

/**
 * Create a modified EDF file with updated header
 */
export const createModifiedEdfFile = (originalBuffer: ArrayBuffer, updatedHeader: EdfHeader): ArrayBuffer => {
  // Create a copy of the original buffer
  const resultBuffer = new ArrayBuffer(originalBuffer.byteLength);
  new Uint8Array(resultBuffer).set(new Uint8Array(originalBuffer));
  
  const encoder = new TextEncoder();
  
  // Function to write ASCII string to buffer with padding
  const writeAsciiString = (str: string, offset: number, length: number) => {
    const paddedStr = str.padEnd(length, ' ').substring(0, length);
    const bytes = encoder.encode(paddedStr);
    new Uint8Array(resultBuffer).set(bytes, offset);
  };
  
  // Function to write a number as an ASCII string with padding
  const writeNumber = (num: number, offset: number, length: number, isInteger = true) => {
    let str: string;
    if (isInteger) {
      str = Math.floor(num).toString().padStart(length, ' ');
    } else {
      // For floating point, ensure we have the correct format (e.g. "123.456")
      str = num.toString().padStart(length, ' ');
    }
    writeAsciiString(str, offset, length);
  };
  
  // Update fixed header fields
  writeAsciiString(updatedHeader.version, 0, 8);
  writeAsciiString(updatedHeader.patientId, 8, 80);
  writeAsciiString(updatedHeader.recordId, 88, 80);
  writeAsciiString(updatedHeader.startDate, 168, 8);
  writeAsciiString(updatedHeader.startTime, 176, 8);
  writeNumber(updatedHeader.bytesInHeader, 184, 8);
  writeAsciiString(updatedHeader.reserved, 192, 44);
  writeNumber(updatedHeader.numDataRecords, 236, 8);
  writeNumber(updatedHeader.durationOfDataRecord, 244, 8, false);
  writeNumber(updatedHeader.numSignals, 252, 4);
  
  // Update variable header fields
  let offset = 256;
  
  // Write labels
  for (let i = 0; i < updatedHeader.numSignals; i++) {
    writeAsciiString(updatedHeader.labels[i] || '', offset, 16);
    offset += 16;
  }
  
  // Write transducer types
  for (let i = 0; i < updatedHeader.numSignals; i++) {
    writeAsciiString(updatedHeader.transducerTypes[i] || '', offset, 80);
    offset += 80;
  }
  
  // Write physical dimensions
  for (let i = 0; i < updatedHeader.numSignals; i++) {
    writeAsciiString(updatedHeader.physicalDimensions[i] || '', offset, 8);
    offset += 8;
  }
  
  // Write physical minimums
  for (let i = 0; i < updatedHeader.numSignals; i++) {
    writeNumber(updatedHeader.physicalMins[i] || 0, offset, 8, false);
    offset += 8;
  }
  
  // Write physical maximums
  for (let i = 0; i < updatedHeader.numSignals; i++) {
    writeNumber(updatedHeader.physicalMaxs[i] || 0, offset, 8, false);
    offset += 8;
  }
  
  // Write digital minimums
  for (let i = 0; i < updatedHeader.numSignals; i++) {
    writeNumber(updatedHeader.digitalMins[i] || 0, offset, 8);
    offset += 8;
  }
  
  // Write digital maximums
  for (let i = 0; i < updatedHeader.numSignals; i++) {
    writeNumber(updatedHeader.digitalMaxs[i] || 0, offset, 8);
    offset += 8;
  }
  
  // Write prefiltering information
  for (let i = 0; i < updatedHeader.numSignals; i++) {
    writeAsciiString(updatedHeader.prefiltering[i] || '', offset, 80);
    offset += 80;
  }
  
  // Write samples per record
  for (let i = 0; i < updatedHeader.numSignals; i++) {
    writeNumber(updatedHeader.samplesPerRecord[i] || 0, offset, 8);
    offset += 8;
  }
  
  // Write reserved area
  for (let i = 0; i < updatedHeader.numSignals; i++) {
    writeAsciiString(updatedHeader.reserved2[i] || '', offset, 32);
    offset += 32;
  }
  
  return resultBuffer;
};
