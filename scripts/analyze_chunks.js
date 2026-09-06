const fs = require('fs');
const path = require('path');

function getFiles(dir, files = []) {
  if (!fs.existsSync(dir)) return files;
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      getFiles(filePath, files);
    } else {
      files.push({
        path: filePath,
        name: file,
        sizeKB: (fs.statSync(filePath).size / 1024).toFixed(1),
        bytes: fs.statSync(filePath).size
      });
    }
  }
  return files;
}

const chunks = getFiles('.next/static/chunks');
chunks.sort((a, b) => b.bytes - a.bytes);

console.log('Top 25 largest JS chunks:');
chunks.slice(0, 25).forEach(c => {
  console.log(`${c.sizeKB} KB - ${c.name} (${c.path})`);
});

const totalJSBytes = chunks.reduce((acc, c) => acc + c.bytes, 0);
console.log(`\nTotal JS Chunks Size: ${(totalJSBytes / 1024 / 1024).toFixed(2)} MB across ${chunks.length} files`);
