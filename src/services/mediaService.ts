import { supabase } from './supabaseClient';
import type { MediaItem } from '../types';

/**
 * Fetch A&F products from Supabase
 */
export async function fetchProducts(): Promise<MediaItem[]> {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .order('id', { ascending: true });

  if (error) {
    console.error('Error fetching products from Supabase:', error);
    throw error;
  }

  return data || [];
}

/**
 * Fetch user media from Supabase
 */
export async function fetchUserMedia(userId: string): Promise<MediaItem[]> {
  const { data, error } = await supabase
    .from('user_media')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching user media from Supabase:', error);
    throw error;
  }

  return data || [];
}

/**
 * Upload a user photo to Supabase Storage
 */
export async function uploadUserPhoto(
  file: File,
  userId: string
): Promise<{ url: string; error: Error | null }> {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}.${fileExt}`;
    const filePath = `${userId}/${fileName}`;

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('user-images')
      .upload(filePath, file);

    if (uploadError) {
      throw uploadError;
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('user-images')
      .getPublicUrl(filePath);

    const publicUrl = urlData.publicUrl;

    // Insert metadata into user_media table
    const { error: insertError } = await supabase
      .from('user_media')
      .insert({
        user_id: userId,
        url: publicUrl,
        type: 'image',
      });

    if (insertError) {
      throw insertError;
    }

    return { url: publicUrl, error: null };
  } catch (error) {
    console.error('Error uploading photo:', error);
    return { url: '', error: error as Error };
  }
}

/**
 * Fetch an authenticated image from Supabase Storage
 * Returns a blob URL that can be used in <img> src
 */
export async function fetchAuthenticatedImage(url: string): Promise<string> {
  try {
    // Extract the file path from the Supabase storage URL
    // URL format: https://{project}.supabase.co/storage/v1/object/public/user-images/{path}
    const urlParts = url.split('/user-images/');
    if (urlParts.length !== 2) {
      throw new Error('Invalid Supabase storage URL format');
    }

    const filePath = urlParts[1];

    // Use Supabase's download method which handles authentication automatically
    const { data, error } = await supabase.storage
      .from('user-images')
      .download(filePath);

    if (error) {
      throw error;
    }

    if (!data) {
      throw new Error('No data returned from storage');
    }

    // Create blob URL from the downloaded blob
    const blobUrl = URL.createObjectURL(data);
    return blobUrl;
  } catch (error) {
    console.error('Error fetching authenticated image:', error);
    throw error;
  }
}

