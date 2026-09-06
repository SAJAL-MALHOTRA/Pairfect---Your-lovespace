const ffmpeg = require('ffmpeg-static');
const { spawnSync } = require('child_process');
const fs = require('fs');

const rawFiles = fs.readdirSync('temp_video_raw');
const rawFile = 'temp_video_raw/' + rawFiles[0];

const res = spawnSync(ffmpeg, ['-i', rawFile]);
const out = res.stderr.toString() + res.stdout.toString();
const durationMatch = out.match(/Duration: (\d+:\d+:\d+\.\d+)/);
console.log('Raw video file:', rawFile);
console.log('Duration:', durationMatch ? durationMatch[1] : 'unknown');
