const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://ffwlyelptfpyruowjknt.supabase.co';
const KEY = 'sb_publishable_IZtDTHTofCFF_nPbuz6bsQ_bFWOT2eb';
const supabase = createClient(SUPABASE_URL, KEY);

async function main() {
  console.log('Logging in...');
  const { data: authData, error: authErr } = await supabase.auth.signInWithPassword({
    email: 'indresh756606@gmail.com',
    password: '123456789'
  });

  if (authErr) {
    console.log('Login error:', authErr.message);
    return;
  }

  const adminUser = authData.session.user;
  console.log('Logged in as:', adminUser.id);

  console.log('Checking admin role...');
  const { data: roleRow, error: roleErr } = await supabase
    .from('admin_roles')
    .select('role')
    .eq('user_id', adminUser.id)
    .single();

  console.log('Role row:', roleRow);
  console.log('Role err:', roleErr);

  if (!roleRow || roleRow.role !== 'admin') {
    console.log('User is not admin. showAuthError() would be called.');
  } else {
    console.log('User IS admin.');
  }
}

main();
