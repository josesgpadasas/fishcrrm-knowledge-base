# API Documentation

Complete reference for all backend functions in the FishCRRM 1.1 Knowledge Base.

## 📋 Table of Contents

- [Overview](#overview)
- [Entry Point Functions](#entry-point-functions)
- [Page Loading Functions](#page-loading-functions)
- [Data Fetching Functions](#data-fetching-functions)
- [Search Functions](#search-functions)
- [Utility Functions](#utility-functions)
- [Error Handling](#error-handling)
- [Caching](#caching)

## 🎯 Overview

All backend functions are implemented in Google Apps Script (`Code.gs`). Functions are called from the client-side using `google.script.run` or accessed via HTTP GET requests.

### Function Categories

1. **Entry Point**: `doGet()` - Handles web app requests
2. **Page Loading**: `loadPage()`, `getPageContent()`, `include()`
3. **Data Fetching**: `getQuickStats()`, `getSheetData()`, `getDirectory()`, etc.
4. **Search**: `searchAll()`
5. **Export**: `exportDirectoryToCSV()`

## 🚪 Entry Point Functions

### `doGet(e)`

Entry point for all web app requests. Handles initial page loads.

**Parameters:**
- `e` (Object): Event object containing request parameters
  - `e.parameter.page` (String, optional): Page name to load (default: 'home')

**Returns:**
- `HtmlOutput`: HTML page with layout and content

**Example:**
```javascript
// URL: https://script.google.com/.../exec?page=references
// Loads the references page
```

**Implementation:**
```javascript
function doGet(e) {
  let page = e.parameter.page || 'home';
  if (page === 'home') page = 'index';

  return loadPage(page)
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setTitle('FishCRRM 1.1 Knowledge Base');
}
```

**Notes:**
- Automatically converts 'home' to 'index'
- Sets XFrameOptions to allow embedding
- Adds responsive viewport meta tag
- Sets page title

## 📄 Page Loading Functions

### `loadPage(page)`

Loads a page template with the main layout wrapper.

**Parameters:**
- `page` (String): Page name (e.g., 'index', 'references', 'activities')

**Returns:**
- `HtmlOutput`: Complete HTML page with layout, navbar, footer, and content

**Valid Pages:**
- `index` - Home/Dashboard
- `structure` - Implementation Structure
- `municipalities` - Municipalities listing
- `activities` - Activities timeline
- `directory` - Directory (Internal/External/NPMO)
- `references` - Reference documents
- `search` - Search page
- `about` - About page
- `learnmore` - Learn More page
- `fmaprofile` - FMA Profile page

**Example:**
```javascript
// Server-side
const html = loadPage('references');

// Client-side
google.script.run
  .withSuccessHandler(html => {
    document.getElementById('content').innerHTML = html;
  })
  .loadPage('references');
```

**Error Handling:**
- Invalid page names default to 'index'
- Missing templates will throw an error

### `getPageContent(page)`

Returns page HTML content without layout (for SPA navigation).

**Parameters:**
- `page` (String): Page name

**Returns:**
- `String`: HTML content of the page (without layout)

**Example:**
```javascript
// Client-side (SPA navigation)
google.script.run
  .withSuccessHandler(html => {
    document.getElementById('page-content').innerHTML = html;
  })
  .getPageContent('references');
```

**Use Case:**
- Used for client-side routing in Single Page Application
- Faster than full page reload
- Maintains application state

### `include(filename)`

Includes a partial template file (navbar, footer, etc.).

**Parameters:**
- `filename` (String): Name of the template file (without .html extension)

**Returns:**
- `String`: HTML content of the included file

**Example:**
```javascript
// In layout.html
<?!= include('pagenavbar') ?>
<?!= include('pagefooter') ?>
```

**Common Includes:**
- `pagenavbar` - Navigation bar
- `pagefooter` - Footer section
- `pagetoast` - Toast notification container
- `scripts` - Client-side JavaScript
- `styles` - CSS styles

## 📊 Data Fetching Functions

### `getQuickStats()`

Fetches dashboard statistics (counts for personnel, activities, and files).

**Parameters:** None

**Returns:**
- `Object`: Statistics object with:
  - `internalCount` (Number): Number of internal directory entries
  - `activitiesCount` (Number): Number of activities
  - `filesCount` (Number): Number of reference files

**Example:**
```javascript
// Client-side
google.script.run
  .withSuccessHandler(stats => {
    document.getElementById('stat-internal').textContent = stats.internalCount;
    document.getElementById('stat-activities').textContent = stats.activitiesCount;
    document.getElementById('stat-files').textContent = stats.filesCount;
  })
  .getQuickStats();
```

**Caching:**
- Cache key: `quickstats`
- TTL: 5 minutes (300 seconds)

**Performance:**
- Uses cached data when available
- Calculates counts from sheet row numbers

### `getSheetData(sheetName)`

Generic function to fetch data from any Google Sheet.

**Parameters:**
- `sheetName` (String): Exact name of the sheet (case-sensitive)

**Returns:**
- `Array<Object>`: Array of objects, each representing a row
  - Keys are column headers
  - Values are cell values
  - Empty cells return empty strings

**Example:**
```javascript
// Server-side
const activities = getSheetData('Activities_Conducted');

// Client-side
google.script.run
  .withSuccessHandler(data => {
    console.log(data); // Array of activity objects
  })
  .getSheetData('Activities_Conducted');
```

**Data Structure:**
```javascript
[
  {
    ACTIVITY_TITLE: "Workshop on Fisheries Management",
    DATE_CONDUCTED: "2024-01-15",
    LOCATION: "Manila",
    RESOURCE_PERSON: "John Doe",
    REFERENCE_DOC: "https://example.com/doc.pdf"
  },
  // ... more rows
]
```

**Caching:**
- Cache key: `sheet_[SHEET_NAME]`
- TTL: 5 minutes (300 seconds)

**Error Handling:**
- Returns empty array if sheet doesn't exist
- Returns empty array if sheet has no data (only headers)

### `getDirectory(type)`

Fetches directory data for a specific type.

**Parameters:**
- `type` (String): Directory type
  - `'internal'` - NFRDI FishCore Personnel
  - `'external'` - External contacts
  - `'npmo'` - National Project Management Office personnel

**Returns:**
- `Array<Object>`: Array of directory entries

**Example:**
```javascript
// Client-side
google.script.run
  .withSuccessHandler(data => {
    renderDirectory(data);
  })
  .getDirectory('internal');
```

**Data Structure (Internal):**
```javascript
[
  {
    GIVEN_NAME: "John",
    LAST_NAME: "Doe",
    MIDDLE_INITIAL: "M",
    COMPONENT: "FishCRRM",
    POSITION_DESIGNATION: "Project Manager",
    EMPLOYMENT_TYPE: "Regular",
    EMAIL: "john.doe@example.com"
  },
  // ... more entries
]
```

**Data Structure (External):**
```javascript
[
  {
    GIVEN_NAME: "Jane",
    LAST_NAME: "Smith",
    MIDDLE_INITIAL: "A",
    OFFICE: "BFAR Region 6",
    POSITION_DESIGNATION: "Regional Director",
    FMA_LEAD: "FMA 6",
    EMAIL: "jane.smith@example.com"
  },
  // ... more entries
]
```

**Data Structure (NPMO):**
```javascript
[
  {
    GIVEN_NAME: "Bob",
    LAST_NAME: "Johnson",
    MIDDLE_INITIAL: "C",
    OFFICE: "NPMO",
    POSITION_DESIGNATION: "Assistant Director",
    COMPONENT: "FishCRRM",
    EMAIL: "bob.johnson@example.com"
  },
  // ... more entries
]
```

**Error Handling:**
- Throws error if type is invalid
- Returns empty array if sheet doesn't exist

**Notes:**
- Headers are trimmed of whitespace
- Empty cells are preserved as empty strings

### `getActivities()`

Fetches all activities from the Activities_Conducted sheet.

**Parameters:** None

**Returns:**
- `Array<Object>`: Array of activity objects

**Example:**
```javascript
// Client-side
google.script.run
  .withSuccessHandler(activities => {
    activities.forEach(activity => {
      console.log(activity.ACTIVITY_TITLE);
    });
  })
  .getActivities();
```

**Data Structure:**
```javascript
[
  {
    ACTIVITY_TITLE: "Training Workshop",
    DATE_CONDUCTED: "2024-01-15",
    LOCATION: "Manila",
    RESOURCE_PERSON: "John Doe",
    REFERENCE_DOC: "https://example.com/doc.pdf"
  },
  // ... more activities
]
```

**Implementation:**
- Wrapper around `getSheetData('Activities_Conducted')`

### `getMunicipalities()`

Fetches all municipalities from the FMA_6_&_9_Municipalities sheet.

**Parameters:** None

**Returns:**
- `Array<Object>`: Array of municipality objects

**Example:**
```javascript
// Client-side
google.script.run
  .withSuccessHandler(municipalities => {
    municipalities.forEach(municipality => {
      console.log(municipality.MUNICIPALITY);
    });
  })
  .getMunicipalities();
```

**Data Structure:**
```javascript
[
  {
    FMA_ID: "FMA 6",
    REGION: "Region VI",
    PROVINCE: "Iloilo",
    MUNICIPALITY: "Iloilo City"
  },
  // ... more municipalities
]
```

**Implementation:**
- Wrapper around `getSheetData('FMA_6_&_9_Municipalities')`

### `getReferenceFiles()`

Fetches all reference documents from the Reference_Files sheet.

**Parameters:** None

**Returns:**
- `Array<Object>`: Array of reference file objects

**Example:**
```javascript
// Client-side
google.script.run
  .withSuccessHandler(files => {
    files.forEach(file => {
      console.log(file.DOCUMENT_TITLE);
    });
  })
  .getReferenceFiles();
```

**Data Structure:**
```javascript
[
  {
    DOCUMENT_TITLE: "Operation Manual",
    FILE_URL: "https://example.com/manual.pdf",
    CATEGORY: "Manual"
  },
  // ... more files
]
```

**Implementation:**
- Wrapper around `getSheetData('Reference_Files')`

### `getFMAProfile()`

Fetches FMA profile data from the FMA_Profile sheet.

**Parameters:** None

**Returns:**
- `Array<Object>`: Array of FMA profile rows

**Example:**
```javascript
// Client-side
google.script.run
  .withSuccessHandler(profile => {
    profile.forEach(row => {
      console.log(row.KEY_CHARACTERISTICS);
      console.log(row['FMA 06']);
      console.log(row['FMA 09']);
    });
  })
  .getFMAProfile();
```

**Data Structure:**
```javascript
[
  {
    KEY_CHARACTERISTICS: "Total Area",
    MEASUREMENT: "Square Kilometers",
    "FMA 06": "1,234.56",
    "FMA 09": "2,345.67"
  },
  // ... more rows
]
```

**Notes:**
- Column names with spaces (e.g., "FMA 06") are preserved
- Text formatting is preserved (line breaks, spacing)

### `getImplementationStructure()`

Fetches implementation structure data from the Implementation_Structure sheet.

**Parameters:** None

**Returns:**
- `Array<Object>`: Array of structure entries

**Example:**
```javascript
// Client-side
google.script.run
  .withSuccessHandler(structure => {
    structure.forEach(entry => {
      console.log(entry.COMPONENT);
      console.log(entry.LEVEL);
    });
  })
  .getImplementationStructure();
```

**Data Structure:**
```javascript
[
  {
    COMPONENT: "NPMO",
    FULL_NAME: "National Project Management Office",
    LEVEL: "National",
    HEAD: "BFAR Director",
    COMPOSITION: "Assistant Directors, Specialists"
  },
  // ... more entries
]
```

**Implementation:**
- Wrapper around `getSheetData('Implementation_Structure')`

## 🔍 Search Functions

### `searchAll(query)`

Searches across all configured sheets for matching content.

**Parameters:**
- `query` (String): Search query (case-insensitive)

**Returns:**
- `Object`: Search results object
  - `results` (Array<Object>): Array of matching rows (max 50)
    - Each result includes original row data plus:
      - `_sheet` (String): Source sheet name
      - `_score` (Number): Match score (higher = better)
      - `_field` (String): Field that matched
  - `suggestions` (Array<String>): Array of suggested search terms (max 5)

**Example:**
```javascript
// Client-side
google.script.run
  .withSuccessHandler(data => {
    console.log(`Found ${data.results.length} results`);
    data.results.forEach(result => {
      console.log(`Match in ${result._sheet}: ${result._field}`);
    });
    console.log('Suggestions:', data.suggestions);
  })
  .searchAll('fisheries');
```

**Searchable Sheets and Fields:**

1. **Implementation_Structure**
   - `COMPONENT`, `FULL_NAME`, `LEVEL`, `HEAD`, `COMPOSITION`

2. **FMA_6_&_9_Municipalities**
   - `FMA_ID`, `REGION`, `PROVINCE`, `MUNICIPALITY`

3. **Activities_Conducted**
   - `ACTIVITY_TITLE`, `DATE_CONDUCTED`, `LOCATION`, `RESOURCE_PERSON`, `REFERENCE_DOC`

4. **Internal_Directory**
   - `GIVEN_NAME`, `LAST_NAME`, `MIDDLE_INITIAL`, `COMPONENT`, `POSITION_DESIGNATION`, `EMPLOYMENT_TYPE`, `EMAIL`

5. **External_Directory**
   - `GIVEN_NAME`, `LAST_NAME`, `MIDDLE_INITIAL`, `OFFICE`, `POSITION_DESIGNATION`, `FMA_LEAD`, `EMAIL`

6. **NPMO_Directory**
   - `GIVEN_NAME`, `LAST_NAME`, `MIDDLE_INITIAL`, `OFFICE`, `POSITION_DESIGNATION`, `COMPONENT`, `EMAIL`

7. **Reference_Files**
   - `DOCUMENT_TITLE`, `FILE_URL`, `CATEGORY`

**Scoring Algorithm:**
- Exact match: 10 points
- Partial match (contains): 1 point
- Results sorted by score (highest first)

**Deduplication:**
- Duplicate rows (same sheet + same data) are removed
- Highest-scored duplicate is kept

**Limits:**
- Maximum 50 results returned
- Maximum 5 suggestions

**Empty Query:**
- Returns `{ results: [], suggestions: [] }` if query is empty or only whitespace

## 📤 Export Functions

### `exportDirectoryToCSV(type)`

Exports directory data as CSV format.

**Parameters:**
- `type` (String): Directory type ('internal', 'external', or 'npmo')

**Returns:**
- `String`: Data URI for CSV file
  - Format: `data:text/csv;charset=utf-8,{encoded_csv}`

**Example:**
```javascript
// Client-side
google.script.run
  .withSuccessHandler(csvDataUri => {
    // Create download link
    const link = document.createElement('a');
    link.href = csvDataUri;
    link.download = 'directory.csv';
    link.click();
  })
  .exportDirectoryToCSV('internal');
```

**CSV Format:**
- Headers in first row
- Values quoted (double quotes escaped as "")
- Comma-separated
- UTF-8 encoded

**Empty Data:**
- Returns empty string if no data

**Filtered Columns:**
- Columns starting with `_` (internal metadata) are excluded

## 🔧 Utility Functions

### Constants

#### `SPREADSHEET_ID`
- **Type:** String
- **Description:** Google Sheets Spreadsheet ID
- **Example:** `'1LDtZ9VOSgKI5B0c_GtmOhRJiTOA0sb_4dGD4wAJKfqc'`
- **Note:** Must be updated with your spreadsheet ID

#### `CACHE`
- **Type:** CacheService
- **Description:** Google Apps Script CacheService instance
- **Usage:** Used for caching sheet data and statistics

#### `CACHE_TTL`
- **Type:** Number
- **Description:** Cache Time-To-Live in seconds
- **Default:** 300 (5 minutes)

## ⚠️ Error Handling

### Common Errors

#### Invalid Sheet Name
```javascript
// Error: Sheet not found
// Solution: Verify sheet name matches exactly (case-sensitive)
```

#### Invalid Directory Type
```javascript
// Error: Invalid type
// Solution: Use 'internal', 'external', or 'npmo'
```

#### Missing Spreadsheet ID
```javascript
// Error: Cannot open spreadsheet
// Solution: Update SPREADSHEET_ID constant
```

### Error Response Format

Functions that throw errors will be caught by `google.script.run.withFailureHandler()`:

```javascript
google.script.run
  .withSuccessHandler(data => {
    // Handle success
  })
  .withFailureHandler(error => {
    console.error('Error:', error.message);
    // Handle error
  })
  .getDirectory('invalid'); // Will trigger failure handler
```

## 💾 Caching

### Cache Strategy

All data fetching functions use Google Apps Script CacheService:

- **Cache Key Format:**
  - Statistics: `quickstats`
  - Sheet Data: `sheet_[SHEET_NAME]`

- **TTL:** 300 seconds (5 minutes)

- **Benefits:**
  - Reduces API calls to Google Sheets
  - Improves response time
  - Reduces quota usage

### Cache Invalidation

Cache is automatically invalidated after TTL expires. To force refresh:

1. Wait for TTL to expire (5 minutes)
2. Clear cache programmatically (not implemented in current version)
3. Modify cache key (development only)

### Cache Limitations

- Maximum cache size: 100KB per key
- Maximum cache duration: 6 hours
- Cache is shared across all users

## 📝 Notes

- All functions are synchronous
- Functions return data directly (no promises)
- Client-side uses `google.script.run` for async calls
- All sheet names are case-sensitive
- Empty cells are returned as empty strings
- Dates are returned as strings (format depends on sheet)

## 🔗 Related Documentation

- [Developer Guide](DEVELOPER_GUIDE.md) - Development workflows and best practices
- [README](README.md) - Project overview and setup instructions

---

**Last Updated:** November 26, 2025

