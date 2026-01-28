

# Fix: Download Button Chrome Blocking Issue

## Problem Identified

The download button crashes the page with "This page has been blocked by Chrome" because:

1. The bucket is **public**, so the `file_url` is already a valid public URL
2. The current approach creates a signed URL and uses a programmatic anchor click
3. Chrome blocks cross-origin downloads triggered by JavaScript when the `download` attribute is used on cross-origin URLs
4. The anchor element approach violates Chrome's security policies for cross-origin file downloads

## Root Cause

The `download` attribute on anchor elements only works for **same-origin** URLs. When clicking a cross-origin link with a `download` attribute, Chrome blocks it as a potential security risk.

## Solution

Use the **fetch + blob** approach to download files, which:
1. Fetches the file content as a blob
2. Creates a local object URL (same-origin)
3. Triggers the download from that object URL
4. Revokes the object URL after download

Since the bucket is public, we can use the stored `file_url` directly without needing a signed URL.

## Implementation Steps

### Step 1: Update handleDownload function

In `src/pages/OfferTemplates.tsx`, replace the current download logic with:

```typescript
const handleDownload = async (template: OfferTemplate) => {
  console.log("[OfferTemplates] Downloading:", template.name, template.file_url);
  
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
  }
};
```

### Step 2: Add loading state for downloads (optional enhancement)

Add visual feedback while the file is being fetched:

```typescript
const [downloadingId, setDownloadingId] = useState<string | null>(null);

// In handleDownload:
setDownloadingId(template.id);
try {
  // ... download logic
} finally {
  setDownloadingId(null);
}

// In the button:
<Button
  variant="ghost"
  size="sm"
  onClick={() => handleDownload(template)}
  disabled={downloadingId === template.id}
>
  {downloadingId === template.id ? (
    <Loader2 className="h-4 w-4 animate-spin" />
  ) : (
    <Download className="h-4 w-4" />
  )}
</Button>
```

### Step 3: Remove unnecessary Supabase import

Since we're using the public URL directly and fetch API, we can remove the `createSignedUrl` logic entirely.

## Why This Works

```text
Current Flow (Blocked by Chrome):
+------------------+      cross-origin      +----------------+
| JavaScript       | ---- link.click() ---> | Supabase URL   |
| anchor element   |      download attr     | (different     |
| with download    |                        | origin)        |
+------------------+                        +----------------+
                                                   |
                                                   X Chrome blocks
                                                     "Not same-origin"

New Flow (Works):
+------------------+      fetch()      +----------------+
| JavaScript       | ----------------> | Supabase URL   |
|                  |                   |                |
+------------------+                   +----------------+
         |                                    |
         v                                    v
+------------------+                   +--------------+
| Create blob URL  | <--- blob data -- | Returns file |
| (same-origin)    |                   | content      |
+------------------+                   +--------------+
         |
         v link.click() (same-origin OK!)
+------------------+
| Browser triggers |
| download prompt  |
+------------------+
```

## Files to Modify

1. **src/pages/OfferTemplates.tsx**
   - Replace `handleDownload` function with fetch + blob approach
   - Add `downloadingId` state for loading indicator
   - Update download button to show loading state
   - Remove unnecessary `supabase` import if not used elsewhere

## Expected Outcome

- Clicking download button fetches the file and triggers a browser download prompt
- No Chrome security blocks
- Works for both PDF and DOCX files
- Fallback to opening in new tab if fetch fails
- Visual loading indicator while downloading

