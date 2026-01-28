import { useState, useRef } from "react";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Upload, Download, Trash2, FileText, File, Loader2 } from "lucide-react";
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

    await createTemplate.mutateAsync({
      file: selectedFile,
      name: templateName.trim(),
    });

    // Reset form
    setTemplateName("");
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
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
                    disabled={!selectedFile || !templateName.trim() || createTemplate.isPending}
                    className="w-full"
                  >
                    {createTemplate.isPending ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Upload className="h-4 w-4 mr-2" />
                    )}
                    Upload Template
                  </Button>
                </div>
              </div>
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
                              asChild
                            >
                              <a 
                                href={template.file_url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                download
                              >
                                <Download className="h-4 w-4" />
                              </a>
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(template)}
                              disabled={deleteTemplate.isPending}
                              className="text-destructive hover:text-destructive"
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
    </div>
  );
}
