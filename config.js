// Configuration for FishCRRM 1.1 Knowledge Base
// Replace these values with your own Google Sheets configuration

const CONFIG = {
  // Google Sheets Spreadsheet ID
  // Get this from your Google Sheet URL: https://docs.google.com/spreadsheets/d/[SPREADSHEET_ID]/edit
  SPREADSHEET_ID: '1LDtZ9VOSgKI5B0c_GtmOhRJiTOA0sb_4dGD4wAJKfqc',
  
  // Google Sheets API Key (for public sheets)
  // Get one from: https://console.cloud.google.com/apis/credentials
  // Make sure to restrict it to Google Sheets API only for security
  API_KEY: 'AIzaSyA8rhOdsRv9fIt2zGC7_3XYEZ5jOBOjb9M',
  
  // Cache settings
  CACHE_TTL: 300000, // 5 minutes in milliseconds
  
  // Sheet names (must match exactly)
  SHEETS: {
    INTERNAL_DIRECTORY: 'Internal_Directory',
    EXTERNAL_DIRECTORY: 'External_Directory',
    NPMO_DIRECTORY: 'NPMO_Directory',
    ACTIVITIES: 'Activities_Conducted',
    MUNICIPALITIES: 'FMA_6_&_9_Municipalities',
    REFERENCE_FILES: 'Reference_Files',
    IMPLEMENTATION_STRUCTURE: 'Implementation_Structure',
    FMA_PROFILE: 'FMA_Profile'
  }
};

// Make sure the sheet is published to the web or accessible via API
// For public access: File > Share > Anyone with the link can view

