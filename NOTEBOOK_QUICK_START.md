# Notebook Feature - Quick Start Guide for Developers

## 5-Minute Setup

### 1. Review the Implementation

```bash
# Read the main documentation
cat NOTEBOOK_IMPLEMENTATION.md

# Check the checklist
cat NOTEBOOK_DEPLOYMENT_CHECKLIST.md
```

### 2. Key Files to Know

**Data & Logic:**
- `lib/notebook-types.ts` - All TypeScript types
- `lib/notebook-utils.ts` - Helper functions
- `lib/firestore-notebooks.ts` - Firebase CRUD operations

**Hooks:**
- `hooks/use-autosave.ts` - Autosave debounce logic
- `hooks/use-notebooks.ts` - Fetch all notebooks
- `hooks/use-notebook.ts` - Fetch single notebook with pages

**Components:**
- `components/notebook/NotebookEditor.tsx` - Main editor
- `components/notebook/NotebookCard.tsx` - Notebook tile
- `components/notebook/NotebookList.tsx` - Grid view
- `components/notebook/NotebookSidebar.tsx` - Pages sidebar
- `components/notebook/ConvertToEntityModal.tsx` - Convert to task/session/goal

**Pages:**
- `app/(app)/notebooks/page.tsx` - List notebooks
- `app/(app)/notebooks/[id]/page.tsx` - Edit notebook

### 3. Running Locally

```bash
# Install dependencies (already done)
npm install

# Start dev server
npm run dev

# Navigate to
# http://localhost:3000/notebooks
```

## Common Tasks

### Adding a New Feature

1. **Save state to Firestore?**
   - Add to `lib/firestore-notebooks.ts`
   - Call from component using `updatePage()` or `updateNotebook()`

2. **Need new UI component?**
   - Create in `components/notebook/`
   - Export from `components/notebook/index.ts`
   - Import where needed

3. **New translation string?**
   - Add key to `lib/i18n/translations.ts` in all 3 languages
   - Use with `useI18n()` hook

### Debugging

#### Autosave not working?

```typescript
// Check the hook is working
const autosave = useAutosave(content, {
  delay: 800,
  onSave: async (value) => {
    console.log('Saving:', value)
    // Your save logic
  }
})

// Component should call autosave.markDirty() on change
<textarea onChange={(e) => {
  setContent(e.target.value)
  autosave.markDirty()
}} />
```

#### Pages not showing?

```typescript
// Check subscription is working
const { pages, loading } = useNotebook(userId, notebookId)

console.log('Pages:', pages)
console.log('Loading:', loading)
```

#### Firestore permission denied?

1. Check user is authenticated: `useAuthState(auth)`
2. Verify Firestore rules are deployed: `firebase deploy --only firestore:rules`
3. Check `ownerId` matches `request.auth.uid` in data
4. Check collection path: `users/{userId}/notebooks/{notebookId}`

### Performance Optimization

#### Reduce Firestore writes

- Autosave debounce is set to 800ms by default
- Adjust with: `useAutosave(content, { delay: 1200 })`
- Or disable realtime: `useNotebook(userId, id, { realtime: false })`

#### Improve page load time

- Use pagination for large notebook lists
- Lazy load page content (only load when selected)
- Implement virtualization for 50+ pages

### Adding Tests

```typescript
// Example test for useAutosave
import { renderHook, act } from '@testing-library/react'
import { useAutosave } from '@/hooks/use-autosave'

test('autosave debounces', async () => {
  const onSave = jest.fn()
  const { result } = renderHook(() => useAutosave('test', { delay: 100, onSave }))
  
  act(() => {
    result.current.markDirty()
  })
  
  expect(onSave).not.toHaveBeenCalled()
  
  // Wait for debounce
  await new Promise(resolve => setTimeout(resolve, 150))
  
  expect(onSave).toHaveBeenCalledWith('test')
})
```

## API Reference Quick

### Creating a Notebook

```typescript
import { createNotebook } from '@/lib/firestore-notebooks'

const notebook = await createNotebook(userId, {
  title: 'My Notebook',
  description: 'About this notebook',
  projectIds: ['proj-1'],
  categoryIds: ['cat-1'],
  tags: ['personal'],
  ownerId: userId,
})
```

### Creating a Page

```typescript
import { createPage } from '@/lib/firestore-notebooks'

const page = await createPage(userId, notebookId, {
  title: 'My Page',
  content: '# Hello\nWorld',
  order: 0,
})
```

### Updating a Page

```typescript
import { updatePage } from '@/lib/firestore-notebooks'

await updatePage(userId, notebookId, pageId, {
  content: 'Updated content...',
  title: 'New Title',
})
```

### Deleting

```typescript
import { deleteNotebook, deletePage } from '@/lib/firestore-notebooks'

await deleteNotebook(userId, notebookId)
await deletePage(userId, notebookId, pageId)
```

## Keyboard Shortcuts

Users can use:

- `Ctrl/Cmd + S` - Save current page
- `Ctrl/Cmd + Enter` - Create new page
- `Alt + ←` - Go to previous page
- `Alt + →` - Go to next page

## File Size Limits

- Notebook title: 200 characters max
- Page title: 200 characters max
- Page content: ~1MB max per page
- Total per notebook: ~10MB (reasonable for most use cases)

## Real-time Sync Behavior

Pages update in real-time using Firebase subscriptions:

```typescript
const unsub = subscribeToPagees(userId, notebookId, 
  (pages) => {
    // This fires whenever pages change
    console.log('Pages updated:', pages)
  }
)

// Don't forget to unsubscribe!
return () => unsub()
```

## Handling Errors

```typescript
// All operations return errors
const { error: notebookError } = useNotebook(userId, id)

if (notebookError) {
  toast({
    title: 'Error loading notebook',
    description: notebookError.message,
    variant: 'destructive'
  })
}
```

## Mobile Considerations

The feature works on mobile but isn't optimized:

- Editor textarea is difficult to use on small screens
- Sidebar takes up mobile width
- Future: Add mobile-specific layout

## Browser Support

- Chrome/Edge: ✅ Full support
- Firefox: ✅ Full support
- Safari: ✅ Full support (iOS 14+)
- IE11: ❌ Not supported (uses modern JS)

## Troubleshooting Commands

```bash
# Check for TypeScript errors
npm run type-check

# Check for eslint issues
npm run lint

# Format code
npm run format

# Run tests (if available)
npm test

# Build for production
npm run build
```

## Feature Flags (if implemented)

```typescript
// Example feature flag check
if (user?.features?.includes('notebooks')) {
  // Show notebooks
}
```

## Rate Limits

Firestore automatically limits:

- Write operations: ~1,000 per second per user
- Read operations: ~10,000 per second per user
- Storage: ~1GB free tier, then charged

For this feature, typical usage:
- Autosave every 800ms = 1 write/second
- Search is client-side (no reads)
- Page loads = 1 read

**Total per user: ~2,000-3,000 operations/month**

## Useful Links

- [Firebase Firestore Docs](https://firebase.google.com/docs/firestore)
- [Firebase Auth Docs](https://firebase.google.com/docs/auth)
- [Markdown-it](https://github.com/markdown-it/markdown-it)
- [Fuse.js](https://fusejs.io/)

## Support

For questions or issues:

1. Check `NOTEBOOK_IMPLEMENTATION.md`
2. Search TypeScript errors: `npm run type-check`
3. Check Firestore rules: `firebase firestore:rules:describe`
4. Review error logs in Firebase Console
5. Contact the team

---

**Last Updated:** February 2026  
**Version:** 1.0  
**Status:** Production Ready ✅
