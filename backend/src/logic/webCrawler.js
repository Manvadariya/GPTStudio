import axios from 'axios';
import * as cheerio from 'cheerio';
import crypto from 'crypto';

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Patterns to exclude from crawling
const EXCLUDE_PATTERNS = [
    /login/i, /signin/i, /signup/i, /register/i,
    /logout/i, /signout/i, /password/i, /reset/i,
    /\?/, /\#/, /javascript:/i, /mailto:/i, /tel:/i,
    /\.pdf$/i, /\.zip$/i, /\.exe$/i, /\.dmg$/i,
    /\.jpg$/i, /\.jpeg$/i, /\.png$/i, /\.gif$/i, /\.svg$/i,
    /\.mp3$/i, /\.mp4$/i, /\.avi$/i, /\.mov$/i
];

/**
 * Validate URL format
 */
export function isValidUrl(urlString) {
    try {
        const url = new URL(urlString);
        return url.protocol === 'http:' || url.protocol === 'https:';
    } catch {
        return false;
    }
}

/**
 * Check if URL is reachable (HTTP 200)
 */
export async function checkUrlReachable(url) {
    try {
        const response = await axios.head(url, {
            timeout: 10000,
            headers: { 'User-Agent': 'Mozilla/5.0 (compatible; ATProjectBot/1.0)' }
        });
        return response.status >= 200 && response.status < 400;
    } catch {
        // Try GET if HEAD fails
        try {
            const response = await axios.get(url, {
                timeout: 10000,
                headers: { 'User-Agent': 'Mozilla/5.0 (compatible; ATProjectBot/1.0)' },
                maxRedirects: 5
            });
            return response.status >= 200 && response.status < 400;
        } catch {
            return false;
        }
    }
}

/**
 * Get base domain from URL
 */
function getBaseDomain(url) {
    try {
        const parsed = new URL(url);
        return parsed.origin;
    } catch {
        return null;
    }
}

/**
 * Check if link should be excluded
 */
function shouldExcludeLink(href) {
    return EXCLUDE_PATTERNS.some(pattern => pattern.test(href));
}

/**
 * Extract text content from HTML
 */
function extractTextContent($) {
    // Remove unwanted elements
    $('script, style, nav, header, footer, aside, noscript, iframe, form, button, input, select, textarea').remove();
    $('[role="navigation"], [role="banner"], [role="contentinfo"], .nav, .navbar, .header, .footer, .sidebar, .menu, .ad, .advertisement, .cookie-banner').remove();

    const content = [];
    const pageTitle = $('title').text().trim() || $('h1').first().text().trim() || 'Untitled Page';

    // Extract headings and their following content
    $('h1, h2, h3, h4, h5, h6').each((_, el) => {
        const heading = $(el).text().trim();
        if (heading && heading.length > 2) {
            content.push(`## ${heading}`);
        }
    });

    // Extract paragraphs
    $('p').each((_, el) => {
        const text = $(el).text().trim();
        if (text && text.length > 20) {
            content.push(text);
        }
    });

    // Extract lists
    $('ul, ol').each((_, el) => {
        const listItems = [];
        $(el).find('li').each((_, li) => {
            const text = $(li).text().trim();
            if (text && text.length > 5) {
                listItems.push(`- ${text}`);
            }
        });
        if (listItems.length > 0) {
            content.push(listItems.join('\n'));
        }
    });

    // Extract tables as structured text
    $('table').each((_, table) => {
        const rows = [];
        $(table).find('tr').each((_, tr) => {
            const cells = [];
            $(tr).find('th, td').each((_, cell) => {
                cells.push($(cell).text().trim());
            });
            if (cells.length > 0) {
                rows.push(cells.join(' | '));
            }
        });
        if (rows.length > 0) {
            content.push(rows.join('\n'));
        }
    });

    // Deduplicate and clean
    const seen = new Set();
    const cleaned = content.filter(text => {
        const normalized = text.toLowerCase().replace(/\s+/g, ' ').trim();
        if (seen.has(normalized) || normalized.length < 10) {
            return false;
        }
        seen.add(normalized);
        return true;
    });

    return {
        title: pageTitle,
        text: cleaned.join('\n\n')
    };
}

/**
 * Extract links from page
 */
function extractLinks($, baseUrl) {
    const links = new Set();
    const baseDomain = getBaseDomain(baseUrl);

    $('a[href]').each((_, el) => {
        let href = $(el).attr('href');
        if (!href) return;

        // Resolve relative URLs
        try {
            href = new URL(href, baseUrl).href;
        } catch {
            return;
        }

        // Check same domain
        if (!href.startsWith(baseDomain)) return;

        // Check exclusions
        if (shouldExcludeLink(href)) return;

        links.add(href);
    });

    return Array.from(links);
}

/**
 * Fetch page with retry
 */
async function fetchPage(url, retries = 3) {
    for (let i = 0; i < retries; i++) {
        try {
            const response = await axios.get(url, {
                timeout: 15000,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                    'Accept-Language': 'en-US,en;q=0.5'
                },
                maxRedirects: 5
            });
            return response.data;
        } catch (error) {
            console.log(`Retry ${i + 1}/${retries} for ${url}: ${error.message}`);
            if (i < retries - 1) {
                await delay(1000 * (i + 1)); // Exponential backoff
            }
        }
    }
    return null;
}

/**
 * Crawl website and extract content
 * @param {string} startUrl - Starting URL
 * @param {number} maxDepth - Maximum crawl depth (default: 2)
 * @param {number} maxPages - Maximum pages to crawl (default: 20)
 * @returns {Promise<Array>} Array of extracted page content
 */
export async function crawlWebsite(startUrl, maxDepth = 2, maxPages = 20) {
    const visited = new Set();
    const results = [];
    const queue = [{ url: startUrl, depth: 0 }];
    const contentHashes = new Set();

    console.log(`🕷️ Starting crawl: ${startUrl} (depth: ${maxDepth}, maxPages: ${maxPages})`);

    while (queue.length > 0 && results.length < maxPages) {
        const { url, depth } = queue.shift();

        if (visited.has(url) || depth > maxDepth) continue;
        visited.add(url);

        console.log(`📄 Crawling: ${url} (depth: ${depth})`);

        const html = await fetchPage(url);
        if (!html) continue;

        const $ = cheerio.load(html);
        const { title, text } = extractTextContent($);

        // Deduplicate by content hash
        const contentHash = crypto.createHash('md5').update(text).digest('hex');
        if (contentHashes.has(contentHash) || text.length < 100) {
            console.log(`⏭️ Skipping (duplicate or too short): ${url}`);
            continue;
        }
        contentHashes.add(contentHash);

        results.push({
            url,
            title,
            text,
            crawledAt: new Date().toISOString()
        });

        console.log(`✅ Extracted: ${title} (${text.length} chars)`);

        // Extract links for next depth
        if (depth < maxDepth) {
            const links = extractLinks($, url);
            for (const link of links) {
                if (!visited.has(link)) {
                    queue.push({ url: link, depth: depth + 1 });
                }
            }
        }

        // Rate limiting
        await delay(500);
    }

    console.log(`🎉 Crawl complete: ${results.length} pages extracted`);
    return results;
}
