
// --- PNG Chunk Utilities ---

export function dataUrlToUint8Array(dataUrl) {
  const base64 = dataUrl.split(",")[1];
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

export function uint8ArrayToDataUrl(uint8Array, mimeType = 'image/png') {
  const binaryString = Array.from(uint8Array)
    .map((byte) => String.fromCharCode(byte))
    .join("");
  const base64 = btoa(binaryString);
  return `data:${mimeType};base64,${base64}`;
}

export function addPngChunk(pngData, chunkType, data) {
  // Find IEND chunk
  let iendIndex = -1;
  for (let i = 0; i < pngData.length - 7; i++) {
    if (
      pngData[i + 4] === 0x49 &&
      pngData[i + 5] === 0x45 &&
      pngData[i + 6] === 0x4e &&
      pngData[i + 7] === 0x44
    ) {
      iendIndex = i;
      break;
    }
  }

  if (iendIndex === -1) {
    // If IEND chunk does not exist, add it
    const iendChunk = new Uint8Array([
      0x00,
      0x00,
      0x00,
      0x00, // Length: 0
      0x49,
      0x45,
      0x4e,
      0x44, // Type: IEND
      0xae,
      0x42,
      0x60,
      0x82, // CRC
    ]);
    iendIndex = pngData.length;
    const newPngData = new Uint8Array(pngData.length + iendChunk.length);
    newPngData.set(pngData);
    newPngData.set(iendChunk, pngData.length);
    pngData = newPngData;
  }

  // Create new chunk
  const chunkTypeBytes = new TextEncoder().encode(chunkType);
  const chunkLength = data.length;
  const lengthBytes = new Uint8Array(4);
  lengthBytes[0] = (chunkLength >>> 24) & 0xff;
  lengthBytes[1] = (chunkLength >>> 16) & 0xff;
  lengthBytes[2] = (chunkLength >>> 8) & 0xff;
  lengthBytes[3] = chunkLength & 0xff;

  // Calculate CRC
  const crcData = new Uint8Array(chunkTypeBytes.length + data.length);
  crcData.set(chunkTypeBytes);
  crcData.set(data, chunkTypeBytes.length);
  const crc = calculateCRC32(crcData);
  const crcBytes = new Uint8Array(4);
  crcBytes[0] = (crc >>> 24) & 0xff;
  crcBytes[1] = (crc >>> 16) & 0xff;
  crcBytes[2] = (crc >>> 8) & 0xff;
  crcBytes[3] = crc & 0xff;

  const chunkSize = 12 + data.length;
  const newPngData = new Uint8Array(pngData.length + chunkSize);

  newPngData.set(pngData.slice(0, iendIndex));

  let offset = iendIndex;
  newPngData.set(lengthBytes, offset);
  offset += 4;
  newPngData.set(chunkTypeBytes, offset);
  offset += 4;
  newPngData.set(data, offset);
  offset += data.length;
  newPngData.set(crcBytes, offset);
  offset += 4;

  newPngData.set(pngData.slice(iendIndex), offset);

  return newPngData;
}

export function calculateCRC32(data) {
  const crcTable = [];
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let j = 0; j < 8; j++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    crcTable[i] = c;
  }

  let crc = 0xffffffff;
  for (let i = 0; i < data.length; i++) {
    crc = crcTable[(crc ^ data[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

export function extractPngChunk(pngData, chunkType) {
  const chunkTypeBytes = new TextEncoder().encode(chunkType);

  let index = 8; // Skip PNG header
  while (index < pngData.length - 8) {
    const length =
      (pngData[index] << 24) |
      (pngData[index + 1] << 16) |
      (pngData[index + 2] << 8) |
      pngData[index + 3];

    const type = pngData.slice(index + 4, index + 8);

    if (
      type.length === chunkTypeBytes.length &&
      type.every((byte, i) => byte === chunkTypeBytes[i])
    ) {
      return pngData.slice(index + 8, index + 8 + length);
    }

    index += 8 + length + 4;
  }

  return null;
}

export async function compressData(data) {
  if (!window.CompressionStream) {
    return data;
  }

  try {
    const stream = new CompressionStream("gzip");
    const writer = stream.writable.getWriter();
    const reader = stream.readable.getReader();

    writer.write(data);
    writer.close();

    const chunks = [];
    let done = false;
    while (!done) {
      const { value, done: readerDone } = await reader.read();
      done = readerDone;
      if (value) {
        chunks.push(value);
      }
    }

    const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
    const result = new Uint8Array(totalLength);
    let offset = 0;
    for (const chunk of chunks) {
      result.set(chunk, offset);
      offset += chunk.length;
    }

    return result;
  } catch (error) {
    return data;
  }
}

export async function decompressData(compressedData) {
  if (!window.DecompressionStream) {
    return compressedData;
  }

  try {
    const stream = new DecompressionStream("gzip");
    const writer = stream.writable.getWriter();
    const reader = stream.readable.getReader();

    writer.write(compressedData);
    writer.close();

    const chunks = [];
    let done = false;
    while (!done) {
      const { value, done: readerDone } = await reader.read();
      done = readerDone;
      if (value) {
        chunks.push(value);
      }
    }

    const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
    const result = new Uint8Array(totalLength);
    let offset = 0;
    for (const chunk of chunks) {
      result.set(chunk, offset);
      offset += chunk.length;
    }

    return result;
  } catch (error) {
    return compressedData;
  }
}
