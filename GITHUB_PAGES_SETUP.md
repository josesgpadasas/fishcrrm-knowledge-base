# GitHub Pages Deployment Guide

This guide will help you deploy the FishCRRM 1.1 Knowledge Base to GitHub Pages.

## Prerequisites

1. A GitHub account
2. A Google Sheets spreadsheet with your data
3. A Google Cloud API key with Sheets API enabled

## Step 1: Set Up Google Sheets API

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the **Google Sheets API**:
   - Go to "APIs & Services" > "Library"
   - Search for "Google Sheets API"
   - Click "Enable"
4. Create an API Key:
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "API Key"
   - Copy the API key
   - **Important**: Restrict the API key to "Google Sheets API" only for security
5. Make your Google Sheet publicly accessible:
   - Open your Google Sheet
   - Click "Share" > "Change to anyone with the link"
   - Set permission to "Viewer"

## Step 2: Configure the Application

1. Open `config.js` in your project
2. Update the following values:
   ```javascript
   SPREADSHEET_ID: 'YOUR_SPREADSHEET_ID_HERE',
   API_KEY: 'YOUR_API_KEY_HERE',
   ```
3. Get your Spreadsheet ID from the URL:
   ```
   https://docs.google.com/spreadsheets/d/[SPREADSHEET_ID]/edit
   ```

## Step 3: Create GitHub Repository

1. Create a new repository on GitHub
2. Name it (e.g., `fishcrrm-knowledge-base`)
3. Initialize with a README (optional)

## Step 4: Upload Files to GitHub

1. Clone your repository locally:
   ```bash
   git clone https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
   cd YOUR_REPO_NAME
   ```

2. Copy all project files to the repository:
   - `index.html`
   - `config.js`
   - `data-service.js`
   - `app.js`
   - All `.html` page files (activities.html, directory.html, etc.)
   - `styles.html`
   - `README.md`

3. Commit and push:
   ```bash
   git add .
   git commit -m "Initial commit: FishCRRM Knowledge Base"
   git push origin main
   ```

## Step 5: Enable GitHub Pages

1. Go to your repository on GitHub
2. Click "Settings" > "Pages"
3. Under "Source", select:
   - Branch: `main` (or `master`)
   - Folder: `/ (root)`
4. Click "Save"
5. Your site will be available at:
   ```
   https://YOUR_USERNAME.github.io/YOUR_REPO_NAME/
   ```

## Step 6: Security Considerations

### API Key Security

**Important**: Your API key will be visible in the client-side code. To minimize risk:

1. **Restrict the API Key**:
   - Go to Google Cloud Console > APIs & Services > Credentials
   - Click on your API key
   - Under "API restrictions", select "Restrict key"
   - Choose "Google Sheets API" only
   - Under "Application restrictions", you can add HTTP referrer restrictions:
     - Add: `https://YOUR_USERNAME.github.io/*`

2. **Use a Service Account** (Advanced):
   - For production, consider using a backend service
   - Keep API keys server-side only

3. **Monitor Usage**:
   - Set up usage quotas in Google Cloud Console
   - Monitor API usage regularly

## Step 7: Update Configuration After Deployment

After deploying, you may need to update the API key restrictions to include your GitHub Pages URL.

## Troubleshooting

### CORS Errors

If you see CORS errors:
- Ensure your Google Sheet is publicly accessible
- Check that the API key has proper restrictions
- Verify the Spreadsheet ID is correct

### Data Not Loading

1. Check browser console for errors
2. Verify API key is correct in `config.js`
3. Ensure Google Sheets API is enabled
4. Check that sheet names match exactly (case-sensitive)
5. Verify the sheet is publicly accessible

### 404 Errors on Navigation

- Ensure all HTML page files are in the root directory
- Check that file names match the ROUTES in `app.js`
- Verify GitHub Pages is serving from the root directory

## Custom Domain (Optional)

1. Add a `CNAME` file to your repository with your domain name
2. Configure DNS settings with your domain provider
3. Update GitHub Pages settings to use your custom domain

## Continuous Deployment

Every time you push changes to the `main` branch, GitHub Pages will automatically rebuild your site.

## Support

For issues or questions:
- Check the browser console for errors
- Review Google Cloud Console for API errors
- Verify all configuration values are correct

