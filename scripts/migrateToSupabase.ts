/**
 * Migration script to upload data from local JSON files and images to Supabase
 *
 * Prerequisites:
 * 1. Set up your .env file with REACT_APP_SUPABASE_URL and REACT_APP_SUPABASE_ANON_KEY
 * 2. Create the following tables in Supabase:
 *    - products (id, name, price, gender, url, images jsonb, created_at)
 *    - user_media (id, user_id, url, type, thumbnail, created_at)
 * 3. Create a storage bucket named 'user-images'
 * 4. Set up RLS policies as needed
 *
 * Usage:
 *   npx ts-node scripts/migrateToSupabase.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || '';
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Error: Missing Supabase credentials in .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

interface MediaItem {
  id: number;
  type: 'image' | 'video';
  url: string;
  thumbnail?: string;
  name?: string;
  price?: string;
  gender?: string;
  images?: {
    [key: string]: string | undefined;
  };
}

/**
 * Step 1: Create a demo user in Supabase Auth
 * Note: This requires admin privileges. You may need to create the user manually
 * through the Supabase dashboard if this fails.
 */
/* Commented out - user already created manually
async function createDemoUser(): Promise<string> {
  console.log('\n📝 Creating demo user...');

  // Try to sign up a demo user
  const demoEmail = 'demo@aura.app';
  const demoPassword = 'demo123456'; // Change this to a secure password

  const { data, error } = await supabase.auth.signUp({
    email: demoEmail,
    password: demoPassword,
  });

  if (error) {
    console.error('Error creating demo user:', error.message);
    console.log('Please create a demo user manually in Supabase dashboard');
    console.log('Then update this script with the user ID');
    process.exit(1);
  }

  if (!data.user) {
    console.error('Failed to create demo user');
    process.exit(1);
  }

  console.log(`✅ Demo user created with ID: ${data.user.id}`);
  console.log(`   Email: ${demoEmail}`);
  console.log(`   Password: ${demoPassword}`);

  return data.user.id;
}
*/

/**
 * Step 2: Migrate A&F products to Supabase
 */
/* Already migrated - commented out
async function migrateProducts() {
  console.log('\n📦 Migrating A&F products...');

  const mediaPath = path.join(__dirname, '../public/media.json');
  const mediaData: MediaItem[] = JSON.parse(fs.readFileSync(mediaPath, 'utf-8'));

  console.log(`Found ${mediaData.length} products to migrate`);

  let successCount = 0;
  let errorCount = 0;

  for (const item of mediaData) {
    const { error } = await supabase
      .from('products')
      .insert({
        id: item.id,
        name: item.name,
        price: item.price,
        gender: item.gender,
        url: item.url,
        images: item.images || {},
      });

    if (error) {
      console.error(`❌ Error inserting product ${item.id}:`, error.message);
      errorCount++;
    } else {
      successCount++;
      if (successCount % 10 === 0) {
        console.log(`   Progress: ${successCount}/${mediaData.length}`);
      }
    }
  }

  console.log(`✅ Products migration complete: ${successCount} successful, ${errorCount} errors`);
}
*/

/**
 * Step 3: Upload user images to Supabase Storage
 */
async function uploadUserImages(userId: string): Promise<Map<string, string>> {
  console.log('\n📸 Uploading user images...');

  const imagesDir = path.join(__dirname, '../public/images/user_images');
  const files = fs.readdirSync(imagesDir).filter(f => f.endsWith('.jpg'));

  console.log(`Found ${files.length} images to upload`);

  const urlMap = new Map<string, string>(); // Maps old URL to new Supabase URL
  let successCount = 0;
  let errorCount = 0;

  for (const filename of files) {
    const filePath = path.join(imagesDir, filename);
    const fileBuffer = fs.readFileSync(filePath);
    const storagePath = `${userId}/${filename}`;

    // Upload to Supabase Storage
    const { error } = await supabase.storage
      .from('user-images')
      .upload(storagePath, fileBuffer, {
        contentType: 'image/jpeg',
        upsert: true,
      });

    if (error) {
      console.error(`❌ Error uploading ${filename}:`, error.message);
      errorCount++;
      continue;
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('user-images')
      .getPublicUrl(storagePath);

    const oldUrl = `/aura/images/user_images/${filename}`;
    urlMap.set(oldUrl, urlData.publicUrl);

    successCount++;
    if (successCount % 5 === 0) {
      console.log(`   Progress: ${successCount}/${files.length}`);
    }
  }

  console.log(`✅ Image upload complete: ${successCount} successful, ${errorCount} errors`);

  return urlMap;
}

/**
 * Step 4: Migrate user media metadata
 */
async function migrateUserMedia(userId: string, urlMap: Map<string, string>) {
  console.log('\n📝 Migrating user media metadata...');

  const userMediaPath = path.join(__dirname, '../public/user_media.json');
  const userMediaData: MediaItem[] = JSON.parse(fs.readFileSync(userMediaPath, 'utf-8'));

  console.log(`Found ${userMediaData.length} user media items to migrate`);

  let successCount = 0;
  let errorCount = 0;

  for (const item of userMediaData) {
    // Map old URL to new Supabase URL
    const newUrl = urlMap.get(item.url) || item.url;

    const { error } = await supabase
      .from('user_media')
      .insert({
        user_id: userId,
        url: newUrl,
        type: item.type,
        thumbnail: item.thumbnail,
      });

    if (error) {
      console.error(`❌ Error inserting user media ${item.id}:`, error.message);
      errorCount++;
    } else {
      successCount++;
    }
  }

  console.log(`✅ User media migration complete: ${successCount} successful, ${errorCount} errors`);
}

/**
 * Main migration function
 */
async function main() {
  console.log('🚀 Starting Supabase migration...');
  console.log(`   Supabase URL: ${supabaseUrl}`);

  try {
    // Step 1: Using existing demo user
    const userId = '0d3667cf-df5a-4a5d-a837-efadd140b2ae';
    console.log(`\n✅ Using demo user ID: ${userId}`);

    // Step 2: Migrate products
    // await migrateProducts();

    // Step 3: Upload images
    const urlMap = await uploadUserImages(userId);

    // Step 4: Migrate user media
    await migrateUserMedia(userId, urlMap);

    console.log('\n✅ Migration complete!');
    console.log('   Next steps:');
    console.log('   1. Verify data in Supabase dashboard');
    console.log('   2. Set REACT_APP_USE_SUPABASE=true in .env');
    console.log('   3. Test the application');

  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run the migration
main();
