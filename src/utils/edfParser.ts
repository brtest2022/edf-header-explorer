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

// Interface for respiratory data
export interface RespiratoryData {
  times: number[];
  values: number[];
  label: string;
  unit: string;
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
 * Extract respiratory data from EDF file
 * @param buffer ArrayBuffer containing EDF data
 * @param header Parsed EDF header
 * @returns Object containing respiratory data series
 */
export const extractRespiratoryData = (buffer: ArrayBuffer, header: EdfHeader): RespiratoryData[] => {
  const respiratoryChannels: RespiratoryData[] = [];
  const dataView = new DataView(buffer);
  
  // Find respiratory channels (typically labeled as RESP, FLOW, or similar)
  const respiratoryIndices = header.labels
    .map((label, index) => {
      const lowerLabel = label.toLowerCase().trim();
      return {
        index,
        isRespiratory: lowerLabel.includes('resp') || 
                       lowerLabel.includes('flow') || 
                       lowerLabel.includes('thorax') || 
                       lowerLabel.includes('abdom') ||
                       lowerLabel.includes('breath')
      };
    })
    .filter(item => item.isRespiratory)
    .map(item => item.index);
  
  if (respiratoryIndices.length === 0) {
    // If no clearly labeled respiratory channels found, use first channel as default
    respiratoryIndices.push(0);
  }
  
  // Calculate header size and data offset
  const headerSize = header.bytesInHeader;
  
  // Extract data for each respiratory channel
  for (const channelIndex of respiratoryIndices) {
    const numSamples = header.samplesPerRecord[channelIndex];
    const label = header.labels[channelIndex].trim();
    const unit = header.physicalDimensions[channelIndex].trim();
    const digitalMin = header.digitalMins[channelIndex];
    const digitalMax = header.digitalMaxs[channelIndex];
    const physicalMin = header.physicalMins[channelIndex];
    const physicalMax = header.physicalMaxs[channelIndex];
    
    const values: number[] = [];
    const times: number[] = [];
    
    // Calculate sample offset for this channel
    let sampleOffsetInRecord = 0;
    for (let i = 0; i < channelIndex; i++) {
      sampleOffsetInRecord += header.samplesPerRecord[i];
    }
    
    // Read values for each data record
    let dataOffset = headerSize;
    
    for (let record = 0; record < Math.min(header.numDataRecords, 10); record++) {
      const recordOffset = dataOffset + record * 2 * sampleOffsetInRecord;
      
      for (let sample = 0; sample < numSamples; sample++) {
        // Read 2-byte sample
        const sampleOffset = recordOffset + sample * 2;
        if (sampleOffset + 2 <= buffer.byteLength) {
          const digitalValue = dataView.getInt16(sampleOffset, true); // little endian
          
          // Convert to physical value using scaling from header
          const physicalValue = physicalMin + (digitalValue - digitalMin) * 
            (physicalMax - physicalMin) / (digitalMax - digitalMin);
          
          values.push(physicalValue);
          
          // Calculate timestamp (in seconds)
          const time = (record * header.durationOfDataRecord) + 
            (sample / numSamples) * header.durationOfDataRecord;
          times.push(time);
        }
      }
    }
    
    respiratoryChannels.push({
      label,
      unit,
      values,
      times
    });
  }
  
  return respiratoryChannels;
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

/**
 * Create a modified EDF file with updated respiratory data
 */
export const updateRespiratoryDataInFile = (
  originalBuffer: ArrayBuffer, 
  header: EdfHeader,
  channelIndex: number,
  newValues: number[]
): ArrayBuffer => {
  // Create a copy of the original buffer
  const resultBuffer = new ArrayBuffer(originalBuffer.byteLength);
  new Uint8Array(resultBuffer).set(new Uint8Array(originalBuffer));
  const dataView = new DataView(resultBuffer);
  
  // Calculate header size
  const headerSize = header.bytesInHeader;
  
  // Get scaling factors for the selected channel
  const digitalMin = header.digitalMins[channelIndex];
  const digitalMax = header.digitalMaxs[channelIndex];
  const physicalMin = header.physicalMins[channelIndex];
  const physicalMax = header.physicalMaxs[channelIndex];
  
  // Calculate sample offset for this channel
  let sampleOffsetInRecord = 0;
  for (let i = 0; i < channelIndex; i++) {
    sampleOffsetInRecord += header.samplesPerRecord[i];
  }
  
  // Number of samples for this channel
  const numSamples = header.samplesPerRecord[channelIndex];
  
  // Calculate how many values we can update (min of provided values and actual samples)
  const valuesToUpdate = Math.min(
    newValues.length,
    numSamples * Math.min(header.numDataRecords, 10)
  );
  
  // Update values
  for (let i = 0; i < valuesToUpdate; i++) {
    // Calculate record and sample index
    const record = Math.floor(i / numSamples);
    const sample = i % numSamples;
    
    // Convert physical value to digital value
    const physicalValue = newValues[i];
    const digitalValue = Math.round(digitalMin + (physicalValue - physicalMin) * 
      (digitalMax - digitalMin) / (physicalMax - physicalMin));
    
    // Calculate offset in buffer
    const dataOffset = headerSize;
    const recordOffset = dataOffset + record * 2 * sampleOffsetInRecord;
    const sampleOffset = recordOffset + sample * 2;
    
    if (sampleOffset + 2 <= resultBuffer.byteLength) {
      // Write 2-byte sample
      dataView.setInt16(sampleOffset, digitalValue, true); // little endian
    }
  }
  
  return resultBuffer;
};
