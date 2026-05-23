// Portable video transcode using ffmpeg-static + fluent-ffmpeg
// Input: cv_page_video/0919(1).mp4
// Outputs: public/cv_page_video/cv-intro.mp4 and cv-intro.webm

const fs = require('fs');
const path = require('path');
const ffmpegPath = require('ffmpeg-static');
const ffmpeg = require('fluent-ffmpeg');

if (!ffmpegPath) {
  console.error('ffmpeg-static binary not found');
  process.exit(1);
}

ffmpeg.setFfmpegPath(ffmpegPath);

const input = path.resolve('cv_page_video', '0919(1).mp4');
const outDir = path.resolve('public', 'cv_page_video');
const outMp4 = path.join(outDir, 'cv-intro.mp4');
const outWebm = path.join(outDir, 'cv-intro.webm');

if (!fs.existsSync(input)) {
  console.error('Input file not found:', input);
  process.exit(1);
}
fs.mkdirSync(outDir, { recursive: true });

function transcodeMp4() {
  return new Promise((resolve, reject) => {
    ffmpeg(input)
      .outputOptions([
        '-c:v libx264',
        '-profile:v high',
        '-level 4.1',
        '-pix_fmt yuv420p',
        '-movflags +faststart',
        '-crf 21',
        '-preset medium',
        '-c:a aac',
        '-b:a 128k',
      ])
      .on('start', cmd => console.log('[mp4] ffmpeg start:', cmd))
      .on('progress', p => {
        if (p.percent) process.stdout.write(`\r[mp4] ${p.percent.toFixed(1)}%`);
      })
      .on('error', err => reject(err))
      .on('end', () => { console.log('\n[mp4] done ->', outMp4); resolve(); })
      .save(outMp4);
  });
}

function transcodeWebm() {
  return new Promise((resolve, reject) => {
    ffmpeg(input)
      .outputOptions([
        '-c:v libvpx-vp9',
        '-b:v 0',
        '-crf 35',
        '-pix_fmt yuv420p',
        '-row-mt 1',
        '-c:a libopus',
        '-b:a 96k',
      ])
      .on('start', cmd => console.log('[webm] ffmpeg start:', cmd))
      .on('progress', p => {
        if (p.percent) process.stdout.write(`\r[webm] ${p.percent.toFixed(1)}%`);
      })
      .on('error', err => reject(err))
      .on('end', () => { console.log('\n[webm] done ->', outWebm); resolve(); })
      .save(outWebm);
  });
}

(async () => {
  try {
    await transcodeMp4();
    await transcodeWebm();
    console.log('All transcodes completed.');
    process.exit(0);
  } catch (err) {
    console.error('Transcode failed:', err && err.message ? err.message : err);
    process.exit(2);
  }
})();


