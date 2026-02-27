# Notebook Feature - Deployment Checklist

## Pre-Deployment

- [ ] All files created and committed to git
- [ ] No TypeScript errors: `npm run type-check`
- [ ] All components render without errors
- [ ] Local testing completed
- [ ] All routes accessible
- [ ] Console shows no warnings

## Firestore Setup

- [ ] Firebase project is created and configured
- [ ] Service account key available for Cloud Functions (if needed)
- [ ] Firestore database exists and is active
- [ ] Collections created (auto-created on first write):
  - [ ] `users/{userId}/notebooks/{notebookId}`
  - [ ] `users/{userId}/notebooks/{notebookId}/pages/{pageId}`

## Deploy Firestore Rules

```bash
# Verify rules syntax
firebase firestore:indexes --project=YOUR_PROJECT_ID

# Deploy rules
firebase deploy --only firestore:rules
```

## Create Firestore Indexes (Optional but Recommended)

In Firebase Console → Firestore → Indexes, create:

1. **Notebook List Index**
   - Collection: `notebooks`
   - Fields: 
     - `userId` (Ascending)
     - `updatedAt` (Descending)

2. **Notebook Search Index**
   - Collection: `notebooks`
   - Fields:
     - `userId` (Ascending)
     - `title` (Ascending)

Or using CLI:
```bash
firebase firestore:indexes:create --project=YOUR_PROJECT_ID
```

## Code Deployment

### 1. Add Environment Variables (if using custom features)

```bash
# .env.local or Firebase config
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
# These should already be set
```

### 2. Build Verification

```bash
npm run build
# Should complete without errors
```

### 3. Deploy to Hosting/Vercel

```bash
# Option A: Vercel
vercel deploy --prod

# Option B: Firebase Hosting
firebase deploy --only hosting

# Option C: Full Firebase deployment
firebase deploy
```

## Post-Deployment Testing

### Smoke Tests

- [ ] Create a new notebook
- [ ] Create a page in notebook
- [ ] Edit page content
- [ ] Check autosave is working (Saving... → Saved)
- [ ] Toggle handwriting mode
- [ ] Toggle preview mode
- [ ] Navigate between pages
- [ ] Delete a page
- [ ] Reorder pages with drag-drop
- [ ] Convert text selection to task
- [ ] Search for notebooks
- [ ] Delete a notebook
- [ ] Refresh page and verify data persists
- [ ] Offline mode works (disable network)

### Performance Tests

- [ ] Load `/notebooks` - should be <1s
- [ ] Open notebook - should be <500ms
- [ ] Type in editor - should feel responsive
- [ ] Autosave completes within 1s
- [ ] Search results show within 100ms

### Error Handling

- [ ] Try to create notebook with empty title - shows error
- [ ] Try to save while offline - shows draft saved
- [ ] Refresh while saving - no data loss
- [ ] Close page without saving - shows confirmation

## Monitoring

### Firebase Console Checklist

- [ ] Firestore Rules are deployed
- [ ] No errors in Firestore Logs
- [ ] Indexes show as ENABLED (if created)
- [ ] Database size reasonable
- [ ] Auth is working properly

### Application Monitoring

- [ ] No console errors on any page
- [ ] No unhandled promise rejections
- [ ] Autosave working consistently
- [ ] Real-time updates working
- [ ] No memory leaks detected

## Feature Flags (Optional)

If using feature flags, enable for:
- [ ] Trusted testers (small group)
- [ ] Verified users (if needed)
- [ ] All users (when confident)

Example:
```typescript
if (featureFlags.notebooksEnabled && user.verified) {
  showNotebooksInSidebar = true
}
```

## Documentation

- [ ] README updated with Notebook feature
- [ ] NOTEBOOK_IMPLEMENTATION.md is in repo
- [ ] Translations all present (EN, ES, JA)
- [ ] Help docs updated
- [ ] Team notified of new feature

## Communication

- [ ] Notify users of new feature via:
  - [ ] Email
  - [ ] In-app announcement
  - [ ] Changelog update
  - [ ] Social media (if applicable)

## Rollback Plan (if needed)

If deployment has issues:

1. **Immediate**
   ```bash
   # Remove from sidebar to hide from users
   # Can be done via feature flag or code revert
   git revert <commit-hash>
   firebase deploy
   ```

2. **Within 24 hours**
   - Investigate error logs
   - Fix issues in development
   - Re-deploy

3. **Firestore Cleanup (if needed)**
   ```bash
   # Delete test notebooks if necessary
   # Use Firebase Console or script
   ```

## Success Criteria

✅ Feature is live and accessible to users  
✅ No critical errors in logs  
✅ Autosave working reliably  
✅ Real-time updates functional  
✅ Search working  
✅ Performance metrics acceptable  
✅ User feedback is positive  

## Post-Launch (First Week)

- [ ] Monitor error logs daily
- [ ] Check Firestore quota usage
- [ ] Collect user feedback
- [ ] Fix any critical bugs
- [ ] Performance optimization if needed
- [ ] Scale database if required

## Sign-Off

- [ ] Development team: _________________
- [ ] QA team: _________________
- [ ] Product manager: _________________
- [ ] Date: _________________

---

**Deployment Status**: [ ] Ready [ ] In Progress [ ] Deployed [ ] Rollback

**Notes:**
