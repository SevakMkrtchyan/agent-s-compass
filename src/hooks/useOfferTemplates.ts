import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useEffect, useCallback } from "react";

export interface OfferTemplate {
  id: string;
  name: string;
  file_url: string;
  file_type: string;
  brokerage_id: string | null;
  created_by: string | null;
  created_at: string;
  analysis_status: string;
  analysis_error: string | null;
  analyzed_at: string | null;
}

export interface OfferTemplateField {
  id: string;
  template_id: string;
  field_name: string;
  field_label: string;
  field_type: string;
  data_source: string;
  is_required: boolean;
  source_field: string | null;
  default_value: string | null;
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

// Fetch fields for a specific template
export function useOfferTemplateFields(templateId: string | null) {
  return useQuery({
    queryKey: ["offer-template-fields", templateId],
    queryFn: async () => {
      if (!templateId) return [];
      
      const { data, error } = await supabase
        .from("offer_template_fields")
        .select("*")
        .eq("template_id", templateId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      return data as OfferTemplateField[];
    },
    enabled: !!templateId,
  });
}

// Poll for analysis completion
export function useAnalysisPolling(templateId: string | null, isAnalyzing: boolean) {
  const queryClient = useQueryClient();

  const pollForCompletion = useCallback(async () => {
    if (!templateId || !isAnalyzing) return null;

    const { data, error } = await supabase
      .from("offer_templates")
      .select("analysis_status, analysis_error")
      .eq("id", templateId)
      .single();

    if (error) {
      console.error("[useAnalysisPolling] Error fetching status:", error);
      return null;
    }

    return data;
  }, [templateId, isAnalyzing]);

  useEffect(() => {
    if (!templateId || !isAnalyzing) return;

    const intervalId = setInterval(async () => {
      const status = await pollForCompletion();
      
      if (status) {
        if (status.analysis_status === "completed") {
          // Invalidate queries to refresh data
          queryClient.invalidateQueries({ queryKey: ["offer-templates"] });
          queryClient.invalidateQueries({ queryKey: ["offer-template-fields", templateId] });
          clearInterval(intervalId);
        } else if (status.analysis_status === "failed") {
          queryClient.invalidateQueries({ queryKey: ["offer-templates"] });
          clearInterval(intervalId);
        }
      }
    }, 3000); // Poll every 3 seconds

    return () => clearInterval(intervalId);
  }, [templateId, isAnalyzing, pollForCompletion, queryClient]);
}

// Analyze template with AI (async mode - returns immediately)
export function useAnalyzeTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ templateId, fileUrl, fileType }: { 
      templateId: string; 
      fileUrl: string; 
      fileType: string;
    }) => {
      console.log("[useAnalyzeTemplate] Starting async AI analysis for template:", templateId);
      
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analyze-offer-template`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            template_id: templateId,
            file_url: fileUrl,
            file_type: fileType,
            async: true, // Enable async mode
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Analysis failed: ${response.status}`);
      }

      const data = await response.json();
      console.log("[useAnalyzeTemplate] Analysis started:", data);
      return { ...data, templateId };
    },
    onSuccess: (data) => {
      // Invalidate to pick up the "analyzing" status
      queryClient.invalidateQueries({ queryKey: ["offer-templates"] });
      toast.info("Analyzing template fields...");
    },
    onError: (error: Error) => {
      console.error("[useAnalyzeTemplate] Analysis failed:", error);
      toast.error(`Field detection failed: ${error.message}`);
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

      // Create database record with initial analysis_status
      const { data, error } = await supabase
        .from("offer_templates")
        .insert({
          name,
          file_url: urlData.publicUrl,
          file_type: fileType,
          analysis_status: "pending",
        })
        .select()
        .single();

      if (error) {
        console.error("[OfferTemplates] Database insert failed:", error);
        throw new Error(`Database save failed: ${error.message}`);
      }
      
      console.log("[OfferTemplates] Template record created:", data);
      return { ...data, file_size: file.size } as OfferTemplate & { file_size: number };
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

      // Delete from database (fields will cascade delete if FK is set up)
      const { error } = await supabase
        .from("offer_templates")
        .delete()
        .eq("id", template.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["offer-templates"] });
      queryClient.invalidateQueries({ queryKey: ["offer-template-fields"] });
      toast.success("Template deleted");
    },
    onError: (error) => {
      console.error("Failed to delete template:", error);
      toast.error("Failed to delete template");
    },
  });
}
