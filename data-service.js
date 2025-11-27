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
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${this.config.SPREADSHEET_ID}/values/${encodeURIComponent(sheetName)}?key=${this.config.API_KEY}`;
    
    console.log(`Fetching sheet: ${sheetName} from URL: ${url.replace(this.config.API_KEY, 'API_KEY_HIDDEN')}`);
    
    try {
      const response = await fetch(url);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`API Error for ${sheetName}:`, response.status, response.statusText, errorText);
        throw new Error(`Failed to fetch ${sheetName}: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log(`Received data for ${sheetName}:`, data);
      
      if (!data.values || data.values.length === 0) {
        console.warn(`No data values found in ${sheetName}`);
        return [];
      }

      // Convert rows to objects
      const headers = data.values[0].map(h => h.trim());
      console.log(`Headers for ${sheetName}:`, headers);
      
      const rows = data.values.slice(1).map(row => {
        const obj = {};
        headers.forEach((header, i) => {
          obj[header] = row[i] || '';
        });
        return obj;
      });

      console.log(`Converted ${rows.length} rows for ${sheetName}`);
      return rows;
    } catch (error) {
      console.error(`Error fetching ${sheetName}:`, error);
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
}

// Create global instance
const dataService = new DataService(CONFIG);

