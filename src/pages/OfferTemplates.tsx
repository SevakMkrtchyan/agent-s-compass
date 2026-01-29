import { useState, useRef, useEffect } from "react";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Upload, Download, Trash2, FileText, File, Loader2, CheckCircle2, 
  Eye, ExternalLink, Sparkles, ListChecks, AlertCircle, RefreshCw 
} from "lucide-react";
import { cn } from "@/lib/utils";
import { 
  useOfferTemplates, 
  useCreateOfferTemplate, 
  useDeleteOfferTemplate,
  useAnalyzeTemplate,
  useOfferTemplateFields,
  useAnalysisPolling,
  type OfferTemplate 
} from "@/hooks/useOfferTemplates";
import { format } from "date-fns";
import { useQueryClient } from "@tanstack/react-query";

export default function OfferTemplates() {
  const [collapsed] = useState(false);
  const [templateName, setTemplateName] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [previewTemplate, setPreviewTemplate] = useState<OfferTemplate | null>(null);
  const [fieldsModalTemplate, setFieldsModalTemplate] = useState<OfferTemplate | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  const { data: templates = [], isLoading } = useOfferTemplates();
  const createTemplate = useCreateOfferTemplate();
  const deleteTemplate = useDeleteOfferTemplate();
  const analyzeTemplate = useAnalyzeTemplate();
  const { data: modalFields = [] } = useOfferTemplateFields(fieldsModalTemplate?.id || null);

  // Poll for any templates that are currently analyzing
  const analyzingTemplates = templates.filter(t => t.analysis_status === "analyzing");
  
  useEffect(() => {
    if (analyzingTemplates.length === 0) return;

    const intervalId = setInterval(async () => {
      // Refresh templates to check for status updates
      queryClient.invalidateQueries({ queryKey: ["offer-templates"] });
    }, 3000);

    return () => clearInterval(intervalId);
  }, [analyzingTemplates.length, queryClient]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
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
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => Math.min(prev + 10, 80));
      }, 200);

      const result = await createTemplate.mutateAsync({
        file: selectedFile,
        name: templateName.trim(),
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      // Start AI analysis in background (async mode - returns immediately)
      analyzeTemplate.mutate({
        templateId: result.id,
        fileUrl: result.file_url,
        fileType: result.file_type,
      });

      setTimeout(() => {
        setTemplateName("");
        setSelectedFile(null);
        setUploadProgress(0);
        setIsUploading(false);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }, 500);
    } catch (error) {
      setUploadProgress(0);
      setIsUploading(false);
    }
  };

  const handleReanalyze = (template: OfferTemplate) => {
    analyzeTemplate.mutate({
      templateId: template.id,
      fileUrl: template.file_url,
      fileType: template.file_type,
    });
  };

  const handleDownload = async (template: OfferTemplate) => {
    console.log("[OfferTemplates] Downloading:", template.name, template.file_url);
    
    setDownloadingId(template.id);
    try {
      const response = await fetch(template.file_url);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch file: ${response.status}`);
      }
      
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = `${template.name}.${template.file_type}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      URL.revokeObjectURL(blobUrl);
      
      console.log("[OfferTemplates] Download successful");
    } catch (error) {
      console.error("[OfferTemplates] Download error:", error);
      window.open(template.file_url, "_blank");
    } finally {
      setDownloadingId(null);
    }
  };

  const handlePreview = (template: OfferTemplate) => {
    setPreviewTemplate(template);
  };

  const getPreviewUrl = (template: OfferTemplate): string => {
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

  const getDataSourceBadgeColor = (source: string) => {
    switch (source) {
      case "buyer": return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "property": return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "agent": return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200";
      default: return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200";
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
                Upload a PDF or DOCX file — AI will automatically detect fillable fields
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
                    {uploadProgress === 100 ? "Upload complete! AI analysis starting..." : `Uploading... ${uploadProgress}%`}
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
                      <TableHead>Status</TableHead>
                      <TableHead>Uploaded</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {templates.map((template) => (
                      <TemplateRow
                        key={template.id}
                        template={template}
                        isDownloading={downloadingId === template.id}
                        isDeleting={deleteTemplate.isPending}
                        onPreview={handlePreview}
                        onDownload={handleDownload}
                        onDelete={handleDelete}
                        onReanalyze={handleReanalyze}
                        onViewFields={setFieldsModalTemplate}
                      />
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

      {/* Fields Modal */}
      <Dialog open={!!fieldsModalTemplate} onOpenChange={(open) => !open && setFieldsModalTemplate(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="flex items-center gap-2">
              <ListChecks className="h-5 w-5" />
              Detected Fields: {fieldsModalTemplate?.name}
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="flex-1 min-h-0">
            {modalFields.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Sparkles className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No fields detected yet</p>
                <p className="text-sm">Run AI analysis to detect fillable fields</p>
              </div>
            ) : (
              <div className="space-y-3 pr-4">
                {modalFields.map((field) => (
                  <div 
                    key={field.id} 
                    className="border rounded-lg p-3 bg-muted/30"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium">{field.field_label}</p>
                        <p className="text-sm text-muted-foreground font-mono">{field.field_name}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {field.is_required && (
                          <Badge variant="destructive" className="text-xs">Required</Badge>
                        )}
                        <Badge variant="outline" className="text-xs">{field.field_type}</Badge>
                        <Badge className={cn("text-xs", getDataSourceBadgeColor(field.data_source))}>
                          {field.data_source}
                        </Badge>
                      </div>
                    </div>
                    {field.source_field && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Maps to: <span className="font-mono">{field.source_field}</span>
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
          {fieldsModalTemplate && (
            <div className="pt-4 border-t flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => fieldsModalTemplate && handleReanalyze(fieldsModalTemplate)}
                disabled={fieldsModalTemplate.analysis_status === "analyzing"}
              >
                {fieldsModalTemplate.analysis_status === "analyzing" ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-2" />
                )}
                Re-analyze
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Template row component with status-based UI
function TemplateRow({
  template,
  isDownloading,
  isDeleting,
  onPreview,
  onDownload,
  onDelete,
  onReanalyze,
  onViewFields,
}: {
  template: OfferTemplate;
  isDownloading: boolean;
  isDeleting: boolean;
  onPreview: (t: OfferTemplate) => void;
  onDownload: (t: OfferTemplate) => void;
  onDelete: (t: OfferTemplate) => void;
  onReanalyze: (t: OfferTemplate) => void;
  onViewFields: (t: OfferTemplate) => void;
}) {
  const { data: fields = [] } = useOfferTemplateFields(template.id);
  const fieldCount = fields.length;

  const renderStatus = () => {
    switch (template.analysis_status) {
      case "analyzing":
        return (
          <div className="flex items-center gap-2 text-amber-600">
            <Loader2 className="h-3 w-3 animate-spin" />
            <span className="text-sm">Analyzing...</span>
          </div>
        );
      case "completed":
        if (fieldCount > 0) {
          return (
            <Button
              variant="ghost"
              size="sm"
              className="h-auto py-1 px-2 text-green-600 hover:text-green-700"
              onClick={() => onViewFields(template)}
            >
              <CheckCircle2 className="h-3 w-3 mr-1" />
              <span className="text-sm">{fieldCount} fields</span>
            </Button>
          );
        }
        return (
          <Button
            variant="ghost"
            size="sm"
            className="h-auto py-1 px-2 text-muted-foreground hover:text-foreground"
            onClick={() => onReanalyze(template)}
          >
            <Sparkles className="h-3 w-3 mr-1" />
            <span className="text-sm">Re-analyze</span>
          </Button>
        );
      case "failed":
        console.error("[TemplateRow] Analysis failed for template:", template.name, "Error:", template.analysis_error);
        return (
          <div className="flex flex-col items-start gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-auto py-1 px-2 text-destructive hover:text-destructive"
              onClick={() => onReanalyze(template)}
            >
              <AlertCircle className="h-3 w-3 mr-1" />
              <span className="text-sm">Retry Analysis</span>
            </Button>
            {template.analysis_error && (
              <span className="text-xs text-destructive/80 max-w-[200px] truncate" title={template.analysis_error}>
                Error: {template.analysis_error}
              </span>
            )}
          </div>
        );
      case "pending":
      default:
        return (
          <Button
            variant="ghost"
            size="sm"
            className="h-auto py-1 px-2 text-muted-foreground hover:text-foreground"
            onClick={() => onReanalyze(template)}
          >
            <Sparkles className="h-3 w-3 mr-1" />
            <span className="text-sm">Analyze</span>
          </Button>
        );
    }
  };

  return (
    <TableRow>
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
      <TableCell>
        {renderStatus()}
      </TableCell>
      <TableCell className="text-muted-foreground">
        {format(new Date(template.created_at), "MMM d, yyyy")}
      </TableCell>
      <TableCell className="text-right">
        <div className="flex items-center justify-end gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onPreview(template)}
            title="Preview template"
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDownload(template)}
            disabled={isDownloading}
            title="Download template"
          >
            {isDownloading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(template)}
            disabled={isDeleting}
            className="text-destructive hover:text-destructive"
            title="Delete template"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}
