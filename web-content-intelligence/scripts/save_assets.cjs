const fs = require('fs');
const path = require('path');

/**
 * Saves the extracted content to a JSON file.
 * Usage: node save_assets.cjs '<json_string>' [filename]
 */

const rawData = process.argv[2];
const customFilename = process.argv[3];

if (!rawData) {
    console.error('Error: No data provided to save.');
    process.exit(1);
}

try {
    // Attempt to clean the string if it contains markdown code blocks
    const cleanedData = rawData.replace(/```json/g, '').replace(/```/g, '').trim();
    const jsonData = JSON.parse(cleanedData);
    
    const filename = customFilename || `content_assets_${Date.now()}.json`;
    const filePath = path.resolve(process.cwd(), filename);
    
    fs.writeFileSync(filePath, JSON.stringify(jsonData, null, 4), 'utf8');
    console.log(`Successfully saved assets to: ${filePath}`);
    
    // Also output to stdout for the agent to see
    console.log(JSON.stringify(jsonData, null, 4));
} catch (error) {
    console.error('Error: Failed to parse or save JSON.');
    console.error(error.message);
    // If parsing fails, save the raw text as a fallback to avoid data loss
    const fallbackPath = path.resolve(process.cwd(), 'raw_content_fallback.txt');
    fs.writeFileSync(fallbackPath, rawData, 'utf8');
    console.log(`Saved raw content to fallback file: ${fallbackPath}`);
    process.exit(1);
}
