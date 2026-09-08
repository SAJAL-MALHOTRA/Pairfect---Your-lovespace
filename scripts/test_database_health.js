const { createClient } = require('@supabase/supabase-js');

const fs = require('fs');
const path = require('path');

try {
  const envPath = path.resolve(__dirname, '../.env.local');
  const envContent = fs.readFileSync(envPath, 'utf-8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
      const [k, ...rest] = trimmed.split('=');
      process.env[k.trim()] = rest.join('=').trim();
    }
  }
} catch {}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://vhykmhfrptyjkagwetku.supabase.co';
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const admin = createClient(url, serviceKey);
const anon = createClient(url, anonKey);

const TABLES_TO_CHECK = [
  'users',
  'pairs',
  'love_letters',
  'shared_moments',
  'gratitude_entries',
  'mixtapes',
  'mood_logs',
  'notifications',
  'disputes',
  'stories',
  'saved_stories',
  'story_reactions',
  'story_responses',
  'riddles',
  'riddle_guesses',
  'iq_duel_questions',
  'iq_duel_matches',
  'beta_waitlist'
];

async function runHealthCheck() {
  console.log('════════════════════════════════════════════════════════════════');
  console.log('         PAIRFECT DATABASE & TABLES FULL HEALTH AUDIT           ');
  console.log('════════════════════════════════════════════════════════════════\n');

  let passedTables = 0;
  let failedTables = 0;

  console.log('1. INSPECTING ALL SUPABASE TABLES:');
  console.log('----------------------------------------------------------------');

  for (const table of TABLES_TO_CHECK) {
    try {
      const { count, error } = await admin
        .from(table)
        .select('*', { count: 'exact', head: true });

      if (error) {
        console.log(`❌ [TABLE] ${table.padEnd(20)} ERROR: ${error.message} (${error.code})`);
        failedTables++;
      } else {
        console.log(`✅ [TABLE] ${table.padEnd(20)} OK (Total rows: ${count ?? 0})`);
        passedTables++;
      }
    } catch (e) {
      console.log(`❌ [TABLE] ${table.padEnd(20)} EXCEPTION: ${e.message}`);
      failedTables++;
    }
  }

  console.log(`\nTable Check Summary: ${passedTables}/${TABLES_TO_CHECK.length} operational.`);

  // 2. CHECK RPC FUNCTIONS
  console.log('\n2. INSPECTING STORED PROCEDURES / RPC FUNCTIONS:');
  console.log('----------------------------------------------------------------');

  // Test get_on_this_day
  try {
    const { data: rpcRes, error: rpcErr } = await admin.rpc('get_on_this_day', {
      p_pair_id: 'df8a08cb-0114-49fa-8085-b8e8f9b930eb',
      p_user_id: '1ae10371-c26e-4c49-bb65-98872b5b992c'
    });
    if (rpcErr) {
      console.log('⚠️ [RPC] get_on_this_day: ' + rpcErr.message);
    } else {
      console.log('✅ [RPC] get_on_this_day: OK (Result count: ' + (rpcRes ? rpcRes.length : 0) + ')');
    }
  } catch (e) {
    console.log('❌ [RPC] get_on_this_day failed: ' + e.message);
  }

  // Test record_pair_activity
  try {
    const { error: streakErr } = await admin.rpc('record_pair_activity', {
      p_pair_id: 'df8a08cb-0114-49fa-8085-b8e8f9b930eb'
    });
    if (streakErr) {
      console.log('⚠️ [RPC] record_pair_activity: ' + streakErr.message);
    } else {
      console.log('✅ [RPC] record_pair_activity: OK');
    }
  } catch (e) {
    console.log('❌ [RPC] record_pair_activity failed: ' + e.message);
  }

  // 3. TEST WRITE & DELETE CAPABILITY (CRUD Integrity)
  console.log('\n3. TESTING WRITE & CLEANUP INTEGRITY:');
  console.log('----------------------------------------------------------------');
  try {
    const testRow = {
      pair_id: 'df8a08cb-0114-49fa-8085-b8e8f9b930eb',
      user_id: '1ae10371-c26e-4c49-bb65-98872b5b992c',
      content: 'Health check probe test entry ' + Date.now()
    };

    const { data: inserted, error: insertErr } = await admin
      .from('gratitude_entries')
      .insert(testRow)
      .select('id')
      .single();

    if (insertErr) {
      console.log('❌ Write test failed:', insertErr.message);
    } else {
      console.log('✅ Write test passed! Created temporary row ID:', inserted.id);

      // Clean up
      const { error: delErr } = await admin
        .from('gratitude_entries')
        .delete()
        .eq('id', inserted.id);

      if (delErr) {
        console.log('⚠️ Cleanup warning:', delErr.message);
      } else {
        console.log('✅ Cleanup test passed! Temporary row removed cleanly.');
      }
    }
  } catch (e) {
    console.log('❌ CRUD exception:', e.message);
  }

  // 4. ACTIVE COUPLE SANCTUARY STATUS
  console.log('\n4. ACTIVE COUPLE SANCTUARY INTEGRITY (Sajal & Partner):');
  console.log('----------------------------------------------------------------');
  const { data: pairData, error: pairErr } = await admin
    .from('pairs')
    .select('*, user_a:users!user_a_id(display_name, email), user_b:users!user_b_id(display_name, email)')
    .eq('id', 'df8a08cb-0114-49fa-8085-b8e8f9b930eb')
    .single();

  if (pairErr) {
    console.log('❌ Pair status query error:', pairErr.message);
  } else {
    console.log('✅ Pair ID:', pairData.id);
    console.log('✅ Status:', pairData.status);
    console.log('✅ Partner A:', pairData.user_a?.display_name || 'User A');
    console.log('✅ Partner B:', pairData.user_b?.display_name || 'User B');
    console.log('✅ Streak:', pairData.current_streak, 'days');
    console.log('✅ Started Dating Date:', pairData.started_dating_date);
  }

  console.log('\n════════════════════════════════════════════════════════════════');
  console.log('                      AUDIT COMPLETE                            ');
  console.log('════════════════════════════════════════════════════════════════');
}

runHealthCheck();
