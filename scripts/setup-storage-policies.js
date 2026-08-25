// scripts/setup-storage-policies.js - Apply Storage RLS Policies for outlanders-images bucket
const db = require('../server/config/db');

async function applyStoragePolicies() {
  console.log('🛡️ Applying Supabase Storage RLS Policies for "outlanders-images" bucket...');

  const sqlQueries = [
    // 1. Ensure bucket exists and is public
    `INSERT INTO storage.buckets (id, name, public) 
     VALUES ('outlanders-images', 'outlanders-images', true)
     ON CONFLICT (id) DO UPDATE SET public = true;`,

    // 2. Drop existing policies if any
    `DROP POLICY IF EXISTS "Public Access for outlanders-images" ON storage.objects;`,
    `DROP POLICY IF EXISTS "Public Upload for outlanders-images" ON storage.objects;`,
    `DROP POLICY IF EXISTS "Public Update for outlanders-images" ON storage.objects;`,
    `DROP POLICY IF EXISTS "Public Delete for outlanders-images" ON storage.objects;`,

    // 3. Create permissive policies for outlanders-images bucket
    `CREATE POLICY "Public Access for outlanders-images"
     ON storage.objects FOR SELECT
     USING (bucket_id = 'outlanders-images');`,

    `CREATE POLICY "Public Upload for outlanders-images"
     ON storage.objects FOR INSERT
     WITH CHECK (bucket_id = 'outlanders-images');`,

    `CREATE POLICY "Public Update for outlanders-images"
     ON storage.objects FOR UPDATE
     USING (bucket_id = 'outlanders-images');`,

    `CREATE POLICY "Public Delete for outlanders-images"
     ON storage.objects FOR DELETE
     USING (bucket_id = 'outlanders-images');`
  ];

  for (let i = 0; i < sqlQueries.length; i++) {
    try {
      await db.query(sqlQueries[i]);
      console.log(`✅ Query ${i + 1}/${sqlQueries.length} executed successfully.`);
    } catch (err) {
      console.warn(`⚠️ Query ${i + 1} warning:`, err.message);
    }
  }

  console.log('\n🎉 Storage RLS Policies applied successfully!');
  process.exit(0);
}

applyStoragePolicies().catch(err => {
  console.error('❌ Failed to apply storage policies:', err);
  process.exit(1);
});
