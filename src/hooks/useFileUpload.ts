import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface UploadOptions {
  bucket: "avatars" | "logos";
  folder?: string;
  maxSizeMB?: number;
  allowedTypes?: string[];
}

interface UploadResult {
  url: string | null;
  error: string | null;
}

export function useFileUpload() {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const upload = async (
    file: File,
    options: UploadOptions
  ): Promise<UploadResult> => {
    const { bucket, folder, maxSizeMB = 2, allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp", "image/svg+xml"] } = options;

    // Validate file type
    if (!allowedTypes.includes(file.type)) {
      return { url: null, error: `File type not allowed. Please use: ${allowedTypes.map(t => t.split('/')[1]).join(', ')}` };
    }

    // Validate file size
    const maxBytes = maxSizeMB * 1024 * 1024;
    if (file.size > maxBytes) {
      return { url: null, error: `File too large. Maximum size is ${maxSizeMB}MB` };
    }

    setIsUploading(true);
    setProgress(0);

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { url: null, error: "Not authenticated" };
      }

      // Generate unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = folder 
        ? `${folder}/${fileName}`
        : `${user.id}/${fileName}`;

      setProgress(30);

      // Upload file
      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true,
        });

      if (uploadError) {
        console.error("Upload error:", uploadError);
        return { url: null, error: uploadError.message };
      }

      setProgress(80);

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath);

      setProgress(100);
      
      return { url: publicUrl, error: null };
    } catch (error) {
      console.error("Upload error:", error);
      return { url: null, error: "Failed to upload file" };
    } finally {
      setIsUploading(false);
      setProgress(0);
    }
  };

  const deleteFile = async (bucket: "avatars" | "logos", url: string): Promise<boolean> => {
    try {
      // Extract path from URL
      const urlParts = url.split(`/storage/v1/object/public/${bucket}/`);
      if (urlParts.length < 2) return false;
      
      const filePath = urlParts[1];
      
      const { error } = await supabase.storage
        .from(bucket)
        .remove([filePath]);

      return !error;
    } catch {
      return false;
    }
  };

  return {
    upload,
    deleteFile,
    isUploading,
    progress,
  };
}
