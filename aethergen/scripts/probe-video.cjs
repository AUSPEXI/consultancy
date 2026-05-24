const path = require('path');
const ffprobe = require('ffprobe-static');
const ffmpeg = require('fluent-ffmpeg');

if (!ffprobe || !ffprobe.path) {
  console.error('ffprobe-static not available');
  process.exit(1);
}

ffmpeg.setFfprobePath(ffprobe.path);

const files = [
  path.resolve('cv_page_video', '0919(1).mp4'),
  path.resolve('public', 'cv_page_video', 'cv-intro.mp4'),
  path.resolve('public', 'cv_page_video', 'cv-intro.webm'),
];

function probe(file) {
  return new Promise((resolve) => {
    ffmpeg.ffprobe(file, (err, data) => {
      if (err) {
        resolve({ file, error: err.message });
        return;
      }
      const format = data && data.format ? data.format : {};
      const duration = format.duration || 0;
      const streams = (data && data.streams) || [];
      const v = streams.find(s => s.codec_type === 'video');
      const a = streams.find(s => s.codec_type === 'audio');
      resolve({
        file,
        duration,
        video: v ? { codec: v.codec_name, width: v.width, height: v.height, r_frame_rate: v.r_frame_rate } : null,
        audio: a ? { codec: a.codec_name, channels: a.channels, sample_rate: a.sample_rate } : null,
      });
    });
  });
}

(async () => {
  const results = [];
  for (const f of files) {
    results.push(await probe(f));
  }
  for (const r of results) {
    if (r.error) {
      console.log(r.file, '-> ERROR:', r.error);
    } else {
      console.log(r.file);
      console.log('  duration (s):', r.duration);
      console.log('  video:', r.video);
      console.log('  audio:', r.audio);
    }
  }
})();


