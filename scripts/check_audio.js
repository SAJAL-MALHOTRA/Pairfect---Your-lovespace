const ffmpeg = require('ffmpeg-static');
const { spawnSync } = require('child_process');

const res = spawnSync(ffmpeg, ['-i', 'voiceover.mp3']);
const output = res.stderr.toString() + res.stdout.toString();
const match = output.match(/Duration: (\d+:\d+:\d+\.\d+)/);
console.log('Voiceover duration:', match ? match[1] : 'unknown');
