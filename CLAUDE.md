# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Aura is a TikTok-style mobile web application built with React. It features vertical swipe navigation for browsing media content (images and videos) with smooth transitions and touch gestures.

## Development Commands

```bash
# Start development server
npm start

# Build for production
npm run build

# Run tests
npm test

# Deploy to GitHub Pages
npm run deploy
```

The app is deployed to GitHub Pages at: https://ayush29feb.github.io/aura

## Architecture

### Component Hierarchy

The application follows a simple three-component structure:

1. **App.js** - Root component that:
   - Fetches media data from `public/media.json` using `process.env.PUBLIC_URL` prefix (required for GitHub Pages deployment)
   - Manages loading state
   - Renders the Feed component with media data

2. **Feed.js** - Main container that handles:
   - Touch gesture detection and swipe navigation (up/down)
   - Current media index state
   - Real-time touch offset calculation for drag feedback
   - Transition animations between media items
   - Video preloading for adjacent items (currentIndex ± 1)
   - Renders only adjacent items (currentIndex - 1, currentIndex, currentIndex + 1) for performance

3. **MediaItem.js** - Individual media renderer that:
   - Conditionally renders video or image based on `item.type`
   - Manages video autoplay/pause based on `isActive` prop
   - Handles play/pause toggle on video tap
   - Resets video to start when not active

### State Management

The app uses React hooks for state management:
- **App.js**: `media` array and `loading` state
- **Feed.js**: `currentIndex`, touch gesture state (`touchStart`, `touchEnd`, `touchOffset`), and `transitioning` flag
- **MediaItem.js**: `isPaused` state for video controls

### Media Data Format

Media content is defined in `public/media.json` with the following structure:

```json
{
  "id": 1,
  "type": "image" | "video",
  "url": "https://...",
  "thumbnail": "https://..." (optional, for videos)
}
```

### Swipe Navigation

The swipe system in Feed.js works as follows:
- Minimum swipe distance: 50px (configurable via `minSwipeDistance`)
- Swipe up: advances to next item
- Swipe down: returns to previous item
- Real-time drag feedback during touch move
- Transition animation: 300ms ease-out
- Prevents navigation during active transitions

### Video Behavior

Videos in MediaItem.js are configured with:
- `loop`: videos replay automatically
- `playsInline`: prevents fullscreen on iOS
- `muted`: allows autoplay without user interaction
- Autoplay when `isActive` prop is true
- Pause and reset to start when inactive
- Click/tap toggles play/pause state

## GitHub Pages Deployment

The app is configured for GitHub Pages deployment:
- Homepage URL set in package.json: `"homepage": "https://ayush29feb.github.io/aura"`
- Media loading uses `process.env.PUBLIC_URL` prefix for proper path resolution
- Deploy workflow: `npm run predeploy` builds, then `npm run deploy` publishes to gh-pages branch

## Supabase Integration

The app integrates with Supabase for authentication, database, and cloud storage.

### Setup

1. **Create a Supabase project** at [supabase.com](https://supabase.com)

2. **Configure environment variables** in `.env`:
   ```bash
   REACT_APP_SUPABASE_URL=your_supabase_project_url
   REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

3. **Set up OAuth providers** in Supabase dashboard:
   - Navigate to Authentication > Providers
   - Enable Google OAuth
   - Configure redirect URLs: `http://localhost:3000` and your production URL

4. **Create database tables** using the Supabase SQL editor:

   ```sql
   -- Users table (extends auth.users)
   CREATE TABLE users (
     id UUID REFERENCES auth.users PRIMARY KEY,
     username TEXT,
     avatar_url TEXT,
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );

   -- Products table (A&F products)
   CREATE TABLE products (
     id BIGINT PRIMARY KEY,
     name TEXT,
     price TEXT,
     gender TEXT,
     url TEXT,
     images JSONB,
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );

   -- User media table
   CREATE TABLE user_media (
     id BIGSERIAL PRIMARY KEY,
     user_id UUID REFERENCES users(id) ON DELETE CASCADE,
     url TEXT NOT NULL,
     type TEXT NOT NULL,
     thumbnail TEXT,
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );

   -- Enable Row Level Security (RLS)
   ALTER TABLE products ENABLE ROW LEVEL SECURITY;
   ALTER TABLE user_media ENABLE ROW LEVEL SECURITY;

   -- RLS Policies
   -- Products: Public read access
   CREATE POLICY "Public read access for products"
     ON products FOR SELECT
     USING (true);

   -- User media: Users can only read their own photos
   CREATE POLICY "Users can read their own media"
     ON user_media FOR SELECT
     USING (auth.uid() = user_id);

   -- User media: Users can insert their own photos
   CREATE POLICY "Users can insert their own media"
     ON user_media FOR INSERT
     WITH CHECK (auth.uid() = user_id);

   -- User media: Users can delete their own photos
   CREATE POLICY "Users can delete their own media"
     ON user_media FOR DELETE
     USING (auth.uid() = user_id);
   ```

5. **Create storage bucket**:
   - Navigate to Storage in Supabase dashboard
   - Create a new public bucket named `user-images`
   - Add the following RLS policy for the bucket:

   ```sql
   -- Allow users to upload to their own folder
   CREATE POLICY "Users can upload to own folder"
     ON storage.objects FOR INSERT
     WITH CHECK (
       bucket_id = 'user-images' AND
       auth.uid()::text = (storage.foldername(name))[1]
     );

   -- Allow users to read their own images
   CREATE POLICY "Users can read own images"
     ON storage.objects FOR SELECT
     USING (
       bucket_id = 'user-images' AND
       auth.uid()::text = (storage.foldername(name))[1]
     );
   ```

### Data Migration

To migrate existing data from JSON files to Supabase:

1. **Create a demo user** in Supabase dashboard:
   - Go to Authentication > Users
   - Add a new user manually
   - Copy the user ID

2. **Update the migration script**:
   - Open `scripts/migrateToSupabase.ts`
   - Replace `YOUR_DEMO_USER_ID` with the actual user ID

3. **Run the migration**:
   ```bash
   npx ts-node scripts/migrateToSupabase.ts
   ```

   The script will:
   - Upload all A&F products to the `products` table
   - Upload 41 user images to Supabase Storage (`user-images` bucket)
   - Insert user media metadata into `user_media` table

4. **Start the application**:
   - Restart the development server with `npm start`

### Authentication Flow

- **Public Access**: A&F products feed is accessible without authentication
- **Private Access**: "My Photos" feed requires users to sign in
- **OAuth Providers**: Users can sign in with Google
- **Upload**: Authenticated users can upload photos to their personal collection

### Services Architecture

- **`src/services/supabaseClient.ts`**: Initializes Supabase client
- **`src/services/authService.ts`**: Handles authentication (sign in, sign out, session management)
- **`src/services/mediaService.ts`**: Handles all data fetching from Supabase
  - `fetchProducts()`: Fetches A&F products from Supabase
  - `fetchUserMedia(userId)`: Fetches user-specific photos from Supabase
  - `uploadUserPhoto(file, userId)`: Uploads photos to Supabase Storage

### Components

- **`AuthButton`**: Displays sign in/sign out button with user avatar
- **`UploadButton`**: Camera icon for uploading photos (visible when authenticated in "My Photos" mode)
- **`App.tsx`**: Manages authentication state and conditional rendering based on auth status
- **`Feed.tsx`**: Unchanged, continues to handle swipe navigation
