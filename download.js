const youtubedl = require('youtube-dl-exec');
const path = require('path');
const fs = require('fs');
const sanitize = require('sanitize-filename');
const readline = require('readline');

const downloadsDir = path.join(__dirname, 'downloads');
if (!fs.existsSync(downloadsDir)) fs.mkdirSync(downloadsDir);

async function downloadYouTubeVideo(url) {
  try {
    // Get video info to get title and formats
    const info = await youtubedl(url, {
      dumpSingleJson: true,
      noCheckCertificates: true,
      noWarnings: true,
    });

    const title = sanitize(info.title);
    const outputFile = path.join(downloadsDir, `${title}.mp4`);

    if (fs.existsSync(outputFile)) {
      console.log(`File already exists: ${outputFile}`);
      return;
    }

    // Try 1080p60 format first, fallback to best mp4
    const format1080p60 = 'bestvideo[height=1080][fps=60]+bestaudio/best[height=1080]';
    const fallbackFormat = 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/mp4';

    // We can't detect format availability easily, so try first and fallback if error

    const startTime = Date.now();
    console.log(`Starting download: ${title}`);

    try {
      await youtubedl(url, {
        output: outputFile,
        format: format1080p60,
        mergeOutputFormat: 'mp4',
        noCheckCertificates: true,
        noWarnings: true,
      });
      console.log('Downloaded in 1080p60 quality!');
    } catch (err) {
      console.log('1080p60 not available, downloading best quality mp4 instead...');
      await youtubedl(url, {
        output: outputFile,
        format: fallbackFormat,
        mergeOutputFormat: 'mp4',
        noCheckCertificates: true,
        noWarnings: true,
      });
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`Download finished in ${duration} seconds`);
    console.log(`Saved to: ${outputFile}`);

  } catch (error) {
    console.error('Download failed:', error);
  }
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

rl.question('Enter YouTube video URL: ', (url) => {
  if (!url.trim()) {
    console.log('No URL provided. Exiting.');
    rl.close();
    return;
  }
  downloadYouTubeVideo(url.trim()).then(() => rl.close());
});
