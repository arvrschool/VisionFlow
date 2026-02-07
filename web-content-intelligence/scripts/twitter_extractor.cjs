const { execSync } = require('child_process');
const https = require('https');

/**
 * Advanced Twitter Scraper for web-content-intelligence
 * Strategies: fxtwitter, yt-dlp, and metadata extraction.
 */

const tweetUrl = process.argv[2];

if (!tweetUrl || (!tweetUrl.includes('x.com') && !tweetUrl.includes('twitter.com'))) {
    console.error('Error: Invalid Twitter URL.');
    process.exit(1);
}

async function fetchFxTwitter(url) {
    console.log('--- Strategy 1: FxTwitter Scrape ---');
    const fxUrl = url.replace(/(?:x|twitter)\.com/, 'fxtwitter.com');
    
    return new Promise((resolve) => {
        https.get(fxUrl, { headers: { 'User-Agent': 'Bot' } }, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                const titleMatch = data.match(/<meta[^>]*property=["']og:title["'][^>]*content=["'](.*?)["']/i);
                const descMatch = data.match(/<meta[^>]*property=["']og:description["'][^>]*content=["'](.*?)["']/i);
                
                if (descMatch && descMatch[1]) {
                    resolve({
                        title: titleMatch ? titleMatch[1] : '',
                        description: descMatch[1]
                    });
                } else {
                    resolve(null);
                }
            });
        }).on('error', () => resolve(null));
    });
}

function fetchYtDlp(url) {
    console.log('--- Strategy 2: yt-dlp Extraction ---');
    try {
        // Try simple first
        let output = execSync(`yt-dlp --dump-json --no-playlist "${url}"`, { encoding: 'utf-8' });
        const data = JSON.parse(output);
        return {
            title: data.title || '',
            description: data.description || data.fulltitle || '',
            video_url: data.url || null
        };
    } catch (e) {
        console.log('yt-dlp basic failed, trying with chrome cookies...');
        try {
            let output = execSync(`yt-dlp --dump-json --no-playlist --cookies-from-browser chrome "${url}"`, { encoding: 'utf-8' });
            const data = JSON.parse(output);
            return {
                title: data.title || '',
                description: data.description || data.fulltitle || '',
                video_url: data.url || null
            };
        } catch (e2) {
            return null;
        }
    }
}

async function main() {
    let result = await fetchFxTwitter(tweetUrl);
    
    if (!result || result.description.length < 20) {
        const ytResult = fetchYtDlp(tweetUrl);
        if (ytResult) result = ytResult;
    }

    if (result) {
        console.log('SUCCESS_METADATA_START');
        console.log(JSON.stringify(result, null, 2));
        console.log('SUCCESS_METADATA_END');
    } else {
        console.error('Error: All Twitter scraping strategies failed.');
        process.exit(1);
    }
}

main();