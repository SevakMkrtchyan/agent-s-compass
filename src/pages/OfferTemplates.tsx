import { useState, useRef } from "react";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Upload, Download, Trash2, FileText, File, Loader2, CheckCircle2, Eye, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import { 
  useOfferTemplates, 
  useCreateOfferTemplate, 
  useDeleteOfferTemplate,
  type OfferTemplate 
} from "@/hooks/useOfferTemplates";
import { format } from "date-fns";

export default function OfferTemplates() {
  const [collapsed] = useState(false);
  const [templateName, setTemplateName] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [previewTemplate, setPreviewTemplate] = useState<OfferTemplate | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: templates = [], isLoading } = useOfferTemplates();
  const createTemplate = useCreateOfferTemplate();
  const deleteTemplate = useDeleteOfferTemplate();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      // Auto-fill name from filename if empty
      if (!templateName) {
        const nameWithoutExt = file.name.replace(/\.(pdf|docx)$/i, "");
        setTemplateName(nameWithoutExt);
      }
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !templateName.trim()) return;

    setIsUploading(true);
    setUploadProgress(20);

    try {
      // Simulate progress for UX
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => Math.min(prev + 10, 80));
      }, 200);

      await createTemplate.mutateAsync({
        file: selectedFile,
        name: templateName.trim(),
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      // Reset form after brief delay to show completion
      setTimeout(() => {
        setTemplateName("");
        setSelectedFile(null);
        setUploadProgress(0);
        setIsUploading(false);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }, 1000);
    } catch (error) {
      setUploadProgress(0);
      setIsUploading(false);
    }
  };

  const handleDownload = async (template: OfferTemplate) => {
    console.log("[OfferTemplates] Downloading:", template.name, template.file_url);
    
    setDownloadingId(template.id);
    try {
      // Fetch the file as a blob (works for public bucket URLs)
      const response = await fetch(template.file_url);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch file: ${response.status}`);
      }
      
      const blob = await response.blob();
      
      // Create a local object URL (same-origin, so download attribute works)
      const blobUrl = URL.createObjectURL(blob);
      
      // Create anchor and trigger download
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = `${template.name}.${template.file_type}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up the object URL
      URL.revokeObjectURL(blobUrl);
      
      console.log("[OfferTemplates] Download successful");
    } catch (error) {
      console.error("[OfferTemplates] Download error:", error);
      // Fallback: open in new tab
      window.open(template.file_url, "_blank");
    } finally {
      setDownloadingId(null);
    }
  };

  const formatFileSize = (bytes: number | undefined): string => {
    if (!bytes) return "—";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handlePreview = (template: OfferTemplate) => {
    setPreviewTemplate(template);
  };

  const getPreviewUrl = (template: OfferTemplate): string => {
    // Use Google Docs Viewer for both PDF and DOCX to avoid X-Frame-Options restrictions
    return `https://docs.google.com/gview?url=${encodeURIComponent(template.file_url)}&embedded=true`;
  };

  const handleOpenInNewTab = (url: string) => {
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const handleDelete = async (template: OfferTemplate) => {
    if (confirm(`Delete template "${template.name}"?`)) {
      await deleteTemplate.mutateAsync(template);
    }
  };

  return (
    <div className="flex min-h-screen w-full bg-background">
      <Sidebar collapsed={collapsed} />
      
      <main className={cn(
        "flex-1 transition-all duration-200",
        collapsed ? "ml-[58px]" : "ml-[240px]"
      )}>
        <div className="p-8 max-w-5xl mx-auto">
          <div className="mb-8">
            <h1 className="text-2xl font-semibold text-foreground">Offer Templates</h1>
            <p className="text-muted-foreground mt-1">
              Upload and manage document templates for generating offers
            </p>
          </div>

          {/* Upload Section */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="text-lg">Upload New Template</CardTitle>
              <CardDescription>
                Upload a PDF or DOCX file to use as an offer template
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="file">Template File</Label>
                  <Input
                    ref={fileInputRef}
                    id="file"
                    type="file"
                    accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    onChange={handleFileChange}
                    className="cursor-pointer"
                  />
                  {selectedFile && (
                    <p className="text-xs text-muted-foreground">
                      Selected: {selectedFile.name}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="name">Template Name</Label>
                  <Input
                    id="name"
                    placeholder="e.g., CA Residential Purchase Agreement"
                    value={templateName}
                    onChange={(e) => setTemplateName(e.target.value)}
                  />
                </div>

                <div className="flex items-end">
                  <Button
                    onClick={handleUpload}
                    disabled={!selectedFile || !templateName.trim() || isUploading}
                    className="w-full"
                  >
                    {isUploading ? (
                      uploadProgress === 100 ? (
                        <CheckCircle2 className="h-4 w-4 mr-2 text-green-500" />
                      ) : (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      )
                    ) : (
                      <Upload className="h-4 w-4 mr-2" />
                    )}
                    {uploadProgress === 100 ? "Uploaded!" : isUploading ? "Uploading..." : "Upload Template"}
                  </Button>
                </div>
              </div>

              {/* Upload Progress */}
              {isUploading && (
                <div className="mt-4 space-y-2">
                  <Progress value={uploadProgress} className="h-2" />
                  <p className="text-xs text-muted-foreground text-center">
                    {uploadProgress === 100 ? "Upload complete!" : `Uploading... ${uploadProgress}%`}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Templates List */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Uploaded Templates</CardTitle>
              <CardDescription>
                {templates.length} template{templates.length !== 1 ? "s" : ""} available
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : templates.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No templates uploaded yet</p>
                  <p className="text-sm">Upload your first template above</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Template Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Uploaded</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {templates.map((template) => (
                      <TableRow key={template.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            {template.file_type === "pdf" ? (
                              <File className="h-4 w-4 text-red-500" />
                            ) : (
                              <FileText className="h-4 w-4 text-blue-500" />
                            )}
                            {template.name}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="uppercase text-xs">
                            {template.file_type}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {format(new Date(template.created_at), "MMM d, yyyy")}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handlePreview(template)}
                              title="Preview template"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDownload(template)}
                              disabled={downloadingId === template.id}
                              title="Download template"
                            >
                              {downloadingId === template.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Download className="h-4 w-4" />
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(template)}
                              disabled={deleteTemplate.isPending}
                              className="text-destructive hover:text-destructive"
                              title="Delete template"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Preview Modal */}
      <Dialog open={!!previewTemplate} onOpenChange={(open) => !open && setPreviewTemplate(null)}>
        <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="flex items-center gap-2">
              {previewTemplate?.file_type === "pdf" ? (
                <File className="h-5 w-5 text-red-500" />
              ) : (
                <FileText className="h-5 w-5 text-blue-500" />
              )}
              {previewTemplate?.name}
              <Badge variant="outline" className="uppercase text-xs ml-2">
                {previewTemplate?.file_type}
              </Badge>
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 min-h-0 relative">
            {previewTemplate && (
              <>
                <iframe
                  src={getPreviewUrl(previewTemplate)}
                  className="w-full h-full border rounded-md"
                  title={`Preview of ${previewTemplate.name}`}
                />
                <div className="absolute bottom-4 right-4 flex gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleOpenInNewTab(previewTemplate.file_url)}
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Open in New Tab
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleDownload(previewTemplate)}
                    disabled={downloadingId === previewTemplate.id}
                  >
                    {downloadingId === previewTemplate.id ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Download className="h-4 w-4 mr-2" />
                    )}
                    Download
                  </Button>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
