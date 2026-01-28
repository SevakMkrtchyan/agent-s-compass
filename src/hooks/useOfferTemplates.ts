import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface OfferTemplate {
  id: string;
  name: string;
  file_url: string;
  file_type: string;
  brokerage_id: string | null;
  created_by: string | null;
  created_at: string;
}

// Fetch all templates
export function useOfferTemplates() {
  return useQuery({
    queryKey: ["offer-templates"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("offer_templates")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as OfferTemplate[];
    },
  });
}

// Upload file + create record
export function useCreateOfferTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ file, name }: { file: File; name: string }) => {
      console.log("[OfferTemplates] Starting upload for:", file.name, "Size:", file.size);
      
      // Determine file type
      const fileType = file.name.endsWith(".pdf") ? "pdf" : "docx";
      
      // Generate unique filename
      const timestamp = Date.now();
      const fileName = `${timestamp}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
      console.log("[OfferTemplates] Generated filename:", fileName);

      // Upload to storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("offer-templates")
        .upload(fileName, file, {
          contentType: file.type,
          upsert: false,
        });

      if (uploadError) {
        console.error("[OfferTemplates] Storage upload failed:", uploadError);
        throw new Error(`Upload failed: ${uploadError.message}`);
      }
      
      console.log("[OfferTemplates] Storage upload successful:", uploadData);

      // Get public URL
      const { data: urlData } = supabase.storage
        .from("offer-templates")
        .getPublicUrl(uploadData.path);

      console.log("[OfferTemplates] Public URL generated:", urlData.publicUrl);

      // Create database record with file size
      const { data, error } = await supabase
        .from("offer_templates")
        .insert({
          name,
          file_url: urlData.publicUrl,
          file_type: fileType,
        })
        .select()
        .single();

      if (error) {
        console.error("[OfferTemplates] Database insert failed:", error);
        throw new Error(`Database save failed: ${error.message}`);
      }
      
      console.log("[OfferTemplates] Template record created:", data);
      return { ...data, file_size: file.size };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["offer-templates"] });
      toast.success(`Template "${data.name}" uploaded successfully`);
    },
    onError: (error: Error) => {
      console.error("[OfferTemplates] Upload failed:", error);
      toast.error(error.message || "Failed to upload template");
    },
  });
}

// Delete template
export function useDeleteOfferTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (template: OfferTemplate) => {
      // Extract filename from URL
      const urlParts = template.file_url.split("/");
      const fileName = urlParts[urlParts.length - 1];

      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from("offer-templates")
        .remove([fileName]);

      if (storageError) {
        console.warn("Storage delete failed:", storageError);
        // Continue anyway - the file might already be deleted
      }

      // Delete from database
      const { error } = await supabase
        .from("offer_templates")
        .delete()
        .eq("id", template.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["offer-templates"] });
      toast.success("Template deleted");
    },
    onError: (error) => {
      console.error("Failed to delete template:", error);
      toast.error("Failed to delete template");
    },
  });
}
