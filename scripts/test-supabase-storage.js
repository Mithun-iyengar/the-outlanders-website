// scripts/test-supabase-storage.js - Test Supabase Storage Upload & Public URL Generation
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://qcwnzaeydvosuiclddqr.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY || process.env.SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_OgXymBA4gWFDUOuykSgvCA_6SRbPjSL';
const BUCKET_NAME = process.env.SUPABASE_BUCKET || 'outlanders-images';

async function testSupabaseStorage() {
  console.log('📦 Testing Supabase Storage Bucket Connection...');
  console.log(`- URL: ${SUPABASE_URL}`);
  console.log(`- Bucket: ${BUCKET_NAME}`);
  console.log(`- Key type: ${SUPABASE_KEY.startsWith('sb_publishable') ? 'Publishable Key' : 'Secret / Service Key'}\n`);

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

  // 1. Test listing buckets
  try {
    const { data: buckets, error: bError } = await supabase.storage.listBuckets();
    if (bError) {
      console.warn('⚠️ listBuckets warning:', bError.message);
    } else {
      console.log('✅ Buckets found in Supabase:', buckets.map(b => `${b.name} (${b.public ? 'Public' : 'Private'})`).join(', '));
    }
  } catch (e) {
    console.warn('⚠️ listBuckets exception:', e.message);
  }

  // 2. Test uploading a test file
  const testBuffer = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64');
  const filename = `test-storage-${Date.now()}.png`;

  console.log(`\n📤 Attempting upload of "${filename}" to bucket "${BUCKET_NAME}"...`);

  const { data: uploadData, error: uploadError } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(filename, testBuffer, {
      contentType: 'image/png',
      upsert: true
    });

  if (uploadError) {
    console.error('❌ Supabase Storage Upload Failed:', uploadError.message);
    console.error('   Details:', uploadError);
    return;
  }

  console.log('✅ Upload Successful! Key:', uploadData.path);

  // 3. Get Public URL
  const { data: publicData } = supabase.storage
    .from(BUCKET_NAME)
    .getPublicUrl(filename);

  console.log('✅ Generated Public URL:');
  console.log(`👉 ${publicData.publicUrl}`);

  if (publicData.publicUrl.startsWith(`https://qcwnzaeydvosuiclddqr.supabase.co/storage/v1/object/public/${BUCKET_NAME}/`)) {
    console.log('\n🎉 URL format matches required Supabase public storage format perfectly!');
  } else {
    console.warn('\n⚠️ Public URL format differs:', publicData.publicUrl);
  }

  // 4. Test downloading/fetching the uploaded public URL via HTTP
  const http = require('https');
  const reqOptions = { rejectUnauthorized: false };
  http.get(publicData.publicUrl, reqOptions, (res) => {
    console.log(`\n📡 HTTP GET Test on Public URL: Status ${res.statusCode} ${res.statusMessage}`);
    if (res.statusCode === 200) {
      console.log('✅ Public URL is publicly accessible over HTTP without authentication headers!');
    } else {
      console.warn('⚠️ Public URL returned non-200 status! Check if bucket is marked Public in Supabase dashboard.');
    }
  });
}

testSupabaseStorage();
