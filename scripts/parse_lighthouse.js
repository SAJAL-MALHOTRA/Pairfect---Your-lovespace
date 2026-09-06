const fs = require('fs');
const r = JSON.parse(fs.readFileSync('./lighthouse_report.json'));

const score = Math.round(r.categories.performance.score * 100);
const audits = r.audits;

console.log('=== LIGHTHOUSE PERFORMANCE BASELINE ===');
console.log('Performance Score:', score);
console.log('FCP (First Contentful Paint):', audits['first-contentful-paint']?.displayValue);
console.log('LCP (Largest Contentful Paint):', audits['largest-contentful-paint']?.displayValue);
console.log('TBT (Total Blocking Time):', audits['total-blocking-time']?.displayValue);
console.log('CLS (Cumulative Layout Shift):', audits['cumulative-layout-shift']?.displayValue);
console.log('Speed Index:', audits['speed-index']?.displayValue);
if (audits['interactive']) console.log('TTI (Time to Interactive):', audits['interactive']?.displayValue);
if (audits['server-response-time']) console.log('TTFB (Time to First Byte):', audits['server-response-time']?.displayValue);

console.log('\n=== NETWORK / PAYLOAD STATS ===');
if (audits['total-byte-weight']) {
  console.log('Total Transferred Bytes:', audits['total-byte-weight']?.displayValue);
  console.log('Top items in payload:');
  const items = audits['total-byte-weight']?.details?.items || [];
  items.slice(0, 10).forEach(item => {
    const name = item.url.split('/').pop() || item.url;
    console.log(`- ${name.slice(0, 50)}: ${(item.totalBytes / 1024).toFixed(1)} KB`);
  });
}
if (audits['network-requests']) {
  console.log('Total Network Requests:', audits['network-requests']?.details?.items?.length || 'unknown');
}

console.log('\n=== KEY AUDIT OPPORTUNITIES ===');
[
  'render-blocking-resources',
  'unused-javascript',
  'unused-css-rules',
  'uses-responsive-images',
  'offscreen-images',
  'unminified-javascript',
  'unminified-css',
  'modern-image-formats',
  'uses-optimized-images',
  'dom-size'
].forEach(k => {
  if (audits[k] && audits[k].score !== 1 && audits[k].score !== null) {
    console.log(`[${k}] Score: ${audits[k].score} | ${audits[k].displayValue || ''}`);
  }
});
