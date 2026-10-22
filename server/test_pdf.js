import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { PDFParse } = require('pdf-parse');

const sampleUnicodePdf = Buffer.from(
`%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>
endobj
4 0 obj
<< /Length 72 >>
stream
BT
/F1 12 Tf
72 712 Td
(Software Engineer - Resume: C++, Python, AI/ML, React.js) Tj
ET
endstream
endobj
5 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
endobj
xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000244 00000 n 
0000000364 00000 n 
trailer
<< /Size 6 /Root 1 0 R >>
startxref
449
%%EOF`
);

import { parseDocument } from './services/documentParser.js';

async function test() {
  console.log('1. Testing raw PDFParse:');
  const parser = new PDFParse({ data: sampleUnicodePdf });
  const result = await parser.getText();
  console.log('Unicode result:', result.text);
  await parser.destroy();

  console.log('\n2. Testing parseDocument service function:');
  const parsed = await parseDocument(sampleUnicodePdf, 'resume.pdf', 'application/pdf');
  console.log('✓ parseDocument format:', parsed.formatDetected);
  console.log('✓ parseDocument word count:', parsed.wordCount);
  console.log('✓ parseDocument clean text:', parsed.rawText);

  console.log('\n3. Testing live HTTP /api/resume/upload endpoint:');
  const blob = new Blob([sampleUnicodePdf], { type: 'application/pdf' });
  const formData = new FormData();
  formData.append('resume', blob, 'Candidate_Resume.pdf');
  formData.append('targetRole', 'Java Developer');

  const res = await fetch('http://localhost:5000/api/resume/upload', {
    method: 'POST',
    body: formData
  });

  const data = await res.json();
  console.log('✓ HTTP Status:', res.status);
  console.log('✓ Upload Success:', data.success);
  if (data.fileInfo) {
    console.log('✓ File Info:', data.fileInfo);
  }
}
test().catch(console.error);
