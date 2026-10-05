const https = require('https');

const SUPABASE_URL = 'ffwlyelptfpyruowjknt.supabase.co';
const KEY = 'sb_publishable_IZtDTHTofCFF_nPbuz6bsQ_bFWOT2eb';

function httpPost(path, body, headers = {}) {
  return new Promise((resolve, reject) => {
    const bodyStr = body ? JSON.stringify(body) : '';
    const options = {
      hostname: SUPABASE_URL,
      path: path,
      method: body ? 'POST' : 'GET',
      headers: {
        'apikey': KEY,
        'Content-Type': 'application/json',
        ...headers
      }
    };
    if (body) {
      options.headers['Content-Length'] = Buffer.byteLength(bodyStr);
    }
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, body: data }));
    });
    req.on('error', reject);
    if (body) req.write(bodyStr);
    req.end();
  });
}

function httpGet(path, headers = {}) {
  return httpPost(path, null, headers);
}

async function main() {
  // Login
  const loginRes = await httpPost('/auth/v1/token?grant_type=password', {
    email: 'indresh756606@gmail.com',
    password: '123456789'
  });
  
  if (loginRes.status !== 200) {
    console.log('Login failed:', loginRes.body);
    return;
  }
  
  const token = JSON.parse(loginRes.body).access_token;
  console.log('Logged in successfully.');
  
  // Query admin_roles
  const queryRes = await httpGet('/rest/v1/admin_roles?select=*', {
    'Authorization': 'Bearer ' + token
  });
  
  console.log('Admin Roles Query Status:', queryRes.status);
  console.log('Admin Roles Query Body:', queryRes.body);
}

main().catch(console.error);
