# Supabase Setup Guide

This guide walks you through setting up Supabase for the Aura application.

## Prerequisites

- A Supabase account ([sign up here](https://supabase.com))
- Node.js installed
- The Aura project cloned locally

## Step 1: Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign in
2. Click "New Project"
3. Fill in the project details:
   - **Name**: Aura (or your preferred name)
   - **Database Password**: Choose a strong password (save this!)
   - **Region**: Select the region closest to your users
4. Click "Create new project" and wait for setup to complete (~2 minutes)

## Step 2: Get Your API Credentials

1. In your Supabase project dashboard, go to **Settings** (gear icon) > **API**
2. Copy the following values:
   - **Project URL** (under "Project URL")
   - **anon public** key (under "Project API keys")

## Step 3: Configure Environment Variables

1. In your Aura project, copy the `.env.example` file:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` and add your Supabase credentials:
   ```bash
   REACT_APP_SUPABASE_URL=https://your-project-id.supabase.co
   REACT_APP_SUPABASE_ANON_KEY=your-anon-key-here
   ```

## Step 4: Set Up Database Tables

1. In Supabase dashboard, go to **SQL Editor** (left sidebar)
2. Click "New Query"
3. Copy the contents of `scripts/supabase-schema.sql` and paste it
4. Click "Run" to execute the SQL
5. Verify tables were created by going to **Table Editor**

You should see three tables:
- `users`
- `products`
- `user_media`

## Step 5: Create Storage Bucket

1. In Supabase dashboard, go to **Storage** (left sidebar)
2. Click "Create a new bucket"
3. Configure the bucket:
   - **Name**: `user-images`
   - **Public bucket**: Check this box (for public image access)
4. Click "Create bucket"

### Set Up Storage Policies

1. Click on the `user-images` bucket
2. Go to **Policies** tab
3. Click "New Policy"
4. For each policy below, click "Create policy from scratch":

**Policy 1: Upload Policy**
```sql
CREATE POLICY "Users can upload to own folder"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'user-images' AND
  auth.uid()::text = (storage.foldername(name))[1]
);
```

**Policy 2: Read Policy**
```sql
CREATE POLICY "Users can read own images"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'user-images' AND
  auth.uid()::text = (storage.foldername(name))[1]
);
```

**Policy 3: Delete Policy**
```sql
CREATE POLICY "Users can delete own images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'user-images' AND
  auth.uid()::text = (storage.foldername(name))[1]
);
```

## Step 6: Configure OAuth Providers

### Google OAuth

1. Go to **Authentication** > **Providers** in Supabase
2. Find "Google" and click "Enable"
3. You'll need to create OAuth credentials in Google Cloud Console:
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select existing
   - Enable Google+ API
   - Go to "Credentials" > "Create Credentials" > "OAuth client ID"
   - Application type: "Web application"
   - Add authorized redirect URIs:
     - `https://your-project-id.supabase.co/auth/v1/callback`
     - `http://localhost:3000` (for local development)
   - Copy Client ID and Client Secret
4. Back in Supabase, paste the Client ID and Client Secret
5. Click "Save"

## Step 7: Create a Demo User

For the migration script to work, you need a demo user:

1. Go to **Authentication** > **Users** in Supabase
2. Click "Add user" > "Create new user"
3. Fill in:
   - **Email**: `demo@aura.app` (or any email)
   - **Password**: Create a strong password
   - **Auto Confirm User**: Check this box
4. Click "Create user"
5. **Copy the User ID** (you'll need this for migration)

## Step 8: Run the Migration Script

1. Open `scripts/migrateToSupabase.ts`
2. Find the line with `const userId = 'YOUR_DEMO_USER_ID';`
3. Replace `YOUR_DEMO_USER_ID` with the actual user ID from Step 7
4. Run the migration:
   ```bash
   npx ts-node scripts/migrateToSupabase.ts
   ```

The script will:
- Upload all A&F products from `media.json` → `products` table
- Upload 41 user images from `public/images/user_images/` → Supabase Storage
- Create metadata records in `user_media` table

## Step 9: Enable Supabase in Your App

1. Edit `.env` and change:
   ```bash
   REACT_APP_USE_SUPABASE=true
   ```

2. Restart your development server:
   ```bash
   npm start
   ```

## Step 10: Test the Integration

1. **Test A&F Products Feed**:
   - Should load without authentication
   - Verify products display correctly

2. **Test Authentication**:
   - Click "Sign In" button
   - Try signing in with Google
   - Verify your avatar/email appears

3. **Test My Photos Feed**:
   - Click "My Photos" tab
   - Should prompt to sign in if not authenticated
   - After signing in, should show the migrated photos

4. **Test Photo Upload**:
   - While in "My Photos" and authenticated
   - Click the camera icon
   - Upload a new photo
   - Verify it appears in the feed

## Troubleshooting

### "Missing Supabase credentials" error
- Check that `.env` file exists and contains correct values
- Restart the development server after changing `.env`

### OAuth redirect not working
- Verify redirect URLs match exactly in OAuth provider settings
- Check that OAuth is enabled in Supabase Authentication settings

### Images not uploading
- Verify storage bucket `user-images` exists and is public
- Check storage policies are set up correctly
- Look for errors in browser console

### RLS Policy errors
- Make sure all policies from `supabase-schema.sql` were created
- Verify RLS is enabled on all tables
- Check user is authenticated when accessing protected resources

### Migration script fails
- Ensure you replaced `YOUR_DEMO_USER_ID` with actual user ID
- Verify `.env` has correct Supabase credentials
- Check that tables and storage bucket exist before running migration

## Next Steps

- Deploy to production with updated environment variables
- Configure custom domain for OAuth redirects
- Set up Supabase Edge Functions for advanced features
- Enable database backups in Supabase dashboard

## Support

For issues with:
- **Supabase**: [Supabase Documentation](https://supabase.com/docs)
- **Aura App**: Check the main README.md or create an issue
