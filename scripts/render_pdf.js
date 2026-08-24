const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const htmlPath = path.resolve('./PROJECT_COMPLETE_LEARNING_GUIDE.html');
const pdfPath = path.resolve('./PROJECT_COMPLETE_LEARNING_GUIDE.pdf');
const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const browser = fs.existsSync(chromePath) ? chromePath : edgePath;

const cmd = '"' + browser + '" --headless --disable-gpu --run-all-compositor-stages-before-draw --print-to-pdf="' + pdfPath + '" --no-pdf-header-footer "' + htmlPath + '"';
console.log('Executing command...');
execSync(cmd);

const stats = fs.statSync(pdfPath);
console.log('PDF rendered successfully! File size: ' + stats.size + ' bytes (' + (stats.size / 1024).toFixed(1) + ' KB)');
