const ffmpeg = require('ffmpeg-static');
const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const rawFiles = fs.readdirSync('temp_video_raw');
const rawFile = path.resolve('temp_video_raw', rawFiles[0]);
const audioFile = path.resolve('temp_audio', 'cinematic_audio.aac');

const desktopDir = 'C:\\Users\\2006s\\Desktop';
const desktopOutput = path.join(desktopDir, 'pairfect_cinematic_launch_video.mp4');
const publicOutput = path.resolve('public', 'pairfect_launch_video.mp4');

console.log('Input video:', rawFile);
console.log('Input audio:', audioFile);

// Target duration: 57.5 seconds
// Speed factor: 57.5 / 99.96 = 0.5752
const speedFactor = 0.5752;

const filterComplex = [
  `[0:v]setpts=${speedFactor}*PTS,eq=contrast=1.04:brightness=0.01:saturation=1.05,fade=t=in:st=0:d=1.0,fade=t=out:st=55.0:d=2.5[v]`,
  `[1:a]afade=t=in:st=0:d=0.5,afade=t=out:st=54.5:d=3.0[a]`
].join(';');

console.log('Assembling final cinematic launch video with H.264 / AAC...');

const args = [
  '-y',
  '-i', rawFile,
  '-i', audioFile,
  '-filter_complex', filterComplex,
  '-map', '[v]',
  '-map', '[a]',
  '-c:v', 'libx264',
  '-preset', 'slow',
  '-crf', '18',
  '-pix_fmt', 'yuv420p',
  '-c:a', 'aac',
  '-b:a', '192k',
  '-t', '57.5',
  desktopOutput
];

const res = spawnSync(ffmpeg, args, { stdio: 'inherit' });

if (res.status === 0) {
  console.log('Launch video successfully created on Desktop:', desktopOutput);
  // Copy to public folder as well
  fs.copyFileSync(desktopOutput, publicOutput);
  console.log('Also mirrored to public folder:', publicOutput);
} else {
  console.error('Assembly failed with code:', res.status);
  process.exit(1);
}
