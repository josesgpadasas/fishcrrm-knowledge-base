# Conversion Notes: Google Apps Script to GitHub Pages

This document explains the key changes made to convert the Google Apps Script application to a standalone web application for GitHub Pages.

## Key Changes

### 1. Backend Replacement
- **Before**: Google Apps Script (`code.js`) with `google.script.run` calls
- **After**: Client-side `data-service.js` using Google Sheets API v4

### 2. Data Fetching
- **Before**: `callServer('getQuickStats')` → `google.script.run.getQuickStats()`
- **After**: `dataService.getQuickStats()` → Direct API calls

### 3. Page Loading
- **Before**: `google.script.run.getPageContent(route)` → Server-side template rendering
- **After**: `fetch('${route}.html')` → Client-side HTML loading

### 4. Configuration
- **Before**: Hardcoded `SPREADSHEET_ID` in `code.js`
- **After**: `config.js` with `SPREADSHEET_ID` and `API_KEY`

## Function Mapping

| Old (Google Apps Script) | New (Client-Side) |
|-------------------------|-------------------|
| `callServer('getQuickStats')` | `dataService.getQuickStats()` |
| `callServer('getActivities')` | `dataService.getActivities()` |
| `callServer('getMunicipalities')` | `dataService.getMunicipalities()` |
| `callServer('getDirectory', [type])` | `dataService.getDirectory(type)` |
| `callServer('getReferenceFiles')` | `dataService.getReferenceFiles()` |
| `callServer('getFMAProfile')` | `dataService.getFMAProfile()` |
| `callServer('getImplementationStructure')` | `dataService.getImplementationStructure()` |
| `callServer('searchAll', [query])` | `dataService.searchAll(query)` |
| `callServer('exportDirectoryToCSV', [type])` | `dataService.exportDirectoryToCSV(data)` |

## CSV Export Changes

**Before:**
```javascript
const csv = await callServer('exportDirectoryToCSV', [type]);
```

**After:**
```javascript
const data = await dataService.getDirectory(type);
const csv = dataService.exportDirectoryToCSV(data);
```

## Required Setup

1. **Google Sheets API Key**: Get from Google Cloud Console
2. **Public Sheet**: Make your Google Sheet publicly accessible
3. **API Restrictions**: Restrict API key to Google Sheets API only
4. **HTTP Referrer**: Add GitHub Pages URL to API key restrictions

## Files Changed

- `code.js` → Replaced by `data-service.js`
- `scripts.html` → Replaced by `app.js`
- `layout.html` → Replaced by `index.html`
- New: `config.js` (configuration)
- New: `data-service.js` (data fetching)
- New: `app.js` (main application logic)

## Files Unchanged

All HTML page templates remain the same:
- `index.html` (home page content)
- `activities.html`
- `directory.html`
- `municipalities.html`
- `references.html`
- `search.html`
- `structure.html`
- `fmaprofile.html`
- `about.html`
- `learnmore.html`
- `styles.html`

## Testing Checklist

- [ ] Update `config.js` with your Spreadsheet ID and API Key
- [ ] Make Google Sheet publicly accessible
- [ ] Test all pages load correctly
- [ ] Test data fetching for each page
- [ ] Test search functionality
- [ ] Test CSV export
- [ ] Test filters on all pages
- [ ] Verify responsive design
- [ ] Check browser console for errors

## Known Limitations

1. **API Key Exposure**: API key is visible in client-side code. Mitigate by:
   - Restricting API key to Google Sheets API only
   - Adding HTTP referrer restrictions
   - Setting usage quotas

2. **CORS**: Google Sheets API requires proper CORS headers (handled by API)

3. **Rate Limits**: Google Sheets API has rate limits. Caching helps reduce calls.

## Migration Steps

1. Copy all HTML files to new repository
2. Add `config.js` and update with your values
3. Add `data-service.js`
4. Add `app.js` (converted from `scripts.html`)
5. Update `index.html` (new main entry point)
6. Test locally
7. Push to GitHub
8. Enable GitHub Pages
9. Update API key restrictions with GitHub Pages URL

