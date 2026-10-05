const http = require('http');

function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ statusCode: res.statusCode, data }));
    }).on('error', reject);
  });
}

async function main() {
  try {
    const jsRes = await fetchUrl('http://localhost:5173/admin.js');
    console.log(jsRes.data.substring(0, 1000));
  } catch(e) {
    console.log('Error fetching:', e.message);
  }
}
main();
