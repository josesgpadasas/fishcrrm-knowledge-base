// Code.gs
const SPREADSHEET_ID = '1LDtZ9VOSgKI5B0c_GtmOhRJiTOA0sb_4dGD4wAJKfqc'; // ← REPLACE THIS
const CACHE = CacheService.getScriptCache();
const CACHE_TTL = 300; // 5 minutes

function doGet(e) {
  let page = e.parameter.page || 'home';
  if (page === 'home') page = 'index';

  return loadPage(page)
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setTitle('FishCRRM 1.1 Knowledge Base');
}

function loadPage(page) {
  const validPages = ['index', 'structure', 'municipalities', 'activities', 'directory', 'references', 'search', 'about', 'learnmore', 'fmaprofile'];
  if (!validPages.includes(page)) page = 'index';

  const contentTemplate = HtmlService.createTemplateFromFile(page);
  const content = contentTemplate.evaluate().getContent();

  const layout = HtmlService.createTemplateFromFile('layout');
  layout.content = content;
  layout.currentPage = page;

  return layout.evaluate();
}

function getPageContent(page) {
  const validPages = ['index', 'structure', 'municipalities', 'activities', 'directory', 'references', 'search', 'about', 'learnmore', 'fmaprofile'];
  if (!validPages.includes(page)) page = 'index';

  const template = HtmlService.createTemplateFromFile(page);
  return template.evaluate().getContent();
}

function include(filename) {
  return HtmlService.createTemplateFromFile(filename).evaluate().getContent();
}

// === DATA FETCHERS ===
function getQuickStats() {
  const cacheKey = 'quickstats';
  const cached = CACHE.get(cacheKey);
  if (cached) return JSON.parse(cached);

  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const stats = {
    internalCount: ss.getSheetByName('Internal_Directory').getLastRow() - 1,
    activitiesCount: ss.getSheetByName('Activities_Conducted').getLastRow() - 1,
    filesCount: ss.getSheetByName('Reference_Files').getLastRow() - 1
  };

  CACHE.put(cacheKey, JSON.stringify(stats), CACHE_TTL);
  return stats;
}

function getImplementationStructure() {
  return getSheetData('Implementation_Structure');
}

function getMunicipalities() {
  return getSheetData('FMA_6_&_9_Municipalities');
}

function getActivities() {
  return getSheetData('Activities_Conducted');
}

function getDirectory(type) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheet;
  if (type === 'internal') sheet = ss.getSheetByName('Internal_Directory');
  else if (type === 'external') sheet = ss.getSheetByName('External_Directory');
  else if (type === 'npmo') sheet = ss.getSheetByName('NPMO_Directory');
  else throw new Error('Invalid type');

  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  return data.slice(1).map(row => {
    const obj = {};
    headers.forEach((h, i) => obj[h.trim()] = row[i]);
    return obj;
  });
}

function getReferenceFiles() {
  return getSheetData('Reference_Files');
}

function getFMAProfile() {
  return getSheetData('FMA_Profile');
}

function searchAll(query) {
  query = query.toLowerCase().trim();
  if (!query) return { results: [], suggestions: [] };

  const sheets = [
    { name: 'Implementation_Structure', fields: ['COMPONENT', 'FULL_NAME', 'LEVEL', 'HEAD', 'COMPOSITION'] },
    { name: 'FMA_6_&_9_Municipalities', fields: ['FMA_ID', 'REGION', 'PROVINCE', 'MUNICIPALITY'] },
    { name: 'Activities_Conducted', fields: ['ACTIVITY_TITLE', 'DATE_CONDUCTED', 'LOCATION', 'RESOURCE_PERSON', 'REFERENCE_DOC'] },
    { name: 'Internal_Directory', fields: ['GIVEN_NAME', 'LAST_NAME', 'MIDDLE_INITIAL', 'COMPONENT', 'POSITION_DESIGNATION', 'EMPLOYMENT_TYPE', 'EMAIL'] },
    { name: 'External_Directory', fields: ['GIVEN_NAME', 'LAST_NAME', 'MIDDLE_INITIAL', 'OFFICE', 'POSITION_DESIGNATION', 'FMA_LEAD', 'EMAIL'] },
    { name: 'NPMO_Directory', fields: ['GIVEN_NAME', 'LAST_NAME', 'MIDDLE_INITIAL', 'OFFICE', 'POSITION_DESIGNATION', 'COMPONENT', 'EMAIL'] },
    { name: 'Reference_Files', fields: ['DOCUMENT_TITLE', 'FILE_URL', 'CATEGORY'] }
  ];

  const results = [];
  const seen = new Set();

  sheets.forEach(s => {
    const data = getSheetData(s.name);
    data.forEach(row => {
      let matchScore = 0;
      let matchedField = '';
      s.fields.forEach(f => {
        const val = row[f] ? row[f].toString().toLowerCase() : '';
        if (val.includes(query)) {
          matchScore += val === query ? 10 : 1;
          matchedField = f;
        }
      });
      if (matchScore > 0) {
        const key = `${s.name}_${JSON.stringify(row)}`;
        if (!seen.has(key)) {
          seen.add(key);
          results.push({ ...row, _sheet: s.name, _score: matchScore, _field: matchedField });
        }
      }
    });
  });

  results.sort((a, b) => b._score - a._score);
  const suggestions = [...new Set(results.slice(0, 5).map(r => r[r._field]).filter(Boolean))];

  return { results: results.slice(0, 50), suggestions };
}

function getSheetData(sheetName) {
  const cacheKey = `sheet_${sheetName}`;
  const cached = CACHE.get(cacheKey);
  if (cached) return JSON.parse(cached);

  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet || sheet.getLastRow() <= 1) return [];

  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const rows = data.slice(1).map(row => {
    const obj = {};
    headers.forEach((h, i) => obj[h] = row[i] || '');
    return obj;
  });

  CACHE.put(cacheKey, JSON.stringify(rows), CACHE_TTL);
  return rows;
}

function exportDirectoryToCSV(type) {
  const data = getDirectory(type);
  if (!data.length) return '';
  const headers = Object.keys(data[0]).filter(h => !h.startsWith('_'));
  const csv = [
    headers.join(','),
    ...data.map(row => headers.map(h => `"${(row[h] || '').toString().replace(/"/g, '""')}"`).join(','))
  ].join('\n');
  return 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv);
}