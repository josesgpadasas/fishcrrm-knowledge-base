// Data Service - Fetches data from Google Sheets using the Sheets API
// Replaces Google Apps Script backend functions

class DataService {
  constructor(config) {
    this.config = config;
    this.cache = new Map();
    this.cacheTimestamps = new Map();
  }

  // Get data from cache or fetch from API
  async getCachedData(key, fetcher, ttl = this.config.CACHE_TTL) {
    const now = Date.now();
    const cached = this.cache.get(key);
    const timestamp = this.cacheTimestamps.get(key);

    if (cached && timestamp && (now - timestamp) < ttl) {
      return cached;
    }

    const data = await fetcher();
    this.cache.set(key, data);
    this.cacheTimestamps.set(key, now);
    return data;
  }

  // Fetch data from a Google Sheet
  async fetchSheetData(sheetName) {
    // Properly encode sheet name for URL (handles special characters like &, spaces, etc.)
    const encodedSheetName = encodeURIComponent(sheetName);
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${this.config.SPREADSHEET_ID}/values/${encodedSheetName}?key=${this.config.API_KEY}`;
    
    console.log(`Fetching sheet: "${sheetName}" (encoded: "${encodedSheetName}")`);
    console.log(`URL: ${url.replace(this.config.API_KEY, 'API_KEY_HIDDEN')}`);
    
    try {
      const response = await fetch(url);
      
      if (!response.ok) {
        let errorText = '';
        try {
          errorText = await response.text();
          const errorJson = JSON.parse(errorText);
          console.error(`API Error for ${sheetName}:`, {
            status: response.status,
            statusText: response.statusText,
            error: errorJson.error || errorText
          });
          
          // Provide more helpful error messages
          if (response.status === 403) {
            throw new Error(`Access denied. Please check: 1) API key is valid, 2) Google Sheets API is enabled, 3) Sheet is shared publicly (Anyone with the link can view)`);
          } else if (response.status === 404) {
            throw new Error(`Sheet "${sheetName}" not found. Please verify the sheet name matches exactly (case-sensitive).`);
          } else if (response.status === 400) {
            throw new Error(`Invalid request. Check that the spreadsheet ID and sheet name are correct. Error: ${errorJson.error?.message || errorText}`);
          } else {
            throw new Error(`Failed to fetch ${sheetName}: ${response.status} ${response.statusText}. ${errorJson.error?.message || errorText}`);
          }
        } catch (parseError) {
          console.error(`Error parsing error response:`, parseError);
          throw new Error(`Failed to fetch ${sheetName}: ${response.status} ${response.statusText}. ${errorText || 'Unknown error'}`);
        }
      }
      
      const data = await response.json();
      console.log(`Received data for ${sheetName}:`, {
        hasValues: !!data.values,
        rowCount: data.values ? data.values.length : 0,
        range: data.range
      });
      
      if (!data.values || data.values.length === 0) {
        console.warn(`No data values found in ${sheetName}. Sheet may be empty or sheet name may be incorrect.`);
        return [];
      }

      // Convert rows to objects
      const headers = data.values[0].map(h => (h || '').toString().trim());
      console.log(`Headers for ${sheetName} (${headers.length} columns):`, headers);
      
      // Filter out completely empty rows
      const rows = data.values.slice(1)
        .map(row => {
          const obj = {};
          headers.forEach((header, i) => {
            obj[header] = (row[i] || '').toString();
          });
          return obj;
        })
        .filter(row => {
          // Keep row if at least one field has a value
          return Object.values(row).some(val => val.trim() !== '');
        });

      console.log(`Converted ${rows.length} rows for ${sheetName} (from ${data.values.length - 1} total rows)`);
      return rows;
    } catch (error) {
      console.error(`Error fetching ${sheetName}:`, error);
      // Re-throw with more context
      if (error.message && !error.message.includes('Sheet')) {
        throw new Error(`Error fetching "${sheetName}": ${error.message}`);
      }
      throw error;
    }
  }

  // Get sheet data with caching
  async getSheetData(sheetName) {
    return this.getCachedData(
      `sheet_${sheetName}`,
      () => this.fetchSheetData(sheetName)
    );
  }

  // Get quick statistics
  async getQuickStats() {
    return this.getCachedData(
      'quickstats',
      async () => {
        const [internal, activities, files] = await Promise.all([
          this.getSheetData(this.config.SHEETS.INTERNAL_DIRECTORY),
          this.getSheetData(this.config.SHEETS.ACTIVITIES),
          this.getSheetData(this.config.SHEETS.REFERENCE_FILES)
        ]);

        return {
          internalCount: internal.length,
          activitiesCount: activities.length,
          filesCount: files.length
        };
      }
    );
  }

  // Get implementation structure
  async getImplementationStructure() {
    return this.getSheetData(this.config.SHEETS.IMPLEMENTATION_STRUCTURE);
  }

  // Get municipalities
  async getMunicipalities() {
    return this.getSheetData(this.config.SHEETS.MUNICIPALITIES);
  }

  // Get activities
  async getActivities() {
    return this.getSheetData(this.config.SHEETS.ACTIVITIES);
  }

  // Get directory by type
  async getDirectory(type) {
    let sheetName;
    if (type === 'internal') {
      sheetName = this.config.SHEETS.INTERNAL_DIRECTORY;
    } else if (type === 'external') {
      sheetName = this.config.SHEETS.EXTERNAL_DIRECTORY;
    } else if (type === 'npmo') {
      sheetName = this.config.SHEETS.NPMO_DIRECTORY;
    } else {
      throw new Error('Invalid directory type');
    }

    return this.getSheetData(sheetName);
  }

  // Get reference files
  async getReferenceFiles() {
    return this.getSheetData(this.config.SHEETS.REFERENCE_FILES);
  }

  // Get FMA profile
  async getFMAProfile() {
    return this.getSheetData(this.config.SHEETS.FMA_PROFILE);
  }

  // Search across all sheets
  async searchAll(query) {
    query = query.toLowerCase().trim();
    if (!query) return { results: [], suggestions: [] };

    const sheets = [
      { name: this.config.SHEETS.IMPLEMENTATION_STRUCTURE, fields: ['COMPONENT', 'FULL_NAME', 'LEVEL', 'HEAD', 'COMPOSITION'] },
      { name: this.config.SHEETS.MUNICIPALITIES, fields: ['FMA_ID', 'REGION', 'PROVINCE', 'MUNICIPALITY'] },
      { name: this.config.SHEETS.ACTIVITIES, fields: ['ACTIVITY_TITLE', 'DATE_CONDUCTED', 'LOCATION', 'RESOURCE_PERSON', 'REFERENCE_DOC'] },
      { name: this.config.SHEETS.INTERNAL_DIRECTORY, fields: ['GIVEN_NAME', 'LAST_NAME', 'MIDDLE_INITIAL', 'COMPONENT', 'POSITION_DESIGNATION', 'EMPLOYMENT_TYPE', 'EMAIL'] },
      { name: this.config.SHEETS.EXTERNAL_DIRECTORY, fields: ['GIVEN_NAME', 'LAST_NAME', 'MIDDLE_INITIAL', 'OFFICE', 'POSITION_DESIGNATION', 'FMA_LEAD', 'EMAIL'] },
      { name: this.config.SHEETS.NPMO_DIRECTORY, fields: ['GIVEN_NAME', 'LAST_NAME', 'MIDDLE_INITIAL', 'OFFICE', 'POSITION_DESIGNATION', 'COMPONENT', 'EMAIL'] },
      { name: this.config.SHEETS.REFERENCE_FILES, fields: ['DOCUMENT_TITLE', 'FILE_URL', 'CATEGORY'] }
    ];

    const results = [];
    const seen = new Set();

    for (const sheet of sheets) {
      try {
        const data = await this.getSheetData(sheet.name);
        data.forEach(row => {
          let matchScore = 0;
          let matchedField = '';
          sheet.fields.forEach(f => {
            const val = row[f] ? row[f].toString().toLowerCase() : '';
            if (val.includes(query)) {
              matchScore += val === query ? 10 : 1;
              matchedField = f;
            }
          });
          if (matchScore > 0) {
            const key = `${sheet.name}_${JSON.stringify(row)}`;
            if (!seen.has(key)) {
              seen.add(key);
              results.push({ ...row, _sheet: sheet.name, _score: matchScore, _field: matchedField });
            }
          }
        });
      } catch (error) {
        console.error(`Error searching ${sheet.name}:`, error);
      }
    }

    results.sort((a, b) => b._score - a._score);
    const suggestions = [...new Set(results.slice(0, 5).map(r => r[r._field]).filter(Boolean))];

    return { results: results.slice(0, 50), suggestions };
  }

  // Export directory to CSV
  exportDirectoryToCSV(data) {
    if (!data || data.length === 0) return '';

    const headers = Object.keys(data[0]).filter(h => !h.startsWith('_'));
    const csv = [
      headers.join(','),
      ...data.map(row => headers.map(h => `"${(row[h] || '').toString().replace(/"/g, '""')}"`).join(','))
    ].join('\n');
    
    return 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv);
  }

  // Clear cache
  clearCache() {
    this.cache.clear();
    this.cacheTimestamps.clear();
  }

  // Test connection to spreadsheet (useful for debugging)
  async testConnection() {
    try {
      const url = `https://sheets.googleapis.com/v4/spreadsheets/${this.config.SPREADSHEET_ID}?key=${this.config.API_KEY}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        const errorText = await response.text();
        let errorJson;
        try {
          errorJson = JSON.parse(errorText);
        } catch {
          errorJson = { message: errorText };
        }
        
        return {
          success: false,
          error: {
            status: response.status,
            statusText: response.statusText,
            message: errorJson.error?.message || errorText
          }
        };
      }
      
      const data = await response.json();
      return {
        success: true,
        spreadsheet: {
          title: data.properties?.title,
          sheets: data.sheets?.map(s => s.properties?.title) || []
        }
      };
    } catch (error) {
      return {
        success: false,
        error: {
          message: error.message
        }
      };
    }
  }
}

// Create global instance
const dataService = new DataService(CONFIG);

// Helper function to test connection (can be called from browser console)
window.testDataServiceConnection = async () => {
  console.log('Testing connection to Google Sheets...');
  const result = await dataService.testConnection();
  if (result.success) {
    console.log('✅ Connection successful!');
    console.log('Spreadsheet title:', result.spreadsheet.title);
    console.log('Available sheets:', result.spreadsheet.sheets);
    console.log('Expected sheets:', Object.values(CONFIG.SHEETS));
    
    // Check if all expected sheets exist
    const expectedSheets = Object.values(CONFIG.SHEETS);
    const availableSheets = result.spreadsheet.sheets;
    const missingSheets = expectedSheets.filter(sheet => !availableSheets.includes(sheet));
    
    if (missingSheets.length > 0) {
      console.warn('⚠️ Missing sheets:', missingSheets);
      console.warn('Available sheets:', availableSheets);
    } else {
      console.log('✅ All expected sheets are present!');
    }
  } else {
    console.error('❌ Connection failed:', result.error);
    if (result.error.status === 403) {
      console.error('This usually means:');
      console.error('1. API key is invalid or restricted');
      console.error('2. Google Sheets API is not enabled');
      console.error('3. Spreadsheet is not shared publicly');
    }
  }
  return result;
};

