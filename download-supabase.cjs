const https = require('https');
const fs = require('fs');

const url = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
const dest = 'supabase.js';

function downloadFile(url, dest, retries = 3) {
  console.log(`Downloading supabase.js... (Retries left: ${retries})`);
  return new Promise((resolve, reject) => {
    https.get(url, (response) => {
      if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
        // Handle redirect
        return downloadFile(response.headers.location, dest, retries).then(resolve).catch(reject);
      }
      
      if (response.statusCode !== 200) {
        return reject(new Error(`Failed to get '${url}' (${response.statusCode})`));
      }

      const file = fs.createWriteStream(dest);
      response.pipe(file);
      file.on('finish', () => {
        file.close();
        console.log('Download complete.');
        resolve();
      });
    }).on('error', (err) => {
      fs.unlink(dest, () => {});
      if (retries > 0) {
        console.log('Download failed, retrying...');
        setTimeout(() => downloadFile(url, dest, retries - 1).then(resolve).catch(reject), 2000);
      } else {
        reject(err);
      }
    });
  });
}

downloadFile(url, dest).catch(err => {
  console.error('Final failure:', err.message);
  process.exit(1);
});
