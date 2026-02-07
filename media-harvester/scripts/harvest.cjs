const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

/**
 * Advanced Universal Media Harvester
 * Capable of handling modern SPA/React sites by scanning JSON payloads and deep JS strings.
 */

const targetUrl = process.argv[2];
const outputBase = path.join(process.cwd(), 'downloads');

if (!targetUrl) {
    console.error('Usage: node harvest.cjs <URL>');
    process.exit(1);
}

const urlObj = new URL(targetUrl);
const baseUrl = `${urlObj.protocol}//${urlObj.host}`;
const domain = urlObj.hostname.replace('www.', '');
const timestamp = Date.now();
const downloadDir = path.join(outputBase, `${domain}_${timestamp}`);
if (!fs.existsSync(downloadDir)) fs.mkdirSync(downloadDir, { recursive: true });

async function downloadFile(url, dest) {
    return new Promise((resolve, reject) => {
        const client = url.startsWith('https') ? https : http;
        const options = {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Referer': targetUrl
            },
            timeout: 10000
        };

        client.get(url, options, (res) => {
            if (res.statusCode === 302 || res.statusCode === 301) {
                return downloadFile(res.headers.location, dest).then(resolve).catch(reject);
            }
            if (res.statusCode !== 200) {
                return reject(new Error(`Status: ${res.statusCode}`));
            }
            const file = fs.createWriteStream(dest);
            res.pipe(file);
            file.on('finish', () => {
                file.close();
                resolve();
            });
        }).on('error', reject);
    });
}

async function downloadHLS(url, dest) {
    console.log(`--- HLS Detected: Downloading via FFmpeg ---`);
    try {
        const mp4Dest = dest.replace(/\.m3u8$/i, '.mp4');
        // Added some ffmpeg flags to handle network streams better
        const cmd = `ffmpeg -protocol_whitelist file,http,https,tcp,tls,crypto -i "${url}" -c copy -bsf:a aac_adtstoasc "${mp4Dest}" -y`;
        console.log(`Executing: ${cmd}`);
        execSync(cmd, { stdio: 'inherit' });
        return true;
    } catch (e) {
        console.error(`FFmpeg HLS download failed: ${e.message}`);
        return false;
    }
}

async function harvestSocial(url) {
    try {
        console.log(`Checking if social platform (yt-dlp)...`);
        const outputPath = path.join(downloadDir, 'video_social.mp4');
        execSync(`yt-dlp -f "bestvideo+bestaudio/best" -o "${outputPath}" --no-playlist --max-filesize 100M "${url}"`, { stdio: 'ignore' });
        if (fs.existsSync(outputPath)) return true;
    } catch (e) {}
    return false;
}

async function harvestDeep(url) {
    console.log('--- Strategy: Deep Content Sniffing ---');
    try {
        const getHtmlCmd = process.platform === 'win32' 
            ? `powershell -NoProfile -Command "(Invoke-WebRequest -Uri '${url}' -UseBasicParsing).Content"`
            : `curl -sL "${url}"`;
        
        const html = execSync(getHtmlCmd, { encoding: 'utf-8', maxBuffer: 1024 * 1024 * 20 });
        
        // Match various media formats including m3u8
        const mediaRegex = /(?:["']|^|[\s=])((?:https?:\/\/|\/|.\/|..\/)[^"'\s<>]+?\.(mp4|webm|mov|ogg|m3u8|png|jpg|jpeg))(?=["']|$|[\s>])/gi;
        const matches = [...html.matchAll(mediaRegex)];
        
        const staticRegex = /["']([^"'\s<>]+?static\/media\/[^"'\s<>]+?)["']/gi;
        const staticMatches = [...html.matchAll(staticRegex)];

        let potentialLinks = [
            ...matches.map(m => m[1]),
            ...staticMatches.map(m => m[1])
        ];

        let uniqueUrls = [...new Set(potentialLinks)].map(link => {
            if (link.startsWith('http')) return link;
            if (link.startsWith('//')) return 'https:' + link;
            if (link.startsWith('/')) return baseUrl + link;
            return new URL(link, targetUrl).href;
        });

        console.log(`Identified ${uniqueUrls.length} potential resource candidates.`);
        
        let downloadCount = 0;
        for (let finalUrl of uniqueUrls) {
            try {
                const name = new URL(finalUrl).pathname.split('/').pop();
                const dest = path.join(downloadDir, name);
                if (fs.existsSync(dest) || fs.existsSync(dest.replace('.m3u8', '.mp4'))) continue;

                if (finalUrl.match(/\.m3u8$/i)) {
                    const ok = await downloadHLS(finalUrl, dest);
                    if (ok) downloadCount++;
                } else if (finalUrl.match(/\.(mp4|webm|mov|ogg)$/i) || finalUrl.includes('ctfassets.net')) {
                    console.log(`  Downloading: ${name}`);
                    await downloadFile(finalUrl, dest);
                    downloadCount++;
                }
            } catch (e) {}
        }
        return downloadCount > 0;
    } catch (err) {
        console.error(`Deep harvest failed: ${err.message}`);
        return false;
    }
}

async function probeCommonDirs(domainUrl) {
    console.log('--- Strategy: Common Directory Probing ---');
    const commonDirs = ['videos/', 'video/', 'static/videos/', 'assets/videos/', 'evals_gallery/'];
    const commonNames = ['teaser.mp4', 'demo.mp4', 'main.mp4', 'video.mp4', 'overview.mp4'];
    
    for (let dir of commonDirs) {
        for (let name of commonNames) {
            const probeUrl = `${domainUrl}${dir}${name}`;
            try {
                const dest = path.join(downloadDir, `${dir.replace(/\//g, '_')}${name}`);
                const client = probeUrl.startsWith('https') ? https : http;
                await new Promise((resolve) => {
                    const req = client.request(probeUrl, { method: 'HEAD', timeout: 2000 }, (res) => {
                        if (res.statusCode === 200) {
                            console.log(`  Found hidden asset: ${probeUrl}`);
                            downloadFile(probeUrl, dest).then(resolve).catch(() => resolve());
                        } else {
                            resolve();
                        }
                    });
                    req.on('error', () => resolve());
                    req.end();
                });
            } catch (e) {}
        }
    }
}

async function main() {
    console.log(`Target URL: ${targetUrl}`);
    console.log(`Output Dir: ${downloadDir}`);

    await harvestSocial(targetUrl);
    await harvestDeep(targetUrl);
    await probeCommonDirs(baseUrl.endsWith('/') ? baseUrl : baseUrl + '/');

    console.log(`\nHarvesting Complete. Check: ${downloadDir}`);
}

main();
