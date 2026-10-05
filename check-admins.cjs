const https = require('https');

const SUPABASE_URL = 'ffwlyelptfpyruowjknt.supabase.co';
const KEY = 'sb_publishable_IZtDTHTofCFF_nPbuz6bsQ_bFWOT2eb';

function httpGet(path) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: SUPABASE_URL,
      path: path,
      method: 'GET',
      headers: {
        'apikey': KEY,
        'Authorization': 'Bearer ' + KEY,
        'Accept': 'application/json'
      }
    };
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, body: data }));
    });
    req.on('error', reject);
    req.end();
  });
}

async function main() {
  const r = await httpGet('/rest/v1/admin_roles?select=*');
  console.log('Status:', r.status);
  console.log('Body:', r.body);
}

main().catch(console.error);
