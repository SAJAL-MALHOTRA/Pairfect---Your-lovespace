const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const testHtml = path.resolve('./scripts/test.html');
const testPdf = path.resolve('./scripts/test.pdf');

fs.writeFileSync(testHtml, `<!DOCTYPE html>
<html>
<head>
  <style>
    @page { size: A4; margin: 20mm; }
    body { font-family: sans-serif; }
    h1 { color: #8E2B45; }
  </style>
</head>
<body>
  <h1>Pairfect Test PDF</h1>
  <p>Testing headless Edge/Chrome PDF engine.</p>
</body>
</html>`);

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const browserPath = fs.existsSync(chromePath) ? chromePath : edgePath;

const cmd = `"${browserPath}" --headless --disable-gpu --run-all-compositor-stages-before-draw --print-to-pdf="${testPdf}" --no-pdf-header-footer "${testHtml}"`;
console.log('Running browser command...');
execSync(cmd);

console.log('PDF generated! Size:', fs.statSync(testPdf).size, 'bytes');

// Clean up test files
fs.unlinkSync(testHtml);
fs.unlinkSync(testPdf);
