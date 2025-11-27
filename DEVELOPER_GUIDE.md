# Developer Guide

Comprehensive guide for developers working on the FishCRRM 1.1 Knowledge Base.

## 📋 Table of Contents

- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Project Architecture](#project-architecture)
- [Code Structure](#code-structure)
- [Adding New Features](#adding-new-features)
- [Styling Guidelines](#styling-guidelines)
- [Testing](#testing)
- [Debugging](#debugging)
- [Performance Optimization](#performance-optimization)
- [Best Practices](#best-practices)
- [Common Patterns](#common-patterns)
- [Troubleshooting](#troubleshooting)

## 🚀 Getting Started

### Prerequisites

- Google Account with Apps Script access
- Basic knowledge of:
  - HTML/CSS/JavaScript
  - Google Apps Script
  - Google Sheets API
  - Bootstrap 5.3.3

### Development Environment Setup

1. **Clone or Download Project**
   ```bash
   # Download project files
   # Ensure all HTML files and code.js are available
   ```

2. **Set Up Google Apps Script Project**
   - Go to [script.google.com](https://script.google.com/)
   - Create new project
   - Upload all files

3. **Configure Spreadsheet**
   - Create or use existing Google Sheet
   - Update `SPREADSHEET_ID` in `Code.gs`
   - Set up required sheets

4. **Test Locally**
   - Use Apps Script editor's test functions
   - Deploy as web app for full testing

## 🔄 Development Workflow

### 1. Making Changes

**Backend Changes (`Code.gs`):**
```javascript
// 1. Edit code in Apps Script editor
// 2. Save (Ctrl+S / Cmd+S)
// 3. Test using test functions or web app
// 4. Deploy new version if needed
```

**Frontend Changes (HTML files):**
```javascript
// 1. Edit HTML/CSS/JS in Apps Script editor
// 2. Save changes
// 3. Refresh web app to see changes
// 4. Clear browser cache if needed
```

### 2. Testing Changes

**Quick Test:**
1. Save files in Apps Script editor
2. Refresh web app URL
3. Test functionality
4. Check browser console for errors

**Full Test:**
1. Test on different pages
2. Test with different data
3. Test responsive design
4. Test error scenarios

### 3. Deploying Changes

**Development Deployment:**
1. Click "Deploy" → "Manage deployments"
2. Click "Edit" on existing deployment
3. Select "New version"
4. Click "Deploy"
5. Test new version

**Production Deployment:**
1. Test thoroughly in development
2. Create new deployment version
3. Update version description
4. Deploy
5. Monitor for issues

### 4. Version Control

**Best Practices:**
- Keep local backups of all files
- Document changes in version history
- Test before deploying
- Use descriptive version descriptions

## 🏗️ Project Architecture

### File Organization

```
Project/
├── Code.gs (code.js)          # Backend logic
├── layout.html                # Main layout wrapper
├── Page Templates/           # Individual pages
│   ├── index.html
│   ├── structure.html
│   └── ...
├── Component Templates/       # Reusable components
│   ├── pagenavbar.html
│   ├── pagefooter.html
│   └── pagetoast.html
└── Assets/
    ├── scripts.html           # Client-side JavaScript
    └── styles.html            # CSS styles
```

### Data Flow

```
User Action
    ↓
Client-Side (scripts.html)
    ↓
google.script.run
    ↓
Backend (Code.gs)
    ↓
Google Sheets API
    ↓
Cache (optional)
    ↓
Response
    ↓
Client-Side Rendering
```

### Routing System

**Hash-Based Routing:**
```javascript
// Navigation
navigate('#references')  // Changes page

// URL Structure
https://script.google.com/.../exec#references
https://script.google.com/.../exec#activities?year=2024
```

**Route Configuration:**
```javascript
// In scripts.html
const ROUTES = {
  'home': 'index',
  'references': 'references',
  // ... more routes
};
```

## 💻 Code Structure

### Backend Structure (`Code.gs`)

**Sections:**
1. **Constants**: Configuration values
2. **Entry Point**: `doGet()` function
3. **Page Loading**: Template functions
4. **Data Fetching**: Sheet data functions
5. **Search**: Search functionality
6. **Export**: CSV export functions
7. **Utilities**: Helper functions

**Function Naming:**
- `get*()` - Data fetching functions
- `load*()` - Page loading functions
- `export*()` - Export functions
- `search*()` - Search functions

### Frontend Structure (`scripts.html`)

**Sections:**
1. **Configuration**: Routes, constants
2. **Utilities**: Helper functions
3. **Navigation**: Routing functions
4. **Data Loading**: Page-specific loaders
5. **Event Handlers**: User interactions
6. **Initialization**: App startup

**Function Naming:**
- `load*()` - Data loading functions
- `render*()` - UI rendering functions
- `handle*()` - Event handlers
- `format*()` - Data formatting

### Styling Structure (`styles.html`)

**Sections:**
1. **Bootstrap Overrides**: Custom Bootstrap styles
2. **Global Styles**: Base styles
3. **Component Styles**: Page-specific styles
4. **Animations**: CSS animations
5. **Responsive**: Media queries

## ➕ Adding New Features

### Adding a New Page

**Step 1: Create HTML Template**
```html
<!-- newpage.html -->
<div class="container">
  <h1>New Page</h1>
  <div id="newpage-content">
    <!-- Content here -->
  </div>
</div>
```

**Step 2: Add to Backend**
```javascript
// In Code.gs
function loadPage(page) {
  const validPages = [
    // ... existing pages
    'newpage'  // Add here
  ];
  // ... rest of function
}
```

**Step 3: Add Route**
```javascript
// In scripts.html
const ROUTES = {
  // ... existing routes
  'newpage': 'newpage'
};
```

**Step 4: Add Navigation**
```html
<!-- In pagenavbar.html -->
<li class="nav-item">
  <a class="nav-link" href="#newpage">New Page</a>
</li>
```

**Step 5: Add Data Loading (if needed)**
```javascript
// In scripts.html
function initPage(page, hash) {
  // ... existing pages
  if (page === 'newpage') loadNewPage();
}

async function loadNewPage() {
  try {
    const data = await callServer('getNewPageData');
    // Render data
  } catch (err) {
    console.error('Error loading new page:', err);
  }
}
```

### Adding a New Data Source

**Step 1: Create Sheet**
- Create new sheet in Google Sheets
- Add column headers
- Populate with data

**Step 2: Add Backend Function**
```javascript
// In Code.gs
function getNewData() {
  return getSheetData('New_Sheet_Name');
}
```

**Step 3: Use in Frontend**
```javascript
// In scripts.html
async function loadNewData() {
  const data = await callServer('getNewData');
  // Process and render data
}
```

### Adding a New Filter

**Example: Adding Category Filter**
```javascript
// In scripts.html
async function loadReferences() {
  const container = document.getElementById('references-list');
  const categoryFilter = document.getElementById('category-filter');
  
  // Get data
  const data = await callServer('getReferenceFiles');
  
  // Extract unique categories
  const categories = [...new Set(data.map(item => item.CATEGORY))];
  
  // Populate filter
  categoryFilter.innerHTML = '<option value="">All Categories</option>' +
    categories.map(cat => `<option value="${cat}">${cat}</option>`).join('');
  
  // Add event listener
  categoryFilter.addEventListener('change', () => {
    filterReferences();
  });
  
  function filterReferences() {
    const selectedCategory = categoryFilter.value;
    const filtered = data.filter(item => 
      !selectedCategory || item.CATEGORY === selectedCategory
    );
    renderReferences(filtered);
  }
}
```

## 🎨 Styling Guidelines

### Color Scheme

**Primary Colors:**
```css
--primary-dark: #151269;  /* Navbar, titles, icons */
--footer-color: #0f1056;  /* Footer, buttons */
```

**Usage:**
```css
/* Titles and Icons */
.title {
  color: #151269;
}

/* Buttons */
.btn-primary {
  background: #0f1056;
}
```

### Component Styling

**Glassmorphism Cards:**
```css
.glass-card {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 12px;
}
```

**Consistent Spacing:**
```css
/* Use Bootstrap spacing utilities */
.mb-4  /* margin-bottom: 1.5rem */
.p-3   /* padding: 1rem */
.g-4   /* gap: 1.5rem */
```

### Responsive Design

**Breakpoints:**
```css
/* Mobile: < 576px */
@media (max-width: 575.98px) { }

/* Tablet: 576px - 992px */
@media (min-width: 576px) and (max-width: 991.98px) { }

/* Desktop: > 992px */
@media (min-width: 992px) { }
```

**Mobile-First Approach:**
```css
/* Base styles for mobile */
.container {
  padding: 1rem;
}

/* Override for larger screens */
@media (min-width: 992px) {
  .container {
    padding: 2rem;
  }
}
```

## 🧪 Testing

### Manual Testing Checklist

**Navigation:**
- [ ] All navbar links work
- [ ] Browser back/forward works
- [ ] Page persists on refresh
- [ ] Quick links work

**Data Loading:**
- [ ] All pages load data correctly
- [ ] Loading spinners appear
- [ ] Error messages display properly
- [ ] Empty states handled

**Filters:**
- [ ] All filters work correctly
- [ ] Multiple filters combine properly
- [ ] Filter resets work
- [ ] Search filters work

**Responsive:**
- [ ] Mobile layout works
- [ ] Tablet layout works
- [ ] Desktop layout works
- [ ] Touch interactions work

### Testing Functions

**Backend Testing:**
```javascript
// In Code.gs, create test function
function testGetQuickStats() {
  const stats = getQuickStats();
  Logger.log(stats);
  return stats;
}
```

**Frontend Testing:**
```javascript
// In browser console
loadQuickStats();
loadReferences();
// Check results
```

## 🐛 Debugging

### Browser Console

**Check for Errors:**
```javascript
// Open browser console (F12)
// Look for red error messages
// Check network tab for failed requests
```

**Debug Data Loading:**
```javascript
// In scripts.html, add logging
async function loadReferences() {
  console.log('Loading references...');
  try {
    const data = await callServer('getReferenceFiles');
    console.log('Data loaded:', data);
    // ... rest of function
  } catch (err) {
    console.error('Error:', err);
  }
}
```

### Apps Script Execution Log

**View Logs:**
1. Open Apps Script editor
2. Click "Executions" tab
3. View execution logs
4. Check for errors

**Add Logging:**
```javascript
// In Code.gs
function getQuickStats() {
  Logger.log('Fetching quick stats...');
  const stats = {
    // ... stats
  };
  Logger.log('Stats:', stats);
  return stats;
}
```

### Common Debugging Scenarios

**Data Not Loading:**
```javascript
// Check sheet name
console.log('Sheet name:', 'Activities_Conducted');

// Check data structure
const data = await callServer('getActivities');
console.log('First item:', data[0]);
console.log('Keys:', Object.keys(data[0]));
```

**Navigation Issues:**
```javascript
// Check current hash
console.log('Current hash:', window.location.hash);

// Check route mapping
console.log('Route:', ROUTES['references']);

// Test navigation
navigate('#references');
```

## ⚡ Performance Optimization

### Caching Strategy

**Backend Caching:**
```javascript
// Already implemented in getSheetData()
const cacheKey = `sheet_${sheetName}`;
const cached = CACHE.get(cacheKey);
if (cached) return JSON.parse(cached);
// ... fetch and cache
```

**Frontend Caching:**
```javascript
// Cache data in memory
let cachedData = null;

async function loadData() {
  if (cachedData) return cachedData;
  cachedData = await callServer('getData');
  return cachedData;
}
```

### Lazy Loading

**Load Data on Demand:**
```javascript
// Only load when page is visible
function initPage(page, hash) {
  if (page === 'references') {
    // Load immediately
    loadReferences();
  } else if (page === 'activities') {
    // Load when user interacts
    document.getElementById('load-activities').addEventListener('click', loadActivities);
  }
}
```

### Debouncing

**Search Input:**
```javascript
// Already implemented
const debouncedSearch = debounce(handleSearch, 300);
searchInput.addEventListener('input', debouncedSearch);
```

## ✅ Best Practices

### Code Organization

1. **Separate Concerns**
   - Backend: Data fetching
   - Frontend: UI rendering
   - Styles: Visual presentation

2. **Consistent Naming**
   - Functions: camelCase
   - Constants: UPPER_SNAKE_CASE
   - CSS Classes: kebab-case

3. **Comment Complex Logic**
   ```javascript
   // Calculate match score
   // Exact match = 10 points, partial = 1 point
   if (val === query) matchScore += 10;
   else if (val.includes(query)) matchScore += 1;
   ```

### Error Handling

**Always Handle Errors:**
```javascript
try {
  const data = await callServer('getData');
  renderData(data);
} catch (err) {
  console.error('Error:', err);
  showError('Failed to load data');
}
```

**User-Friendly Messages:**
```javascript
catch (err) {
  showToast('Unable to load data. Please try again.', 'danger');
}
```

### Data Validation

**Validate Input:**
```javascript
function getDirectory(type) {
  const validTypes = ['internal', 'external', 'npmo'];
  if (!validTypes.includes(type)) {
    throw new Error('Invalid directory type');
  }
  // ... rest of function
}
```

**Sanitize Output:**
```javascript
// Escape HTML to prevent XSS
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
```

## 🔄 Common Patterns

### Data Loading Pattern

```javascript
async function loadPageData() {
  const container = document.getElementById('container');
  
  // Show loading
  container.innerHTML = '<div class="spinner">Loading...</div>';
  
  try {
    // Fetch data
    const data = await callServer('getData');
    
    // Render data
    renderData(data, container);
  } catch (err) {
    // Show error
    container.innerHTML = '<div class="alert alert-danger">Error loading data</div>';
  }
}
```

### Filter Pattern

```javascript
function setupFilters() {
  const searchInput = document.getElementById('search');
  const categoryFilter = document.getElementById('category');
  
  let filteredData = allData;
  
  function applyFilters() {
    filteredData = allData.filter(item => {
      const matchesSearch = !searchInput.value || 
        item.name.toLowerCase().includes(searchInput.value.toLowerCase());
      const matchesCategory = !categoryFilter.value || 
        item.category === categoryFilter.value;
      return matchesSearch && matchesCategory;
    });
    renderData(filteredData);
  }
  
  searchInput.addEventListener('input', applyFilters);
  categoryFilter.addEventListener('change', applyFilters);
}
```

### Modal Pattern

```javascript
// Open modal
function openModal(content) {
  const modal = new bootstrap.Modal(document.getElementById('myModal'));
  document.getElementById('modal-content').innerHTML = content;
  modal.show();
}

// Close modal
function closeModal() {
  const modal = bootstrap.Modal.getInstance(document.getElementById('myModal'));
  modal.hide();
}
```

## 🔧 Troubleshooting

### Common Issues

**Issue: Changes Not Appearing**
- **Solution:** Clear browser cache, hard refresh (Ctrl+F5)

**Issue: Data Not Loading**
- **Solution:** Check sheet names, verify SPREADSHEET_ID, check permissions

**Issue: Navigation Not Working**
- **Solution:** Check ROUTES object, verify navigate() function, check console errors

**Issue: Styling Issues**
- **Solution:** Verify styles.html included, check Bootstrap CDN, clear cache

### Getting Help

1. Check [README.md](README.md) troubleshooting section
2. Review [API.md](API.md) for function details
3. Check browser console for errors
4. Review Apps Script execution logs
5. Test in incognito mode

## 📚 Additional Resources

- [Google Apps Script Documentation](https://developers.google.com/apps-script)
- [Bootstrap 5.3 Documentation](https://getbootstrap.com/docs/5.3/)
- [Google Sheets API](https://developers.google.com/sheets/api)

---

**Last Updated:** November 26, 2025

