const ffmpeg = require('ffmpeg-static');
const { spawnSync } = require('child_process');
const fs = require('fs');

fs.mkdirSync('temp_frames', { recursive: true });
const rawFiles = fs.readdirSync('temp_video_raw');
const rawFile = 'temp_video_raw/' + rawFiles[0];

// Extract 1 frame every 8 seconds
spawnSync(ffmpeg, [
  '-y',
  '-i', rawFile,
  '-vf', 'fps=1/8',
  'temp_frames/frame_%02d.jpg'
]);

console.log('Extracted frames:', fs.readdirSync('temp_frames'));
