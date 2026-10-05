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
    const htmlRes = await fetchUrl('http://localhost:5173/admin.html');
    console.log('admin.html status:', htmlRes.statusCode);
    console.log('admin.html length:', htmlRes.data.length);
    if (htmlRes.statusCode !== 200) console.log(htmlRes.data);
    
    const jsRes = await fetchUrl('http://localhost:5173/admin.js');
    console.log('admin.js status:', jsRes.statusCode);
    console.log('admin.js length:', jsRes.data.length);
    if (jsRes.statusCode !== 200) console.log(jsRes.data.substring(0, 500));
  } catch(e) {
    console.log('Error fetching:', e.message);
  }
}
main();
