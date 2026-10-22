import { createRequire } from 'module';
import mammoth from 'mammoth';

const require = createRequire(import.meta.url);
const pdfParse = require('pdf-parse');

export async function parseDocument(fileBuffer, originalName, mimeType) {
  const extension = originalName.split('.').pop()?.toLowerCase();
  let rawText = '';
  let formatDetected = extension || 'unknown';

  if (!fileBuffer || fileBuffer.length === 0) {
    throw new Error('Uploaded file is empty (0 bytes). Please upload a valid document.');
  }

  // 1. PDF Parsing
  if (extension === 'pdf' || mimeType === 'application/pdf') {
    formatDetected = 'PDF';
    try {
      const pdfData = await pdfParse(fileBuffer);
      rawText = pdfData.text || '';
    } catch (err) {
      throw new Error(`Failed to parse PDF document: ${err.message}. Ensure the file is not password-protected or corrupted.`);
    }
  }
  // 2. DOCX Parsing
  else if (extension === 'docx' || mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
    formatDetected = 'DOCX';
    try {
      const docxResult = await mammoth.extractRawText({ buffer: fileBuffer });
      rawText = docxResult.value || '';
    } catch (err) {
      throw new Error(`Failed to parse DOCX document: ${err.message}.`);
    }
  }
  // 3. Plain Text / Markdown / DOC
  else if (['txt', 'text', 'md', 'markdown'].includes(extension) || mimeType?.includes('text')) {
    formatDetected = 'TXT';
    try {
      rawText = fileBuffer.toString('utf-8');
    } catch (err) {
      throw new Error(`Failed to decode text file: ${err.message}.`);
    }
  }
  // 4. Fallback / Unrecognized format
  else {
    // Attempt utf-8 decode
    try {
      rawText = fileBuffer.toString('utf-8');
      formatDetected = extension.toUpperCase();
    } catch (err) {
      throw new Error(`Unsupported document format: .${extension}. Supported formats are PDF, DOCX, and TXT.`);
    }
  }

  // Sanitize extracted text
  const cleanText = rawText.replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim();

  if (!cleanText || cleanText.length < 20) {
    throw new Error('Extracted text from document is too short or blank. If this is a scanned image PDF, please use a searchable text PDF or paste the text.');
  }

  const words = cleanText.split(/\s+/).filter(Boolean);

  return {
    rawText: cleanText,
    formatDetected,
    wordCount: words.length,
    charCount: cleanText.length,
    lineCount: cleanText.split('\n').length
  };
}
