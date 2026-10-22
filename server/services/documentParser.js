import { extractText as unpdfExtractText } from 'unpdf';
import { createRequire } from 'module';
import mammoth from 'mammoth';

if (typeof globalThis.DOMMatrix === 'undefined') {
  globalThis.DOMMatrix = class DOMMatrix {
    constructor() {
      this.a = 1; this.b = 0; this.c = 0; this.d = 1; this.e = 0; this.f = 0;
    }
  };
}

const require = createRequire(import.meta.url);
let pdfModule = null;
try {
  pdfModule = require('pdf-parse');
} catch (e) {
  // Deferred / optional
}

/**
 * Universal PDF Text Extractor
 * Primary: unpdf (pure-JS, zero-native, 100% serverless/Vercel compatible)
 * Fallback 1: pdf-parse v1 (callable function)
 * Fallback 2: pdf-parse v2 (PDFParse class)
 * Fallback 3: Raw PDF text stream scanner
 */
async function extractPdfText(fileBuffer) {
  let extractedText = '';

  // 1. Primary: unpdf (works reliably in modern Node & Vercel serverless)
  try {
    const uint8 = new Uint8Array(fileBuffer.buffer, fileBuffer.byteOffset, fileBuffer.byteLength);
    const unpdfResult = await unpdfExtractText(uint8, { mergePages: true });
    if (unpdfResult) {
      if (typeof unpdfResult.text === 'string' && unpdfResult.text.trim()) {
        extractedText = unpdfResult.text.trim();
      } else if (Array.isArray(unpdfResult.text) && unpdfResult.text.length > 0) {
        extractedText = unpdfResult.text.join('\n\n').trim();
      }
    }
  } catch (unpdfErr) {
    console.warn('[DocumentParser] unpdf primary extraction failed:', unpdfErr.message);
  }

  // 2. Secondary fallback: pdf-parse v1 (callable function)
  if (!extractedText && typeof pdfModule === 'function') {
    try {
      const pdfData = await pdfModule(fileBuffer);
      if (pdfData && typeof pdfData.text === 'string' && pdfData.text.trim()) {
        extractedText = pdfData.text.trim();
      }
    } catch (fnErr) {
      console.warn('[DocumentParser] pdf-parse v1 fallback failed:', fnErr.message);
    }
  }

  // 3. Tertiary fallback: pdf-parse v2 (class PDFParse)
  const PDFParseClass = pdfModule?.PDFParse || (pdfModule && typeof pdfModule === 'function' && pdfModule.prototype?.getText ? pdfModule : null);
  if (!extractedText && PDFParseClass) {
    let parser = null;
    try {
      parser = new PDFParseClass({ data: fileBuffer });
      const result = await parser.getText();
      if (result && typeof result.text === 'string' && result.text.trim()) {
        extractedText = result.text.trim();
      }
    } catch (classErr) {
      console.warn('[DocumentParser] PDFParse class fallback failed:', classErr.message);
    } finally {
      if (parser && typeof parser.destroy === 'function') {
        try { await parser.destroy(); } catch (e) {}
      }
    }
  }

  // 4. Quaternary fallback: direct text stream scanner for uncompressed PDF text
  if (!extractedText) {
    try {
      const bufferStr = fileBuffer.toString('binary');
      const textPieces = [];
      const tjRegex = /\(([^)\\]*(?:\\.[^)\\]*)*)\)\s*Tj/g;
      let tjMatch;
      while ((tjMatch = tjRegex.exec(bufferStr)) !== null) {
        const raw = tjMatch[1].replace(/\\([()\\])/g, '$1');
        if (raw.trim()) textPieces.push(raw);
      }
      if (textPieces.length >= 3) {
        extractedText = textPieces.join(' ');
      }
    } catch (fallbackErr) {}
  }

  if (!extractedText || !extractedText.trim()) {
    throw new Error('Unable to extract text from PDF document. Please ensure the file contains selectable text and is not an image scan, or use the "Paste Text" tab to paste your resume content directly.');
  }

  return extractedText;
}

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
      rawText = await extractPdfText(fileBuffer);
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
