import { crawlWebsite } from '../src/logic/webCrawler.js';

async function testCrawler() {
    const url = 'https://en.wikipedia.org/wiki/Artificial_intelligence';
    console.log(`🧪 Testing crawler on: ${url}`);

    try {
        const results = await crawlWebsite(url, 1, 3);

        console.log('\n--- Crawler Results ---');
        console.log(`Pages crawled: ${results.length}`);

        results.forEach((page, i) => {
            console.log(`\n[Page ${i + 1}] ${page.title}`);
            console.log(`URL: ${page.url}`);
            console.log(`Text Length: ${page.text.length} chars`);
            console.log(`Excerpt: ${page.text.substring(0, 100).replace(/\n/g, ' ')}...`);
        });

        if (results.length > 0 && results[0].text.length > 500) {
            console.log('\n✅ Crawler verification PASSED');
        } else {
            console.error('\n❌ Crawler verification FAILED: No content or too short');
            process.exit(1);
        }
    } catch (error) {
        console.error('\n❌ Crawler verification FAILED with error:', error);
        process.exit(1);
    }
}

testCrawler();
