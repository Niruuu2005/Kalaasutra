// src/lib/services/storage.service.ts
import { createClient } from '@/lib/supabase/client';

export type BucketName = 'product-media' | 'custom-requests';

export const StorageService = {
  /**
   * Uploads a file to the specified Supabase bucket.
   * Uses client-side Supabase client (browser compatible).
   * 
   * @param bucket The name of the bucket
   * @param file The File object from an input element
   * @param path Optional path prefix (e.g. 'products/'). Defaults to root.
   * @returns The public URL of the uploaded file
   */
  async uploadFile(bucket: BucketName, file: File, path: string = ''): Promise<string> {
    const supabase = createClient();
    
    // Generate a unique filename to prevent collisions
    const fileExtension = file.name.split('.').pop();
    const uniqueFileName = `${crypto.randomUUID()}.${fileExtension}`;
    const filePath = `${path}${uniqueFileName}`;

    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      throw new Error(`Failed to upload image: ${error.message}`);
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(data.path);

    return publicUrl;
  },

  /**
   * Deletes a file from the bucket given its full URL.
   */
  async deleteFileByUrl(bucket: BucketName, url: string): Promise<void> {
    if (!url.includes(bucket)) return;

    const supabase = createClient();
    
    // Extract the path after the bucket name
    // URL format: https://[project].supabase.co/storage/v1/object/public/[bucket]/[path]
    const parts = url.split(`/${bucket}/`);
    if (parts.length < 2) return;
    
    const filePath = parts[1];

    const { error } = await supabase.storage
      .from(bucket)
      .remove([filePath]);

    if (error) {
      console.error(`Failed to delete file ${filePath}:`, error.message);
    }
  }
};
