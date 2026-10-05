const https = require('https');

const SUPABASE_URL = 'ffwlyelptfpyruowjknt.supabase.co';
const KEY = 'sb_publishable_IZtDTHTofCFF_nPbuz6bsQ_bFWOT2eb';

function httpPost(path, body) {
  return new Promise((resolve, reject) => {
    const bodyStr = JSON.stringify(body);
    const options = {
      hostname: SUPABASE_URL,
      path: path,
      method: 'POST',
      headers: {
        'apikey': KEY,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(bodyStr)
      }
    };
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, body: data }));
    });
    req.on('error', reject);
    req.write(bodyStr);
    req.end();
  });
}

async function main() {
  const res = await httpPost('/auth/v1/token?grant_type=password', {
    email: 'indresh756606@gmail.com',
    password: '123456789'
  });
  
  if (res.status === 200) {
    const data = JSON.parse(res.body);
    console.log('UUID:', data.user.id);
  } else {
    console.log('Error logging in:', res.body);
  }
}

main().catch(console.error);
