
# Fix: AI Field Detection "Maximum call stack size exceeded" Error

## Problem Identified

**Root Cause**: Line 55 in the edge function:
```typescript
const base64Content = btoa(String.fromCharCode(...new Uint8Array(fileBuffer)));
```

The spread operator (`...`) passes all 847,463 bytes as individual arguments to `String.fromCharCode()`. JavaScript has a limit on the number of function arguments (varies by engine, typically ~65,000-130,000). With an 847KB file, this creates approximately 847,463 arguments, causing a **stack overflow**.

This is a well-known issue documented on Stack Overflow and GitHub issues for base64 encoding libraries.

## Solution

Replace the problematic spread-based base64 encoding with Deno's built-in standard library encoder, which handles large files correctly using chunked processing.

## Technical Implementation

### Step 1: Update imports in the Edge Function

Add the Deno standard library base64 encoder:
```typescript
import { encodeBase64 } from "https://deno.land/std@0.168.0/encoding/base64.ts";
```

### Step 2: Fix the base64 encoding (Line 54-55)

Replace:
```typescript
const fileBuffer = await fileResponse.arrayBuffer();
const base64Content = btoa(String.fromCharCode(...new Uint8Array(fileBuffer)));
```

With:
```typescript
const fileBuffer = await fileResponse.arrayBuffer();
const base64Content = encodeBase64(new Uint8Array(fileBuffer));
```

### Step 3: Add better error handling and logging

Add more granular logging to track exactly where issues occur:

```typescript
console.log("[analyze-offer-template] Step 1: Fetching file...");
// fetch code
console.log("[analyze-offer-template] Step 2: File fetched, size:", fileBuffer.byteLength, "bytes");
console.log("[analyze-offer-template] Step 3: Encoding to base64...");
// encode code
console.log("[analyze-offer-template] Step 4: Base64 encoded, length:", base64Content.length);
console.log("[analyze-offer-template] Step 5: Calling Claude API...");
// Claude call
console.log("[analyze-offer-template] Step 6: Claude response received");
```

### Step 4: Add timeout protection

Wrap the function execution in a timeout to prevent hangs:

```typescript
// At the start of the try block
const timeoutPromise = new Promise((_, reject) => {
  setTimeout(() => reject(new Error("Analysis timeout: exceeded 25 seconds")), 25000);
});

// Wrap main logic in Promise.race with timeout
const result = await Promise.race([
  mainAnalysisLogic(),
  timeoutPromise
]);
```

## Files to Modify

1. **supabase/functions/analyze-offer-template/index.ts**
   - Add `encodeBase64` import from Deno standard library
   - Replace spread-based encoding with `encodeBase64()` function
   - Add step-by-step logging
   - Add timeout protection

## Why This Fixes the Issue

| Approach | How it works | File size limit |
|----------|--------------|-----------------|
| `btoa(String.fromCharCode(...arr))` | Spreads array as function args | ~65KB-130KB |
| `encodeBase64(Uint8Array)` | Chunked internal processing | No practical limit |

The Deno standard library function processes bytes in chunks rather than passing them all as function arguments, avoiding the call stack limitation entirely.

## Expected Outcome

- 847KB PDF files will process successfully
- Step-by-step logs will show progress
- Timeout protection prevents indefinite hangs
- AI field detection will complete and populate the `offer_template_fields` table
