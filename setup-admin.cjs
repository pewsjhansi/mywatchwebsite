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
        'Authorization': 'Bearer ' + KEY,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
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
  const r = await httpPost('/rest/v1/admin_roles', {
    user_id: 'a5958a06-c8d3-407a-9b76-1f9670635a92',
    role: 'admin'
  });
  console.log('Status:', r.status);
  console.log('Body:', r.body);
}

main().catch(console.error);
