

# Fix: Task Navigation Using Callback Props

## Problem Identified

The navigation from "Task created" badge and toast to the Tasks tab is failing because:

1. **GuidedAgentGPT** (child component) calls `navigate()` to change the URL
2. **Workspace** (parent component) uses `useSearchParams()` to read the tab from URL
3. React Router optimizes same-route navigations, so the parent's `searchParams` hook doesn't always detect changes made by child components
4. Result: URL changes but `activeTab` state never updates

## Solution

Pass a callback prop from Workspace to GuidedAgentGPT that directly sets the active tab, bypassing URL navigation entirely. This follows the same pattern already used for `onPrefillFromProgress`.

## Implementation Steps

### Step 1: Add callback prop to GuidedAgentGPT interface

In `src/components/workspace/GuidedAgentGPT.tsx`:

- Add `onNavigateToTab?: (tab: string) => void` to the props interface
- Replace all `navigate()` calls with `onNavigateToTab?.('tasks')` 
- Remove the `navigateToTasksTab` callback that uses React Router
- Remove unused `useNavigate` import if no longer needed

### Step 2: Pass the callback from Workspace

In `src/pages/Workspace.tsx`:

- Add `onNavigateToTab={(tab) => setActiveTab(tab as WorkspaceTab)}` prop when rendering GuidedAgentGPT

## Technical Details

```text
Current Flow (Broken):
+------------------+     navigate()      +----------------+
| GuidedAgentGPT   | ------------------> | URL Changes    |
+------------------+                     +----------------+
                                                |
                                                | (React Router
                                                |  doesn't trigger
                                                |  re-render)
                                                v
                                         +----------------+
                                         | Workspace      |
                                         | searchParams   |
                                         | NOT updated    |
                                         +----------------+

New Flow (Fixed):
+------------------+  onNavigateToTab()  +----------------+
| GuidedAgentGPT   | ------------------> | Workspace      |
+------------------+                     | setActiveTab() |
                                         +----------------+
                                                |
                                                | (Direct state
                                                |  update)
                                                v
                                         +----------------+
                                         | Tab switches   |
                                         | instantly!     |
                                         +----------------+
```

## Files to Modify

1. **src/components/workspace/GuidedAgentGPT.tsx**
   - Add `onNavigateToTab` prop to interface
   - Update toast action to call `onNavigateToTab?.('tasks')`
   - Update badge onClick to call `onNavigateToTab?.('tasks')`
   - Remove `navigateToTasksTab` callback
   - Clean up unused imports

2. **src/pages/Workspace.tsx**
   - Pass `onNavigateToTab` prop to GuidedAgentGPT component

## Expected Outcome

- Clicking "Task created" badge instantly switches to Tasks tab
- Clicking "View Tasks" button in toast instantly switches to Tasks tab
- No page reload, no white flash
- Works reliably on every click (not just first click)
- Follows existing patterns in the codebase

